# Action Replay HwH Extension

A HeroWarsHelper (HWH) extension that **records actions you do in the game UI** and can **replay them later** (with optional auto-run and repeat counts).

## Install
- **This extension requires HeroWarsHelper to function.**
- Install a userscript manager (Tampermonkey / Violentmonkey).
- Install/update from the raw userscript URL (see `@downloadURL` inside the script).

## Usage
- Use the HWH menu button **Action Replay**.
- Click **Start Recording**, perform the actions in-game, then **Stop Recording** and **Save Recording**.
- You can record **one action** (e.g., a single click) or a **series of actions** (e.g., multiple clicks in sequence).
- Enable **Auto** on a recording to replay it on load.

## Export & Import

### Export Recordings
- Click the **Export** button in the Action Replay popup to save all your recordings to a JSON file.
- This allows you to backup your recordings or share them with others.
- The exported file contains all recording data including names, descriptions, API calls, and settings.

### Import Recordings
- Click the **Import** button in the Action Replay popup to load recordings from a JSON file.
- Imported recordings are merged with your existing recordings (duplicate IDs are automatically assigned new IDs).
- This is useful for restoring backups or adding pre-made recording templates.

### Recording Templates Library
- Check out the [library folder](https://github.com/mailming/Action-Replay-HwH-Ext/tree/main/library) for pre-made recording templates you can import.
- These templates provide ready-to-use action sequences for common game tasks.
- **Contributions welcome!** Helpers are encouraged to add additional templates and suggestions to the library.
- For questions or suggestions, please send an email to: **gamepla@gmail.com**

## Safety
Action Replay replays recordings **sequentially** (one at a time) to avoid firing many requests simultaneously.

## Notes
- Internally the script stores and replays captured api calls, but the UI uses *actions/replay* wording.


## Raw install URL

https://github.com/mailming/Action-Replay-HwH-Ext/raw/refs/heads/main/Action%20Replay%20HwH%20Ext.user.js

