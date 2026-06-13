// js/popup.js - Complete rewrite with NO direct content script messaging

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup opened');
    
    // Load saved settings
    loadSettings();
    
    // Setup save button
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
});

// Load settings from storage
function loadSettings() {
    chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
        console.log('Loaded settings:', result);
        
        const docTypeSelect = document.getElementById('defaultDocType');
        const positionSelect = document.getElementById('buttonPosition');
        const customInput = document.getElementById('customSelectors');
        
        if (docTypeSelect) docTypeSelect.value = result.defaultDocType || 'google';
        if (positionSelect) positionSelect.value = result.buttonPosition || 'bottom-right';
        if (customInput) customInput.value = result.customSelectors || '';
    });
}

// Save settings to storage
function saveSettings() {
    const settings = {
        defaultDocType: document.getElementById('defaultDocType').value,
        buttonPosition: document.getElementById('buttonPosition').value,
        customSelectors: document.getElementById('customSelectors').value
    };
    
    // Save to Chrome storage
    chrome.storage.sync.set(settings, () => {
        console.log('Settings saved:', settings);
        
        // Show success message
        const btn = document.getElementById('saveBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        btn.style.backgroundColor = '#34a853';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '#1a73e8';
        }, 1500);
        
        // DO NOT try to send message to content script from here
        // The content script will read settings from storage when needed
    });
}