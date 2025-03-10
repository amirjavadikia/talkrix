import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import api from '../services/api';

const Analytics = () => {
    const { websiteId } = useParams();
    const [loading, setLoading] = useState(true);
    const [websites, setWebsites] = useState([]);
    const [agents, setAgents] = useState([]);
    const [analytics, setAnalytics] = useState({
        conversations: {
            total: 0,
            active: 0,
            closed: 0,
        },
        messages: {
            total: 0,
            byVisitor: 0,
            byAgent: 0,
        },
        responseTimes: {
            average: 0,
            min: 0,
            max: 0,
        },
        visitors: {
            total: 0,
            returning: 0,
            new: 0,
        },
        dailyStats: [],
        peakHours: [],
    });
    const [dateRange, setDateRange] = useState('7d');
    const [chartView, setChartView] = useState('conversations');

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

                // Fetch analytics data
                if (websiteId) {
                    const analyticsResponse = await api.getAnalytics(websiteId, { range: dateRange });
                    setAnalytics(analyticsResponse);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching analytics data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, [websiteId, dateRange]);

    // Format date for display
    const formatDate = (dateString) => {
        return format(parseISO(dateString), 'MMM d');
    };

    // Format time for display (convert seconds to human-readable format)
    const formatTime = (seconds) => {
        if (seconds < 60) {
            return `${seconds} sec`;
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            return `${minutes} min`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${hours}h ${minutes}m`;
        }
    };

    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
    };

    // Calculate percentage change
    const calculateChange = (current, previous) => {
        if (previous === 0) return 100;
        return ((current - previous) / previous) * 100;
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
                            <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>

                            <div className="flex space-x-2">
                                <button
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                        dateRange === '7d'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleDateRangeChange('7d')}
                                >
                                    Last 7 days
                                </button>
                                <button
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                        dateRange === '30d'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleDateRangeChange('30d')}
                                >
                                    Last 30 days
                                </button>
                                <button
                                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                                        dateRange === '90d'
                                            ? 'bg-indigo-100 text-indigo-700'
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => handleDateRangeChange('90d')}
                                >
                                    Last 90 days
                                </button>
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
                            <>
                                {/* Overview Cards */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                                    {/* Total Conversations Card */}
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                                                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Total Conversations
                                                        </dt>
                                                        <dd>
                                                            <div className="text-lg font-medium text-gray-900">
                                                                {analytics.conversations.total.toLocaleString()}
                                                            </div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Active</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.conversations.active.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Closed</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.conversations.closed.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Messages Card */}
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                                                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Total Messages
                                                        </dt>
                                                        <dd>
                                                            <div className="text-lg font-medium text-gray-900">
                                                                {analytics.messages.total.toLocaleString()}
                                                            </div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Visitors</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.messages.byVisitor.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Agents</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.messages.byAgent.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Response Time Card */}
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                                                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Avg. Response Time
                                                        </dt>
                                                        <dd>
                                                            <div className="text-lg font-medium text-gray-900">
                                                                {formatTime(analytics.responseTimes.average)}
                                                            </div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-500">Min</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{formatTime(analytics.responseTimes.min)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Max</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{formatTime(analytics.responseTimes.max)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Visitors Card */}
                                    <div className="bg-white overflow-hidden shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                                                    <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <div className="ml-5 w-0 flex-1">
                                                    <dl>
                                                        <dt className="text-sm font-medium text-gray-500 truncate">
                                                            Total Visitors
                                                        </dt>
                                                        <dd>
                                                            <div className="text-lg font-medium text-gray-900">
                                                                {analytics.visitors.total.toLocaleString()}
                                                            </div>
                                                        </dd>
                                                    </dl>
                                                </div>
                                            </div>

                                            <div className="mt-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-sm text-gray-500">New</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.visitors.new.toLocaleString()}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-gray-500">Returning</span>
                                                        <span className="ml-2 text-sm font-medium text-gray-900">{analytics.visitors.returning.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Chart Section */}
                                <div className="bg-white shadow rounded-lg mb-8">
                                    <div className="border-b border-gray-200">
                                        <nav className="flex -mb-px">
                                            <button
                                                className={`${
                                                    chartView === 'conversations'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                                onClick={() => setChartView('conversations')}
                                            >
                                                Conversations
                                            </button>
                                            <button
                                                className={`${
                                                    chartView === 'messages'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                                onClick={() => setChartView('messages')}
                                            >
                                                Messages
                                            </button>
                                            <button
                                                className={`${
                                                    chartView === 'responseTimes'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                                onClick={() => setChartView('responseTimes')}
                                            >
                                                Response Times
                                            </button>
                                            <button
                                                className={`${
                                                    chartView === 'visitors'
                                                        ? 'border-indigo-500 text-indigo-600'
                                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
                                                onClick={() => setChartView('visitors')}
                                            >
                                                Visitors
                                            </button>
                                        </nav>
                                    </div>

                                    <div className="p-6">
                                        {/* Simple Chart Visualization - To be replaced with actual chart component */}
                                        <div className="h-80 flex items-center justify-center">
                                            {chartView === 'conversations' && (
                                                <div className="text-center text-gray-500">
                                                    <p>Conversations Chart</p>
                                                    <p>This would be replaced with an actual chart component</p>
                                                </div>
                                            )}

                                            {chartView === 'messages' && (
                                                <div className="text-center text-gray-500">
                                                    <p>Messages Chart</p>
                                                    <p>This would be replaced with an actual chart component</p>
                                                </div>
                                            )}

                                            {chartView === 'responseTimes' && (
                                                <div className="text-center text-gray-500">
                                                    <p>Response Times Chart</p>
                                                    <p>This would be replaced with an actual chart component</p>
                                                </div>
                                            )}

                                            {chartView === 'visitors' && (
                                                <div className="text-center text-gray-500">
                                                    <p>Visitors Chart</p>
                                                    <p>This would be replaced with an actual chart component</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Additional Stats */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 mb-8">
                                    {/* Peak Hours */}
                                    <div className="bg-white shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Peak Activity Hours</h3>

                                            <div className="space-y-4">
                                                {analytics.peakHours.map((hour, index) => (
                                                    <div key={index} className="flex items-center">
                                                        <div className="w-12 text-sm text-gray-500">
                                                            {hour.hour.toString().padStart(2, '0')}:00
                                                        </div>
                                                        <div className="flex-1 ml-4">
                                                            <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                                                                <div
                                                                    className="bg-indigo-500 h-4"
                                                                    style={{
                                                                        width: `${(hour.count / Math.max(...analytics.peakHours.map(h => h.count))) * 100}%`,
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4 w-16 text-right text-sm font-medium text-gray-900">
                                                            {hour.count}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Agent Performance */}
                                    <div className="bg-white shadow rounded-lg">
                                        <div className="px-4 py-5 sm:p-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Agent Performance</h3>

                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead>
                                                    <tr>
                                                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Agent
                                                        </th>
                                                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Conversations
                                                        </th>
                                                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Messages
                                                        </th>
                                                        <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Avg. Response
                                                        </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                    {agents.map((agent, index) => (
                                                        <tr key={agent.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {agent.name}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                                {(Math.floor(Math.random() * 500) + 50).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                                {(Math.floor(Math.random() * 2000) + 200).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                                                                {formatTime(Math.floor(Math.random() * 300) + 30)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Export Button */}
                                <div className="flex justify-end mb-8">
                                    <button
                                        type="button"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                    >
                                        <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export Data
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;