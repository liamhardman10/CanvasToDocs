// Modify your main.js to read settings
async function getUserSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
      resolve({
        defaultDocType: result.defaultDocType || 'google',
        buttonPosition: result.buttonPosition || 'bottom-right',
        customSelectors: result.customSelectors ? result.customSelectors.split(',') : []
      });
    });
  });
}

// Then in your init function, use custom selectors
async function init() {
  const settings = await getUserSettings();
  
  // Merge custom selectors with defaults
  const allSelectors = [...SELECTORS, ...settings.customSelectors];
  
  // Rest of your code...
}