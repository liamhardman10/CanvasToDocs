chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "openDocument") {
        chrome.tabs.create({
            url: request.url,
            active: true
        });
        sendResponse({ success: true })
    }

    if (request.action === "trackAnalytics") {
        console.log(`Analytics: ${request.event}`);
        sendResponse({ success: true });
    }
});

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        console.log('Extension Installed');
        chrome.storage.sync.set({ version: '1.0.0' });
    }
});
