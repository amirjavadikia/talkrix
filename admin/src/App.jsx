import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';

// Import pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import WebsiteSettings from './pages/WebsiteSettings';
import AgentManagement from './pages/AgentManagement';

// Protected route component
const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated()) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" replace />;
    }

    return children;
};

const App = () => {
    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected routes */}
                <Route
                    path="/dashboard/:websiteId?"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings/:websiteId?"
                    element={
                        <ProtectedRoute>
                            <Settings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analytics/:websiteId?"
                    element={
                        <ProtectedRoute>
                            <Analytics />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/website-settings/:websiteId"
                    element={
                        <ProtectedRoute>
                            <WebsiteSettings />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/agents/:websiteId?"
                    element={
                        <ProtectedRoute>
                            <AgentManagement />
                        </ProtectedRoute>
                    }
                />

                {/* Default redirect */}
                <Route
                    path="/"
                    element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
                />

                {/* 404 route - redirect to dashboard or login */}
                <Route
                    path="*"
                    element={<Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />}
                />
            </Routes>
        </Router>
    );
};

export default App;