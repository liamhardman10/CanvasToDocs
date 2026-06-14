// js/popup.js - Settings that actually apply immediately

document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup opened');
    loadSettings();
    
    document.getElementById('saveBtn').addEventListener('click', saveSettings);
});

function loadSettings() {
    chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
        console.log('Loaded settings into popup:', result);
        
        document.getElementById('defaultDocType').value = result.defaultDocType || 'docs';
        document.getElementById('buttonPosition').value = result.buttonPosition || 'bottom-right';
        document.getElementById('customSelectors').value = result.customSelectors || '';
    });
}

function saveSettings() {
    const settings = {
        defaultDocType: document.getElementById('defaultDocType').value,
        buttonPosition: document.getElementById('buttonPosition').value,
        customSelectors: document.getElementById('customSelectors').value
    };
    
    console.log('Saving settings:', settings);
    
    // Save to storage
    chrome.storage.sync.set(settings, () => {
        console.log('Settings saved');
        
        // Show success message
        const btn = document.getElementById('saveBtn');
        const originalText = btn.textContent;
        btn.textContent = 'Saved!';
        btn.style.backgroundColor = '#34a853';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#1a73e8';
        }, 1500);
        
        // Send message to content script to update
        notifyContentScript(settings);
    });
}

function notifyContentScript(settings) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (!tabs || tabs.length === 0) {
            console.log('No active tab found');
            return;
        }
        
        const tab = tabs[0];
        
        // Check if we can message this tab
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
            console.log('Cannot message this URL:', tab.url);
            return;
        }
        
        console.log('Sending settings update to tab:', tab.id);
        
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, {
            action: "settingsUpdated",
            settings: settings
        }).catch((error) => {
            console.log('Could not send message to content script (page may need refresh):', error.message);
        });
    });
}