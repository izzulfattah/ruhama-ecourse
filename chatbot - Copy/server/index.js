import express from 'express';
import cors from 'cors';
import fs from 'fs';
import axios from 'axios';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

let knowledgeBase = {};

const loadKnowledgeBase = () => {
    const rawData = fs.readFileSync('../knowledge/knowledge-base.json', 'utf-8');
    knowledgeBase = JSON.parse(rawData);
    console.log("Knowledge Base Loaded ✅");
};

loadKnowledgeBase();

// Professional tone transformation helper
const transformToProfessional = (text) => {
    return text
        .replace(/\bgak\b/gi, 'tidak')
        .replace(/\bbro\b/gi, '')
        .replace(/\baja\b/gi, '')
        .replace(/\bbanget\b/gi, 'sangat')
        .replace(/\bdoang\b/gi, 'saja')
        .replace(/\bbuat\b/gi, 'untuk')
        .replace(/\budah\b/gi, 'sudah')
        .replace(/\blu\b/gi, 'Anda')
        .replace(/\bkita\b/gi, 'kami')
        .replace(/\bgimana\b/gi, 'bagaimana')
        .replace(/\bkenapa\b/gi, 'mengapa')
        .replace(/\bngerti\b/gi, 'memahami')
        .replace(/\bngawur\b/gi, 'tidak akurat')
        .replace(/\byg\b/gi, 'yang')
        .replace(/\bsimpel\b/gi, 'sederhana')
        .replace(/\bupdate\b/gi, 'terkini')
        .replace(/\bnyala\b/gi, 'aktif')
        .replace(/\b[Tt]entu aja\b/gi, 'Tentu saja')
        .replace(/\bselesain\b/gi, 'menyelesaikan')
        .replace(/\bCocok buat\b/gi, 'Sesuai untuk')
        .replace(/\bModal cinta doang\b/gi, 'Hanya berdasarkan perasaan cinta')
        .trim();
};

// Keyword matching fallback function with professional tone
const performKeywordMatching = (question, knowledge) => {
    const lowerQuestion = question.toLowerCase();
    
    // Check Q&A pairs first (most specific matches)
    const qaList = knowledge.qa_pairs || knowledge.faq || [];
    for (const qa of qaList) {
        const questionWords = qa.question.toLowerCase().split(' ');
        const matchScore = questionWords.filter(word => 
            lowerQuestion.includes(word) && word.length > 2
        ).length;
        
        if (matchScore >= 2) {
            return transformToProfessional(qa.answer);
        }
    }
    
    // Check main topics/modules
    const modules = knowledge.modules || knowledge.main_topics || [];
    for (const topic of modules) {
        const topicWords = topic.title.toLowerCase().split(' ');
        const matchScore = topicWords.filter(word => 
            lowerQuestion.includes(word) && word.length > 2
        ).length;
        
        if (matchScore >= 1) {
            const description = topic.description ? transformToProfessional(topic.description) : 'Informasi lengkap tersedia dalam materi pembelajaran kursus ini.';
            return description;
        }
    }
    
    // General keywords fallback
    const keywords = {
        'biaya': 'Untuk informasi mengenai biaya kursus, silakan menghubungi tim layanan pelanggan kami.',
        'daftar': 'Untuk informasi pendaftaran, silakan menghubungi tim layanan pelanggan kami.',
        'materi': `Materi pembelajaran utama dalam kursus ini meliputi: ${modules.map(m => m.title).join(', ')}.`,
        'jadwal': 'Untuk informasi mengenai jadwal kursus, silakan menghubungi tim layanan pelanggan kami.',
        'sertifikat': 'Untuk informasi mengenai sertifikat, silakan menghubungi tim layanan pelanggan kami.',
        'harga': 'Untuk informasi mengenai harga kursus, silakan menghubungi tim layanan pelanggan kami.',
        'durasi': 'Untuk informasi mengenai durasi kursus, silakan menghubungi tim layanan pelanggan kami.',
        'syarat': 'Untuk informasi mengenai persyaratan kursus, silakan menghubungi tim layanan pelanggan kami.'
    };
    
    for (const [keyword, response] of Object.entries(keywords)) {
        if (lowerQuestion.includes(keyword)) {
            return response;
        }
    }
    
    return 'Mohon maaf, saya tidak dapat menemukan informasi yang sesuai dengan pertanyaan Anda. Untuk mendapatkan bantuan lebih lanjut, silakan menghubungi tim layanan pelanggan kami.';
};

app.post('/ask', async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Pertanyaan tidak boleh kosong. Silakan masukkan pertanyaan Anda.' });

    const qaList = knowledgeBase.qa_pairs || knowledgeBase.faq || [];
    const modules = knowledgeBase.modules || knowledgeBase.main_topics || [];
    
    const context = `
    ${knowledgeBase.title} adalah ${knowledgeBase.description}
    
    MATERI PEMBELAJARAN UTAMA:
    ${modules.map(m => `• ${m.title}: ${m.description || ''}`).join("\n")}
    
    INFORMASI YANG TERSEDIA:
    ${qaList.map(f => `• ${f.answer}`).join("\n")}
    
    MANFAAT PROGRAM:
    ${knowledgeBase.benefits.map(b => `• ${b}`).join("\n")}
    `;

    try {
        const strictSystemPrompt = `You are a professional virtual assistant for the E-Course Persiapan Pranikah program.

CRITICAL RESPONSE RULES:
1. NEVER repeat the user's question in your response
2. Do NOT start with "Q:" or "Pertanyaan:" or echo back what they asked
3. Start your response DIRECTLY with the answer
4. Answer the question directly without repeating it
5. Only provide the answer, never echo back the question

LANGUAGE REQUIREMENTS:
- Use formal, professional Indonesian language only
- Use "Anda" (not "kamu"), "untuk" (not "buat"), "hanya" (not "cuma")
- Professional tone like formal customer service

CONTENT RULES:
- Only answer based on the provided knowledge base
- If information is not available: "Mohon maaf, informasi yang Anda tanyakan belum tersedia dalam sistem kami. Silakan menghubungi tim layanan pelanggan untuk informasi lebih lanjut."
- Do not make up information

KNOWLEDGE BASE:
${context}

EXAMPLES OF CORRECT RESPONSES:
User asks: "Apa itu E-Course Persiapan Pranikah?"
CORRECT: "E-Course Persiapan Pranikah adalah program pembelajaran online profesional..."
WRONG: "Apa itu E-Course Persiapan Pranikah? E-Course Persiapan Pranikah adalah..."

Remember: Answer directly. Never repeat the question.`;

        const aiRes = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: "meta-llama/llama-4-maverick:free",
            messages: [
                { role: "system", content: strictSystemPrompt },
                { role: "user", content: question }
            ],
            max_tokens: 300
        }, {
            headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}` }
        });

        let answer = aiRes.data.choices[0].message.content;
        
        // Remove any question repetition from the response
        const removeQuestionEcho = (response, originalQuestion) => {
            // Remove if response starts with the question
            if (response.toLowerCase().startsWith(originalQuestion.toLowerCase())) {
                return response.substring(originalQuestion.length).replace(/^[:\-\s]+/, '').trim();
            }
            
            // Remove common question-answer patterns
            response = response
                .replace(/^(T:|Q:|Pertanyaan:|Question:|User asks?:)\s*.+?\s*(J:|A:|Jawaban:|Answer:|CORRECT:|WRONG:)\s*/i, '')
                .replace(/^.+\?\s*/i, '') // Remove if starts with question ending with ?
                .replace(/^.+\?\s*\n*/i, '') // Remove question lines
                .replace(/^Untuk pertanyaan.+?,\s*/i, '')
                .replace(/^Mengenai.+?,\s*/i, '')
                .replace(/^Jawaban untuk.+?:\s*/i, '')
                .replace(/^Pertanyaan tentang.+?:\s*/i, '')
                // Remove any remaining Q&A patterns
                .replace(/^.*:\s*(Apa|Siapa|Bagaimana|Berapa|Kapan|Dimana|Mengapa).+\?\s*/i, '')
                // Remove lines that are clearly echoing the question
                .split('\n')
                .filter(line => {
                    const lowerLine = line.toLowerCase().trim();
                    const lowerQuestion = originalQuestion.toLowerCase().trim();
                    // Skip lines that are very similar to the original question
                    return lowerLine.length < 5 || !lowerLine.includes(lowerQuestion.substring(0, Math.min(20, lowerQuestion.length)));
                })
                .join('\n');
            
            return response.trim();
        };
        
        answer = removeQuestionEcho(answer, question);
        
        // MANDATORY response filtering to ensure professional language
        answer = transformToProfessional(answer);
        
        // Additional strict filtering for any remaining casual terms
        answer = answer
            .replace(/\bbuat\b/gi, 'untuk')
            .replace(/\bcuma\b/gi, 'hanya')
            .replace(/\bdoang\b/gi, 'saja')
            .replace(/\bgak\b/gi, 'tidak')
            .replace(/\baja\b/gi, 'saja')
            .replace(/\bbanget\b/gi, 'sangat')
            .replace(/\budah\b/gi, 'sudah')
            .replace(/\blu\b/gi, 'Anda')
            .replace(/\bkamu\b/gi, 'Anda')
            .replace(/\bpengen\b/gi, 'ingin')
            .replace(/\bgimana\b/gi, 'bagaimana')
            .replace(/\bkenapa\b/gi, 'mengapa');
        
        return res.json({ answer });
    } catch (err) {
        console.error('OpenRouter API Error:', err);
        
        // Fallback handling for 503 errors or API downtime
        if (err.response?.status === 503 || err.code === 'ECONNREFUSED') {
            const fallbackAnswer = performKeywordMatching(question, knowledgeBase);
            return res.json({ 
                answer: fallbackAnswer,
                fallback: true,
                message: "Sistem sedang menggunakan pencarian kata kunci karena layanan AI tidak tersedia"
            });
        }
        
        return res.status(500).json({ error: "Mohon maaf, sistem sedang mengalami gangguan. Silakan coba kembali beberapa saat lagi atau hubungi tim layanan pelanggan kami." });
    }
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`Server nyala di port ${PORT} 🚀`));
