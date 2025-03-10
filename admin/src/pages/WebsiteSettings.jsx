import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const WebsiteSettings = () => {
    const { websiteId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [websites, setWebsites] = useState([]);
    const [agents, setAgents] = useState([]);
    const [website, setWebsite] = useState(null);
    const [autoReplies, setAutoReplies] = useState([]);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [newAutoReply, setNewAutoReply] = useState({
        name: '',
        conditions: {
            keywords: [],
            pages: [],
        },
        response: '',
        is_active: true,
    });
    const [isAddingAutoReply, setIsAddingAutoReply] = useState(false);
    const [keywordInput, setKeywordInput] = useState('');
    const [pageInput, setPageInput] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch websites
                const websitesResponse = await api.getWebsites();
                setWebsites(websitesResponse.websites);

                // Fetch website details
                if (websiteId) {
                    const websiteResponse = await api.getWebsite(websiteId);
                    setWebsite(websiteResponse.website);

                    // Fetch auto-replies
                    const autoRepliesResponse = await api.getAutoReplies(websiteId);
                    setAutoReplies(autoRepliesResponse.auto_replies);
                }

                // Fetch agents
                const agentsResponse = await api.getAgents();
                setAgents(agentsResponse.agents);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching website data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [websiteId]);

    // Handle adding keyword
    const handleAddKeyword = () => {
        if (keywordInput.trim()) {
            setNewAutoReply({
                ...newAutoReply,
                conditions: {
                    ...newAutoReply.conditions,
                    keywords: [...newAutoReply.conditions.keywords, keywordInput.trim()],
                },
            });
            setKeywordInput('');
        }
    };

    // Handle removing keyword
    const handleRemoveKeyword = (keyword) => {
        setNewAutoReply({
            ...newAutoReply,
            conditions: {
                ...newAutoReply.conditions,
                keywords: newAutoReply.conditions.keywords.filter(k => k !== keyword),
            },
        });
    };

    // Handle adding page
    const handleAddPage = () => {
        if (pageInput.trim()) {
            setNewAutoReply({
                ...newAutoReply,
                conditions: {
                    ...newAutoReply.conditions,
                    pages: [...newAutoReply.conditions.pages, pageInput.trim()],
                },
            });
            setPageInput('');
        }
    };

    // Handle removing page
    const handleRemovePage = (page) => {
        setNewAutoReply({
            ...newAutoReply,
            conditions: {
                ...newAutoReply.conditions,
                pages: newAutoReply.conditions.pages.filter(p => p !== page),
            },
        });
    };

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAutoReply({
            ...newAutoReply,
            [name]: type === 'checkbox' ? checked : value,
        });

        // Clear error for the field being changed
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: '',
            });
        }
    };

    // Handle auto-reply toggle
    const handleToggleAutoReply = async (id, isActive) => {
        try {
            await api.toggleAutoReply(id, !isActive);

            // Update state
            setAutoReplies(
                autoReplies.map((item) =>
                    item.id === id ? { ...item, is_active: !isActive } : item
                )
            );

            setSuccessMessage('Auto-reply status updated!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error toggling auto-reply:', error);
            setErrors({
                general: error.response?.data?.message || 'An error occurred while updating the auto-reply',
            });
        }
    };

    // Handle auto-reply deletion
    const handleDeleteAutoReply = async (id) => {
        if (window.confirm('Are you sure you want to delete this auto-reply?')) {
            try {
                await api.deleteAutoReply(websiteId, id);

                // Update state
                setAutoReplies(autoReplies.filter((item) => item.id !== id));

                setSuccessMessage('Auto-reply deleted successfully!');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } catch (error) {
                console.error('Error deleting auto-reply:', error);
                setErrors({
                    general: error.response?.data?.message || 'An error occurred while deleting the auto-reply',
                });
            }
        }
    };

    // Handle saving new auto-reply
    const handleSaveAutoReply = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!newAutoReply.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!newAutoReply.response.trim()) {
            newErrors.response = 'Response message is required';
        }

        if (newAutoReply.conditions.keywords.length === 0 && newAutoReply.conditions.pages.length === 0) {
            newErrors.conditions = 'At least one trigger condition (keyword or page) is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);

        try {
            const response = await api.createAutoReply(websiteId, newAutoReply);

            // Add to state
            setAutoReplies([...autoReplies, response.auto_reply]);

            // Reset form
            setNewAutoReply({
                name: '',
                conditions: {
                    keywords: [],
                    pages: [],
                },
                response: '',
                is_active: true,
            });

            setIsAddingAutoReply(false);

            setSuccessMessage('Auto-reply created successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error creating auto-reply:', error);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'An error occurred while creating the auto-reply',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar
                websites={websites}
                activeWebsiteId={websiteId}
                isConnected={true}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navigation */}
                <Navbar
                    agents={agents}
                    onAssignConversation={() => {}}
                    onCloseConversation={() => {}}
                    onReopenConversation={() => {}}
                />

                <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold text-gray-900">Website Settings</h1>

                            <div>
                                <Link
                                    to={`/settings/${websiteId}`}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    General Settings
                                </Link>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="bg-white shadow rounded-lg overflow-hidden">
                                {/* Success message */}
                                {successMessage && (
                                    <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-green-700">{successMessage}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Error message */}
                                {errors.general && (
                                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-red-700">{errors.general}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Auto-replies Section */}
                                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-lg font-medium text-gray-900">Auto-Reply Rules</h3>
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                            onClick={() => setIsAddingAutoReply(!isAddingAutoReply)}
                                        >
                                            {isAddingAutoReply ? 'Cancel' : 'Add Auto-Reply'}
                                        </button>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Set up automatic responses based on visitor messages or pages they're viewing.
                                    </p>
                                </div>

                                {/* Add New Auto-reply Form */}
                                {isAddingAutoReply && (
                                    <div className="px-4 py-5 sm:p-6 border-b border-gray-200 bg-gray-50">
                                        <h4 className="text-md font-medium text-gray-900 mb-4">New Auto-Reply Rule</h4>

                                        <form onSubmit={handleSaveAutoReply}>
                                            <div className="space-y-6">
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                        Rule Name
                                                    </label>
                                                    <div className="mt-1">
                                                        <input
                                                            type="text"
                                                            id="name"
                                                            name="name"
                                                            value={newAutoReply.name}
                                                            onChange={handleChange}
                                                            className={`block w-full border ${
                                                                errors.name ? 'border-red-300' : 'border-gray-300'
                                                            } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                                        />
                                                        {errors.name && (
                                                            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Trigger Keywords
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Auto-reply will be triggered when visitor messages contain these keywords.
                                                    </p>

                                                    <div className="mt-2 flex">
                                                        <input
                                                            type="text"
                                                            value={keywordInput}
                                                            onChange={(e) => setKeywordInput(e.target.value)}
                                                            placeholder="Enter keyword and press Add"
                                                            className="block w-full border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleAddKeyword}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {newAutoReply.conditions.keywords.map((keyword, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                                                            >
                                {keyword}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveKeyword(keyword)}
                                                                    className="ml-2 flex-shrink-0 inline-flex text-indigo-500 focus:outline-none"
                                                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">
                                                        Trigger Pages
                                                    </label>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Auto-reply will be triggered when visitors are on these pages.
                                                    </p>

                                                    <div className="mt-2 flex">
                                                        <input
                                                            type="text"
                                                            value={pageInput}
                                                            onChange={(e) => setPageInput(e.target.value)}
                                                            placeholder="Enter page path (e.g., /pricing)"
                                                            className="block w-full border border-gray-300 rounded-l-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={handleAddPage}
                                                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-r-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>

                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {newAutoReply.conditions.pages.map((page, index) => (
                                                            <span
                                                                key={index}
                                                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                                                            >
                                {page}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemovePage(page)}
                                                                    className="ml-2 flex-shrink-0 inline-flex text-green-500 focus:outline-none"
                                                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                  </svg>
                                </button>
                              </span>
                                                        ))}
                                                    </div>

                                                    {errors.conditions && (
                                                        <p className="mt-2 text-sm text-red-600">{errors.conditions}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                                                        Response Message
                                                    </label>
                                                    <div className="mt-1">
                            <textarea
                                id="response"
                                name="response"
                                rows={3}
                                value={newAutoReply.response}
                                onChange={handleChange}
                                className={`block w-full border ${
                                    errors.response ? 'border-red-300' : 'border-gray-300'
                                } rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                            />
                                                        {errors.response && (
                                                            <p className="mt-2 text-sm text-red-600">{errors.response}</p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center">
                                                    <input
                                                        id="is_active"
                                                        name="is_active"
                                                        type="checkbox"
                                                        checked={newAutoReply.is_active}
                                                        onChange={handleChange}
                                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                                    />
                                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                                        Active
                                                    </label>
                                                </div>

                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        className="mr-3 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        onClick={() => setIsAddingAutoReply(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={saving}
                                                        className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                                            saving ? 'opacity-70 cursor-not-allowed' : ''
                                                        }`}
                                                    >
                                                        {saving ? 'Saving...' : 'Save Auto-Reply Rule'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* List of Auto-replies */}
                                <div className="px-4 py-5 sm:p-6">
                                    {autoReplies.length === 0 ? (
                                        <div className="text-center py-10">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No auto-replies</h3>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Get started by creating a new auto-reply rule.
                                            </p>
                                            <div className="mt-6">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    onClick={() => setIsAddingAutoReply(true)}
                                                >
                                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    New Auto-Reply
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                            <table className="min-w-full divide-y divide-gray-300">
                                                <thead className="bg-gray-50">
                                                <tr>
                                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                                        Name
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Triggers
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Response
                                                    </th>
                                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                                        Status
                                                    </th>
                                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                                        <span className="sr-only">Actions</span>
                                                    </th>
                                                </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 bg-white">
                                                {autoReplies.map((autoReply) => (
                                                    <tr key={autoReply.id}>
                                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                            {autoReply.name}
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500">
                                                            <div className="flex flex-col space-y-1">
                                                                {autoReply.conditions.keywords && autoReply.conditions.keywords.length > 0 && (
                                                                    <div>
                                                                        <span className="font-medium">Keywords: </span>
                                                                        <span>{autoReply.conditions.keywords.join(', ')}</span>
                                                                    </div>
                                                                )}
                                                                {autoReply.conditions.pages && autoReply.conditions.pages.length > 0 && (
                                                                    <div>
                                                                        <span className="font-medium">Pages: </span>
                                                                        <span>{autoReply.conditions.pages.join(', ')}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500">
                                                            <div className="max-w-xs truncate">{autoReply.response}</div>
                                                        </td>
                                                        <td className="px-3 py-4 text-sm text-gray-500">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    autoReply.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {autoReply.is_active ? 'Active' : 'Inactive'}
                                </span>
                                                        </td>
                                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAutoReply(autoReply.id, autoReply.is_active)}
                                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                                            >
                                                                {autoReply.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteAutoReply(autoReply.id)}
                                                                className="text-red-600 hover:text-red-900"
                                                            >
                                                                Delete
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WebsiteSettings;