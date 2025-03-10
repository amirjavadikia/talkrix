// Talkrix Chat Embed Script

(function() {
    // Configuration (will be customized for each website owner)
    const config = {
        apiKey: 'YOUR_API_KEY',
        websiteId: 'YOUR_WEBSITE_ID',
        baseUrl: 'https://api.talkrix.com',
        wsUrl: 'wss://ws.talkrix.com',
        themeColor: '#4f46e5',
        position: 'bottom-right',
        greetingMessage: 'Hi there! How can we help you today?',
        awayMessage: "We're currently away. Leave a message and we'll get back to you as soon as possible.",
        logoUrl: null,
        companyName: 'Support'
    };

    // Check if the widget is already initialized
    if (window.TalkrixInitialized) {
        return;
    }

    // Mark as initialized
    window.TalkrixInitialized = true;

    // Create container for the widget
    const container = document.createElement('div');
    container.id = 'talkrix-container';
    document.body.appendChild(container);

    // Function to load the widget
    const loadChatWidget = () => {
        // Create a link to load CSS
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = `${config.baseUrl}/widget/chat-widget.css`;
        document.head.appendChild(styleLink);

        // Create a script element to load the widget bundle
        const script = document.createElement('script');
        script.src = `${config.baseUrl}/widget/chat-widget.js`;
        script.async = true;
        script.onload = () => {
            // Initialize the widget once loaded
            if (typeof window.initTalkrixWidget === 'function') {
                window.initTalkrixWidget(container, config);
            } else {
                console.error('Talkrix chat widget initialization function not found');
            }
        };
        script.onerror = () => {
            console.error('Failed to load Talkrix chat widget');
        };
        document.body.appendChild(script);
    };

    // Load the widget after the page has fully loaded
    if (document.readyState === 'complete') {
        loadChatWidget();
    } else {
        window.addEventListener('load', loadChatWidget);
    }

    // Add utility functions to the global scope
    window.Talkrix = {
        // Show the widget
        show: function() {
            const widgetContainer = document.getElementById('talkrix-container');
            if (widgetContainer) {
                widgetContainer.style.display = 'block';
            }
        },

        // Hide the widget
        hide: function() {
            const widgetContainer = document.getElementById('talkrix-container');
            if (widgetContainer) {
                widgetContainer.style.display = 'none';
            }
        },

        // Open the chat window
        open: function() {
            if (window.openTalkrixWidget && typeof window.openTalkrixWidget === 'function') {
                window.openTalkrixWidget();
            }
        },

        // Close the chat window
        close: function() {
            if (window.closeTalkrixWidget && typeof window.closeTalkrixWidget === 'function') {
                window.closeTalkrixWidget();
            }
        },

        // Update widget settings
        updateConfig: function(newConfig) {
            if (window.updateTalkrixWidgetConfig && typeof window.updateTalkrixWidgetConfig === 'function') {
                window.updateTalkrixWidgetConfig(newConfig);
            }
        },

        // Set visitor data
        setVisitorData: function(data) {
            if (window.setTalkrixVisitorData && typeof window.setTalkrixVisitorData === 'function') {
                window.setTalkrixVisitorData(data);
            }
        },

        // Handle custom events
        on: function(eventName, callback) {
            if (!window.talkrixEventListeners) {
                window.talkrixEventListeners = {};
            }

            if (!window.talkrixEventListeners[eventName]) {
                window.talkrixEventListeners[eventName] = [];
            }

            window.talkrixEventListeners[eventName].push(callback);
        },

        // Trigger events manually
        trigger: function(eventName, data) {
            if (window.triggerTalkrixEvent && typeof window.triggerTalkrixEvent === 'function') {
                window.triggerTalkrixEvent(eventName, data);
            }
        }
    };
})();