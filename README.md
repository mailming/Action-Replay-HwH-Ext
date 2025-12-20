# Action Replay HwH Extension

**Tired of repeating the same tasks over and over?** Simply record your actions once and replay them as many times as you want with just one click! 🚀

A HeroWarsHelper (HWH) extension that **records actions you do in the game UI** and can **replay them later** (with optional auto-run and repeat counts).

## Install
- **This extension requires HeroWarsHelper to function.**
- Install a userscript manager (Tampermonkey / Violentmonkey).
- Install/update from the raw userscript URL (see `@downloadURL` inside the script).

## Usage
- Use the HWH menu button **Action Replay**.
- Click **Start Recording**, perform the actions in-game, then **Stop Recording** and **Save Recording**.
- You can record **one action** (e.g., a single click) or a **series of actions** (e.g., multiple clicks in sequence).

### Auto-Run Option
- **Auto checkbox**: Enable the **Auto** checkbox next to any recording in the dashboard to automatically replay it when the game loads.
- Recordings with Auto enabled will execute automatically after a short delay when you load the game page.
- This is useful for daily tasks or repetitive actions you want to run automatically.

### Play All Button (Side Menu)
- **Blue ▶️/⏹ button** in the HWH side menu: Click to manually play all recordings that have Auto enabled.
- When clicked, it changes to **⏹** (stop button) and starts executing all enabled recordings.
- Click **⏹** again to stop/interrupt the current playback at any time.
- This gives you manual control to trigger auto-run recordings on demand without reloading the page.

### Dashboard Controls
- On the dashboard, you can **specify the number of replays** for each recording using the repeat count field.
- You can **manage actions** on the dashboard: edit, delete, reorder, or expand to view individual actions within each recording.
- Each recording has its own **▶️ play button** that changes to **⏹ stop** when playing - click stop to interrupt that specific recording.
- Use the **Delete All** button in the dashboard footer to remove all recordings at once (with confirmation).

## Export & Import

### Export Recordings
- Click the **Export** button in the Action Replay popup to save all your recordings to a JSON file.
- This allows you to backup your recordings or share them with others.
- The exported file contains all recording data including names, descriptions, API calls, and settings.

### Import Recordings
- Click the **Import** button in the Action Replay popup to load recordings from a JSON file.
- Imported recordings are merged with your existing recordings (duplicate IDs are automatically assigned new IDs).
- This is useful for restoring backups or adding pre-made recording templates.

### Delete All Recordings
- Click the **Delete All** button in the dashboard footer to remove all recordings at once.
- A confirmation dialog will appear before deletion (this action cannot be undone).

### Recording Templates Library
- Check out the [library folder](https://github.com/mailming/Action-Replay-HwH-Ext/tree/main/library) for pre-made recording templates you can import.
- These templates provide ready-to-use action sequences for common game tasks.
- **Contributions welcome!** Helpers are encouraged to add additional templates and suggestions to the library.
- For questions or suggestions, please send an email to: **gamepla@gmail.com**

## Safety
Action Replay replays recordings **sequentially** (one at a time) to avoid firing many requests simultaneously.

## Notes
- Internally the script stores and replays captured api calls, but the UI uses *actions/replay* wording.

## License
Copyright (c) gamepla

You are free to modify and use this extension as long as you credit the original author. Using a pre-existing license is recommended for clarity.

For licensing questions or permissions, please contact: **gamepla@gmail.com**

## Raw install URL

https://github.com/mailming/Action-Replay-HwH-Ext/raw/refs/heads/main/Action%20Replay%20HwH%20Ext.user.js

