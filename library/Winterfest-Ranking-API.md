# Winterfest Ranking API Documentation

## Overview

The Winterfest Ranking API provides access to various leaderboards for the Winterfest event in Hero Wars. This API allows you to retrieve rankings for gifts sent, gifts received, and tree decoration actions.

## API Endpoint

- **URL**: `https://heroes-wb.nextersglobal.com/api/`
- **Method**: `POST`
- **Content-Type**: `application/json; charset=UTF-8`

## API Call Structure

### Request Format

The API uses a batch call format where multiple API calls can be sent in a single request:

```json
{
  "calls": [
    {
      "name": "topGet",
      "args": {
        "type": "giftsSend",
        "extraId": 0,
        "serverId": 218
      },
      "context": {
        "actionTs": 100807
      },
      "ident": "group_1_body"
    }
  ]
}
```

### Parameters

- **name**: `"topGet"` (required) - The API method name
- **args**: Object containing:
  - **type**: `string` (required) - The ranking type (see available types below)
  - **extraId**: `number` (optional, default: `0`) - Additional identifier
  - **serverId**: `number` (required) - The server ID
- **context**: Object containing:
  - **actionTs**: `number` - Timestamp for the action
- **ident**: `string` - Unique identifier for this call in the batch

## Available Ranking Types

### 1. giftsSend

Retrieves the leaderboard of players ranked by the total number of gifts they have sent.

**Request Example:**
```json
{
  "name": "topGet",
  "args": {
    "type": "giftsSend",
    "extraId": 0,
    "serverId": 218
  },
  "context": {
    "actionTs": 100807
  },
  "ident": "group_1_body"
}
```

**Response Structure:**
```json
{
  "date": 1766511843.638122,
  "results": [
    {
      "ident": "group_1_body",
      "result": {
        "response": {
          "top": [
            {
              "giftsSum": "4928",
              "userId": "35461323"
            },
            {
              "giftsSum": "4396",
              "userId": "35891708"
            }
            // ... up to 50 entries
          ],
          "place": 1,
          "giftsSum": "4928",
          "delta": 0,
          "users": {
            "35461323": {
              "id": "35461323",
              "name": "PlayerName",
              "lastLoginTime": "1766504122",
              "serverId": "218",
              "level": "130",
              "clanId": "328621",
              "clanRole": "4",
              "commander": false,
              "avatarId": "267",
              "isChatModerator": false,
              "frameId": 39,
              "leagueId": 3,
              "allowPm": "all",
              "clanTitle": "Clan Name",
              "clanIcon": { /* icon details */ }
            }
            // ... more user entries
          }
        }
      }
    }
  ]
}
```

**Response Fields:**
- **top**: `array` - Array of ranking entries (up to 50 entries)
  - **giftsSum**: `string` - Total number of gifts sent (as string)
  - **userId**: `string` - User ID of the player
- **place**: `number` - The current player's ranking position (1-based)
- **giftsSum**: `string` - The current player's total gifts sent
- **delta**: `number` - Change in ranking position since last check (positive = moved up, negative = moved down, 0 = no change)
- **users**: `object` - Object mapping `userId` (as string key) to full user details. Each user object contains:
  - **id**: `string` - User ID
  - **name**: `string` - Player name
  - **lastLoginTime**: `string` - Last login timestamp
  - **serverId**: `string` - Server ID
  - **level**: `string` - Player level
  - **clanId**: `string` - Clan ID (if in a clan)
  - **clanRole**: `string` - Role in clan
  - **commander**: `boolean` - Whether player is a commander
  - **avatarId**: `string` - Avatar ID
  - **isChatModerator**: `boolean` - Whether player is a chat moderator
  - **frameId**: `number` - Frame ID
  - **leagueId**: `number` - League ID
  - **allowPm**: `string` - PM permission setting
  - **clanTitle**: `string` - Clan name (if in a clan)
  - **clanIcon**: `object` - Clan icon details (if in a clan)

### 2. giftsReceived

Retrieves the leaderboard of players ranked by the total number of gifts they have received.

**Request Example:**
```json
{
  "name": "topGet",
  "args": {
    "type": "giftsReceived",
    "extraId": 0,
    "serverId": 218
  },
  "context": {
    "actionTs": 100808
  },
  "ident": "group_2_body"
}
```

**Response Structure:**
```json
{
  "date": 1766511843.638122,
  "results": [
    {
      "ident": "group_2_body",
      "result": {
        "response": {
          "top": [
            {
              "giftsSum": "5260",
              "userId": "35891708"
            },
            {
              "giftsSum": "4524",
              "userId": "35986432"
            }
            // ... up to 50 entries
          ],
          "place": 10,
          "giftsSum": "2916",
          "delta": -2,
          "users": {
            "35891708": {
              "id": "35891708",
              "name": "PlayerName",
              // ... full user details (same structure as giftsSend)
            }
            // ... more user entries
          }
        }
      }
    }
  ]
}
```

**Response Fields:**
- **top**: `array` - Array of ranking entries (up to 50 entries)
  - **giftsSum**: `string` - Total number of gifts received (as string)
  - **userId**: `string` - User ID of the player
- **place**: `number` - The current player's ranking position (1-based)
- **giftsSum**: `string` - The current player's total gifts received
- **delta**: `number` - Change in ranking position since last check (positive = moved up, negative = moved down, 0 = no change)
- **users**: `object` - Object mapping `userId` (as string key) to full user details (same structure as `giftsSend`)

### 3. nyTree

Retrieves the leaderboard of clans ranked by tree decoration actions (New Year Tree).

**Request Example:**
```json
{
  "name": "topGet",
  "args": {
    "type": "nyTree",
    "extraId": 0,
    "serverId": 218
  },
  "context": {
    "actionTs": 100808
  },
  "ident": "group_3_body"
}
```

**Response Structure:**
```json
{
  "date": 1766511843.638122,
  "results": [
    {
      "ident": "group_3_body",
      "result": {
        "response": {
          "top": [
            {
              "decorateActions": "9237900",
              "clanId": "268348"
            },
            {
              "decorateActions": "8891700",
              "clanId": "328621"
            }
            // ... up to 24 entries
          ],
          "place": 2,
          "decorateActions": "8891700",
          "delta": 0,
          "clans": [
            {
              "id": "268348",
              "ownerId": "36011707",
              "level": "1",
              "title": "Clan Name",
              "description": "",
              "icon": {
                "flagColor1": 0,
                "flagColor2": 0,
                "flagShape": 3,
                "iconColor": 19,
                "iconShape": 44
              },
              "country": "6",
              "minLevel": "130",
              "serverId": "218",
              "membersCount": "30",
              "disbanding": false,
              "topActivity": "540485",
              "topDungeon": "0",
              "roleNames": [],
              "frameId": 3
            }
            // ... more clan entries
          ]
        }
      }
    }
  ]
}
```

**Response Fields:**
- **top**: `array` - Array of ranking entries (up to 24 entries)
  - **decorateActions**: `string` - Total number of decoration actions performed (as string)
  - **clanId**: `string` - Clan ID
- **place**: `number` - The current clan's ranking position (1-based)
- **decorateActions**: `string` - The current clan's total decoration actions
- **delta**: `number` - Change in ranking position since last check (positive = moved up, negative = moved down, 0 = no change)
- **clans**: `array` - Array of full clan details objects. Each clan object contains:
  - **id**: `string` - Clan ID
  - **ownerId**: `string` - Owner's user ID
  - **level**: `string` - Clan level
  - **title**: `string` - Clan name
  - **description**: `string` - Clan description
  - **icon**: `object` - Clan icon details
  - **country**: `string` - Country code
  - **minLevel**: `string` - Minimum level requirement
  - **serverId**: `string` - Server ID
  - **membersCount**: `string` - Number of members
  - **disbanding**: `boolean` - Whether clan is disbanding
  - **topActivity**: `string` - Top activity score
  - **topDungeon**: `string` - Top dungeon score
  - **roleNames**: `array` - Array of role names
  - **frameId**: `number` or `null` - Frame ID

## Response Format

All API responses follow this structure:

```json
{
  "date": 1766511843.638122,
  "results": [
    {
      "ident": "group_X_body",
      "result": {
        "response": {
          "top": [ /* ranking entries */ ],
          "place": 10,
          "giftsSum": "2916",
          "delta": -2,
          "users": { /* user details object */ }
        }
      }
    }
  ]
}
```

### Response Fields

- **date**: `number` - Server timestamp when the response was generated
- **results**: `array` - Array of results matching the request calls
  - **ident**: `string` - Matches the `ident` from the corresponding request call
  - **result**: `object` - Contains the actual API response
    - **response**: `object` - The API response data
      - **top**: `array` - Array of ranking entries (sorted by rank, highest first)
      - **place**: `number` - The current player's/clan's ranking position (1-based, where 1 is the top position)
      - **giftsSum** (for `giftsSend` and `giftsReceived`): `string` - The current player's total gifts sent/received
      - **decorateActions** (for `nyTree`): `string` - The current clan's total decoration actions
      - **delta**: `number` - Change in ranking position since last check (positive = moved up, negative = moved down, 0 = no change)
      - **users** (for `giftsSend` and `giftsReceived`): `object` - Object mapping `userId` (as string key) to full user details object
      - **clans** (for `nyTree`): `array` - Array of full clan details objects for clans in the ranking

## Notes

1. **Ranking Limits**: 
   - `giftsSend` and `giftsReceived` return up to 50 entries
   - `nyTree` returns up to 24 entries

2. **Data Types**: 
   - Numeric values (giftsSum, decorateActions) are returned as strings, not numbers
   - User IDs and Clan IDs are also returned as strings

3. **Server ID**: 
   - The `serverId` parameter must match the server where the player is located

4. **Batch Calls**: 
   - Multiple `topGet` calls can be included in a single request batch
   - Each call should have a unique `ident` value
   - Responses will match the order and `ident` of the requests

## Example Usage

### Single Ranking Request

```json
{
  "calls": [
    {
      "name": "topGet",
      "args": {
        "type": "giftsSend",
        "extraId": 0,
        "serverId": 218
      },
      "context": {
        "actionTs": 100807
      },
      "ident": "body"
    }
  ]
}
```

### Multiple Rankings in One Request

```json
{
  "calls": [
    {
      "name": "topGet",
      "args": {
        "type": "giftsSend",
        "extraId": 0,
        "serverId": 218
      },
      "context": {
        "actionTs": 100807
      },
      "ident": "group_1_body"
    },
    {
      "name": "topGet",
      "args": {
        "type": "giftsReceived",
        "extraId": 0,
        "serverId": 218
      },
      "context": {
        "actionTs": 100808
      },
      "ident": "group_2_body"
    },
    {
      "name": "topGet",
      "args": {
        "type": "nyTree",
        "extraId": 0,
        "serverId": 218
      },
      "context": {
        "actionTs": 100808
      },
      "ident": "group_3_body"
    }
  ]
}
```

---

# Decorate Tree API Documentation

## Overview

The Decorate Tree API allows players to decorate the New Year tree during the Winterfest event in Hero Wars. This API call decorates the tree with a specific decoration option and returns updated tree statistics, rewards, and quest progress.

## Getting Your Holiday Candy Balance

The API response does not include your current holiday candy balance. To retrieve your current balance of coin type 16 (holiday candy), access the client-side game data:

```javascript
// Get your current holiday candy balance
const holidayCandyBalance = lib.data.inventoryitem[16];
// Example: If you have 35600 holiday candy, this will return 35600
```

The `lib.data.inventoryitem` object contains all inventory items and currencies, indexed by their type ID. Coin type `16` specifically represents holiday candy currency used in the Winterfest event.

## API Endpoint

- **URL**: `https://heroes-wb.nextersglobal.com/api/`
- **Method**: `POST`
- **Content-Type**: `application/json; charset=UTF-8`

## API Call Structure

### Request Format

The API uses a batch call format where multiple API calls can be sent in a single request:

```json
{
  "calls": [
    {
      "name": "newYear_decorateTree",
      "args": {
        "optionId": 2,
        "amount": 1
      },
      "context": {
        "actionTs": 358843
      },
      "ident": "body"
    }
  ]
}
```

### Parameters

- **name**: `"newYear_decorateTree"` (required) - The API method name
- **args**: Object containing:
  - **optionId**: `number` (required) - The decoration option ID to apply to the tree
  - **amount**: `number` (required) - The number of decorations to apply (typically `1`)
- **context**: Object containing:
  - **actionTs**: `number` - Timestamp for the action
- **ident**: `string` - Unique identifier for this call in the batch

### Request Example

```json
{
  "calls": [
    {
      "name": "newYear_decorateTree",
      "args": {
        "optionId": 2,
        "amount": 1
      },
      "context": {
        "actionTs": 358843
      },
      "ident": "body"
    }
  ]
}
```

## Response Structure

```json
{
  "date": 1766535409.1318901,
  "results": [
    {
      "ident": "body",
      "result": {
        "response": {
          "reward": {
            "coin": {
              "16": 500
            }
          },
          "treeLevel": 49,
          "treeXp": 9256000,
          "treeExpPercent": 79.5,
          "treeExpToNextLevel": 176000,
          "users": null,
          "quests": [
            {
              "id": 403596,
              "state": 3,
              "progress": 11280,
              "reward": {
                "coin": {
                  "17": 1000,
                  "18": 1500
                }
              },
              "createTime": 1766282716,
              "farmCount": 0
            }
            // ... more quest entries
          ]
        }
      }
    }
  ]
}
```

## Response Fields

### Main Response Object

- **reward**: `object` - Rewards received from decorating the tree
  - **coin**: `object` - Coin/currency rewards, where keys are coin type IDs (as strings) and values are amounts
    - **Important**: Coin type `16` = Holiday candy currency
    - **Example**: `{"16": 500}` = **500 holiday candy** (this is the standard reward for decorating the tree)
    - **Note**: This field shows the **reward amount** (500), not your current total balance. The API response does not include your current holiday candy balance.
    - Other coin types may represent different currencies or items

- **treeLevel**: `number` - Current level of the decorated tree

- **treeXp**: `number` - Total experience points accumulated on the tree

- **treeExpPercent**: `number` - Percentage of experience progress to the next level (e.g., `79.5` means 79.5%)

- **treeExpToNextLevel**: `number` - Experience points needed to reach the next tree level

- **users**: `object` or `null` - User information (typically `null` for this API call)

- **quests**: `array` - Array of quest objects related to the Winterfest event

### Quest Object Structure

Each quest object in the `quests` array contains:

- **id**: `number` - Unique quest identifier

- **state**: `number` - Quest state:
  - `1` = Active/Incomplete
  - `3` = Completed (rewards can be collected)

- **progress**: `number` - Current progress value toward quest completion

- **reward**: `object` - Rewards available for completing this quest
  - **coin**: `object` (optional) - Coin rewards with coin type IDs as keys
  - **pointEventXp**: `object` (optional) - Event experience points, where keys are quest IDs and values are XP amounts
  - **consumable**: `object` (optional) - Consumable items, where keys are item IDs (as strings) and values are quantities (as strings)

- **createTime**: `number` - Unix timestamp when the quest was created

- **farmCount**: `number` - Number of times the quest has been farmed/completed (typically `0`)

## Response Format

All API responses follow this structure:

```json
{
  "date": 1766535409.1318901,
  "results": [
    {
      "ident": "body",
      "result": {
        "response": {
          "reward": { /* reward object */ },
          "treeLevel": 49,
          "treeXp": 9256000,
          "treeExpPercent": 79.5,
          "treeExpToNextLevel": 176000,
          "users": null,
          "quests": [ /* quest array */ ]
        }
      }
    }
  ]
}
```

### Response Fields Summary

- **date**: `number` - Server timestamp when the response was generated
- **results**: `array` - Array of results matching the request calls
  - **ident**: `string` - Matches the `ident` from the corresponding request call
  - **result**: `object` - Contains the actual API response
    - **response**: `object` - The API response data
      - **reward**: `object` - Rewards from the decoration action
      - **treeLevel**: `number` - Current tree level
      - **treeXp**: `number` - Total tree experience
      - **treeExpPercent**: `number` - Experience percentage to next level
      - **treeExpToNextLevel**: `number` - Experience needed for next level
      - **users**: `object` or `null` - User information
      - **quests**: `array` - Array of quest objects

## Quest State Values

- **1**: Quest is active but not yet completed
- **3**: Quest is completed and rewards can be collected

## Notes

1. **Decoration Options**: 
   - The `optionId` parameter determines which decoration is applied to the tree
   - Different decoration options may provide different rewards or experience

2. **Tree Progression**: 
   - Decorating the tree increases `treeXp` (tree experience)
   - When enough experience is gained, `treeLevel` increases
   - `treeExpPercent` shows progress as a percentage (0-100)
   - `treeExpToNextLevel` shows remaining XP needed for the next level

3. **Rewards**: 
   - Immediate rewards are provided in the `reward` field
   - **Decorating the tree rewards 500 holiday candy** (shown as `{"16": 500}` in the response)
   - Coin type `16` represents holiday candy currency used in the Winterfest event
   - **Important**: The `reward` field shows the **amount added** (500), not your current total balance
   - **To get your current holiday candy balance**: Access `lib.data.inventoryitem[16]` from the client-side game data (see "Getting Your Holiday Candy Balance" section above)
   - Quest rewards are separate and listed in the `quests` array
   - Coin types are identified by numeric IDs (as strings in JSON)

4. **Quest Updates**: 
   - The response includes all active and completed quests related to the Winterfest event
   - Completed quests (`state: 3`) may have collectible rewards
   - Quest progress may be updated based on the decoration action

5. **Batch Calls**: 
   - Multiple `newYear_decorateTree` calls can be included in a single request batch
   - Each call should have a unique `ident` value
   - Responses will match the order and `ident` of the requests

## Example Usage

### Single Decoration Request

```json
{
  "calls": [
    {
      "name": "newYear_decorateTree",
      "args": {
        "optionId": 2,
        "amount": 1
      },
      "context": {
        "actionTs": 358843
      },
      "ident": "body"
    }
  ]
}
```

### Multiple Decorations in Batch

```json
{
  "calls": [
    {
      "name": "newYear_decorateTree",
      "args": {
        "optionId": 1,
        "amount": 1
      },
      "context": {
        "actionTs": 358843
      },
      "ident": "decoration_1"
    },
    {
      "name": "newYear_decorateTree",
      "args": {
        "optionId": 2,
        "amount": 1
      },
      "context": {
        "actionTs": 358844
      },
      "ident": "decoration_2"
    }
  ]
}
```

## Related APIs

### newYear_getInfo

Retrieves current Winterfest event information including tree status, gifts, and hero information.

**Request Example:**
```json
{
  "calls": [
    {
      "name": "newYear_getInfo",
      "args": {},
      "context": {
        "actionTs": 404110
      },
      "ident": "group_1_body"
    }
  ]
}
```

**Response Structure:**
```json
{
  "date": 1766536221.8068941,
  "results": [
    {
      "ident": "group_1_body",
      "result": {
        "response": {
          "treeLevel": 49,
          "treeXp": 9261850,
          "treeExpPercent": 80.2,
          "treeExpToNextLevel": 170150,
          "giftsToOpen": 2,
          "eventHero": 69,
          "dayHero": 41
        }
      }
    }
  ]
}
```

**Response Fields:**
- **treeLevel**: `number` - Current level of the decorated tree
- **treeXp**: `number` - Total experience points accumulated on the tree
- **treeExpPercent**: `number` - Percentage of experience progress to the next level
- **treeExpToNextLevel**: `number` - Experience points needed to reach the next tree level
- **giftsToOpen**: `number` - Number of gifts available to open
- **eventHero**: `number` - Hero ID for the event hero
- **dayHero**: `number` - Hero ID for the day hero

**Note**: This API does not return your current holiday candy balance (coin type 16). To retrieve your holiday candy balance, access the client-side game data structure:

```javascript
// Access holiday candy balance (coin type 16) from client-side data
const holidayCandyBalance = lib.data.inventoryitem[16];
// Example: If you have 35600 holiday candy, this will return 35600
```

The `lib.data.inventoryitem` object contains all inventory items and currencies indexed by their coin/item type ID. Coin type `16` represents holiday candy currency used in the Winterfest event.

### newYear_getPersonalTops

Retrieves your personal ranking positions for gifts sent and received in the Winterfest event.

**Request Example:**
```json
{
  "calls": [
    {
      "name": "newYear_getPersonalTops",
      "args": {},
      "context": {
        "actionTs": 404109
      },
      "ident": "group_0_body"
    }
  ]
}
```

**Response Structure:**
```json
{
  "date": 1766536221.8068941,
  "results": [
    {
      "ident": "group_0_body",
      "result": {
        "response": {
          "received": {
            "place": 13,
            "points": 2932
          },
          "sent": {
            "place": 23,
            "points": 1084
          }
        }
      }
    }
  ]
}
```

**Response Fields:**
- **received**: `object` - Information about gifts received ranking
  - **place**: `number` - Your ranking position for gifts received (1-based)
  - **points**: `number` - Total points from gifts received
- **sent**: `object` - Information about gifts sent ranking
  - **place**: `number` - Your ranking position for gifts sent (1-based)
  - **points**: `number` - Total points from gifts sent

**Note**: This API provides your personal ranking positions but does not include the full leaderboard. Use the `topGet` API (see Winterfest Ranking API documentation above) to get the full leaderboard.

## Example Response

```json
{
  "date": 1766535409.1318901,
  "results": [
    {
      "ident": "body",
      "result": {
        "response": {
          "reward": {
            "coin": {
              "16": 500
            }
          },
          "treeLevel": 49,
          "treeXp": 9256000,
          "treeExpPercent": 79.5,
          "treeExpToNextLevel": 176000,
          "users": null,
          "quests": [
            {
              "id": 403596,
              "state": 3,
              "progress": 11280,
              "reward": {
                "coin": {
                  "17": 1000,
                  "18": 1500
                }
              },
              "createTime": 1766282716,
              "farmCount": 0
            },
            {
              "id": 403597,
              "state": 3,
              "progress": 11280,
              "reward": {
                "coin": {
                  "17": 2000,
                  "18": 3000
                }
              },
              "createTime": 1766282716,
              "farmCount": 0
            },
            {
              "id": 400236,
              "state": 3,
              "progress": 11060,
              "reward": {
                "pointEventXp": {
                  "400236": 100
                }
              },
              "createTime": 1766369793,
              "farmCount": 0
            },
            {
              "id": 398728,
              "state": 3,
              "progress": 11040,
              "reward": {
                "consumable": {
                  "65": "3"
                }
              },
              "createTime": 1766455681,
              "farmCount": 0
            }
          ]
        }
      }
    }
  ]
}
```

