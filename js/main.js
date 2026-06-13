// js/content.js - Canvas-specific embedded version

// Canvas-specific selectors for assignment title
const CANVAS_SELECTORS = [
    'h1[data-testid="assignment-title"]',
    '.assignment-title',
    '.title',
    'header h1',
    '[data-selenium="assignment-title"]',
    '.AssignmentTitle__Text'
];

function getAssignmentTitle() {
    for (let selector of CANVAS_SELECTORS) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            let title = element.innerText.trim();
            // Clean up Canvas-specific suffixes
            title = title.replace(/ - Due:.*$/, '')
                       .replace(/ \| .*$/, '');
            return title;
        }
    }
    
    // Fallback: try to find any h1 in the main content area
    const mainH1 = document.querySelector('#content h1, .assignment-view h1');
    if (mainH1) return mainH1.innerText.trim();
    
    return "Canvas Assignment";
}

function createGoogleButton(title) {
    const button = document.createElement('button');
    button.textContent = '📄 Open in Google Docs';
    button.className = 'doclaunch-btn-google';
    button.onclick = () => {
        const url = `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`;
        chrome.runtime.sendMessage({ action: "openDocument", url: url, title: title });
    };
    return button;
}

function createWordButton(title) {
    const button = document.createElement('button');
    button.textContent = '📝 Open in Word Online';
    button.className = 'doclaunch-btn-word';
    button.onclick = () => {
        const url = `https://www.office.com/launch/word?title=${encodeURIComponent(title)}`;
        chrome.runtime.sendMessage({ action: "openDocument", url: url, title: title });
    };
    return button;
}

function injectIntoCanvas() {
    // Don't inject twice
    if (document.querySelector('.doclaunch-canvas-container')) return;
    
    const title = getAssignmentTitle();
    console.log('📝 Canvas Assignment Detected:', title);
    
    // Create embedded container
    const container = document.createElement('div');
    container.className = 'doclaunch-canvas-container';
    
    // Option 1: Insert as a card after the assignment header
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'doclaunch-button-group';
    buttonGroup.appendChild(createGoogleButton(title));
    buttonGroup.appendChild(createWordButton(title));
    
    container.appendChild(buttonGroup);
    
    // Find where to insert in Canvas
    // Try different Canvas-specific locations
    
    // Location 1: After assignment header (most common)
    let targetElement = document.querySelector('.assignment-header, .header-bar, .assignment-title-pane, #assignment_show');
    
    if (targetElement) {
        // Insert after the target element
        targetElement.insertAdjacentElement('afterend', container);
    } else {
        // Location 2: In the right sidebar
        const sidebar = document.querySelector('#right-side, .right-side-wrapper');
        if (sidebar && sidebar.firstChild) {
            sidebar.insertBefore(container, sidebar.firstChild);
        } else {
            // Location 3: Before the assignment content
            const content = document.querySelector('#content, .assignment-view, .assignment-content');
            if (content && content.firstChild) {
                content.insertBefore(container, content.firstChild);
            }
        }
    }
    
    console.log('✅ DocLaunch button embedded in Canvas');
}

// Canvas-specific initialization
function initCanvas() {
    // Check if we're on a Canvas assignment page
    const isCanvasAssignment = window.location.href.includes('/assignments/') && 
                               window.location.href.includes('.instructure.com');
    
    if (!isCanvasAssignment) return;
    
    // Wait for Canvas to fully load (Canvas uses lots of dynamic content)
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(injectIntoCanvas, 500); // Small delay for Canvas to render
        });
    } else {
        setTimeout(injectIntoCanvas, 500);
    }
}

// Watch for Canvas's dynamic navigation (SPA behavior)
function watchCanvasNavigation() {
    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl && location.href.includes('/assignments/')) {
            lastUrl = location.href;
            // Remove old instance
            const oldContainer = document.querySelector('.doclaunch-canvas-container');
            if (oldContainer) oldContainer.remove();
            setTimeout(injectIntoCanvas, 800);
        }
    });
    observer.observe(document, { subtree: true, childList: true });
}

// Start everything
initCanvas();
watchCanvasNavigation();