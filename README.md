# Action Replay HwH Extension

A HeroWarsHelper (HWH) extension that **records actions you do in the game UI** and can **replay them later** (with optional auto-run and repeat counts).

## Install
- Install a userscript manager (Tampermonkey / Violentmonkey).
- Install/update from the raw userscript URL (see `@downloadURL` inside the script).

## Usage
- Use the HWH menu button **Action Replay**.
- Click **Start Recording**, perform the actions in-game, then **Stop Recording** and **Save Recording**.
- Enable **Auto** on a recording to replay it on load.

## Safety
Action Replay replays recordings **sequentially** (one at a time) to avoid firing many requests simultaneously.

## Notes
- Internally the script stores and replays captured calls, but the UI uses *actions/replay* wording.
