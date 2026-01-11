// Content Script - Handles interaction with webpage
class PickyContentScript {
    constructor() {
        this.mode = null; // 'color' or 'typography'
        this.colorPickerActive = false;
        this.typographyPickerActive = false;
        this.cursorCircle = null;
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
            sendResponse({ received: true });
        });

        // Create cursor circle for color picker
        this.createCursorCircle();
    }

    handleMessage(message) {
        switch (message.action) {
            case 'setMode':
                this.setMode(message.mode);
                break;
            case 'toggleColorPicker':
                this.toggleColorPicker(message.active);
                break;
            case 'toggleTypographyPicker':
                this.toggleTypographyPicker(message.active);
                break;
        }
    }

    setMode(mode) {
        this.mode = mode;
        
        // Reset pickers
        this.colorPickerActive = false;
        this.typographyPickerActive = false;
        this.hideCursorCircle();
        
        // Remove existing event listeners
        this.removeEventListeners();
    }

    toggleColorPicker(active) {
        this.colorPickerActive = active;
        this.typographyPickerActive = false; // Disable typography when color is active

        if (active) {
            this.showCursorCircle();
            this.addColorPickerListeners();
        } else {
            this.hideCursorCircle();
            this.removeColorPickerListeners();
        }
    }

    toggleTypographyPicker(active) {
        this.typographyPickerActive = active;
        this.colorPickerActive = false; // Disable color when typography is active

        if (active) {
            this.hideCursorCircle();
            this.addTypographyPickerListeners();
        } else {
            this.removeTypographyPickerListeners();
        }
    }

    createCursorCircle() {
        this.cursorCircle = document.createElement('div');
        this.cursorCircle.id = 'picky-color-circle';
        this.cursorCircle.innerHTML = '<div class="picky-circle-inner">+</div>';
        document.body.appendChild(this.cursorCircle);
    }

    showCursorCircle() {
        if (this.cursorCircle) {
            this.cursorCircle.style.display = 'block';
        }
    }

    hideCursorCircle() {
        if (this.cursorCircle) {
            this.cursorCircle.style.display = 'none';
        }
    }

    // Color Picker Methods
    addColorPickerListeners() {
        this.mouseMoveHandler = (e) => this.handleMouseMove(e);
        this.clickHandler = (e) => this.handleColorClick(e);
        
        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.clickHandler);
        
        // Change cursor style
        document.body.style.cursor = 'crosshair';
    }

    removeColorPickerListeners() {
        if (this.mouseMoveHandler) {
            document.removeEventListener('mousemove', this.mouseMoveHandler);
        }
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler);
        }
        document.body.style.cursor = '';
    }

    handleMouseMove(e) {
        if (!this.colorPickerActive) return;

        // Update cursor circle position
        this.cursorCircle.style.left = (e.clientX - 25) + 'px';
        this.cursorCircle.style.top = (e.clientY - 25) + 'px';

        // Get color at cursor position
        const color = this.getColorAtPosition(e.clientX, e.clientY);
        
        // Send real-time color update to popup
        this.sendMessage({
            action: 'colorUpdate',
            color: color
        });
    }

    handleColorClick(e) {
        if (!this.colorPickerActive) return;
        
        e.preventDefault();
        e.stopPropagation();

        const color = this.getColorAtPosition(e.clientX, e.clientY);
        
        // Send selected color to popup
        this.sendMessage({
            action: 'colorSelected',
            color: color
        });

        // Deactivate color picker after selection
        this.toggleColorPicker(false);
    }

    // Typography Picker Methods
    addTypographyPickerListeners() {
        this.typographyClickHandler = (e) => this.handleTypographyClick(e);
        
        document.addEventListener('click', this.typographyClickHandler);
        
        // Change cursor style
        document.body.style.cursor = 'text';
    }

    removeTypographyPickerListeners() {
        if (this.typographyClickHandler) {
            document.removeEventListener('click', this.typographyClickHandler);
        }
        document.body.style.cursor = '';
    }

    handleTypographyClick(e) {
        if (!this.typographyPickerActive) return;
        
        e.preventDefault();
        e.stopPropagation();

        // Find the text element or closest parent with text
        const element = this.findTextElement(e.target);
        
        if (element) {
            const typography = this.extractTypography(element);
            
            // Send typography data to popup
            this.sendMessage({
                action: 'typographySelected',
                typography: typography
            });
        } else {
            // No typography found
            this.sendMessage({
                action: 'noTypography'
            });
        }

        // Deactivate typography picker after selection
        this.toggleTypographyPicker(false);
    }

    findTextElement(element) {
        // Check if element has text content
        if (element && element.textContent && element.textContent.trim()) {
            return element;
        }
        
        // Check parent elements
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (parent.textContent && parent.textContent.trim()) {
                return parent;
            }
            parent = parent.parentElement;
        }
        
        return null;
    }

    // Utility Methods
    getColorAtPosition(x, y) {
        // Create canvas element to capture pixel data
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to viewport
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        try {
            // Use html2canvas-like approach - capture screenshot of page
            // For simplicity, we'll use document.elementFromPoint to get the element color
            const element = document.elementFromPoint(x, y);
            
            if (element) {
                const styles = window.getComputedStyle(element);
                const bgColor = styles.backgroundColor;
                const color = styles.color;
                
                // Use background color if available, otherwise text color
                const targetColor = bgColor !== 'rgba(0, 0, 0, 0)' ? bgColor : color;
                
                return this.convertColorFormats(targetColor);
            }
        } catch (error) {
            console.error('Error getting color at position:', error);
        }
        
        return {
            hex: '#000000',
            rgb: 'rgb(0, 0, 0)',
            rgba: 'rgba(0, 0, 0, 1)',
            hsl: 'hsl(0, 0%, 0%)'
        };
    }

    convertColorFormats(colorString) {
        // Create temporary element to get computed color
        const temp = document.createElement('div');
        temp.style.color = colorString;
        document.body.appendChild(temp);
        
        const computedColor = window.getComputedStyle(temp).color;
        document.body.removeChild(temp);
        
        // Parse RGB values
        const rgbMatch = computedColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        
        if (!rgbMatch) {
            return {
                hex: '#000000',
                rgb: 'rgb(0, 0, 0)',
                rgba: 'rgba(0, 0, 0, 1)',
                hsl: 'hsl(0, 0%, 0%)'
            };
        }
        
        const r = parseInt(rgbMatch[1]);
        const g = parseInt(rgbMatch[2]);
        const b = parseInt(rgbMatch[3]);
        const a = rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1;
        
        return {
            hex: this.rgbToHex(r, g, b),
            rgb: `rgb(${r}, ${g}, ${b})`,
            rgba: `rgba(${r}, ${g}, ${b}, ${a})`,
            hsl: this.rgbToHsl(r, g, b)
        };
    }

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    }

    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    extractTypography(element) {
        const styles = window.getComputedStyle(element);
        
        return {
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            lineHeight: styles.lineHeight,
            letterSpacing: styles.letterSpacing || 'normal',
            textTransform: styles.textTransform || 'none',
            color: this.convertColorFormats(styles.color).hex
        };
    }

    removeEventListeners() {
        this.removeColorPickerListeners();
        this.removeTypographyPickerListeners();
    }

    sendMessage(message) {
        chrome.runtime.sendMessage(message);
    }
}

// Initialize the content script
new PickyContentScript();