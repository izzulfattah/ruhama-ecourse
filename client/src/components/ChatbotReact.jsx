import { useState, useRef, useEffect } from "react";
import "./ChatbotReact.css";

export default function ChatbotReact() {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([{ text: "Halooo", sender: "bot" }]);
  const [input, setInput] = useState("");
  const chatBodyRef = useRef(null);

  const sendMessage = () => {
    if (!input.trim()) return;

  const userMessage = { text: input, sender: "user" };
  const thinkingMsg = { text: "thinking...", sender: "bot", thinking: true };

  setMessages((prev) => [...prev, userMessage, thinkingMsg]);

    const question = input;
    setInput("");

    fetch("http://localhost:5050/api/chatbot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question })
    })
      .then((res) => res.json())
      .then((data) => {
        setMessages((prev) =>
          prev.filter((msg) => !msg.thinking).concat({ text: data.answer, sender: "bot" })
        );
      })
      .catch(() => {
        setMessages((prev) =>
          prev.filter((msg) => !msg.thinking).concat({ text: "Bot error bro...", sender: "bot" })
        );
      });
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
    <button id="chatbot-toggler" onClick={() => setShowChat(!showChat)}
        className="chatbot-toggler fixed bottom-4 right-4 bg-[#5350C4] rounded-full w-12 h-12 flex items-center justify-center text-white cursor-pointer">
        <span className="material-symbols-rounded">
            {showChat ? "close" : "mode_comment"}
        </span>
    </button>


      {showChat && (
        <div className={`chatbot-popup ${showChat ? "show" : ""}`}>
          <div className="chat-header">
            <div className="header-info">
              <svg className="chatbot-logo" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
              </svg>

              <h2 className="logo-text">Chatbot</h2>
            </div>
            <button onClick={() => setShowChat(false)} className="material-symbols-rounded">keyboard_arrow_down</button>
          </div>
          

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender}-message ${msg.thinking ? "thinking" : ""}`}>
                {msg.sender === "bot" && (
                  <svg className="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                     <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
                  </svg>

                )}
                <div className="message-text">
                  {msg.thinking ? (
                    <div className="thinking-indicator">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-footer">
            <form className="chat-form">
              <textarea className="message-input" placeholder="Tulis pesan..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => {if (e.key === "Enter" && !e.shiftKey) {e.preventDefault();sendMessage();} }}required></textarea>
              <div className="chat-controls">
                <button type="button" className="material-symbols-rounded">sentiment_satisfied</button>
                <button type="button" className="material-symbols-rounded">attach_file</button>
                <button type="button" id="send-message" className="material-symbols-rounded" onClick={sendMessage}>arrow_upward</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
