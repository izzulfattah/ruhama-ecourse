import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import connectCloudinary from './configs/cloudinary.js'
import userRouter from './routes/userRoutes.js'
import { clerkMiddleware } from '@clerk/express'
import { clerkWebhooks, stripeWebhooks, midtransWebhook } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import courseRouter from './routes/courseRoute.js'
import examRouter from './routes/examRoute.js'
import fs from 'fs'

// Initialize Express
const app = express()

// Connect to database
await connectDB()
await connectCloudinary()

// Load chatbot knowledge base
let knowledgeBase = {};

const loadKnowledgeBase = () => {
    try {
        const rawData = fs.readFileSync('./knowledge/knowledge-base.json', 'utf-8');
        knowledgeBase = JSON.parse(rawData);
        console.log("✅ Chatbot Knowledge Base Loaded");
        console.log("📚 Knowledge base has:", Object.keys(knowledgeBase));
        console.log("📚 Main topics count:", knowledgeBase.main_topics?.length || 0);
        console.log("📚 FAQ count:", knowledgeBase.faq?.length || 0);
    } catch (error) {
        console.log("❌ Failed to load chatbot knowledge base:", error.message);
        knowledgeBase = {
            title: "E-Course Pra Nikah",
            description: "Program pembelajaran online untuk persiapan pernikahan",
            main_topics: [],
            faq: []
        };
        console.log("⚠️  Using fallback knowledge base");
    }
};

loadKnowledgeBase();

// Middlewares
app.use(cors())
app.use(express.json()); // penting buat parsing JSON

// Add comprehensive request logging middleware
app.use((req, res, next) => {
  if (req.url.includes('/api/')) {
    console.log('🌍 ===========================================');
    console.log('🌍 INCOMING API REQUEST');
    console.log('🌍 ===========================================');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🔄 Method:', req.method);
    console.log('🎯 URL:', req.url);
    console.log('🏠 Origin:', req.get('origin'));
    console.log('📊 Content-Type:', req.get('content-type'));
    console.log('🔑 Authorization:', req.get('authorization') ? 'Present' : 'Missing');
    console.log('📦 Body size:', JSON.stringify(req.body).length, 'characters');
    if (req.url.includes('/payment/') || req.url.includes('/add-purchase')) {
      console.log('📦 Body content:', JSON.stringify(req.body, null, 2));
    }
    console.log('🌍 ===========================================');
  }
  next();
});

app.use(clerkMiddleware())

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

// Helper function to normalize text for keyword matching
const normalizeText = (text) => {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

// Helper function to calculate keyword match score
const calculateMatchScore = (question, content) => {
    const questionWords = normalizeText(question).split(' ');
    const contentWords = normalizeText(content).split(' ');
    
    let matches = 0;
    questionWords.forEach(word => {
        if (word.length > 2 && contentWords.includes(word)) {
            matches++;
        }
    });
    
    return matches / questionWords.length;
};

// Helper function to find best matching content
const findBestMatch = (question, knowledgeBase) => {
    let bestMatch = null;
    let bestScore = 0;
    
    // Check FAQ first (highest priority)
    if (knowledgeBase.faq) {
        knowledgeBase.faq.forEach(faq => {
            const questionScore = calculateMatchScore(question, faq.question);
            const answerScore = calculateMatchScore(question, faq.answer) * 0.5; // Lower weight for answers
            const totalScore = questionScore + answerScore;
            
            if (totalScore > bestScore && totalScore > 0.1) {
                bestScore = totalScore;
                bestMatch = {
                    type: 'faq',
                    content: `**${faq.question}**\n\n${faq.answer}`,
                    score: totalScore
                };
            }
        });
    }
    
    // Check main topics
    if (knowledgeBase.main_topics) {
        knowledgeBase.main_topics.forEach(topic => {
            const titleScore = calculateMatchScore(question, topic.title);
            let pointsScore = 0;
            
            if (topic.points) {
                topic.points.forEach(point => {
                    pointsScore += calculateMatchScore(question, point) * 0.3;
                });
            }
            
            const totalScore = titleScore + pointsScore;
            
            if (totalScore > bestScore && totalScore > 0.1) {
                bestScore = totalScore;
                const pointsList = topic.points ? topic.points.map(p => `• ${p}`).join('\n') : '';
                bestMatch = {
                    type: 'topic',
                    content: `**${topic.title}**\n\n${pointsList}`,
                    score: totalScore
                };
            }
        });
    }
    
    // Check benefits
    if (knowledgeBase.benefits && (question.includes('manfaat') || question.includes('keuntungan') || question.includes('benefit'))) {
        const benefitsContent = knowledgeBase.benefits.map(b => `• ${b}`).join('\n');
        bestMatch = {
            type: 'benefits',
            content: `**Manfaat E-Course Pra Nikah:**\n\n${benefitsContent}`,
            score: 0.8
        };
    }
    
    // Check description for general questions
    if (knowledgeBase.description && !bestMatch && (
        question.includes('apa itu') || 
        question.includes('tentang') || 
        question.includes('deskripsi') ||
        question.includes('course') ||
        question.includes('kursus')
    )) {
        bestMatch = {
            type: 'description',
            content: knowledgeBase.description,
            score: 0.6
        };
    }
    
    return bestMatch;
};

// Chatbot API endpoint - Local keyword matching
app.post('/api/chatbot/ask', (req, res) => {
    console.log('💬 Chatbot request received:', { question: req.body.question?.substring(0, 50) + '...' });
    
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Pertanyaan kosong bro' });

    // Validate knowledge base
    if (!knowledgeBase || Object.keys(knowledgeBase).length === 0) {
        console.error('❌ Knowledge base is empty or not loaded');
        return res.status(500).json({ error: "Knowledge base not available" });
    }

    // Create available topics list for fallback response
    const availableTopics = [];
    if (knowledgeBase.main_topics) {
        availableTopics.push(...knowledgeBase.main_topics.map(m => m.title));
    }
    if (knowledgeBase.faq) {
        availableTopics.push("FAQ seputar kursus");
    }
    if (knowledgeBase.benefits) {
        availableTopics.push("Manfaat mengikuti kursus");
    }

    const fallbackResponse = `Maaf, saya tidak menemukan informasi yang sesuai dengan pertanyaan Anda. 

Saya bisa membantu dengan topik-topik berikut:
${availableTopics.map(topic => `• ${topic}`).join('\n')}

Silakan tanyakan sesuatu yang lebih spesifik tentang materi kursus di atas!`;

    try {
        console.log('🔍 Searching knowledge base for matches...');
        
        // Find best matching content
        const match = findBestMatch(question, knowledgeBase);
        
        let answer;
        if (match && match.score > 0.1) {
            console.log(`✅ Found match (${match.type}) with score: ${match.score.toFixed(2)}`);
            answer = match.content;
            
            // Add closing message for better responses
            if (knowledgeBase.closing && match.type !== 'faq') {
                answer += `\n\n💡 ${knowledgeBase.closing}`;
            }
        } else {
            console.log('❌ No suitable match found, using fallback response');
            answer = fallbackResponse;
        }

        console.log('✅ Successfully generated local response');
        return res.json({ answer });
        
    } catch (err) {
        console.error('❌ Chatbot processing error:', err.message);
        return res.status(500).json({ error: "Terjadi kesalahan dalam memproses pertanyaan" });
    }
});

// Routes
console.log('🛣️  Registering routes...');
app.get('/', (req, res) => res.send("API Working"))
app.post('/clerk', express.json() , clerkWebhooks)
app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks)
// Webhook disabled - using redirect-based enrollment instead
// app.post('/midtrans-webhook', express.json(), midtransWebhook)
app.use('/api/educator', express.json(), educatorRouter)
console.log('✅ Registered: /api/educator');
app.use('/api/course', express.json(), courseRouter)
console.log('✅ Registered: /api/course');
app.use('/api/user', express.json(), userRouter)
console.log('✅ Registered: /api/user (includes /api/user/add-purchase)');
app.use('/api/exam', express.json(), examRouter)
console.log('✅ Registered: /api/exam');

// Import and use payment routes BEFORE server starts
import paymentRoute from './routes/paymentRoute.js';
app.use('/api/payment', express.json(), paymentRoute);
console.log('✅ Registered: /api/payment (includes /api/payment/midtrans)');
console.log('✅ Registered: /api/chatbot/ask (local chatbot endpoint)');
console.log('🛣️  All routes registered successfully!');

// Port
const PORT = process.env.PORT || 5050;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
})

