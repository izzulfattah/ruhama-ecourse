const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-message");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");

const userData = {
    message: null
};

// Professional tone transformation helper (client-side safety net)
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
        .replace(/\bpengen\b/gi, 'ingin')
        .replace(/\bsama\b/gi, 'dengan')
        .replace(/\bcuma\b/gi, 'hanya')
        .replace(/\btapi\b/gi, 'tetapi')
        .replace(/\bbareng\b/gi, 'bersama')
        .replace(/\bsiapin\b/gi, 'persiapkan')
        .replace(/\bbener\b/gi, 'yang tepat')
        .replace(/\bhalooo+/gi, 'Selamat datang')
        .replace(/\bhai\b/gi, 'Halo')
        .trim();
};

const createMessageElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};

const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = "";

    const messageContent = `<div class="message-text"></div>`;
    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").innerText = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTop = chatBody.scrollHeight;

    setTimeout(() => {
        const thinkingDiv = createMessageElement(`
            <svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
            </svg>
            <div class="message-text">
                <div class="thinking-indicator">
                    <div class="dot"></div>
                    <div class="dot"></div>
                    <div class="dot"></div>
                </div>
            </div>
        `, "bot-message", "thinking");

        chatBody.appendChild(thinkingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        // Fetch ke backend
        fetch('http://localhost:5050/ask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: userData.message })
        })
        .then(res => res.json())
        .then(data => {
            thinkingDiv.remove();
            // Apply professional tone transformation as safety net
            const professionalAnswer = transformToProfessional(data.answer);
            const botReplyDiv = createMessageElement(`<div class="message-text">${professionalAnswer}</div>`, "bot-message");
            chatBody.appendChild(botReplyDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        })
        .catch(err => {
            thinkingDiv.remove();
            console.error(err);
        });
    }, 600);
}

messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === "Enter" && userMessage) {
        handleOutgoingMessage(e);
    }
});

sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
