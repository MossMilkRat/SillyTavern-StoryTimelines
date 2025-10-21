# Changelog

All notable changes to the StoryTimelines extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Bulk tagging interface for multiple messages
- Export timeline to text/JSON format
- Custom time formats
- Timeline visualization with date ranges
- Search/filter messages by story time
- Import timeline from external files

## [1.0.0] - 2024

### Added
- Initial release of StoryTimelines extension
- Timeline view panel with chronological message display
- Message tagging interface with date/time picker
- Drag and drop reordering of timeline events
- Settings panel with customization options:
  - Toggle date/time format (12-hour/24-hour)
  - Enable/disable drag and drop
  - Show/hide timeline icon
  - Auto-refresh on chat change
- Slash command `/storytimeline` for quick access
- Fallback menu entries for older SillyTavern versions
- Auto-refresh functionality when chat changes
- Integration with SillyTavern theming system
- Event hooks for chat updates
- Persistent storage of story times in chat files

### Features
- View messages in chronological story order
- Tag individual messages with specific story dates and times
- Edit or remove story time tags
- Swap story times by dragging messages
- Identify untagged messages easily
- Responsive design for mobile devices
- Smooth animations and transitions
- Keyboard-accessible interface

### Technical
- No external dependencies
- Uses SillyTavern's native APIs
- Graceful degradation for older versions
- Error handling and console logging
- Debounced chat saving
- ISO 8601 timestamp format

## Version History

### Pre-release Development
- Prototype development
- Core functionality implementation
- UI/UX refinement
- Compatibility testing

---

## Legend

- `Added` for new features
- `Changed` for changes in existing functionality
- `Deprecated` for soon-to-be removed features
- `Removed` for now removed features
- `Fixed` for any bug fixes
- `Security` for vulnerability fixes
