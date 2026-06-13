// js/background.js
// Listen for messages from popup and content scripts

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);
    
    if (request.action === "openDocument") {
        // Open document in new tab
        chrome.tabs.create({ 
            url: request.url, 
            active: true 
        });
        sendResponse({ success: true });
        return true;
    }
    
    if (request.action === "settingsUpdated") {
        // Settings were updated - no need to forward
        console.log('Settings updated:', request.settings);
        sendResponse({ success: true });
        return true;
    }
    
    // Default response
    sendResponse({ received: true });
    return true;
});

// Optional: Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed/updated:', details.reason);
});