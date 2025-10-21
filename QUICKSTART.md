# StoryTimelines Quick Start Guide

Get up and running with StoryTimelines in under 5 minutes!

## Installation

### Step 1: Download the Extension

**Option A: Git Clone (Recommended)**
```bash
cd SillyTavern/public/scripts/extensions/third-party
git clone https://github.com/yourusername/SillyTavern-StoryTimelines.git storytimelines
```

**Option B: Manual Download**
1. Download the [latest release](https://github.com/yourusername/SillyTavern-StoryTimelines/releases)
2. Extract to `SillyTavern/public/scripts/extensions/third-party/storytimelines/`

### Step 2: Restart SillyTavern

- Completely close and restart SillyTavern
- Or click the "Reload" button in extensions settings

### Step 3: Verify Installation

Look for the clock icon (🕐) in your extensions menu. If you see it, you're ready to go!

## Basic Usage

### Opening the Timeline

There are three ways to open the Story Timeline:

1. **Click the clock icon** in the extensions menu (left sidebar)
2. **Type `/storytimeline`** in the chat input
3. **Click the clock icon** in the top menu bar (fallback)

### Your First Timeline

Let's create a simple timeline for a story:

#### 1. Start a Conversation

```
You: "Let's go on an adventure!"
Character: "Great idea! Where should we start?"
You: "How about we explore the ancient ruins tomorrow morning?"
Character: "Perfect! I'll pack our supplies tonight."
```

#### 2. Tag the Messages

1. Open the Story Timeline panel
2. Click **"Tag Untagged Messages"**
3. For the first message, set:
   - Date: Today's date
   - Time: 2:00 PM
4. Click **"Save Tag"**
5. Repeat for other messages:
   - Message 2: Same day, 2:05 PM
   - Message 3: Same day, 2:10 PM
   - Message 4: Same day, 2:15 PM

#### 3. View Your Timeline

Your messages now appear in the timeline, sorted by story time!

### Advanced: Out-of-Order Events

Let's say you want to add a flashback:

1. Send a new message: `"I remember when we first met..."`
2. Open the timeline and click the pencil icon next to this message
3. Set a date **in the past** (e.g., one year ago)
4. Save the tag

The flashback message now appears at the beginning of your timeline, even though you just sent it!

## Common Workflows

### Workflow 1: Linear Storytelling

For stories that progress chronologically:

1. Tag messages as they're sent with incremental times
2. Use auto-increment: +5 minutes, +10 minutes, +1 hour, etc.
3. Let the timeline track your story's progression

### Workflow 2: Complex Narratives

For stories with flashbacks, time skips, or parallel storylines:

1. Tag messages with their actual story time
2. Use the timeline to see events in chronological order
3. Drag messages to adjust timeline if needed

### Workflow 3: Planning Ahead

To plan future events:

1. Create placeholder messages for future events
2. Tag them with future dates
3. Use the timeline as a story roadmap
4. Fill in the actual events as they happen

## Tips & Tricks

### Quick Tagging

- **Keyboard shortcut**: After clicking "Tag Untagged Messages," use Tab to navigate between date/time fields
- **Copy times**: Use similar times for consecutive messages, then adjust

### Reordering

- **Drag to swap**: Drag a message onto another to swap their story times
- **Fine-tune**: Use the pencil icon for precise time adjustments

### Organizing

- **Batch tagging**: Tag all messages in a scene with similar times, then adjust
- **Time gaps**: Use time gaps to separate scenes (e.g., 8:00 AM, then 2:00 PM)

### Settings Optimization

| Setting | Recommended For |
|---------|----------------|
| 12-hour format | Casual roleplay, modern settings |
| 24-hour format | Military, sci-fi, or technical precision |
| Drag & Drop ON | Complex timelines with frequent reordering |
| Drag & Drop OFF | Linear stories, prevent accidental changes |
| Auto-refresh ON | Active conversations, collaborative stories |
| Auto-refresh OFF | Solo planning, performance optimization |

## Example Timeline Structure

Here's an example of a well-structured timeline:

```
📅 Monday, March 15, 2024
  🕐 08:00 - Wake up and prepare for the day
  🕐 09:30 - Meet at the tavern
  🕐 10:00 - Start journey to the ruins
  🕐 12:00 - Stop for lunch
  🕐 14:00 - Arrive at ruins entrance

📅 Tuesday, March 16, 2024
  🕐 07:00 - Wake in camp
  🕐 08:00 - Enter the ruins
  🕐 10:30 - Discover hidden chamber
  🕐 12:00 - Battle with guardian
  🕐 13:00 - Claim the artifact
```

## Troubleshooting

### Timeline is Empty

- **Issue**: No messages appear in timeline
- **Fix**: Click "Tag Untagged Messages" to start tagging

### Can't Find the Extension

- **Issue**: Clock icon doesn't appear
- **Fix**: Check installation path is correct: `third-party/storytimelines/`
- **Fix**: Try typing `/storytimeline` instead

### Tags Not Saving

- **Issue**: Story times disappear after refresh
- **Fix**: Ensure SillyTavern has write permissions
- **Fix**: Check browser console (F12) for errors

### Slash Command Not Working

- **Issue**: `/storytimeline` doesn't work
- **Fix**: Look for the clock icon in menus instead
- **Fix**: Update to the latest SillyTavern version

## Next Steps

Now that you're set up:

1. ✅ Tag your existing conversations
2. ✅ Experiment with different timeline structures
3. ✅ Customize settings to your preference
4. ✅ Share feedback or report issues on GitHub

## Need Help?

- 📖 Read the full [README](README.md)
- 🐛 Report bugs on [GitHub Issues](https://github.com/yourusername/SillyTavern-StoryTimelines/issues)
- 💬 Join the SillyTavern Discord community

Happy storytelling! ⏰📖
