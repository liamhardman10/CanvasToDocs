// js/content.js - DocLaunch Extension
// Canvas-embedded document launcher with settings support

console.log('🚨🚨🚨 CONTENT.JS HAS LOADED 🚨🚨🚨');
console.log('Current URL:', window.location.href);
console.log('Is Canvas?', window.location.href.includes('.instructure.com'));
console.log('Is Assignment?', window.location.href.includes('/assignments/'));

// ============================================
// 1. CANVAS-SPECIFIC SELECTORS
// ============================================

const CANVAS_SELECTORS = [
    'h1[data-testid="assignment-title"]',
    '.assignment-title',
    '.title',
    'header h1',
    '[data-selenium="assignment-title"]',
    '.AssignmentTitle__Text',
    '.assign-title',
    '#assignment_show .title',
    '.entry-title',
    '.page-title'
];

// ============================================
// 2. UTILITY FUNCTIONS
// ============================================

function getAssignmentTitle() {
    for (let selector of CANVAS_SELECTORS) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            let title = element.innerText.trim();
            // Clean up Canvas-specific suffixes
            title = title.replace(/ - Due:.*$/, '')
                       .replace(/ \| .*$/, '')
                       .replace(/ \[.*?\]/, '')
                       .replace(/ \(.*?\)/, '');
            return title;
        }
    }
    
    // Fallback: try to find any h1 in the main content area
    const mainH1 = document.querySelector('#content h1, .assignment-view h1, .header-bar h1');
    if (mainH1 && mainH1.innerText.trim()) {
        return mainH1.innerText.trim();
    }
    
    // Last resort: use page title
    let pageTitle = document.title;
    pageTitle = pageTitle.replace(/ - .*$/, '').replace(/ \| .*$/, '');
    return pageTitle || "Canvas Assignment";
}

// ============================================
// 3. LOAD SETTINGS FROM STORAGE
// ============================================

async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['defaultDocType', 'buttonPosition', 'customSelectors'], (result) => {
            resolve({
                defaultDocType: result.defaultDocType || 'google',
                buttonPosition: result.buttonPosition || 'bottom-right',
                customSelectors: result.customSelectors ? result.customSelectors.split(',').map(s => s.trim()) : []
            });
        });
    });
}

// ============================================
// 4. BUTTON CREATION FUNCTIONS
// ============================================

function createGoogleButton(title) {
    const button = document.createElement('button');
    button.textContent = '📄 Open in Google Docs';
    button.className = 'doclaunch-btn-google';
    button.setAttribute('aria-label', 'Open this assignment in Google Docs');
    
    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`;
        
        chrome.runtime.sendMessage({ 
            action: "openDocument", 
            url: url, 
            title: title,
            docType: 'google'
        }).catch(err => console.log('Background connection error:', err));
    };
    
    return button;
}

function createWordButton(title) {
    const button = document.createElement('button');
    button.textContent = '📝 Open in Word Online';
    button.className = 'doclaunch-btn-word';
    button.setAttribute('aria-label', 'Open this assignment in Word Online');
    
    button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const url = `https://www.office.com/launch/word?title=${encodeURIComponent(title)}`;
        
        chrome.runtime.sendMessage({ 
            action: "openDocument", 
            url: url, 
            title: title,
            docType: 'word'
        }).catch(err => console.log('Background connection error:', err));
    };
    
    return button;
}

// ============================================
// 5. EMBEDDED CONTAINER CREATION
// ============================================

function createEmbeddedContainer(title, position) {
    const container = document.createElement('div');
    container.className = 'doclaunch-canvas-container';
    container.setAttribute('data-doclaunch', 'true');
    
    // Add a subtle label
    const label = document.createElement('div');
    label.className = 'doclaunch-label';
    label.textContent = '📄 Create Document';
    label.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: #6c757d;
        margin-bottom: 8px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
    
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'doclaunch-button-group';
    buttonGroup.style.cssText = `
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
    `;
    
    buttonGroup.appendChild(createGoogleButton(title));
    buttonGroup.appendChild(createWordButton(title));
    
    container.appendChild(label);
    container.appendChild(buttonGroup);
    
    return container;
}

// ============================================
// 6. INJECT INTO CANVAS (EMBEDDED)
// ============================================

async function injectIntoCanvas() {
    // Don't inject twice
    if (document.querySelector('[data-doclaunch="true"]')) {
        console.log('DocLaunch already injected');
        return;
    }
    
    // Check if we're on a Canvas assignment page
    const isCanvasAssignment = window.location.href.includes('/assignments/') && 
                               window.location.href.includes('.instructure.com');
    
    if (!isCanvasAssignment) {
        console.log('Not a Canvas assignment page');
        return;
    }
    
    const title = getAssignmentTitle();
    console.log('📝 Canvas Assignment Detected:', title);
    
    if (!title || title === "Canvas Assignment") {
        console.warn('Could not detect assignment title');
    }
    
    const settings = await loadSettings();
    const container = createEmbeddedContainer(title, settings.buttonPosition);
    
    // Try different Canvas injection points in order of preference
    let injected = false;
    
    // Location 1: After assignment header (most common)
    const headerSelectors = [
        '.assignment-header',
        '.header-bar',
        '.assignment-title-pane',
        '#assignment_show',
        '.assignment-view .header',
        '.content-header'
    ];
    
    for (let selector of headerSelectors) {
        const targetElement = document.querySelector(selector);
        if (targetElement && targetElement.parentNode) {
            targetElement.insertAdjacentElement('afterend', container);
            injected = true;
            console.log('Injected after:', selector);
            break;
        }
    }
    
    // Location 2: In the right sidebar
    if (!injected) {
        const sidebar = document.querySelector('#right-side, .right-side-wrapper, .assignment-sidebar');
        if (sidebar) {
            if (sidebar.firstChild) {
                sidebar.insertBefore(container, sidebar.firstChild);
            } else {
                sidebar.appendChild(container);
            }
            injected = true;
            console.log('Injected into sidebar');
        }
    }
    
    // Location 3: Before assignment content
    if (!injected) {
        const content = document.querySelector('#content, .assignment-view, .assignment-content, .module');
        if (content && content.firstChild) {
            content.insertBefore(container, content.firstChild);
            injected = true;
            console.log('Injected before content');
        }
    }
    
    // Location 4: Fallback - add to top of main content area
    if (!injected) {
        const mainContent = document.querySelector('#main, #content, .ic-app-main-content');
        if (mainContent) {
            mainContent.insertAdjacentElement('afterbegin', container);
            injected = true;
            console.log('Fallback injection into main content');
        }
    }
    
    if (injected) {
        console.log('✅ DocLaunch button embedded in Canvas');
        applyCanvasStyles();
    } else {
        console.warn('Could not find injection point for DocLaunch');
    }
}

// ============================================
// 7. APPLY CANVAS-MATCHING STYLES
// ============================================

function applyCanvasStyles() {
    // Add style element if not already present
    if (document.querySelector('#doclaunch-canvas-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'doclaunch-canvas-styles';
    style.textContent = `
        /* DocLaunch Canvas Embed Styles */
        .doclaunch-canvas-container {
            margin: 16px 20px;
            padding: 12px 16px;
            background: #FFFFFF;
            border: 1px solid #E9EBEE;
            border-radius: 4px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .doclaunch-btn-google {
            background-color: #0088EE;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .doclaunch-btn-google:hover {
            background-color: #0066c4;
        }
        
        .doclaunch-btn-google:active {
            transform: translateY(1px);
        }
        
        .doclaunch-btn-word {
            background-color: #F5F5F5;
            color: #2C3E50;
            border: 1px solid #C7CDD1;
            border-radius: 4px;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        .doclaunch-btn-word:hover {
            background-color: #E8E8E8;
            border-color: #A0A8B0;
        }
        
        .doclaunch-btn-word:active {
            transform: translateY(1px);
        }
        
        .doclaunch-label {
            font-size: 11px;
            font-weight: 600;
            color: #6C757D;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .doclaunch-canvas-container {
                background: #2C2C2C;
                border-color: #444444;
            }
            .doclaunch-label {
                color: #B0B0B0;
            }
            .doclaunch-btn-word {
                background-color: #3C3C3C;
                color: #E0E0E0;
                border-color: #555555;
            }
            .doclaunch-btn-word:hover {
                background-color: #4C4C4C;
            }
        }
    `;
    
    document.head.appendChild(style);
}

// ============================================
// 8. HANDLE DYNAMIC CANVAS NAVIGATION
// ============================================

function watchCanvasNavigation() {
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl && currentUrl.includes('/assignments/')) {
            console.log('Canvas navigation detected');
            lastUrl = currentUrl;
            
            // Remove old instance
            const oldContainer = document.querySelector('[data-doclaunch="true"]');
            if (oldContainer) oldContainer.remove();
            
            // Wait for new page to render
            setTimeout(() => {
                injectIntoCanvas();
            }, 800);
        }
    });
    
    observer.observe(document, { 
        subtree: true, 
        childList: true 
    });
}

// ============================================
// 9. LISTEN FOR SETTINGS UPDATES
// ============================================

function listenForSettingsUpdates() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "settingsUpdated") {
            console.log('Settings updated, refreshing button');
            // Remove old container
            const oldContainer = document.querySelector('[data-doclaunch="true"]');
            if (oldContainer) oldContainer.remove();
            // Reinject with new settings
            setTimeout(() => {
                injectIntoCanvas();
            }, 100);
            sendResponse({ success: true });
        }
        return true;
    });
}

// ============================================
// 10. INITIALIZATION
// ============================================

function init() {
    console.log('🚀 DocLaunch extension loading...');
    
    // Check if we're on a Canvas assignment page
    const isCanvas = window.location.href.includes('.instructure.com');
    const isAssignment = window.location.href.includes('/assignments/');
    
    if (!isCanvas || !isAssignment) {
        console.log('Not a Canvas assignment page, skipping');
        return;
    }
    
    // Wait for page to be fully ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(injectIntoCanvas, 500);
        });
    } else {
        setTimeout(injectIntoCanvas, 500);
    }
    
    // Set up watchers
    watchCanvasNavigation();
    listenForSettingsUpdates();
}

// ============================================
// 11. START THE EXTENSION
// ============================================

// Start when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

console.log('📄 DocLaunch content script loaded');