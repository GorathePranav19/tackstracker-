import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import aiService from '../../services/aiService';
import './AIChatWidget.css';

const AIChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: '👋 Hi! I\'m your AI assistant. Ask me anything about your tasks, goals, or team performance!',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const quickActions = [
        'Show my tasks',
        'What\'s overdue?',
        'Team performance',
        'Weekly insights'
    ];

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await aiService.query(input);

            const assistantMessage = {
                role: 'assistant',
                content: response.error ? `❌ ${response.error}` : response.answer,
                data: response.data,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage = {
                role: 'assistant',
                content: '❌ Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleQuickAction = (action) => {
        setInput(action);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!aiService.isEnabled) {
        return null; // Don't render if AI is disabled
    }

    return (
        <div className="ai-chat-widget">
            {/* Floating button */}
            {!isOpen && (
                <button
                    className="ai-chat-button"
                    onClick={() => setIsOpen(true)}
                    aria-label="Open AI Assistant"
                >
                    <MessageCircle size={24} />
                    <span className="ai-chat-badge">AI</span>
                </button>
            )}

            {/* Chat window */}
            {isOpen && (
                <div className="ai-chat-window">
                    {/* Header */}
                    <div className="ai-chat-header">
                        <div className="ai-chat-header-content">
                            <MessageCircle size={20} />
                            <span>AI Assistant</span>
                        </div>
                        <button
                            className="ai-chat-close"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="ai-chat-messages">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`ai-chat-message ${message.role}`}
                            >
                                <div className="ai-chat-message-content">
                                    {message.content}
                                </div>
                                <div className="ai-chat-message-time">
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="ai-chat-message assistant">
                                <div className="ai-chat-message-content">
                                    <Loader className="ai-chat-loader" size={16} />
                                    <span>Thinking...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick actions */}
                    {messages.length <= 2 && (
                        <div className="ai-chat-quick-actions">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    className="ai-chat-quick-action"
                                    onClick={() => handleQuickAction(action)}
                                >
                                    {action}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Input */}
                    <div className="ai-chat-input-container">
                        <textarea
                            className="ai-chat-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            rows={1}
                            disabled={isLoading}
                        />
                        <button
                            className="ai-chat-send"
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            aria-label="Send message"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIChatWidget;
