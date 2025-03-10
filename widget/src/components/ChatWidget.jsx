import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/ChatWidget.css';

const ChatWidget = ({
                        apiKey,
                        websiteId,
                        baseUrl = 'https://api.talkrix.com',
                        wsUrl = 'wss://ws.talkrix.com',
                        themeColor = '#4f46e5',
                        position = 'bottom-right',
                        greetingMessage = 'Hi there! How can we help you today?',
                        awayMessage = "We're currently away. Leave a message and we'll get back to you as soon as possible.",
                        logoUrl = null,
                        companyName = 'Support',
                    }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [visitorData, setVisitorData] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [visitorId, setVisitorId] = useState(null);
    const [agentTyping, setAgentTyping] = useState(false);
    const [officeHours, setOfficeHours] = useState(true);
    const [visitorInfo, setVisitorInfo] = useState({
        name: '',
        email: '',
        nameSubmitted: false,
    });

    const chatBodyRef = useRef(null);
    const wsRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (isOpen && !visitorData) {
            initializeChat();
        }
    }, [isOpen, visitorData]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const initializeChat = async () => {
        try {
            const browserInfo = {
                browser: navigator.userAgent,
                language: navigator.language,
                referrer: document.referrer,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                currentUrl: window.location.href,
            };

            const response = await fetch(`${baseUrl}/visitor/init`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': apiKey,
                },
                body: JSON.stringify({
                    website_id: websiteId,
                    browser_info: browserInfo,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to initialize visitor: ${response.statusText}`);
            }

            const data = await response.json();
            setVisitorData(data);
            setVisitorId(data.visitor.id);
            setConversationId(data.conversation.id);
            setOfficeHours(data.office_hours || true);

            setMessages([
                {
                    id: 'greeting',
                    content: officeHours ? greetingMessage : awayMessage,
                    sender: 'agent',
                    timestamp: new Date().toISOString(),
                },
            ]);

            connectWebSocket(data.visitor.id, data.conversation.id);
            loadMessages(data.conversation.id);
        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    };

    const loadMessages = async (convId) => {
        try {
            const response = await fetch(`${baseUrl}/visitor/messages/${convId}`, {
                headers: {
                    'X-API-Key': apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to load messages: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.messages && data.messages.length > 0) {
                setMessages((prevMessages) => [
                    ...data.messages.map((msg) => ({
                        id: msg.id,
                        content: msg.content,
                        sender: msg.sender_type === 'agent' ? 'agent' : 'visitor',
                        timestamp: msg.created_at,
                    })),
                    ...prevMessages,
                ]);
            }
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const connectWebSocket = (vId, convId) => {
        const wsUrlWithParams = `${wsUrl}/ws/visitor?website_id=${websiteId}&visitor_id=${vId}&conversation_id=${convId}`;
        console.log('Connecting to WebSocket:', wsUrlWithParams); // Debug URL
        const ws = new WebSocket(wsUrlWithParams);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'chat':
                    if (message.sender_type === 'agent') {
                        setMessages((prevMessages) => [
                            ...prevMessages,
                            {
                                id: message.id || Date.now(),
                                content: message.content,
                                sender: 'agent',
                                timestamp: new Date(message.timestamp * 1000).toISOString(),
                            },
                        ]);
                        playNotificationSound();
                    }
                    break;

                case 'typing':
                    if (message.sender_type === 'agent') {
                        setAgentTyping(true);
                        setTimeout(() => setAgentTyping(false), 3000);
                    }
                    break;

                default:
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setTimeout(() => {
                if (visitorId && conversationId) {
                    connectWebSocket(visitorId, conversationId);
                }
            }, 5000);
        };

        wsRef.current = ws;
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !visitorId || !conversationId) return;

        if (!visitorInfo.nameSubmitted) {
            setVisitorInfo((prev) => ({ ...prev, nameSubmitted: true }));
        }

        const messageObj = {
            id: Date.now(),
            content: newMessage,
            sender: 'visitor',
            timestamp: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, messageObj]);
        setNewMessage('');

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'chat',
                    website_id: websiteId,
                    conversation_id: conversationId,
                    sender_type: 'visitor',
                    sender_id: visitorId,
                    content: messageObj.content, // Use messageObj.content instead of newMessage
                    timestamp: Math.floor(Date.now() / 1000),
                })
            );
        } else {
            // Fallback to API if WebSocket is not available
            try {
                await fetch(`${baseUrl}/visitor/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': apiKey,
                    },
                    body: JSON.stringify({
                        website_id: websiteId,
                        conversation_id: conversationId,
                        visitor_id: visitorId,
                        content: messageObj.content,
                        visitor_info: visitorInfo.nameSubmitted
                            ? { name: visitorInfo.name, email: visitorInfo.email }
                            : null,
                    }),
                });
            } catch (error) {
                console.error('Error sending message via API:', error);
            }
        }
    };

    const handleTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (!isTyping && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
                JSON.stringify({
                    type: 'typing',
                    website_id: websiteId,
                    conversation_id: conversationId,
                    sender_type: 'visitor',
                    sender_id: visitorId,
                    content: true,
                    timestamp: Math.floor(Date.now() / 1000),
                })
            );

            setIsTyping(true);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
    };

    const playNotificationSound = () => {
        const audio = new Audio(`${baseUrl}/notification.mp3`);
        audio.play().catch((err) => console.error('Could not play notification sound:', err));
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    const handleVisitorInfoSubmit = (e) => {
        e.preventDefault();
        setVisitorInfo((prev) => ({ ...prev, nameSubmitted: true }));
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className={`chat-widget ${position} ${isOpen ? 'open' : 'closed'}`} style={{ '--theme-color': themeColor }}>
            <button className="chat-button" onClick={toggleChat} style={{ backgroundColor: themeColor }}>
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header" style={{ backgroundColor: themeColor }}>
                        <div className="header-info">
                            {logoUrl && <img src={logoUrl} alt="Company Logo" className="company-logo" />}
                            <h3>{companyName}</h3>
                        </div>
                        <button className="close-button" onClick={toggleChat}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="white" />
                            </svg>
                        </button>
                    </div>

                    <div className="chat-body" ref={chatBodyRef}>
                        {messages.map((message) => (
                            <div key={message.id} className={`message ${message.sender === 'visitor' ? 'visitor' : 'agent'}`}>
                                <div className="message-content">{message.content}</div>
                                <div className="message-time">{formatTimestamp(message.timestamp)}</div>
                            </div>
                        ))}
                        {agentTyping && (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                    </div>

                    {!visitorInfo.nameSubmitted && (
                        <form className="visitor-form" onSubmit={handleVisitorInfoSubmit}>
                            <input
                                type="text"
                                placeholder="Your name"
                                value={visitorInfo.name}
                                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, name: e.target.value }))}
                                required
                            />
                            <input
                                type="email"
                                placeholder="Your email"
                                value={visitorInfo.email}
                                onChange={(e) => setVisitorInfo((prev) => ({ ...prev, email: e.target.value }))}
                                required
                            />
                            <button type="submit">Start Chat</button>
                        </form>
                    )}

                    {visitorInfo.nameSubmitted && (
                        <div className="chat-input">
              <textarea
                  value={newMessage}
                  onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                  }}
                  onKeyDown={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
              />
                            <button onClick={sendMessage} disabled={!newMessage.trim()}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill={themeColor} />
                                </svg>
                            </button>
                        </div>
                    )}

                    <div className="chat-footer">
                        <p>Powered by Talkrix</p>
                    </div>
                </div>
            )}
        </div>
    );
};

ChatWidget.propTypes = {
    apiKey: PropTypes.string.isRequired,
    websiteId: PropTypes.string.isRequired,
    baseUrl: PropTypes.string,
    wsUrl: PropTypes.string,
    themeColor: PropTypes.string,
    position: PropTypes.oneOf(['bottom-right', 'bottom-left', 'top-right', 'top-left']),
    greetingMessage: PropTypes.string,
    awayMessage: PropTypes.string,
    logoUrl: PropTypes.string,
    companyName: PropTypes.string,
};

export default ChatWidget;