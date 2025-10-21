# Contributing to StoryTimelines

First off, thank you for considering contributing to StoryTimelines! It's people like you that make this extension better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if relevant**
- **Include your SillyTavern version and browser**

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any examples of how the enhancement would be used**

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure your code follows the existing style
4. Make sure your code lints
5. Issue that pull request!

## Development Setup

1. Clone your fork of the repository:
```bash
git clone https://github.com/yourusername/SillyTavern-StoryTimelines.git
cd SillyTavern-StoryTimelines
```

2. Create a symlink to your SillyTavern extensions folder for testing:
```bash
# Linux/Mac
ln -s $(pwd) /path/to/SillyTavern/public/scripts/extensions/third-party/storytimelines

# Windows (run as administrator)
mklink /D "C:\path\to\SillyTavern\public\scripts\extensions\third-party\storytimelines" "%CD%"
```

3. Make your changes and test in SillyTavern

## Coding Style

- Use 4 spaces for indentation
- Use camelCase for variable and function names
- Add comments for complex logic
- Keep functions focused and single-purpose
- Use meaningful variable names

### JavaScript Style Guide

```javascript
// Good
function formatStoryTime(storyTime) {
    const date = new Date(storyTime);
    return date.toLocaleDateString();
}

// Bad
function fst(st) {
    var d = new Date(st);
    return d.toLocaleDateString();
}
```

### CSS Style Guide

```css
/* Good */
.storytimeline-message {
    margin-bottom: 15px;
    padding: 12px;
    background: var(--black30a);
}

/* Bad */
.storytimeline-message{margin-bottom:15px;padding:12px;background:var(--black30a);}
```

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line

Examples:
```
Add drag-and-drop reordering functionality

- Implement drag handlers for timeline messages
- Add visual feedback during drag operation
- Update story times on drop
- Fixes #123
```

## Testing

Before submitting a pull request:

1. Test all existing features to ensure nothing broke
2. Test your new feature thoroughly
3. Test in different browsers (Chrome, Firefox, Edge)
4. Test with different SillyTavern themes
5. Check browser console for errors

## Documentation

- Update README.md if you change functionality
- Add JSDoc comments to new functions
- Update CHANGELOG.md with your changes

## Questions?

Feel free to open an issue with the question label, or reach out to the maintainers.

Thank you for contributing! 🎉
