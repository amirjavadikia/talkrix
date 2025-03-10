import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const AgentManagement = () => {
    const { websiteId } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [websites, setWebsites] = useState([]);
    const [agents, setAgents] = useState([]);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [isAddingAgent, setIsAddingAgent] = useState(false);
    const [newAgent, setNewAgent] = useState({
        name: '',
        email: '',
        is_admin: false,
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch websites
                const websitesResponse = await api.getWebsites();
                setWebsites(websitesResponse.websites);

                // Fetch agents
                const agentsResponse = await api.getAgents();
                setAgents(agentsResponse.agents);

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [websiteId]);

    // Handle form input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setNewAgent({
            ...newAgent,
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

    // Handle adding new agent
    const handleAddAgent = async (e) => {
        e.preventDefault();

        // Validation
        const newErrors = {};
        if (!newAgent.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!newAgent.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(newAgent.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);

        try {
            const response = await api.createAgent({
                name: newAgent.name,
                email: newAgent.email,
                is_admin: newAgent.is_admin,
            });

            // Add new agent to the list
            setAgents([...agents, response.agent]);

            // Reset form
            setNewAgent({
                name: '',
                email: '',
                is_admin: false,
            });

            setIsAddingAgent(false);

            setSuccessMessage('Agent added successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error adding agent:', error);

            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            } else {
                setErrors({
                    general: error.response?.data?.message || 'An error occurred while adding the agent',
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // Handle toggling agent status (active/inactive)
    const handleToggleAgentStatus = async (agentId, isActive) => {
        try {
            await api.toggleAgentStatus(agentId, !isActive);

            // Update the agent list
            setAgents(agents.map(agent =>
                agent.id === agentId ? { ...agent, is_active: !isActive } : agent
            ));

            setSuccessMessage('Agent status updated successfully!');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error updating agent status:', error);
            setErrors({
                general: error.response?.data?.message || 'An error occurred while updating the agent status',
            });
        }
    };

    // Handle removing an agent
    const handleRemoveAgent = async (agentId) => {
        if (window.confirm('Are you sure you want to remove this agent?')) {
            try {
                await api.deleteAgent(agentId);

                // Remove the agent from the list
                setAgents(agents.filter(agent => agent.id !== agentId));

                setSuccessMessage('Agent removed successfully!');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            } catch (error) {
                console.error('Error removing agent:', error);
                setErrors({
                    general: error.response?.data?.message || 'An error occurred while removing the agent',
                });
            }
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
                            <h1 className="text-2xl font-semibold text-gray-900">Agent Management</h1>

                            <button
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                onClick={() => setIsAddingAgent(!isAddingAgent)}
                            >
                                {isAddingAgent ? 'Cancel' : 'Add Agent'}
                            </button>
                        </div>

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

                        {/* Add Agent Form */}
                        {isAddingAgent && (
                            <div className="bg-white shadow rounded-lg mb-6 overflow-hidden">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Agent</h3>

                                    <form onSubmit={handleAddAgent}>
                                        <div className="grid grid-cols-6 gap-6">
                                            <div className="col-span-6 sm:col-span-3">
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    id="name"
                                                    value={newAgent.name}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full border ${
                                                        errors.name ? 'border-red-300' : 'border-gray-300'
                                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                                />
                                                {errors.name && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                                )}
                                            </div>

                                            <div className="col-span-6 sm:col-span-3">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    id="email"
                                                    value={newAgent.email}
                                                    onChange={handleChange}
                                                    className={`mt-1 block w-full border ${
                                                        errors.email ? 'border-red-300' : 'border-gray-300'
                                                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                                                />
                                                {errors.email && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                                                )}
                                            </div>

                                            <div className="col-span-6">
                                                <div className="flex items-start">
                                                    <div className="flex items-center h-5">
                                                        <input
                                                            id="is_admin"
                                                            name="is_admin"
                                                            type="checkbox"
                                                            checked={newAgent.is_admin}
                                                            onChange={handleChange}
                                                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                                                        />
                                                    </div>
                                                    <div className="ml-3 text-sm">
                                                        <label htmlFor="is_admin" className="font-medium text-gray-700">
                                                            Admin Privileges
                                                        </label>
                                                        <p className="text-gray-500">
                                                            Admin agents can manage other agents and access all settings.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                type="button"
                                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3"
                                                onClick={() => setIsAddingAgent(false)}
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
                                                {saving ? 'Adding...' : 'Add Agent'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Agents List */}
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                        ) : (
                            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                                <ul className="divide-y divide-gray-200">
                                    {agents.length === 0 ? (
                                        <li className="px-4 py-5 sm:px-6">
                                            <div className="text-center">
                                                <p className="text-sm text-gray-500">No agents found.</p>
                                            </div>
                                        </li>
                                    ) : (
                                        agents.map((agent) => (
                                            <li key={agent.id}>
                                                <div className="px-4 py-4 sm:px-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
                                                                {agent.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="flex items-center">
                                                                    <h3 className="text-sm font-medium text-gray-900">{agent.name}</h3>
                                                                    {agent.is_admin && (
                                                                        <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                      Admin
                                    </span>
                                                                    )}
                                                                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                                        agent.is_active
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-gray-100 text-gray-800'
                                                                    }`}>
                                    {agent.is_active ? 'Active' : 'Inactive'}
                                  </span>
                                                                </div>
                                                                <div className="text-sm text-gray-500">{agent.email}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex space-x-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleAgentStatus(agent.id, agent.is_active)}
                                                                className="text-sm text-indigo-600 hover:text-indigo-900"
                                                            >
                                                                {agent.is_active ? 'Deactivate' : 'Activate'}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveAgent(agent.id)}
                                                                className="text-sm text-red-600 hover:text-red-900"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgentManagement;