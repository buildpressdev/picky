// Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('Picky Extension installed successfully!');
});

// Handle extension icon click if needed
chrome.action.onClicked.addListener((tab) => {
    // The popup will handle the interaction, so this is optional
    console.log('Picky extension icon clicked');
});

// Handle messages from content scripts if needed
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Handle any background script specific messages
    if (message.action === 'log') {
        console.log('Content script message:', message.data);
    }
    
    sendResponse({ received: true });
});