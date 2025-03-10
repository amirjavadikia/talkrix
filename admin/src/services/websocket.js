/**
 * WebSocket service for real-time communication
 * Handles connecting to WebSocket server, sending and receiving messages
 */

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.reconnectTimeout = null;
        this.maxReconnectAttempts = 5;
        this.reconnectAttempts = 0;
        this.reconnectInterval = 3000; // 3 seconds
        this.heartbeatInterval = null;
        this.messageCallbacks = [];
        this.connectedCallbacks = [];
        this.disconnectedCallbacks = [];
    }

    /**
     * Connect to WebSocket server
     *
     * @param {string} websiteId - The website ID
     * @param {string} agentId - The agent ID
     * @returns {WebSocketService} - Returns this for chaining
     */
    connect(websiteId, agentId) {
        // Clear any existing socket
        if (this.socket) {
            this.disconnect();
        }

        this.websiteId = websiteId;
        this.agentId = agentId;

        const token = localStorage.getItem('token');
        const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';

        this.socket = new WebSocket(`${wsUrl}/ws/agent?agent_id=${agentId}&website_id=${websiteId}&token=${token}`);

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
        this.socket.onerror = this.handleError.bind(this);

        // Start heartbeat when connected
        this.startHeartbeat();

        return this;
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
        if (this.socket) {
            // Clear intervals and timeouts
            clearInterval(this.heartbeatInterval);
            clearTimeout(this.reconnectTimeout);

            // Close socket
            if (this.socket.readyState === WebSocket.OPEN) {
                this.socket.close();
            }

            this.socket = null;
            this.connected = false;
        }
    }

    /**
     * Send message to WebSocket server
     *
     * @param {Object} message - The message to send
     */
    sendMessage(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket not connected');
            return;
        }

        // Add common fields
        const fullMessage = {
            ...message,
            website_id: this.websiteId,
            sender_type: 'agent',
            sender_id: this.agentId,
            timestamp: Math.floor(Date.now() / 1000),
        };

        this.socket.send(JSON.stringify(fullMessage));
    }

    /**
     * Send typing indicator to WebSocket server
     *
     * @param {string} conversationId - The conversation ID
     */
    sendTypingIndicator(conversationId) {
        this.sendMessage({
            type: 'typing',
            conversation_id: conversationId,
            content: true,
        });
    }

    /**
     * Send read receipt to WebSocket server
     *
     * @param {string} conversationId - The conversation ID
     */
    sendReadReceipt(conversationId) {
        this.sendMessage({
            type: 'read',
            conversation_id: conversationId,
        });
    }

    /**
     * Register callback for message events
     *
     * @param {Function} callback - The callback function
     * @returns {WebSocketService} - Returns this for chaining
     */
    onMessage(callback) {
        if (typeof callback === 'function') {
            this.messageCallbacks.push(callback);
        }
        return this;
    }

    /**
     * Register callback for connected events
     *
     * @param {Function} callback - The callback function
     * @returns {WebSocketService} - Returns this for chaining
     */
    onConnected(callback) {
        if (typeof callback === 'function') {
            this.connectedCallbacks.push(callback);

            // Call immediately if already connected
            if (this.connected) {
                callback();
            }
        }
        return this;
    }

    /**
     * Register callback for disconnected events
     *
     * @param {Function} callback - The callback function
     * @returns {WebSocketService} - Returns this for chaining
     */
    onDisconnected(callback) {
        if (typeof callback === 'function') {
            this.disconnectedCallbacks.push(callback);

            // Call immediately if already disconnected
            if (!this.connected && this.socket) {
                callback();
            }
        }
        return this;
    }

    /**
     * Handle WebSocket open event
     */
    handleOpen() {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // Call connected callbacks
        this.connectedCallbacks.forEach(callback => callback());
    }

    /**
     * Handle WebSocket message event
     *
     * @param {MessageEvent} event - The message event
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);

            // Call message callbacks
            this.messageCallbacks.forEach(callback => callback(message));
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket close event
     *
     * @param {CloseEvent} event - The close event
     */
    handleClose(event) {
        console.log(`WebSocket disconnected: ${event.code} ${event.reason}`);
        this.connected = false;
        clearInterval(this.heartbeatInterval);

        // Call disconnected callbacks
        this.disconnectedCallbacks.forEach(callback => callback());

        // Attempt to reconnect
        this.attemptReconnect();
    }

    /**
     * Handle WebSocket error event
     *
     * @param {Event} event - The error event
     */
    handleError(event) {
        console.error('WebSocket error:', event);
    }

    /**
     * Attempt to reconnect to WebSocket server
     */
    attemptReconnect() {
        // Clear any existing reconnect timeout
        clearTimeout(this.reconnectTimeout);

        // Check if maximum reconnect attempts reached
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Maximum reconnect attempts reached');
            return;
        }

        // Increment reconnect attempts
        this.reconnectAttempts++;

        // Set timeout for reconnect
        this.reconnectTimeout = setTimeout(() => {
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connect(this.websiteId, this.agentId);
        }, this.reconnectInterval);
    }

    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        // Clear any existing heartbeat interval
        clearInterval(this.heartbeatInterval);

        // Set interval for heartbeat
        this.heartbeatInterval = setInterval(() => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                // Send ping message
                this.socket.send(JSON.stringify({
                    type: 'ping',
                    timestamp: Math.floor(Date.now() / 1000),
                }));
            }
        }, 30000); // 30 seconds
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;