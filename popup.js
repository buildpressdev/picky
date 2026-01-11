// Picky App - Alpine.js Component
function pickyApp() {
    return {
        init() {
            // No initialization needed for simplified popup
        },
        
        activateColorPicker() {
            this.sendMessageToContent({
                action: 'toggleColorPicker',
                active: true
            });
            
            // Close popup after activation
            window.close();
        },
        
        activateTypographyPicker() {
            this.sendMessageToContent({
                action: 'toggleTypographyPicker', 
                active: true
            });
            
            // Close popup after activation
            window.close();
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