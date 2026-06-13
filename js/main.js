// js/content.js - Simple floating button version
console.log('🔴 DocLaunch loaded');

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
            // Clean up the title
            title = title.replace(/ - Due:.*$/, '')
                       .replace(/ \| .*$/, '');
            console.log('Found title:', title);
            return title;
        }
    }
    
    // Fallback
    let title = document.title;
    title = title.replace(/ - .*$/, '').replace(/ \| .*$/, '');
    console.log('Fallback title:', title);
    return title || 'Canvas Assignment';
}

// Create floating button
// Create floating button
function createFloatingButton() {
    if (document.getElementById('doclaunch-floating-btn')) return;
    
    const title = getAssignmentTitle();
    
    const container = document.createElement('div');
    container.id = 'doclaunch-floating-btn';
    container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Google Docs button
    const googleBtn = document.createElement('button');
    googleBtn.innerHTML = '📄 Google Doc';
    googleBtn.style.cssText = `...`; // Your existing Google button styles
    googleBtn.onclick = () => {
        const url = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`;
        chrome.runtime.sendMessage({ action: "openDocument", url: url });
    };
    
    // Word button using .new shortcut
    const wordBtn = document.createElement('button');
    wordBtn.innerHTML = '📝 Word Online';
    wordBtn.style.cssText = `
        background: #2b5797;
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
    `;
    wordBtn.onmouseenter = () => {
        wordBtn.style.transform = 'scale(1.05)';
        wordBtn.style.background = '#1e3c6b';
    };
    wordBtn.onmouseleave = () => {
        wordBtn.style.transform = 'scale(1)';
        wordBtn.style.background = '#2b5797';
    };
    wordBtn.onclick = () => {
        // word.new creates a new blank document directly
        chrome.runtime.sendMessage({ action: "openDocument", url: "https://word.new" });
    };
    
    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `...`; // Your existing close button styles
    closeBtn.onclick = () => {
        container.style.display = 'none';
    };
    
    container.appendChild(googleBtn);
    container.appendChild(wordBtn);
    container.appendChild(closeBtn);
    document.body.appendChild(container);
    
    console.log('✅ Floating buttons added to page');
}

// Initialize
function init() {
    console.log('Checking if Canvas assignment...');
    
    // Check if on Canvas assignment page
    const isCanvas = window.location.hostname.includes('instructure.com');
    const isAssignment = window.location.pathname.includes('/assignments/');
    
    if (isCanvas && isAssignment) {
        console.log('On Canvas assignment page - adding buttons');
        
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

// Watch for page changes (for Canvas navigation)
let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        const oldBtn = document.getElementById('doclaunch-floating-btn');
        if (oldBtn) oldBtn.remove();
        setTimeout(init, 1000);
    }
}).observe(document, { subtree: true, childList: true });

// Start
init();