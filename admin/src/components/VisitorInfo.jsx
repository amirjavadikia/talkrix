import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';

const VisitorInfo = ({ visitor }) => {
    if (!visitor) {
        return (
            <div className="p-4 flex items-center justify-center h-full">
                <p className="text-gray-500">Select a conversation to view visitor details</p>
            </div>
        );
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), 'PPP p'); // e.g., "Apr 29, 2021, 9:30 AM"
    };

    return (
        <div className="p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visitor Information</h3>

            {/* Visitor Profile */}
            <div className="bg-white rounded-lg shadow mb-4">
                <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xl">
                            {visitor.name ? visitor.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="ml-4">
                            <h4 className="text-lg font-medium text-gray-900">
                                {visitor.name || 'Anonymous Visitor'}
                            </h4>
                            <p className="text-sm text-gray-500">
                                {visitor.email || 'Email not provided'}
                            </p>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">First visit</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(visitor.first_seen)}</dd>
                            </div>
                            <div className="sm:col-span-1">
                                <dt className="text-sm font-medium text-gray-500">Last seen</dt>
                                <dd className="mt-1 text-sm text-gray-900">{formatDate(visitor.last_seen)}</dd>
                            </div>
                            <div className="sm:col-span-2">
                                <dt className="text-sm font-medium text-gray-500">Current page</dt>
                                <dd className="mt-1 text-sm text-gray-900 truncate">
                                    {visitor.current_url || 'Not available'}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            {/* Technical Info */}
            <div className="bg-white rounded-lg shadow mb-4">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-base font-medium text-gray-900">Technical Details</h3>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Browser</dt>
                            <dd className="mt-1 text-sm text-gray-900">{visitor.browser || 'Not detected'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Operating System</dt>
                            <dd className="mt-1 text-sm text-gray-900">{visitor.os || 'Not detected'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                            <dd className="mt-1 text-sm text-gray-900">{visitor.ip_address || 'Not available'}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Location</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {visitor.city && visitor.country
                                    ? `${visitor.city}, ${visitor.country}`
                                    : visitor.country || visitor.city || 'Not available'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Custom Visitor Attributes */}
            {visitor.metadata && Object.keys(visitor.metadata).length > 0 && (
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-5 sm:px-6">
                        <h3 className="text-base font-medium text-gray-900">Additional Information</h3>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                            {Object.entries(visitor.metadata).map(([key, value]) => (
                                <div key={key} className="sm:col-span-1">
                                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                                    <dd className="mt-1 text-sm text-gray-900">{value.toString()}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </div>
            )}
        </div>
    );
};

VisitorInfo.propTypes = {
    visitor: PropTypes.object
};

export default VisitorInfo;