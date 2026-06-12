const SELECTORS = [
    //canvas
    'h1[data-testid="assignment-title"]',
    '.assignment-title',
    'h1.title'
];

const DOC_CREATORS = {
    google: (title) => `https://docs.google.com/document/create?title=${encodeURIComponent(title)}`,
    word: (title) => `https://word.office.com/launch?type=docx&title=${encodeURIComponent(title)}`
};

// extract title

function getAssignmentTitle() {
    for (let selector of SELECTORS) {
        const element = document.querySelector(selector);
        if (element && element.innerText.trim()) {
            let title = element.innerText.trim();

            title = title.replace(/ - Due:.*$/, '')
                         .replace(/ \|.*$/, '')
                         .replace(/ \[.*?\]/, '')
            return title;
        }
    }

    let pageTitle = document.title;
    pageTitle = pageTitle.replace(/ - .*$/, '')
                         .replace(/ \| .*$/, '');

    return pageTitle || "Assignment";

}

// create + inject button

function createButton(title, docType) {
    const button = document.createElement('button');
    button.innerText = docType === 'google' ? 'Open in Google Docs' : 'Open in Microsoft Word';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 10000;
            background: ${docType === 'google' ? '#4285F4' : '#0078D4'};
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 20px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: transform 0.2s, opacity 0.2s;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI, Helvetica, sans-serif;
            `;

            button.onmouseenter = () => {
                button.style.transform = 'scale(1.02';
                button.style.opacity = '0.95';
            };

            button.onmouseleave = () => {
                button.style.transform = 'scale(1)';
                button.style.opacity = '1';
            };

            button.onclick = () => {
                e.preventDefault();
                e.stopPropagation();

                const url = DOC_CREATORS[docType](title);

                chrome.runtime.sendMessage({
                    action: "openDocument",
                    url: url,
                    title: title,
                    docType: docType
                });
            };
    return button;
}

function isButtonInjected() {
    return document.querySelector('#assignment-doc-launcher');
}

function createButtonContainer(title) {
    const container = document.createElement('div');
    container.id = 'assignment-doc-launcher';

    const googleBtn = createButton(title, 'google');
    const wordBtn = createButton(title, 'word');
    
    container.appendChild(googleBtn);
    container.appendChild(wordBtn);

    return container;
}

function init() {
    if (isButtonInjected()) return;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const title = getAssignmentTitle();
            const container = createButtonContainer(title);
            container.id = 'assignment-doc-launcher';
            document.body.appendChild(container);
        });
    } else {
        const title = getAssignmentTitle();
        const container = createButtonContainer(title);
        container.id = 'assignment-doc-launcher';
        document.body.appendChild(container);
    }
}

let lastUrl = location.href;
new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
        lastUrl = url;
        const oldButton = document.querySelector('#assignment-doc-launcher');
        if (oldButton) oldButton.remove();
        setTimeout(init, 500);
    }
}).observe(document, {subtree: true, childList: true});

init();