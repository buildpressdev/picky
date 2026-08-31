// Content Script - Handles interaction with webpage
class PickyContentScript {
    constructor() {
        this.colorPickerActive = false;
        this.typographyPickerActive = false;
        this.cursorCircle = null;
        this.lastColorUpdate = 0;
        this.COLOR_THROTTLE_MS = 50;
        this.init();
    }

    init() {
        // Listen for messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message);
            sendResponse({ received: true });
        });

        // Add escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.deactivateAll();
            }
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
            case 'deactivateAll':
                this.deactivateAll();
                break;
            case 'getCurrentState':
                this.reportCurrentState();
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
            this.sendMessage({ action: 'colorPickerActivated' });
        } else {
            this.hideCursorCircle();
            this.removeColorPickerListeners();
            this.sendMessage({ action: 'colorPickerDeactivated' });
        }
    }

    toggleTypographyPicker(active) {
        this.typographyPickerActive = active;
        this.colorPickerActive = false; // Disable color when typography is active

        if (active) {
            this.hideCursorCircle();
            this.addTypographyPickerListeners();
            this.sendMessage({ action: 'typographyPickerActivated' });
        } else {
            this.removeTypographyPickerListeners();
            this.sendMessage({ action: 'typographyPickerDeactivated' });
        }
    }

    createCursorCircle() {
        this.cursorCircle = document.createElement('div');
        this.cursorCircle.id = 'picky-color-circle';
        this.cursorCircle.innerHTML = `
            <div class="picky-circle-inner">
                <div class="picky-plus-horizontal"></div>
                <div class="picky-plus-vertical"></div>
            </div>
        `;
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

        // Update cursor circle position (80px circle, so -40px offset)
        this.cursorCircle.style.left = (e.clientX - 40) + 'px';
        this.cursorCircle.style.top = (e.clientY - 40) + 'px';

        // Throttle color updates
        const now = performance.now();
        if (now - this.lastColorUpdate < this.COLOR_THROTTLE_MS) return;
        this.lastColorUpdate = now;

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
        
        // Visual feedback - flash the cursor circle
        this.cursorCircle.classList.remove('flash');
        void this.cursorCircle.offsetWidth; // trigger reflow
        this.cursorCircle.classList.add('flash');
        
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
            // Visual feedback - flash the element
            element.classList.add('picky-typo-flash');
            setTimeout(() => element.classList.remove('picky-typo-flash'), 400);
            
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
        // Check if element itself has direct text content (not just descendants)
        if (element && this.hasDirectText(element)) {
            return element;
        }
        
        // Walk up to find nearest block-level ancestor with direct text
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
            if (this.hasDirectText(parent)) {
                return parent;
            }
            // Stop at block-level elements to avoid returning overly broad containers
            const display = window.getComputedStyle(parent).display;
            if (display === 'block' || display === 'flex' || display === 'grid') {
                break;
            }
            parent = parent.parentElement;
        }
        
        // Fallback: return original element if it has any text descendants
        if (element && element.textContent && element.textContent.trim()) {
            return element;
        }
        
        return null;
    }

    hasDirectText(element) {
        // Check for direct text nodes (not just descendant text)
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                return true;
            }
        }
        return false;
    }

    // Utility Methods
    getColorAtPosition(x, y) {
        try {
            const element = document.elementFromPoint(x, y);
            
            if (element) {
                const styles = window.getComputedStyle(element);
                const bgColor = styles.backgroundColor;
                const bgImage = styles.backgroundImage;
                
                // If element has a gradient background, try to parse the first color
                if (bgImage && bgImage !== 'none' && bgImage.includes('gradient')) {
                    const gradientColor = this.extractGradientColor(bgImage);
                    if (gradientColor) {
                        return this.convertColorFormats(gradientColor);
                    }
                }
                
                // Use background color if it's not transparent
                if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                    return this.convertColorFormats(bgColor);
                }
                
                // Fall back to text color
                const color = styles.color;
                if (color) {
                    return this.convertColorFormats(color);
                }
                
                // Walk up to find a visible background
                let parent = element.parentElement;
                while (parent && parent !== document.body) {
                    const parentStyles = window.getComputedStyle(parent);
                    const parentBg = parentStyles.backgroundColor;
                    if (parentBg && parentBg !== 'rgba(0, 0, 0, 0)' && parentBg !== 'transparent') {
                        return this.convertColorFormats(parentBg);
                    }
                    parent = parent.parentElement;
                }
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

    extractGradientColor(gradientStr) {
        // Extract first color from linear/radial gradient
        const colorMatch = gradientStr.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|hsl[a]?\([^)]+\))/);
        return colorMatch ? colorMatch[1] : null;
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

    deactivateAll() {
        if (this.colorPickerActive) {
            this.toggleColorPicker(false);
        }
        if (this.typographyPickerActive) {
            this.toggleTypographyPicker(false);
        }
        this.sendMessage({ action: 'allPickersDeactivated' });
    }
    
    reportCurrentState() {
        let state = null;
        if (this.colorPickerActive) {
            state = 'color';
        } else if (this.typographyPickerActive) {
            state = 'typography';
        }
        
        if (state) {
            this.sendMessage({ action: `${state}PickerActivated` });
        } else {
            this.sendMessage({ action: 'allPickersDeactivated' });
        }
    }

    sendMessage(message) {
        chrome.runtime.sendMessage(message);
    }
}

// Initialize the content script
new PickyContentScript();