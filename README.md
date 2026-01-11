# Picky - Chrome Extension

A powerful Chrome extension for picking colors and analyzing typography from any webpage.

## Features

### 🎨 Color Picker
- Real-time color tracking with visual cursor
- Support for HEX, RGB, RGBA, and HSL formats
- Click-to-freeze functionality with clipboard copying
- Smooth animations and visual feedback

### 📝 Typography Analyzer
- Extract font family, size, weight, and more
- Analyze line height, letter spacing, text transform
- Get text color information
- One-click copy for all typography properties

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `picky` directory
5. The Picky extension icon will appear in your Chrome toolbar

## Usage

### Color Picker
1. Click the Picky extension icon
2. Click on the "Color Picker" block to activate it
3. Move your cursor over any webpage element to see real-time color information
4. Click to freeze the color and access copy options
5. Click any format button to copy to clipboard

### Typography Analyzer
1. Click the Picky extension icon
2. Click on the "Typography" block to activate it
3. Click on any text element on the webpage
4. View comprehensive typography information
5. Click any property to copy it to clipboard

## Files Structure

```
picky/
├── manifest.json          # Extension configuration
├── popup.html             # Main popup interface
├── popup.js               # Alpine.js reactive components
├── popup.css              # Popup styling
├── content.js             # Content script for webpage interaction
├── content.css            # Content script styling
├── background.js          # Service worker
├── icons/                 # Extension icons
└── README.md              # This file
```

## Technologies Used

- **Chrome Extension Manifest V3** - Latest extension standards
- **Alpine.js** - Lightweight reactive framework
- **Vanilla JavaScript** - Core functionality
- **CSS3** - Modern styling with animations

## Permissions

The extension requires minimal permissions:
- `activeTab` - Access to the current active tab
- `scripting` - Inject content scripts

## Browser Support

- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## Development

To modify or extend the extension:

1. Edit the relevant files in the `picky` directory
2. Go to `chrome://extensions/` and click the refresh button on the Picky extension
3. Changes will be applied immediately

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License