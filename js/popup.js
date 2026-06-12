// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
    document.getElementById('defaultDocType').value = result.defaultDocType || 'google';
    document.getElementById('buttonPosition').value = result.buttonPosition || 'bottom-right';
    document.getElementById('customSelectors').value = result.customSelectors || '';
  });
});

// Save settings
document.getElementById('saveBtn').addEventListener('click', () => {
  const settings = {
    defaultDocType: document.getElementById('defaultDocType').value,
    buttonPosition: document.getElementById('buttonPosition').value,
    customSelectors: document.getElementById('customSelectors').value
  };
  
  chrome.storage.sync.set(settings, () => {
    const btn = document.getElementById('saveBtn');
    btn.textContent = 'Saved!';
    setTimeout(() => {
      btn.textContent = 'Save Settings';
    }, 1500);
    
    // Notify content script to refresh
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated", settings: settings});
    });
  });
});