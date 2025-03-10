import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import PropTypes from 'prop-types';

const ConversationList = ({
                              conversations,
                              activeConversation,
                              onSelectConversation,
                              unreadCount
                          }) => {
    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        if (isToday(date)) {
            return format(date, 'HH:mm');
        } else if (isYesterday(date)) {
            return 'Yesterday';
        } else {
            return format(date, 'MMM d');
        }
    };

    // Get status color class
    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-500';
            case 'closed':
                return 'bg-gray-500';
            case 'pending':
                return 'bg-yellow-500';
            default:
                return 'bg-blue-500';
        }
    };

    return (
        <div className="overflow-y-auto h-full">
            {conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <p>No conversations found</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {conversations.map((conversation) => (
                        <li
                            key={conversation.id}
                            className={`hover:bg-gray-50 cursor-pointer ${
                                activeConversation && activeConversation.id === conversation.id
                                    ? 'bg-blue-50 border-l-4 border-blue-500'
                                    : ''
                            }`}
                            onClick={() => onSelectConversation(conversation)}
                        >
                            <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3 min-w-0">
                                        <div className="flex-shrink-0">
                                            {conversation.visitor_avatar ? (
                                                <img
                                                    className="h-10 w-10 rounded-full"
                                                    src={conversation.visitor_avatar}
                                                    alt=""
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                                                    {conversation.visitor_name ? conversation.visitor_name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {conversation.visitor_name || 'Anonymous Visitor'}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <p className="text-xs text-gray-500">
                                                        {formatTimestamp(conversation.last_message_time)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-1 flex items-center">
                                                <p className="text-sm text-gray-500 truncate">
                                                    {conversation.last_message || 'No messages yet'}
                                                </p>
                                                {unreadCount[conversation.id] > 0 && (
                                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {unreadCount[conversation.id]}
                          </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-2 flex-shrink-0 flex flex-col items-end">
                    <span
                        className={`inline-block h-2 w-2 rounded-full ${getStatusColor(
                            conversation.status
                        )}`}
                        aria-hidden="true"
                    ></span>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {conversation.agent_name ? `Assigned: ${conversation.agent_name}` : 'Unassigned'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

ConversationList.propTypes = {
    conversations: PropTypes.array.isRequired,
    activeConversation: PropTypes.object,
    onSelectConversation: PropTypes.func.isRequired,
    unreadCount: PropTypes.object.isRequired,
};

export default ConversationList;