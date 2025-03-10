import React from 'react';
import ChatWidget from './components/ChatWidget';

// The App component will receive props from the embed script
const App = ({
                 apiKey,
                 websiteId,
                 baseUrl,
                 wsUrl,
                 themeColor,
                 position,
                 greetingMessage,
                 awayMessage,
                 logoUrl,
                 companyName,
             }) => {
    // Render the ChatWidget with all props passed down
    return (
        <ChatWidget
            apiKey={apiKey}
            websiteId={websiteId}
            baseUrl={baseUrl}
            wsUrl={wsUrl}
            themeColor={themeColor}
            position={position}
            greetingMessage={greetingMessage}
            awayMessage={awayMessage}
            logoUrl={logoUrl}
            companyName={companyName}
        />
    );
};

export default App;

// Initialize function that will be called by the embed script
window.initTalkrixWidget = (container, config) => {
    // Import React and ReactDOM dynamically
    const React = window.React;
    const ReactDOM = window.ReactDOM;

    if (!React || !ReactDOM) {
        console.error('React and ReactDOM must be loaded before initializing the widget');
        return;
    }

    // Render the App component with config props
    ReactDOM.render(
        <App
            apiKey={config.apiKey}
            websiteId={config.websiteId}
            baseUrl={config.baseUrl}
            wsUrl={config.wsUrl}
            themeColor={config.themeColor}
            position={config.position}
            greetingMessage={config.greetingMessage}
            awayMessage={config.awayMessage}
            logoUrl={config.logoUrl}
            companyName={config.companyName}
        />,
        container
    );

    // Expose functions to control the widget
    window.openTalkrixWidget = () => {
        const event = new CustomEvent('talkrix:open');
        document.dispatchEvent(event);
    };

    window.closeTalkrixWidget = () => {
        const event = new CustomEvent('talkrix:close');
        document.dispatchEvent(event);
    };

    window.updateTalkrixWidgetConfig = (newConfig) => {
        const event = new CustomEvent('talkrix:updateConfig', {
            detail: { config: newConfig }
        });
        document.dispatchEvent(event);
    };

    window.setTalkrixVisitorData = (data) => {
        const event = new CustomEvent('talkrix:setVisitorData', {
            detail: { data }
        });
        document.dispatchEvent(event);
    };

    window.triggerTalkrixEvent = (eventName, data) => {
        const event = new CustomEvent(`talkrix:${eventName}`, {
            detail: data
        });
        document.dispatchEvent(event);

        // Call any registered callbacks
        if (window.talkrixEventListeners && window.talkrixEventListeners[eventName]) {
            window.talkrixEventListeners[eventName].forEach(callback => {
                callback(data);
            });
        }
    };
};