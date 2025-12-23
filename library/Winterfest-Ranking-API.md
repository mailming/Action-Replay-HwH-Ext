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

