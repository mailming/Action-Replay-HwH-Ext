

# Area of Conquest (AOC) - Complete API Reference

## Overview

This document provides comprehensive documentation for all Area of Conquest (AOC) / Clan Domination APIs used in Hero Wars. This includes movement, battles, statistics, and clan castle management.

**Last Updated:** 2026-01-13

---

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Map & Movement APIs](#map--movement-apis)
3. [Battle APIs](#battle-apis)
4. [Statistics APIs](#statistics-apis)
5. [Clan Castle APIs](#clan-castle-apis)
6. [Important Coordinates](#important-coordinates)
7. [Common Movement Paths](#common-movement-paths)

---

## Base Configuration

### Base URL
```
https://heroes-wb.nextersglobal.com/api/
```

### Authentication Headers

All requests require the following authentication headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Auth-Token` | Authentication token | `ps-AZjHWbvEkSThqxtQiDMzCJ+...` |
| `X-Auth-User-Id` | User ID | `73660848` |
| `X-Auth-Player-Id` | Player ID | `35979991` |
| `X-Auth-Session-Id` | Session ID | `0t8mwyj0p8463m` |
| `X-Auth-Session-Key` | Session key (may be empty) | `` |
| `X-Auth-Signature` | Request signature | `46dfc42229ec2b17940147b46e1d0e1b` |
| `X-Auth-Application-Id` | Application ID | `3` |
| `X-Auth-Network-Ident` | Network identifier | `web` |
| `X-Env-Unique-Session-Id` | Unique session ID | `7415635073541808077` |
| `X-Env-Unique-Session-Uuid` | Unique session UUID | `a887963e-a581-4218-bb2c-3c8f6ba0b91e` |
| `X-Request-Id` | Request ID (incremental) | `40` |
| `X-Server-Time` | Server time offset | `0` |
| `X-Env-Library-Version` | Library version | `1` |
| `Content-Type` | Content type | `application/json; charset=UTF-8` |
| `X-Requested-With` | Request type | `XMLHttpRequest` |
| `Referer` | Referer URL | `https://www.hero-wars.com/` |
| `X-Full-Referer` | Full referer URL | `https://www.hero-wars.com/` |

### Batch API Call Format

The API uses a batch request system where multiple method calls can be made in a single POST request.

**Request Format:**
```json
{
  "calls": [
    {
      "name": "methodName",
      "args": {},
      "context": {
        "actionTs": 111283
      },
      "ident": "identifier"
    }
  ]
}
```

**Response Format:**
```json
{
  "date": 1768188030.8914781,
  "results": [
    {
      "ident": "identifier",
      "result": {
        "response": { /* method-specific response */ }
      }
    }
  ]
}
```

---

## Map & Movement APIs

### clanDomination_mapState

Retrieves the current state of the Clan Domination map, including map regions, levels, town positions, user positions, and clan information.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanDomination_mapState",
      "args": {},
      "context": {
        "actionTs": 111283
      },
      "ident": "body"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `map` | object | Map configuration object |
| `map.regions` | array | Array of region IDs |
| `map.levels` | array | Array of level objects |
| `map.levels[].id` | integer | Level ID (e.g., 696 for base, 1 for midtown) |
| `map.levels[0].id` | integer | **Starting base level ID** |
| `townPositions` | object | Object keyed by position number, containing town/tower position data |
| `townPositions[position].position` | integer | Position number on the map |
| `townPositions[position].townId` | integer | Town ID |
| `townPositions[position].status` | integer | Status of the town (1 = occupied) |
| `townPositions[position].userId` | integer | User ID occupying the town (0 = empty, non-zero = occupied) |
| `townPositions[position].farmStart` | integer | Timestamp when farming started |
| `userPositions` | object | Object keyed by user ID, containing position number |
| `userPositions[userId]` | integer | **Current position of the user** |
| `clans` | object | Object keyed by clan ID, containing clan information |
| `clans[clanId].id` | string | Clan ID |
| `clans[clanId].title` | string | **Clan name** |
| `clans[clanId].serverId` | string | **Server ID** |
| `clans[clanId].membersCount` | string | Number of members |
| `users` | object | Object keyed by clan ID, then user ID, containing user information |
| `users[clanId][userId].clanId` | string | User's clan ID |

**Example Response:**
```json
{
  "map": {
    "regions": [1],
    "levels": [
      {
        "id": 696,
        "steps": [],
        "isVisible": 24
      }
    ]
  },
  "townPositions": {
    "1": {
      "position": 1,
      "townId": 5,
      "userId": 36039664
    },
    "26": {
      "position": 26,
      "status": 1,
      "userId": 35449277,
      "townId": 3,
      "farmStart": 1768167578
    }
  },
  "userPositions": {
    "35979991": 127,
    "35449277": 26
  },
  "clans": {
    "28079": {
      "id": "28079",
      "title": "Team NO BORDER",
      "serverId": "206",
      "membersCount": "30"
    }
  }
}
```

**Key Usage:**
- Get current player position: `userPositions[userId]`
- Get starting base: `map.levels[0].id`
- Check tower occupancy: `townPositions[position].userId` (0 = empty, non-zero = occupied)
- Get clan information: `clans[clanId]`

---

### clanDomination_move

Moves the player to a specified level on the map.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanDomination_move",
      "args": {
        "levelId": 127
      },
      "context": {
        "actionTs": 54431
      },
      "ident": "body"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `levelId` | integer | Target level ID to move to |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `userId` | integer | User ID |
| `move` | object | Movement information (from position to position) |
| `visibleLevels` | array | Array of visible level IDs after move |
| `userPositions` | object | Updated user positions |
| `townPositions` | object | Updated town positions |
| `refillable` | object | Move count information |
| `refillable.amount` | integer | **Remaining moves available** |
| `refillable.lastRefill` | integer | Last refill timestamp |
| `refillable.refillTime` | integer | Time until next refill (seconds) |

**Example Response:**
```json
{
  "userId": 35979991,
  "move": {
    "91": 127
  },
  "visibleLevels": [696, 606, 612, ...],
  "userPositions": {
    "35979991": 127
  },
  "refillable": {
    "id": 55,
    "amount": 7,
    "lastRefill": 1768025957,
    "boughtToday": 0,
    "refillTime": 720
  }
}
```

**Important Notes:**
- Check `refillable.amount` to ensure you have moves remaining
- If `amount` becomes 0, stop making moves
- Each move consumes 1 move from your available moves

---

## Battle APIs

### clanDomination_getEnemyTeams

Gets information about enemy teams at a specific level, including defense teams, power, and user IDs.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanDomination_getEnemyTeams",
      "args": {
        "levelId": 1
      },
      "context": {
        "actionTs": 138241
      },
      "ident": "body"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `levelId` | integer | Level ID to check for enemies (e.g., 1 for midtown) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `response` | array | Array of enemy team objects |
| `response[].userId` | integer | **Enemy user ID (use as targetId for battle)** |
| `response[].defense` | object | Defense team composition |
| `response[].defense.powerSum` | integer | Total defense power |
| `response[].defense.units` | object | Hero and pet units |
| `response[].defenseState` | object | Current defense state (HP, energy, etc.) |

**Example Response:**
```json
{
  "response": [
    {
      "userId": 53074000,
      "defense": {
        "powerSum": 1160541,
        "units": {
          "57": {
            "id": 57,
            "level": 130,
            "star": 6,
            "power": 164859
          }
        }
      },
      "defenseState": {
        "57": {
          "hp": 1003148,
          "energy": 0,
          "isDead": false,
          "maxHp": 1003148
        }
      }
    }
  ]
}
```

**Key Usage:**
- Extract `userId` from response to use as `targetId` in `clanDomination_startBattle`
- Check `defense.powerSum` to assess enemy strength
- Multiple enemies may be present at a level

---

### clanDomination_startBattle

Initiates a battle against a target player at a specific level.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanDomination_startBattle",
      "args": {
        "targetId": "53074000"
      },
      "context": {
        "actionTs": 142525
      },
      "ident": "body"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `targetId` | string | Target user ID (from `clanDomination_getEnemyTeams` response) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `battle` | object | Complete battle data |
| `battle.result` | object | Battle result |
| `battle.result.win` | boolean | Whether the battle was won |
| `battle.result.stars` | integer | Stars earned (1-3) |
| `reward` | object | Rewards received |
| `reward.coin` | object | Coins received |
| `refillable` | object | Updated move count after battle |

**Example Response:**
```json
{
  "battle": {
    "result": {
      "win": true,
      "stars": 1
    }
  },
  "reward": {
    "coin": {
      "46": 100
    }
  },
  "refillable": {
    "amount": 7
  }
}
```

**Important Notes:**
- After a successful battle, wait 5 seconds before making the next move (cooldown period)
- If battle fails, do not proceed with the move to occupy the tower
- `targetId` must be a string (user ID as string)

---

## Statistics APIs

### clanDomination_stats

Gets statistics for all clans participating in the Clan Domination event.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanDomination_stats",
      "args": {},
      "context": {
        "actionTs": 111283
      },
      "ident": "body"
    }
  ]
}
```

**Response Fields:**

The response is an object where each key is a clan ID (as a string), and the value is a clan statistics object.

| Field | Type | Description |
|-------|------|-------------|
| `[clanId]` | object | Clan statistics object, keyed by clan ID (as string) |
| `[clanId].power` | integer | Total power of the clan |
| `[clanId].coins` | integer | Coins accumulated by the clan |
| `[clanId].towns` | integer | Number of towns controlled by the clan |
| `[clanId].castle` | integer | Castle level of the clan |

**Example Response:**
```json
{
  "28079": {
    "power": 141695243,
    "coins": 62236,
    "towns": 4,
    "castle": 32
  },
  "260896": {
    "power": 150098110,
    "coins": 49822,
    "towns": 5,
    "castle": 33
  },
  "328621": {
    "power": 144836425,
    "coins": 287911,
    "towns": 15,
    "castle": 41
  }
}
```

---

## Clan Castle APIs

### clanCastle_getInfo

Retrieves information about the clan castle, including experience, level, and player contribution points.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanCastle_getInfo",
      "args": {},
      "context": {
        "actionTs": 111283
      },
      "ident": "body"
    }
  ]
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `castleExp` | integer | Total castle experience |
| `castleLevel` | integer | Current castle level |
| `userExp` | integer | Current user's contribution experience |
| `points` | object | Contribution points for all clan members |

---

### clanCastle_upgrade

Upgrades the clan castle by contributing coins.

**Request:**
```json
{
  "calls": [
    {
      "name": "clanCastle_upgrade",
      "args": {
        "optionId": 1,
        "amount": 1
      },
      "context": {
        "actionTs": 111283
      },
      "ident": "body"
    }
  ]
}
```

**Request Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `optionId` | integer | Option ID (1 = donate coins) |
| `amount` | integer | Amount of coins to donate (minimum 1) |

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `clanCastle` | object | Updated clan castle information |
| `clanCastle.castleLevel` | integer | Updated castle level |
| `clanCastle.userExp` | integer | Updated user contribution experience |

**Example Response:**
```json
{
  "clanCastle": {
    "castleExp": 532199,
    "castleLevel": 41,
    "userExp": 30835
  }
}
```

---

## Important Coordinates

### Base Positions

| Base | Level ID | Description |
|------|----------|-------------|
| **Left Upper Base** | 693 | Starting position for left upper base |
| **Right Bottom Base** | 696 | Starting position for right bottom base |

### Key Locations

| Location | Level ID | Description |
|----------|----------|-------------|
| **Midtown** | 1 | Central town location (main objective) |
| **Verdant** | 123 | Verdant location |
| **Monbridge** | 112 | Monbridge location |
| **Moongrave** | 359 | Moongrave location |

### Tower Positions

Tower positions are locations that can be occupied. When moving to a tower:
- If `userId` is 0: Tower is empty, move to occupy it
- If `userId` matches your clan: Tower is occupied by teammate, skip
- If `userId` is different clan: Tower is occupied by enemy, attack first

**All 32 Tower Positions:**
`1, 26, 29, 33, 36, 98, 101, 112, 115, 123, 126, 333, 336, 340, 343, 356, 359, 375, 378, 394, 407, 423, 426, 436, 439, 446, 449, 465, 468, 585, 588, 596`

---

## Common Movement Paths

### Path 1: Left Upper Base (693) → Midtown (1)

**Total Moves:** 16 moves

**Path:** `693 → 603 → 519 → 441 → 369 → 303 → 249 → 201 → 159 → 153 → 111 → 75 → 51 → 45 → 21 → 9 → 3 → 1`

**API Sequence:**
- 16 `clanDomination_move` calls (levels: 603, 519, 441, 369, 303, 249, 201, 159, 153, 111, 75, 51, 45, 21, 9, 3)
- 1 `clanDomination_move` to level 1 (midtown)
- 1 `clanDomination_getEnemyTeams` at level 1
- 1 `clanDomination_startBattle` with target ID

---

### Path 2: Right Bottom Base (696) → Midtown (1) via Level 6

**Total Moves:** 14 moves to level 6, then battle and move to level 1

**Path:** `696 → 606 → 522 → 444 → 372 → 306 → 246 → 192 → 144 → 108 → 78 → 54 → 30 → 12 → 6 → 1`

**API Sequence:**
- 14 `clanDomination_move` calls (levels: 606, 522, 444, 372, 306, 246, 192, 144, 108, 78, 54, 30, 12, 6)
- 1 `clanDomination_getEnemyTeams` at level 1
- 1 `clanDomination_startBattle` with target ID
- 1 `clanDomination_move` to level 1 (midtown) after battle

---

## Tower Handling Logic

When replaying a path and encountering a tower position:

1. **Check if target is a tower:** Use the tower positions list
2. **Get map state:** Call `clanDomination_mapState` to check tower occupancy
3. **Check tower info:** Look at `townPositions[position].userId`
4. **Handle three cases:**
   - **Empty tower (`userId` = 0):** Proceed with move to occupy
   - **Teammate-occupied (`userId` matches your clan):** Skip move, continue to next step
   - **Enemy-occupied (`userId` is different clan):** 
     - Call `clanDomination_getEnemyTeams` with the tower's level ID
     - Call `clanDomination_startBattle` with one of the enemy user IDs
     - Wait 5 seconds (cooldown)
     - If battle successful, proceed with move to occupy tower
     - If battle failed, skip move and continue

---

## Error Handling

### Common Errors

**"NotAvailable" - "level X is too far away"**
- The move will queue up anyway
- Log the error but continue execution
- The move will execute when it becomes available

**Battle Failures**
- If `clanDomination_startBattle` fails, do not proceed with the move
- Skip the move and continue to the next step in the recording

**No Moves Remaining**
- Check `refillable.amount` from `clanDomination_move` responses
- If `amount` becomes 0, stop all recordings
- Log the situation and abort execution

---

## Best Practices

1. **Always check remaining moves** before starting a long path
2. **Wait for cooldown** after battles (5 seconds)
3. **Check tower occupancy** before moving to tower positions
4. **Use dynamic enemy targeting** - capture enemy IDs from `clanDomination_getEnemyTeams` and use them in `clanDomination_startBattle`
5. **Store complete paths** including initial position for faster validation
6. **Handle errors gracefully** - log errors but continue when appropriate

---

---

**Document Version:** 1.1  
**Last Updated:** 2026-01-13
