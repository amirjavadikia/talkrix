import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const Sidebar = ({ websites, activeWebsiteId, isConnected }) => {
    const location = useLocation();

    // Navigation items
    const navigation = [
        { name: 'Dashboard', href: `/dashboard/${activeWebsiteId}`, icon: 'chat' },
        { name: 'Analytics', href: `/analytics/${activeWebsiteId}`, icon: 'chart' },
        { name: 'Settings', href: `/settings/${activeWebsiteId}`, icon: 'settings' },
        { name: 'Agent Management', href: `/agents/${activeWebsiteId}`, icon: 'users' }
    ];

    // Function to get icon element based on icon name
    const getIcon = (iconName) => {
        switch (iconName) {
            case 'chat':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                );
            case 'chart':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                );
            case 'settings':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                );
            case 'users':
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    return (
        <div className="hidden md:flex md:flex-shrink-0">
            <div className="flex flex-col w-64">
                <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
                    <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-4">
                            <img
                                className="h-8 w-auto"
                                src="/logo-white.svg"
                                alt="Talkrix"
                            />
                            <span className="ml-2 text-white text-xl font-bold">Talkrix</span>
                        </div>

                        {/* Website Selector */}
                        <div className="px-4 mt-6">
                            <label htmlFor="website" className="block text-sm font-medium text-gray-400">
                                Selected Website
                            </label>
                            <select
                                id="website"
                                name="website"
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                value={activeWebsiteId || ''}
                                onChange={(e) => {
                                    window.location.href = `/dashboard/${e.target.value}`;
                                }}
                            >
                                {websites.map((website) => (
                                    <option key={website.id} value={website.id}>
                                        {website.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Connection Status */}
                        <div className="px-4 mt-4">
                            <div className="flex items-center text-sm">
                                <div className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className="text-gray-300">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="mt-5 flex-1 px-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={`${
                                            isActive
                                                ? 'bg-gray-900 text-white'
                                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                        } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                                    >
                                        <div className="mr-3 text-gray-400">{getIcon(item.icon)}</div>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Footer with version */}
                    <div className="flex-shrink-0 flex border-t border-gray-700 p-4">
                        <div className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-400">
                                        Talkrix v1.0.0
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Sidebar.propTypes = {
    websites: PropTypes.array.isRequired,
    activeWebsiteId: PropTypes.string,
    isConnected: PropTypes.bool.isRequired
};

export default Sidebar;