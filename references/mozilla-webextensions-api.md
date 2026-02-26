# Mozilla WebExtensions API Reference

**Always remember to reference @$HOME/.claude/references/mozilla-webextensions-api.md and look for snippets and examples in @$HOME/.claude/snippets/mozilla-webextensions-api/**

## Quick Reference

- Documentation: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions>
- API Reference: <https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API>
- GitHub: <https://github.com/mdn/content/tree/main/files/en-us/mozilla/add-ons/webextensions>
- web-ext CLI: <https://github.com/mozilla/web-ext>

## Resources and Documentation

- [Mozilla WebExtensions Documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
  - [Getting Started](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension)
  - [Extension Anatomy](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Anatomy_of_a_WebExtension)
    - [Background Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Background_scripts)
    - [Content Scripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts)
    - [User Interface](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface)
  - [API Reference](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API)
    - [Browser Action API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/browserAction)
    - [Tabs API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs)
    - [Storage API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage)
    - [Runtime API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/runtime)
  - [Manifest.json](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json)
  - [Cross-browser Development](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension)
- [Development Tools](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Getting_started_with_web-ext)
  - [web-ext CLI Tool](https://github.com/mozilla/web-ext)
  - [Debugging Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Debugging)
  - [Testing Extensions](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Testing_persistent_and_restart_features)

## Code Examples Location

Comprehensive examples available in `$HOME/.claude/snippets/mozilla-webextensions-api/`:

- Basic extension structures and manifest configurations
- Background script patterns for Manifest V2 and V3
- Content script injection and communication
- Popup and options page implementations
- Cross-browser compatibility patterns
- Testing and debugging techniques
- Advanced API usage examples
- Security best practices

## Schema and Type Definitions

Type definitions and validation schemas in `$HOME/.claude/snippets/mozilla-webextensions-api/schemas/`

## Linting and Formatting

Latest configuration files in `$HOME/.claude/snippets/mozilla-webextensions-api/linting/`

## Core Concepts

### Extension Architecture

WebExtensions follow a modular architecture with these key components:

- **Manifest**: Declares extension metadata, permissions, and components
- **Background Scripts**: Handle extension lifecycle and long-running operations
- **Content Scripts**: Run in the context of web pages
- **Popup**: User interface triggered by extension icon
- **Options Page**: Settings and configuration interface
- **DevTools Pages**: Extensions to browser developer tools

### Manifest Versions

- **Manifest V2**: Legacy version, still widely supported
- **Manifest V3**: Current standard with enhanced security and performance
  - Service Workers replace background pages
  - Declarative approach for many APIs
  - Enhanced Content Security Policy

### Browser Compatibility

WebExtensions aim for cross-browser compatibility with these considerations:

- **Firefox**: Full WebExtensions support with Mozilla-specific features
- **Chrome/Chromium**: Original WebExtensions inspiration, excellent support
- **Safari**: WebExtensions support in Safari 14+ with some limitations
- **Edge**: Full support using Chromium engine

## Core APIs

### Essential APIs

- `browser.runtime.*` - Extension lifecycle, messaging, and management
- `browser.tabs.*` - Tab creation, navigation, and modification
- `browser.storage.*` - Persistent data storage (local, sync, managed)
- `browser.action.*` - Extension icon and popup (Manifest V3)
- `browser.browserAction.*` - Extension icon and popup (Manifest V2)

### User Interface APIs

- `browser.menus.*` - Context menus and menu items
- `browser.notifications.*` - System notifications
- `browser.sidebarAction.*` - Sidebar panels
- `browser.commands.*` - Keyboard shortcuts
- `browser.theme.*` - Browser theme modification

### Web Interaction APIs

- `browser.webRequest.*` - HTTP request interception and modification
- `browser.webNavigation.*` - Navigation events and URL changes
- `browser.cookies.*` - Cookie management
- `browser.history.*` - Browser history access
- `browser.bookmarks.*` - Bookmark management

### Content APIs

- `browser.scripting.*` - Dynamic script and CSS injection (Manifest V3)
- `browser.activeTab` - Permission for active tab access
- `browser.contentScripts.*` - Dynamic content script registration

### System APIs

- `browser.downloads.*` - Download management
- `browser.management.*` - Extension and app management
- `browser.idle.*` - System idle state detection
- `browser.privacy.*` - Privacy settings modification
- `browser.proxy.*` - Proxy configuration

### Developer APIs

- `browser.devtools.*` - Developer tools integration
- `browser.debugger.*` - Chrome DevTools Protocol access

## Permissions System

### Host Permissions

```json
"host_permissions": [
  "https://example.com/*",
  "https://*.google.com/*",
  "<all_urls>"
]
```

### API Permissions

```json
"permissions": [
  "activeTab",
  "storage",
  "tabs",
  "notifications",
  "webRequest",
  "webNavigation",
  "cookies",
  "history",
  "bookmarks"
]
```

### Optional Permissions

```json
"optional_permissions": [
  "downloads",
  "management",
  "privacy"
]
```

## Manifest V3 Migration

### Key Changes from V2 to V3

1. **Service Workers**: Replace background pages
2. **Action API**: Replaces browserAction and pageAction
3. **Scripting API**: Replaces tabs.executeScript
4. **Declarative Net Request**: Replaces parts of webRequest
5. **Host Permissions**: Separate from API permissions

### Migration Patterns

```javascript
// V2 Background Page
// background.js
chrome.browserAction.onClicked.addListener(() => {
  chrome.tabs.executeScript({
    code: 'document.body.style.backgroundColor = "red"'
  });
});

// V3 Service Worker
// background.js
chrome.action.onClicked.addListener(async (tab) => {
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      document.body.style.backgroundColor = "red";
    }
  });
});
```

## Security Considerations

### Content Security Policy

```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self';"
}
```

### Secure Communication

- Use `browser.runtime.sendMessage()` for internal communication
- Validate all inputs from web pages
- Use HTTPS for external API calls
- Implement proper permission checks

### Data Protection

- Store sensitive data using `browser.storage.local`
- Never expose API keys in content scripts
- Use optional permissions for sensitive APIs
- Implement proper user consent flows

## Development Workflow

### Project Structure

```
extension/
├── manifest.json
├── background.js
├── content.js
├── popup/
│   ├── popup.html
│   ├── popup.js
│   └── popup.css
├── options/
│   ├── options.html
│   ├── options.js
│   └── options.css
├── icons/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-96.png
└── _locales/
    └── en/
        └── messages.json
```

### Build and Development Tools

- **web-ext**: Official CLI tool for development and building
- **Chrome Extensions CLI**: For Chrome-specific development
- **Firefox Add-on SDK**: Legacy tool, now deprecated
- **Extension Reloader**: Development helper for auto-reloading

### Testing Strategies

- Unit testing for background scripts
- Integration testing for API interactions
- Cross-browser testing across target browsers
- Performance testing for resource usage
- Security testing for permission usage

## Performance Optimization

### Background Script Optimization

- Use event pages in Manifest V2
- Minimize service worker startup time in Manifest V3
- Use alarms for scheduled tasks
- Implement proper cleanup in event handlers

### Content Script Optimization

- Minimize content script size
- Use dynamic injection when possible
- Implement efficient DOM manipulation
- Use content script messaging sparingly

### Memory Management

- Clean up event listeners
- Use weak references where appropriate
- Monitor extension memory usage
- Implement proper resource disposal

## Internationalization (i18n)

### Message Files

```json
// _locales/en/messages.json
{
  "extensionName": {
    "message": "My Extension",
    "description": "The name of the extension"
  },
  "extensionDescription": {
    "message": "A sample WebExtension",
    "description": "Description of the extension"
  }
}
```

### Using Messages

```javascript
// Get localized message
const message = browser.i18n.getMessage("extensionName");

// In manifest.json
"name": "__MSG_extensionName__",
"description": "__MSG_extensionDescription__"
```

## Distribution and Publishing

### Firefox Add-ons (AMO)

- Submit to addons.mozilla.org
- Automatic code review for simple extensions
- Manual review for complex extensions
- Self-distribution option available

### Chrome Web Store

- Submit to Chrome Web Store
- Required developer account ($5 fee)
- Automated and manual review process
- Rich listing options

### Microsoft Edge Add-ons

- Submit to Microsoft Edge Add-ons
- Similar process to Chrome Web Store
- Cross-promotion with Chrome extensions

### Safari App Store

- Convert using Safari Web Extension tools
- Submit through App Store Connect
- macOS and iOS distribution

## Advanced Topics

### Native Messaging

- Communicate with native applications
- JSON-based message protocol
- Platform-specific configuration
- Security considerations

### WebAssembly Integration

- Use WebAssembly modules in extensions
- Performance-critical operations
- Cross-platform compatibility
- Security sandbox limitations

### Enterprise Deployment

- Group Policy configuration
- Managed storage
- Force installation options
- Enterprise app stores

### Extension Updates

- Automatic update mechanism
- Version migration strategies
- User data preservation
- Rollback procedures
