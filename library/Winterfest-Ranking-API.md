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
          ]
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
          ]
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
          "top": [ /* ranking entries */ ]
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

