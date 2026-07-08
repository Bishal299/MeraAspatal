import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, Loader } from 'lucide-react';
import api from '../utils/api';

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Namaskar! I am your MeraAsptal AI Assistant. Ask me anything about medicine stocks, patient wait times, active doctors, or bed availability in our district!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [language, setLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const data = await api.sendChatMessage(userMessage, language);
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
    } catch (error) {
      console.error("AI Chat error:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Error: Failed to fetch response. Please verify the backend service is running." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, fontFamily: 'Inter, sans-serif' }}>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            backgroundColor: 'var(--accent)', color: 'white', border: 'none',
            boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.3s ease'
          }}
          title="Open AI Health Assistant"
        >
          <Sparkles size={28} />
        </button>
      )}

      {/* Chat Pane Window */}
      {isOpen && (
        <div className="card animate-fade-in" style={{
          width: '380px', height: '500px', display: 'flex', flexDirection: 'column',
          padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', backgroundColor: 'var(--accent)', color: 'white',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bot size={22} />
              <div>
                <h4 style={{ color: 'white', fontSize: '0.95rem', margin: 0 }}>MeraAsptal AI Copilot</h4>
                <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>National Health Mission</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '0.25rem',
                  border: 'none', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
                  cursor: 'pointer', outline: 'none'
                }}
              >
                <option value="en" style={{ color: '#000' }}>EN</option>
                <option value="hi" style={{ color: '#000' }}>HI</option>
                <option value="or" style={{ color: '#000' }}>OR</option>
              </select>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex',
            flexDirection: 'column', gap: '1rem', backgroundColor: '#fdfdfd'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                style={{
                  alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end',
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: msg.sender === 'bot' ? 'var(--background)' : 'var(--primary)',
                  color: msg.sender === 'bot' ? 'var(--text-main)' : 'white',
                  fontSize: '0.875rem',
                  lineHeight: 1.4,
                  boxShadow: 'var(--shadow-sm)',
                  border: msg.sender === 'bot' ? '1px solid var(--border)' : 'none'
                }}
              >
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>
                <Loader className="animate-spin" size={16} />
                <span style={{ fontSize: '0.8rem' }}>AI Officer typing...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer Form */}
          <form onSubmit={handleSend} style={{
            padding: '0.75rem 1rem', borderTop: '1px solid var(--border)',
            display: 'flex', gap: '0.5rem', backgroundColor: 'var(--surface)'
          }}>
            <input 
              type="text"
              className="form-input"
              placeholder={language === 'hi' ? 'सवाल पूछें...' : language === 'or' ? 'ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ...' : 'Ask a question...'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              style={{ flex: 1, padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
            />
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={!inputValue.trim() || isLoading}
              style={{ padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIChatbot;
