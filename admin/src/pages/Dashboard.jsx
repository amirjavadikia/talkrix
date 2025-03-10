import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ConversationList from '../components/ConversationList';
import ChatMessages from '../components/ChatMessages';
import VisitorInfo from '../components/VisitorInfo';
import Navbar from '../components/Navbar';
import CannedResponses from '../components/CannedResponses';
import api from '../services/api';
import websocketService from '../services/websocket';

const Dashboard = () => {
    const { websiteId } = useParams();
    const navigate = useNavigate();
    const [websites, setWebsites] = useState([]);
    const [agents, setAgents] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [visitorInfo, setVisitorInfo] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [visitorTyping, setVisitorTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState({});
    const [filter, setFilter] = useState('active'); // active, closed, all
    const [search, setSearch] = useState('');
    const [cannedResponses, setCannedResponses] = useState([]);
    const [showCannedResponses, setShowCannedResponses] = useState(false);

    const messageInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    // Load initial data
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);

                // Fetch user's websites
                const websitesResponse = await api.getWebsites();
                setWebsites(websitesResponse.websites);

                // If no websiteId in URL, redirect to the first website
                if (!websiteId && websitesResponse.websites.length > 0) {
                    navigate(`/dashboard/${websitesResponse.websites[0].id}`);
                    return;
                }

                // Fetch agents for current website
                const agentsResponse = await api.getAgents();
                setAgents(agentsResponse.agents);

                // Fetch canned responses
                const cannedResponsesResponse = await api.getCannedResponses();
                setCannedResponses(cannedResponsesResponse.canned_responses);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching initial data:', error);
                setLoading(false);

                // Handle authentication errors
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/login');
                }
            }
        };

        fetchInitialData();
    }, [websiteId, navigate]);

    // Fetch conversations when websiteId changes
    useEffect(() => {
        if (websiteId) {
            fetchConversations();
        }
    }, [websiteId, filter]);

    // Setup WebSocket connection
    useEffect(() => {
        if (websiteId) {
            // Initialize WebSocket
            const agentId = localStorage.getItem('agentId');
            const connect = websocketService.connect(websiteId, agentId);

            // Set up event listeners
            connect.onConnected(() => {
                setIsConnected(true);
            });

            connect.onDisconnected(() => {
                setIsConnected(false);
            });

            connect.onMessage((message) => {
                handleWebSocketMessage(message);
            });

            // Clean up WebSocket connection
            return () => {
                websocketService.disconnect();
            };
        }
    }, [websiteId]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            fetchVisitorInfo(activeConversation.visitor_id);

            // Mark conversation as read
            markConversationAsRead(activeConversation.id);
        } else {
            setMessages([]);
            setVisitorInfo(null);
        }
    }, [activeConversation]);

    // Handle WebSocket messages
    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'chat':
                // Add new message to the conversation
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        {
                            id: message.id || Date.now(),
                            conversation_id: message.conversation_id,
                            sender_type: message.sender_type,
                            sender_id: message.sender_id,
                            content: message.content,
                            created_at: new Date().toISOString(),
                            is_read: message.sender_type === 'agent',
                        },
                    ]);

                    // Clear visitor typing indicator
                    setVisitorTyping(false);
                } else {
                    // Update unread count for other conversations
                    if (message.sender_type === 'visitor') {
                        setUnreadCount((prev) => ({
                            ...prev,
                            [message.conversation_id]: (prev[message.conversation_id] || 0) + 1,
                        }));
                    }
                }

                // Refresh conversations to get latest data
                fetchConversations();
                break;

            case 'typing':
                // Show typing indicator if it's from the visitor in the active conversation
                if (
                    activeConversation &&
                    message.conversation_id === activeConversation.id &&
                    message.sender_type === 'visitor'
                ) {
                    setVisitorTyping(true);

                    // Clear typing indicator after 3 seconds of no updates
                    clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                        setVisitorTyping(false);
                    }, 3000);
                }
                break;

            case 'read':
                // Update read status of messages
                if (
                    activeConversation &&
                    message.conversation_id === activeConversation.id
                ) {
                    setMessages((prevMessages) =>
                        prevMessages.map((msg) =>
                            msg.sender_type === 'agent' ? { ...msg, is_read: true } : msg
                        )
                    );
                }
                break;

            case 'conversation_update':
                // Refresh conversations when status changes
                fetchConversations();

                // Update active conversation if it's the one being updated
                if (activeConversation && message.conversation_id === activeConversation.id) {
                    setActiveConversation((prev) => ({
                        ...prev,
                        status: message.status,
                        agent_id: message.agent_id,
                    }));
                }
                break;

            default:
                break;
        }
    };

    // Fetch conversations
    const fetchConversations = async () => {
        if (!websiteId) return;

        try {
            const response = await api.getConversations(websiteId, { filter, search });
            setConversations(response.conversations);

            // Update unread counts
            const newUnreadCount = {};
            response.conversations.forEach((conv) => {
                newUnreadCount[conv.id] = conv.unread_count || 0;
            });
            setUnreadCount(newUnreadCount);

            // Update active conversation if it exists in the new list
            if (activeConversation) {
                const updatedConversation = response.conversations.find(
                    (conv) => conv.id === activeConversation.id
                );

                if (updatedConversation) {
                    setActiveConversation(updatedConversation);
                }
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch messages for a conversation
    const fetchMessages = async (conversationId) => {
        try {
            const response = await api.getMessages(conversationId);
            setMessages(response.messages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    // Fetch visitor information
    const fetchVisitorInfo = async (visitorId) => {
        try {
            const response = await api.getVisitor(visitorId);
            setVisitorInfo(response.visitor);
        } catch (error) {
            console.error('Error fetching visitor info:', error);
        }
    };

    // Send a message
    const sendMessage = async () => {
        if (!newMessage.trim() || !activeConversation) return;

        const messageContent = newMessage;
        setNewMessage(''); // Clear input field immediately

        // Focus back on the input
        messageInputRef.current?.focus();

        // Add message to UI optimistically
        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            conversation_id: activeConversation.id,
            sender_type: 'agent',
            sender_id: localStorage.getItem('agentId'),
            content: messageContent,
            created_at: new Date().toISOString(),
            is_read: false,
        };

        setMessages((prev) => [...prev, tempMessage]);

        try {
            // Send via WebSocket
            websocketService.sendMessage({
                type: 'chat',
                conversation_id: activeConversation.id,
                content: messageContent,
            });

            // Also send via API for reliability
            const response = await api.sendMessage(activeConversation.id, messageContent);

            // Replace temp message with real one
            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? response.message : msg))
            );

            // Refresh conversation to update last message
            fetchConversations();
        } catch (error) {
            console.error('Error sending message:', error);

            // Show error state for the message
            setMessages((prev) =>
                prev.map((msg) => (msg.id === tempId ? { ...msg, error: true } : msg))
            );
        }
    };

    // Mark conversation as read
    const markConversationAsRead = async (conversationId) => {
        try {
            await api.markConversationAsRead(conversationId);

            // Update unread count locally
            setUnreadCount((prev) => ({
                ...prev,
                [conversationId]: 0,
            }));

            // Update message read status
            setMessages((prev) =>
                prev.map((msg) => ({
                    ...msg,
                    is_read: true,
                }))
            );

            // Send read receipt via WebSocket
            websocketService.sendReadReceipt(conversationId);
        } catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    };

    // Handle conversation selection
    const handleSelectConversation = (conversation) => {
        setActiveConversation(conversation);
        setShowCannedResponses(false); // Hide canned responses when changing conversations
    };

    // Handle assigning conversation to agent
    const handleAssignConversation = async (agentId) => {
        if (!activeConversation) return;

        try {
            await api.assignConversation(activeConversation.id, agentId);

            // Update active conversation
            setActiveConversation((prev) => ({
                ...prev,
                agent_id: agentId,
            }));

            // Refresh conversations
            fetchConversations();
        } catch (error) {
            console.error('Error assigning conversation:', error);
        }
    };

    // Handle closing conversation
    const handleCloseConversation = async () => {
        if (!activeConversation) return;

        try {
            await api.closeConversation(activeConversation.id);

            // Update active conversation
            setActiveConversation((prev) => ({
                ...prev,
                status: 'closed',
            }));

            // Refresh conversations
            fetchConversations();
        } catch (error) {
            console.error('Error closing conversation:', error);
        }
    };

    // Handle reopening conversation
    const handleReopenConversation = async () => {
        if (!activeConversation) return;

        try {
            await api.reopenConversation(activeConversation.id);

            // Update active conversation
            setActiveConversation((prev) => ({
                ...prev,
                status: 'active',
            }));

            // Refresh conversations
            fetchConversations();
        } catch (error) {
            console.error('Error reopening conversation:', error);
        }
    };

    // Handle inserting canned response
    const handleInsertCannedResponse = (response) => {
        setNewMessage(response.content);
        setShowCannedResponses(false);
        messageInputRef.current?.focus();
    };

    // Handle key press for message input
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Handle search
    const handleSearch = (e) => {
        setSearch(e.target.value);
        // Debounce search to avoid too many API calls
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            fetchConversations();
        }, 500);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar
                websites={websites}
                activeWebsiteId={websiteId}
                isConnected={isConnected}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <Navbar
                    agents={agents}
                    onAssignConversation={handleAssignConversation}
                    activeConversation={activeConversation}
                    onCloseConversation={handleCloseConversation}
                    onReopenConversation={handleReopenConversation}
                />

                <div className="flex-1 flex overflow-hidden">
                    {/* Conversation List */}
                    <div className="w-1/4 bg-white border-r overflow-y-auto">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold">Conversations</h2>
                                <div className="relative">
                                    <select
                                        className="bg-gray-100 border border-gray-300 rounded-md py-1 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="closed">Closed</option>
                                        <option value="all">All</option>
                                    </select>
                                </div>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search conversations..."
                                    className="w-full p-2 pl-8 pr-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    value={search}
                                    onChange={handleSearch}
                                />
                                <svg
                                    className="absolute left-2 top-2.5 h-4 w-4 text-gray-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                    />
                                </svg>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-32">
                                <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <ConversationList
                                conversations={conversations}
                                activeConversation={activeConversation}
                                onSelectConversation={handleSelectConversation}
                                unreadCount={unreadCount}
                            />
                        )}
                    </div>

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {activeConversation ? (
                            <>
                                <div className="flex-1 overflow-y-auto">
                                    <ChatMessages
                                        messages={messages}
                                        agents={agents}
                                        visitorTyping={visitorTyping}
                                    />
                                </div>

                                {/* Chat Input */}
                                <div className="border-t p-4">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <button
                                            className="text-gray-500 hover:text-gray-700"
                                            onClick={() => setShowCannedResponses(!showCannedResponses)}
                                        >
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                                />
                                            </svg>
                                        </button>

                                        <button className="text-gray-500 hover:text-gray-700">
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    {showCannedResponses && (
                                        <CannedResponses
                                            responses={cannedResponses}
                                            onSelect={handleInsertCannedResponse}
                                        />
                                    )}

                                    <div className="flex items-center">
                    <textarea
                        ref={messageInputRef}
                        className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="Type a message..."
                        rows="2"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                    />
                                        <button
                                            className="p-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim()}
                                        >
                                            <svg
                                                className="h-5 w-5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                                <svg
                                    className="h-16 w-16 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                    />
                                </svg>
                                <p className="text-lg font-medium">Select a conversation</p>
                                <p className="text-sm">Choose a conversation from the list to start chatting</p>
                            </div>
                        )}
                    </div>

                    {/* Visitor Info Sidebar */}
                    {activeConversation && (
                        <div className="w-1/4 bg-white border-l overflow-y-auto">
                            <VisitorInfo visitor={visitorInfo} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;