import React, { useState } from 'react';
import PropTypes from 'prop-types';

const CannedResponses = ({ responses, onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Filter responses based on search term
    const filteredResponses = responses.filter(
        (response) =>
            response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            response.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (response.shortcut && response.shortcut.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Truncate the content for display
    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength) + '...';
    };

    return (
        <div className="mb-4 bg-white shadow rounded-md">
            <div className="p-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search canned responses..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm leading-5 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                            className="h-5 w-5 text-gray-400"
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
                            ></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="max-h-56 overflow-y-auto border-t border-gray-200">
                {filteredResponses.length === 0 ? (
                    <div className="py-3 px-4 text-sm text-gray-500">
                        No canned responses found
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {filteredResponses.map((response) => (
                            <li
                                key={response.id}
                                className="py-2 px-4 hover:bg-gray-50 cursor-pointer"
                                onClick={() => onSelect(response)}
                            >
                                <div className="flex justify-between">
                                    <div className="text-sm font-medium text-gray-900">{response.title}</div>
                                    {response.shortcut && (
                                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            {response.shortcut}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-1 text-sm text-gray-500">
                                    {truncateContent(response.content)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

CannedResponses.propTypes = {
    responses: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            title: PropTypes.string.isRequired,
            content: PropTypes.string.isRequired,
            shortcut: PropTypes.string
        })
    ).isRequired,
    onSelect: PropTypes.func.isRequired
};

export default CannedResponses;