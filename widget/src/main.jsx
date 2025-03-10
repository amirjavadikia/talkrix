import React from 'react';
import { createRoot } from 'react-dom/client'; // Import createRoot instead of ReactDOM
import App from './App';
import './styles/ChatWidget.css';

// Make React available globally for the embed script
window.React = React;
// Note: You don’t need to expose ReactDOM globally unless your embed script specifically requires it

// This file is used for development only
// In production, the App component is initialized by the embed script

// For development purposes only, render the app directly
if (process.env.NODE_ENV === 'development') {
    const devConfig = {
        apiKey: 'dev-api-key',
        websiteId: 'dev-website-id',
        baseUrl: 'http://localhost/api',
        wsUrl: 'ws://localhost:8080',
        themeColor: '#4f46e5',
        position: 'bottom-right',
        greetingMessage: 'Hi there! How can we help you today?',
        awayMessage: "We're currently away. Leave a message and we'll get back to you as soon as possible.",
        logoUrl: null,
        companyName: 'Talkrix Dev'
    };

    const devContainer = document.createElement('div');
    devContainer.id = 'talkrix-dev-container';
    document.body.appendChild(devContainer);

    // Use createRoot instead of ReactDOM.render
    const root = createRoot(devContainer);
    root.render(
        <React.StrictMode>
            <App
                apiKey={devConfig.apiKey}
                websiteId={devConfig.websiteId}
                baseUrl={devConfig.baseUrl}
                wsUrl={devConfig.wsUrl}
                themeColor={devConfig.themeColor}
                position={devConfig.position}
                greetingMessage={devConfig.greetingMessage}
                awayMessage={devConfig.awayMessage}
                logoUrl={devConfig.logoUrl}
                companyName={devConfig.companyName}
            />
        </React.StrictMode>
    );
}