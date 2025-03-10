import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Navbar = ({
                    agents,
                    onAssignConversation,
                    activeConversation,
                    onCloseConversation,
                    onReopenConversation
                }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    // Toggle assign agent dropdown
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Toggle user dropdown
    const toggleUserDropdown = () => {
        setUserDropdownOpen(!userDropdownOpen);
    };

    // Handle logging out
    const handleLogout = () => {
        // Remove token from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('agentId');

        // Redirect to login page
        window.location.href = '/login';
    };

    return (
        <nav className="bg-white border-b border-gray-200">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <img
                                className="block h-8 w-auto"
                                src="/logo.svg"
                                alt="Talkrix"
                            />
                            <span className="ml-2 text-xl font-bold text-gray-900">Talkrix</span>
                        </div>
                    </div>

                    <div className="flex items-center">
                        {/* Conversation Controls - Only show if active conversation */}
                        {activeConversation && (
                            <div className="flex space-x-2 mr-4">
                                {/* Assign Dropdown */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        onClick={toggleDropdown}
                                    >
                    <span>
                      {activeConversation.agent_id
                          ? 'Reassign'
                          : 'Assign Agent'}
                    </span>
                                        <svg
                                            className="ml-2 -mr-0.5 h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            aria-hidden="true"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {dropdownOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                            <div
                                                className="py-1"
                                                role="menu"
                                                aria-orientation="vertical"
                                                aria-labelledby="options-menu"
                                            >
                                                {agents.map((agent) => (
                                                    <button
                                                        key={agent.id}
                                                        className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                        role="menuitem"
                                                        onClick={() => {
                                                            onAssignConversation(agent.id);
                                                            setDropdownOpen(false);
                                                        }}
                                                    >
                                                        {agent.name}
                                                        {agent.id === activeConversation.agent_id && (
                                                            <span className="ml-2 text-indigo-500">✓</span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Close/Reopen Conversation Button */}
                                {activeConversation.status === 'active' ? (
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        onClick={onCloseConversation}
                                    >
                                        Close Conversation
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                        onClick={onReopenConversation}
                                    >
                                        Reopen Conversation
                                    </button>
                                )}
                            </div>
                        )}

                        {/* User Dropdown */}
                        <div className="ml-3 relative">
                            <div>
                                <button
                                    type="button"
                                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    id="user-menu"
                                    aria-expanded="false"
                                    aria-haspopup="true"
                                    onClick={toggleUserDropdown}
                                >
                                    <span className="sr-only">Open user menu</span>
                                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </button>
                            </div>

                            {/* Dropdown Menu */}
                            {userDropdownOpen && (
                                <div
                                    className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu"
                                >
                                    <div className="py-1">
                                        <a
                                            href="/profile"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            Your Profile
                                        </a>
                                        <a
                                            href="/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            Settings
                                        </a>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            role="menuitem"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

Navbar.propTypes = {
    agents: PropTypes.array.isRequired,
    onAssignConversation: PropTypes.func.isRequired,
    activeConversation: PropTypes.object,
    onCloseConversation: PropTypes.func.isRequired,
    onReopenConversation: PropTypes.func.isRequired
};

export default Navbar;