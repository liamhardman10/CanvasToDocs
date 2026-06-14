// js/content.js - Google Docs button with position settings support
console.log('Extension loaded');

// Get assignment title from Canvas
function getAssignmentTitle() {
    const selectors = [
        'h1[data-testid="assignment-title"]',
        '.assignment-title',
        '.title',
        'header h1',
        '#content h1',
        '.assignment-view h1',
        'h1'
    ];
    
    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            let title = element.innerText.trim();
            title = title.replace(/ - Due:.*$/, '')
                       .replace(/ \| .*$/, '');
            console.log('Found title:', title);
            return title;
        }
    }
    
    let title = document.title;
    title = title.replace(/ - .*$/, '').replace(/ \| .*$/, '');
    console.log('Fallback title:', title);
    return title || 'Canvas Assignment';
}

// Load settings from storage
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
            console.log('Loaded settings:', result);
            resolve({
                defaultDocType: result.defaultDocType || 'google',
                buttonPosition: result.buttonPosition || 'bottom-right',
                customSelectors: result.customSelectors || ''
            });
        });
    });
}

// Get position CSS based on setting
function getPositionStyle(position) {
    switch(position) {
        case 'bottom-right':
            return `
                bottom: 20px;
                right: 20px;
            `;
        case 'bottom-left':
            return `
                bottom: 20px;
                left: 20px;
            `;
        case 'top-right':
            return `
                top: 20px;
                right: 20px;
            `;
        case 'top-left':
            return `
                top: 20px;
                left: 20px;
            `;
        default:
            return `
                bottom: 20px;
                right: 20px;
            `;
    }
}

// Create floating button with X in corner
async function createFloatingButton() {
    // Don't add twice
    if (document.getElementById('doclaunch-floating-btn')) return;
    
    const settings = await loadSettings();
    const title = getAssignmentTitle();
    const positionStyle = getPositionStyle(settings.buttonPosition);
    
    // Create wrapper for positioning
    const wrapper = document.createElement('div');
    wrapper.id = 'doclaunch-floating-btn';
    wrapper.style.cssText = `
        position: fixed;
        ${positionStyle}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Main button
    const button = document.createElement('button');
    button.innerHTML = '📄 Open in Google Docs';
    button.style.cssText = `
        background: #4285f4;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 12px 20px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        font-family: inherit;
        padding-right: 35px;
    `;
    
    button.onmouseenter = () => {
        button.style.transform = 'scale(1.05)';
        button.style.background = '#3367d6';
    };
    button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
        button.style.background = '#4285f4';
    };
    button.onclick = (e) => {
        if (e.target === button) {
            const url = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`;
            chrome.runtime.sendMessage({ action: "openDocument", url: url });
        }
    };
    
    // X button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: #666;
        color: white;
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        padding: 0;
        line-height: 1;
        font-weight: bold;
    `;
    
    closeBtn.onmouseenter = () => {
        closeBtn.style.background = '#ff4444';
        closeBtn.style.transform = 'scale(1.1)';
    };
    closeBtn.onmouseleave = () => {
        closeBtn.style.background = '#666';
        closeBtn.style.transform = 'scale(1)';
    };
    
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        wrapper.style.display = 'none';
    };
    
    wrapper.appendChild(button);
    wrapper.appendChild(closeBtn);
    document.body.appendChild(wrapper);
    
    console.log('✅ Button added at position:', settings.buttonPosition);
}

// Remove existing button
function removeButton() {
    const existingBtn = document.getElementById('doclaunch-floating-btn');
    if (existingBtn) existingBtn.remove();
}

// Refresh button with new settings
async function refreshButton() {
    console.log('Refreshing button with new settings...');
    removeButton();
    await createFloatingButton();
}

// Listen for settings updates from popup
function listenForSettingsUpdates() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Content script received message:', request);
        
        if (request.action === "settingsUpdated") {
            console.log('Settings updated, refreshing button position');
            refreshButton();
            sendResponse({ success: true });
        }
        return true;
    });
}

// Initialize
async function init() {
    console.log('initializing script');
    
    // Check if on Canvas assignment page
    const isCanvas = window.location.hostname.includes('instructure.com');
    const isAssignment = window.location.pathname.includes('/assignments/');
    
    if (isCanvas && isAssignment) {
        console.log('On Canvas assignment page - adding button');
        
        // Listen for future settings changes
        listenForSettingsUpdates();
        
        // Create button
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(createFloatingButton, 500);
            });
        } else {
            setTimeout(createFloatingButton, 500);
        }
    } else {
        console.log('Not a Canvas assignment page - skipping');
    }
}

// Watch for page changes
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        removeButton();
        setTimeout(init, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Start
init();