/**
 * Authentication utility functions
 */

// Check if user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

// Get user ID from localStorage
export const getUserId = () => {
    return localStorage.getItem('userId');
};

// Get agent ID from localStorage
export const getAgentId = () => {
    return localStorage.getItem('agentId');
};

// Set auth token in localStorage
export const setAuthToken = (token) => {
    localStorage.setItem('token', token);
};

// Set user ID in localStorage
export const setUserId = (userId) => {
    localStorage.setItem('userId', userId);
};

// Set agent ID in localStorage
export const setAgentId = (agentId) => {
    localStorage.setItem('agentId', agentId);
};

// Remove auth data from localStorage on logout
export const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('agentId');
};

// Parse JWT token to get claims
export const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

// Check if token is expired
export const isTokenExpired = (token) => {
    try {
        const decoded = parseJwt(token);
        // Check if expiration time is past current time
        return decoded.exp < Date.now() / 1000;
    } catch (e) {
        return true;
    }
};

// Validate token expiration and refresh if needed
export const validateToken = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return false;
    }

    // If token is expired, attempt to refresh
    if (isTokenExpired(token)) {
        try {
            // This would normally call an API to refresh the token
            // For this example, we'll just return false to trigger login
            return false;

            // Example of refresh token flow:
            // const response = await api.refreshToken();
            // setAuthToken(response.token);
            // return true;
        } catch (error) {
            clearAuth();
            return false;
        }
    }

    return true;
};