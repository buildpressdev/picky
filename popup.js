// Picky App - Alpine.js Component
function pickyApp() {
    return {
        activePicker: null, // 'color', 'typography', or null
        
        init() {
            // Listen for messages from content script
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleContentMessage(message);
                sendResponse({ received: true });
            });
            
            // Add escape key listener
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.deactivateAllPickers();
                }
            });
            
            // Check current state when popup opens
            this.checkCurrentState();
        },
        
        activateColorPicker() {
            this.sendMessageToContent({
                action: 'toggleColorPicker',
                active: true
            });
        },
        
        activateTypographyPicker() {
            this.sendMessageToContent({
                action: 'toggleTypographyPicker', 
                active: true
            });
        },
        
        deactivateColorPicker() {
            this.activePicker = null;
            this.sendMessageToContent({
                action: 'toggleColorPicker',
                active: false
            });
        },
        
        deactivateTypographyPicker() {
            this.activePicker = null;
            this.sendMessageToContent({
                action: 'toggleTypographyPicker',
                active: false
            });
        },
        
        deactivateAllPickers() {
            this.activePicker = null;
            this.sendMessageToContent({
                action: 'deactivateAll'
            });
        },
        
        handleContentMessage(message) {
            switch (message.action) {
                case 'colorPickerActivated':
                    this.activePicker = 'color';
                    break;
                case 'colorPickerDeactivated':
                    if (this.activePicker === 'color') {
                        this.activePicker = null;
                    }
                    break;
                case 'typographyPickerActivated':
                    this.activePicker = 'typography';
                    break;
                case 'typographyPickerDeactivated':
                    if (this.activePicker === 'typography') {
                        this.activePicker = null;
                    }
                    break;
                case 'allPickersDeactivated':
                    this.activePicker = null;
                    break;
            }
        },
        
        checkCurrentState() {
            this.sendMessageToContent({
                action: 'getCurrentState'
            });
        },
        
        sendMessageToContent(message) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, message);
                }
            });
        }
    };
}

// Initialize Alpine
document.addEventListener('alpine:init', () => {
    window.Alpine = window.Alpine || Alpine;
    window.Alpine.start();
});