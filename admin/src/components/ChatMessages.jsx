import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

const ChatMessages = ({ messages, agents, visitorTyping }) => {
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages, visitorTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Format message timestamp
    const formatMessageTime = (timestamp) => {
        return format(new Date(timestamp), 'HH:mm');
    };

    // Get agent name by ID
    const getAgentName = (agentId) => {
        const agent = agents.find((a) => a.id.toString() === agentId.toString());
        return agent ? agent.name : 'Agent';
    };

    // Group messages by date
    const groupMessagesByDate = (messages) => {
        const groups = {};

        messages.forEach(message => {
            const date = new Date(message.created_at).toDateString();
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(message);
        });

        return Object.entries(groups).map(([date, messages]) => ({
            date,
            messages
        }));
    };

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
            {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-4">
                    <div className="flex justify-center">
                        <div className="bg-gray-200 rounded-full px-3 py-1 text-xs text-gray-600">
                            {format(new Date(group.date), 'MMMM d, yyyy')}
                        </div>
                    </div>

                    {group.messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${
                                message.sender_type === 'agent' || message.sender_type === 'system' || message.sender_type === 'ai'
                                    ? 'justify-end'
                                    : 'justify-start'
                            }`}
                        >
                            <div
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow ${
                                    message.sender_type === 'agent'
                                        ? 'bg-blue-500 text-white'
                                        : message.sender_type === 'system'
                                            ? 'bg-gray-300 text-gray-700'
                                            : message.sender_type === 'ai'
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center mb-1">
                  <span className="text-xs font-medium">
                    {message.sender_type === 'agent'
                        ? getAgentName(message.sender_id)
                        : message.sender_type === 'system'
                            ? 'System'
                            : message.sender_type === 'ai'
                                ? 'AI Assistant'
                                : 'Visitor'}
                  </span>
                                    <span className="ml-2 text-xs opacity-75">
                    {formatMessageTime(message.created_at)}
                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                                {message.error && (
                                    <div className="text-red-300 text-xs mt-1">
                                        Error sending message. Click to retry.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ))}

            {visitorTyping && (
                <div className="flex justify-start">
                    <div className="max-w-xs px-4 py-2 rounded-lg bg-gray-100 text-gray-700">
                        <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

ChatMessages.propTypes = {
    messages: PropTypes.array.isRequired,
    agents: PropTypes.array.isRequired,
    visitorTyping: PropTypes.bool
};

ChatMessages.defaultProps = {
    visitorTyping: false
};

export default ChatMessages;