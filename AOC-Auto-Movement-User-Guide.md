# AOC Auto Movement Extension - User Guide

## Overview

The **AOC Auto Movement** extension is a powerful tool for automating movements and actions in the Area of Conquest (AOC) / Clan Domination event in Hero Wars. It allows you to record your movements, replay them automatically, and manage multiple movement paths.

**Version:** 2.2.0  
**Author:** zzsheep

---

## Table of Contents

1. [Installation](#installation)
2. [Getting Started](#getting-started)
3. [Recording Movements](#recording-movements)
4. [Playing Recordings](#playing-recordings)
5. [Managing Recordings](#managing-recordings)
6. [Clan Stats Dashboard](#clan-stats-dashboard)
7. [Donate Coins](#donate-coins)
8. [Auto-Run Feature](#auto-run-feature)
9. [Advanced Features](#advanced-features)
10. [Troubleshooting](#troubleshooting)

---

## Installation

1. Ensure you have the **Hero Wars Helper (HWH)** script installed
2. Install the **AOC Auto Movement HwH Ext.user.js** script
3. Refresh your browser
4. The extension will automatically initialize when you visit Hero Wars

---

## Getting Started

### Accessing the Extension

1. Open Hero Wars in your browser
2. Look for the **AOC** button in the HWH ScriptMenu
3. Click the **AOC** button to open the main dashboard

### Main Dashboard

The dashboard displays:
- **Clan Stats Table** - Shows all clans with their ID, name, server, coins, and power
- **Donate Coins Section** - Quick access to donate coins to your clan castle
- **Recording Controls** - Start/stop recording and playback buttons
- **Saved Recordings List** - All your recorded movement paths

---

## Recording Movements

### Starting a Recording

1. Click the **AOC** button to open the dashboard
2. Click **⏺ Start Recording** button
3. The button will turn red and show **⏹ Stop Recording**
4. The status badge will show **🔴 Recording**

### What Gets Recorded

The extension automatically records:
- All `clanDomination_move` API calls (movements)
- All `clanDomination_getEnemyTeams` API calls (enemy checks)
- All `clanDomination_startBattle` API calls (battles)
- Enemy user IDs from `clanDomination_getEnemyTeams` responses
- Your initial position when recording starts

### During Recording

- The recording button shows the number of moves captured: **⏹ 5** (5 moves captured)
- You can continue playing the game normally
- All AOC-related API calls are automatically captured

### Stopping a Recording

1. Click **⏹ Stop Recording** button
2. If moves were captured, a "Save Recording" popup will appear
3. Enter a name and description for your recording
4. Click **Save** to store the recording

### Recording Tips

- **Start from your base position** - The extension captures your initial position
- **Record complete paths** - Include all moves from start to destination
- **Include battles** - If you attack enemies, those will be recorded too
- **Use descriptive names** - Name recordings clearly (e.g., "Base to Midtown")

---

## Playing Recordings

### Manual Playback

1. Open the dashboard
2. Find your recording in the list
3. Click the **▶️** button next to the recording
4. The recording will execute step by step

### Play All Enabled Recordings

1. Click the **▶️** button in the ScriptMenu (next to the AOC button)
2. All recordings with "Auto Run" enabled will execute in sequence
3. Click **⏹** to stop playback

### During Playback

- The extension checks your current position
- If you're on the recorded path, it continues from that point
- If you're not on the path, it logs a message and skips
- If you run out of moves (`refillable.amount` = 0), playback stops

### Playback Features

- **Smart Position Detection** - Automatically finds where you are in the path
- **Tower Handling** - Automatically handles empty, teammate-occupied, and enemy-occupied towers
- **Dynamic Enemy Targeting** - Uses current enemy IDs when available
- **Battle Cooldown** - Waits 5 seconds after battles before continuing
- **Error Handling** - Continues execution even if some moves fail

---

## Managing Recordings

### Viewing Recordings

Each recording shows:
- **Name** - The name you gave it
- **Description** - Your description
- **Created Date** - When it was created
- **API Calls Count** - Number of moves/actions recorded
- **Auto Run Status** - Whether it's enabled for auto-run

### Expanding Recordings

1. Click the **▶ Expand** link next to a recording
2. View detailed information about each API call:
   - Move destinations
   - Enemy IDs captured
   - Battle targets
3. Click **▼ Collapse** to hide details

### Editing Recordings

1. Click the **✏️** button next to a recording
2. Edit the name, description, or auto-run settings
3. Set expiration days (0 = never expires)
4. Set repeat count for playback
5. Click **Save** to update

### Reordering API Calls

1. Expand a recording to see its API calls
2. Drag and drop API calls to reorder them
3. Changes are saved automatically

### Deleting API Calls

1. Expand a recording
2. Click the **🗑️** button next to an API call
3. The call will be removed from the recording

### Deleting Recordings

1. Click the **🗑️** button next to a recording
2. Confirm the deletion
3. The recording will be permanently removed

### Export/Import

- **Export:** Click **💾 Export** to download all recordings as JSON
- **Import:** Click **📥 Import** to load recordings from a JSON file
- **Delete All:** Click **🗑️ Delete All** to remove all recordings (with confirmation)

---

## Clan Stats Dashboard

### Viewing Clan Stats

The dashboard automatically loads clan statistics when the script initializes. The table shows:
- **Clan ID** - Unique identifier for each clan
- **Clan Name** - The clan's name (or ID if name not found)
- **Server** - Server ID where the clan is from
- **Coins** - Total coins accumulated by the clan
- **Power** - Total power of the clan

### Refreshing Stats

1. Click the **🔄 Refresh** button in the clan stats section
2. The extension will fetch the latest statistics
3. The table will update with current data

### Stats Information

- Clans are sorted by power (highest first)
- Stats are loaded automatically on script start
- You can refresh manually at any time

---

## Donate Coins

### Donating to Clan Castle

1. Open the dashboard
2. Find the **Donate Coins** section (below the clan stats table)
3. Enter the amount of coins to donate (default: 1)
4. Click **💰 Donate** button
5. The extension will call the `clanCastle_upgrade` API

### Donation Feedback

After donating, you'll see:
- Success message with your total contribution
- Updated castle level
- Any errors if the donation fails

---

## Auto-Run Feature

### Enabling Auto-Run

1. Edit a recording (click **✏️**)
2. Check the **Auto Run** checkbox
3. Set expiration days if needed (0 = never expires)
4. Save the recording

### How Auto-Run Works

- Enabled recordings run automatically every 10 seconds
- Only recordings with "Auto Run" enabled will execute
- Expired recordings are automatically skipped
- Recordings execute in the order they appear in the list

### Auto-Run Tips

- **Don't enable too many** - Only enable recordings you want to run automatically
- **Set expiration** - Use expiration days to limit how long recordings run
- **Monitor moves** - Make sure you have enough moves available
- **Check positions** - Ensure you're starting from the correct position

---

## Advanced Features

### Tower Position Handling

When a recording encounters a tower position, the extension automatically:

1. **Checks if it's a tower** - Uses the tower positions list
2. **Gets map state** - Checks tower occupancy
3. **Handles three cases:**
   - **Empty tower:** Moves to occupy it
   - **Teammate-occupied:** Skips the move, continues
   - **Enemy-occupied:** 
     - Gets enemy teams
     - Starts a battle
     - Waits 5 seconds (cooldown)
     - Moves to occupy if battle successful

### Dynamic Enemy Targeting

- During recording: Captures enemy user IDs from `clanDomination_getEnemyTeams`
- During playback: Uses current enemy IDs when available, falls back to recorded IDs
- Ensures battles target the correct enemies even if they change

### Path Validation

- Stores complete path including initial position
- Validates current position against the path
- Continues from the correct step if you're already on the path
- Skips if you're not on the path (with log message)

### Move Count Management

- Checks `refillable.amount` from move responses
- Stops all recordings if moves reach 0
- Logs the situation for debugging

### Error Handling

- **"NotAvailable" errors:** Logs but continues (move will queue)
- **Battle failures:** Skips the move, continues to next step
- **API errors:** Logs full error details for debugging

---

## Troubleshooting

### Recording Not Starting

- **Check HWH is loaded:** Make sure Hero Wars Helper is installed
- **Refresh the page:** Reload the page to reinitialize the extension
- **Check console:** Open browser console (F12) for error messages

### Playback Not Working

- **Check current position:** Make sure you're on the recorded path
- **Check moves available:** Ensure you have moves remaining
- **Check recording enabled:** Verify "Auto Run" is enabled if using auto-run
- **Check expiration:** Expired recordings won't run

### Clan Stats Not Loading

- **Click Refresh:** Manually refresh the stats
- **Check network:** Ensure you're connected to the game
- **Wait a moment:** Stats load automatically on script start

### Battles Not Working

- **Check enemy IDs:** The extension uses dynamic targeting
- **Check cooldown:** Wait 5 seconds after battles
- **Check battle result:** Failed battles skip the move

### Moves Not Executing

- **Check move count:** Verify `refillable.amount` > 0
- **Check position:** Ensure you're at the correct starting position
- **Check errors:** Look at console logs for error messages

### Recording Not Saving

- **Check moves captured:** You need at least 1 move to save
- **Check popup:** The save popup should appear after stopping
- **Check name:** Recording name is required

---

## Tips and Best Practices

### Recording

1. **Start from base** - Always start recording from your base position
2. **Record complete paths** - Include all moves from start to finish
3. **Include battles** - Record enemy checks and battles if needed
4. **Use clear names** - Name recordings descriptively
5. **Test recordings** - Play back recordings manually before enabling auto-run

### Playback

1. **Check position first** - Ensure you're at the starting position
2. **Check moves** - Make sure you have enough moves available
3. **Monitor execution** - Watch the first few runs to ensure it works
4. **Use expiration** - Set expiration days for temporary strategies
5. **One at a time** - Don't enable too many recordings at once

### Organization

1. **Name clearly** - Use descriptive names (e.g., "Base693 to Midtown")
2. **Add descriptions** - Document what the recording does
3. **Export backups** - Export recordings regularly as backup
4. **Delete unused** - Remove recordings you no longer need
5. **Group by purpose** - Organize recordings by strategy or path

---

## Keyboard Shortcuts

Currently, the extension uses mouse clicks only. All actions are performed through the dashboard interface.

---

## Support

For issues or questions:
- Check the console (F12) for error messages
- Review the API documentation: `AOC-API-Complete-Reference.md`
- Check recording details in the expanded view

---

## Version History

- **2.2.0** - Added clan stats dashboard, donate coins feature
- **2.1.1** - Added tower position handling, enhanced logging
- **2.1.0** - Added DonatePoint feature, improved error handling
- **2.0.1** - Initial release with recording and playback

---

**Last Updated:** 2026-01-13
