# Hero Tournament API Documentation

## Overview
This document describes the Power Tournament API endpoints used in Hero Wars. The API uses a batch request system where multiple calls can be made in a single request.

## Base URL
```
https://heroes-wb.nextersglobal.com/api/
```

## Authentication Headers
All requests require the following authentication headers:

| Header | Description | Example |
|--------|-------------|---------|
| `X-Auth-Token` | Authentication token | `ps-LqNdXulBPIeMbDWURTgrmiAhVs+oOEfGStQyZnY/pJzCjv-1767283188-104.28.205.136-53d312d244e15d1ed08d319248213100` |
| `X-Auth-User-Id` | User ID | `73660848` |
| `X-Auth-Player-Id` | Player ID | `35979991` |
| `X-Auth-Session-Id` | Session ID | `0t870fr0fz40b5` |
| `X-Auth-Session-Key` | Session key (may be empty) | `` |
| `X-Auth-Signature` | Request signature | `e04ff410c0f087034b5ed994e0ad078b` |
| `X-Auth-Application-Id` | Application ID | `3` |
| `X-Auth-Network-Ident` | Network identifier | `web` |
| `X-Env-Unique-Session-Id` | Unique session ID | `7412522947805650893` |
| `X-Env-Unique-Session-Uuid` | Unique session UUID | `fd1a8167-f4c0-4523-a146-96cfe2197117` |
| `X-Request-Id` | Request ID (incremental) | `10` |
| `X-Server-Time` | Server time offset | `0` |
| `X-Env-Library-Version` | Library version | `1` |
| `Content-Type` | Content type | `application/json; charset=UTF-8` |
| `X-Requested-With` | Request type | `XMLHttpRequest` |
| `Referer` | Referer URL | `https://www.hero-wars.com/` |
| `X-Full-Referer` | Full referer URL | `https://www.hero-wars.com/` |

## API Endpoints

### Batch API Call
The API uses a batch request system where multiple method calls can be made in a single POST request.

**Endpoint:** `POST /api/`

**Request Body Format:**
```json
{
  "calls": [
    {
      "name": "methodName",
      "args": {},
      "context": {
        "actionTs": 186571
      },
      "ident": "identifier"
    }
  ]
}
```

**Response Format:**
```json
{
  "date": 1767283375.210103,
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

## Tournament Methods

### 1. powerTournament_getState

Gets the current state of the Power Tournament.

**Request:**
```json
{
  "calls": [
    {
      "name": "powerTournament_getState",
      "args": {},
      "context": {
        "actionTs": 186571
      },
      "ident": "body"
    }
  ]
}
```

**Response:**
```json
{
  "ident": "body",
  "result": {
    "response": {
      "id": 1798000009,
      "startTime": 1767232800,
      "endTime": 1767664799,
      "state": 1,
      "type": "heroes",
      "currentDayRewards": [
        {
          "id": 1,
          "points": 300,
          "reward": {
            "consumable": {
              "339": 3
            }
          },
          "isFarmed": 1
        },
        {
          "id": 2,
          "points": 1000,
          "reward": {
            "consumable": {
              "297": 20
            }
          },
          "isFarmed": 1
        },
        {
          "id": 3,
          "points": 2200,
          "reward": {
            "consumable": {
              "296": 30
            }
          },
          "isFarmed": 1
        },
        {
          "id": 4,
          "points": 4000,
          "reward": {
            "consumable": {
              "51": 40
            }
          },
          "isFarmed": 1
        }
      ],
      "currentDailyPoints": 25717,
      "currentTournamentPoints": 25717,
      "statueLevel": 1,
      "finalRewardFarmed": 0
    }
  }
}
```

**Response Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Tournament ID |
| `startTime` | integer | Tournament start timestamp (Unix) |
| `endTime` | integer | Tournament end timestamp (Unix) |
| `state` | integer | Tournament state (1 = active) |
| `type` | string | Tournament type (e.g., "heroes") |
| `currentDayRewards` | array | Daily reward milestones |
| `currentDayRewards[].id` | integer | Reward milestone ID |
| `currentDayRewards[].points` | integer | Points required for this reward |
| `currentDayRewards[].reward` | object | Reward object |
| `currentDayRewards[].reward.consumable` | object | Consumable items (itemId: quantity) |
| `currentDayRewards[].isFarmed` | integer | Whether reward has been claimed (1 = yes, 0 = no) |
| `currentDailyPoints` | integer | Current daily points earned |
| `currentTournamentPoints` | integer | Total tournament points earned |
| `statueLevel` | integer | Statue level |
| `finalRewardFarmed` | integer | Whether final reward has been claimed (1 = yes, 0 = no) |

---

### 2. powerTournament_getGroupInfo

Gets information about the tournament group, including all participants, their points, and rewards.

**Note:** When calling `powerTournament_getGroupInfo` alone, use `"ident": "body"` in the request. The response will also have `"ident": "body"` in the results array.

**Request:**
```json
{
  "calls": [
    {
      "name": "powerTournament_getGroupInfo",
      "args": {},
      "context": {
        "actionTs": 124275
      },
      "ident": "body"
    }
  ]
}
```

**Response:**
```json
{
  "date": 1767284966.661356,
  "results": [
    {
      "ident": "body",
      "result": {
        "response": {
          "users": {
            "35979991": {
              "id": "35979991",
              "name": "One Peace",
              "lastLoginTime": "1767283192",
              "serverId": "218",
              "level": "130",
              "clanId": "328621",
              "clanRole": "4",
              "commander": true,
              "avatarId": "690",
              "isChatModerator": false,
              "frameId": 136,
              "leagueId": 3,
              "allowPm": "all",
              "clanTitle": "Peaks End",
              "clanIcon": {
                "flagColor1": 19,
                "flagColor2": 19,
                "flagShape": 12,
                "iconColor": 7,
                "iconShape": 14
              }
            }
          },
          "points": {
            "4588565": 38986,
            "35979991": 28762,
            "22457031": 22541,
            "25741597": 15531,
            "35449277": 14322,
            "46730366": 12029,
            "16913075": 10628,
            "2298620": 9887,
            "9726864": 9081,
            "26440135": 5496,
            "14587587": 4894,
            "8243370": 4671,
            "16868683": 4287,
            "10559844": 2753,
            "51109737": 154
          },
          "rewards": [
            {
              "place": 1,
              "reward": {
                "avatar": {
                  "1595": 1
                },
                "starmoney": 50000,
                "consumable": {
                  "441": 100
                }
              }
            },
            {
              "place": 2,
              "reward": {
                "starmoney": 25000,
                "consumable": {
                  "441": 50
                }
              }
            },
            {
              "place": 3,
              "reward": {
                "starmoney": 15000,
                "consumable": {
                  "441": 25
                }
              }
            },
            {
              "place": 4,
              "reward": {
                "starmoney": 10000,
                "consumable": {
                  "441": 20
                }
              }
            },
            {
              "place": 5,
              "reward": {
                "starmoney": 8000,
                "consumable": {
                  "441": 15
                }
              }
            },
            {
              "place": 6,
              "reward": {
                "consumable": {
                  "441": 15
                }
              }
            },
            {
              "place": 7,
              "reward": {
                "consumable": {
                  "441": 12
                }
              }
            },
            {
              "place": 8,
              "reward": {
                "consumable": {
                  "441": 10
                }
              }
            },
            {
              "place": 9,
              "reward": {
                "consumable": {
                  "441": 8
                }
              }
            },
            {
              "place": 10,
              "reward": {
                "consumable": {
                  "441": 5
                }
              }
            },
            {
              "place": 11,
              "reward": [],
              "rewards": []
            }
          ]
        }
      }
    }
  ]
}
```

**Response Fields:**

#### Users Object
The `users` object contains user information keyed by user ID.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | User ID |
| `name` | string | Player name |
| `lastLoginTime` | string | Last login timestamp (Unix) |
| `serverId` | string | Server ID |
| `level` | string | Player level |
| `clanId` | string | Clan ID |
| `clanRole` | string | Clan role (2 = member, 3 = officer, 4 = commander) |
| `commander` | boolean | Whether player is a clan commander |
| `avatarId` | string | Avatar ID |
| `isChatModerator` | boolean | Whether player is a chat moderator |
| `frameId` | integer | Frame ID |
| `leagueId` | integer | League ID (1-3) |
| `allowPm` | string | PM permission setting |
| `clanTitle` | string | Clan name |
| `clanIcon` | object | Clan icon configuration |
| `clanIcon.flagColor1` | integer | Flag color 1 |
| `clanIcon.flagColor2` | integer | Flag color 2 |
| `clanIcon.flagShape` | integer | Flag shape |
| `clanIcon.iconColor` | integer | Icon color |
| `clanIcon.iconShape` | integer | Icon shape |
| `clanIcon.frame` | integer | Icon frame (optional) |

#### Points Object
The `points` object maps user IDs to their tournament points.

```json
{
  "4588565": 38986,
  "35979991": 28762,
  "22457031": 22541,
  "25741597": 15531,
  "35449277": 14322,
  "46730366": 12029,
  "16913075": 10628,
  "2298620": 9887,
  "9726864": 9081,
  "26440135": 5496,
  "14587587": 4894,
  "8243370": 4671,
  "16868683": 4287,
  "10559844": 2753,
  "51109737": 154
}
```

#### Rewards Array
The `rewards` array contains placement rewards.

| Field | Type | Description |
|-------|------|-------------|
| `place` | integer | Placement rank (1 = first, 2 = second, etc.) |
| `reward` | object | Reward object |
| `reward.avatar` | object | Avatar reward (optional, itemId: quantity) |
| `reward.starmoney` | integer | Star money reward (optional) |
| `reward.consumable` | object | Consumable items (itemId: quantity) |
| `reward.rewards` | array | Alternative rewards array (for place 11+) |

**Example Rewards:**
- **Place 1:** Avatar (1595), 50,000 star money, 100x consumable (441)
- **Place 2:** 25,000 star money, 50x consumable (441)
- **Place 3:** 15,000 star money, 25x consumable (441)
- **Place 4:** 10,000 star money, 20x consumable (441)
- **Place 5:** 8,000 star money, 15x consumable (441)
- **Place 6-10:** Various consumable rewards
- **Place 11+:** Empty rewards array

---

## Ranking Results

The ranking is calculated by sorting the `points` object by point values in descending order, then matching user IDs with the `users` object to get player details.

### Ranking Calculation

To generate a ranking table:

1. Sort the `points` object by values (descending)
2. Match each user ID with the `users` object to get player information
3. Match each rank with the `rewards` array to get placement rewards

#### Algorithm (Pseudocode)

```javascript
function generateRanking(apiResponse) {
  const { users, points, rewards } = apiResponse;
  
  // Step 1: Convert points object to array and sort
  const sortedPoints = Object.entries(points)
    .sort((a, b) => b[1] - a[1]); // Sort descending by points
  
  // Step 2: Build ranking array
  const ranking = sortedPoints.map(([userId, points], index) => {
    const rank = index + 1;
    const user = users[userId];
    const reward = rewards.find(r => r.place === rank)?.reward || null;
    
    return {
      rank,
      userId,
      name: user?.name || 'Unknown',
      points,
      serverId: user?.serverId,
      clanTitle: user?.clanTitle,
      leagueId: user?.leagueId,
      level: user?.level,
      commander: user?.commander,
      reward
    };
  });
  
  return ranking;
}
```

#### JavaScript Example

```javascript
// Process powerTournament_getGroupInfo response
function processRanking(apiResponse) {
  // Extract the response from the API result
  const result = apiResponse.results.find(r => r.ident === 'body');
  const { users, points, rewards } = result.result.response;
  
  // Create ranking array
  const ranking = Object.entries(points)
    .map(([userId, points]) => ({
      userId,
      points,
      user: users[userId] || null
    }))
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => {
      const rank = index + 1;
      const reward = rewards.find(r => r.place === rank);
      
      return {
        rank,
        ...entry.user,
        points: entry.points,
        reward: reward?.reward || null
      };
    });
  
  return ranking;
}

// Usage
const response = {
  "date": 1767284966.661356,
  "results": [{
    "ident": "body",
    "result": {
      "response": {
        "users": { /* ... */ },
        "points": { /* ... */ },
        "rewards": [ /* ... */ ]
      }
    }
  }]
};

const ranking = processRanking(response);
console.table(ranking);
```

#### Python Example

```python
def generate_ranking(api_response):
    """Generate ranking from API response"""
    # Extract the response from the API result
    result = next(
        r for r in api_response['results'] 
        if r['ident'] == 'body'
    )
    
    group_info = result['result']['response']
    users = group_info['users']
    points = group_info['points']
    rewards = group_info['rewards']
    
    # Sort by points (descending)
    sorted_points = sorted(
        points.items(), 
        key=lambda x: x[1], 
        reverse=True
    )
    
    # Build ranking
    ranking = []
    for rank, (user_id, points_value) in enumerate(sorted_points, 1):
        user = users.get(user_id, {})
        reward = next(
            (r['reward'] for r in rewards if r['place'] == rank), 
            None
        )
        
        ranking.append({
            'rank': rank,
            'user_id': user_id,
            'name': user.get('name', 'Unknown'),
            'points': points_value,
            'server_id': user.get('serverId'),
            'clan_title': user.get('clanTitle'),
            'league_id': user.get('leagueId'),
            'level': user.get('level'),
            'commander': user.get('commander', False),
            'reward': reward
        })
    
    return ranking

# Usage
import json

response = {
    "date": 1767284966.661356,
    "results": [{
        "ident": "body",
        "result": {
            "response": {
                "users": { /* ... */ },
                "points": { /* ... */ },
                "rewards": [ /* ... */ ]
            }
        }
    }]
}

ranking = generate_ranking(response)
for entry in ranking:
    print(f"{entry['rank']}. {entry['name']}: {entry['points']:,} points")
```

### Example Ranking Table

Based on the actual API response data:

| Rank | Player Name | Points | Server | Clan | League | Level | Commander | Reward |
|------|-------------|--------|--------|------|--------|-------|-----------|--------|
| 🥇 1 | DeDe | 38,986 | 2 | Ritter der Kokosnuss | 2 | 130 | ✅ | Avatar (1595), 50,000 ⭐, 100x (441) |
| 🥈 2 | One Peace | 28,762 | 218 | Peaks End | 3 | 130 | ✅ | 25,000 ⭐, 50x (441) |
| 🥉 3 | Shirox | 22,541 | 134 | pyonpyon | 3 | 130 | ✅ | 15,000 ⭐, 25x (441) |
| 4 | 7ruslan7 | 15,531 | 154 | UltrAS | 3 | 130 | ❌ | 10,000 ⭐, 20x (441) |
| 5 | SkyLight | 14,322 | 218 | Peaks End | 3 | 130 | ❌ | 8,000 ⭐, 15x (441) |
| 6 | Gorgantis | 12,029 | 306 | LazyTown | 1 | 130 | ❌ | 15x (441) |
| 7 | Carro | 10,628 | 102 | GAUNTLET | 2 | 130 | ✅ | 12x (441) |
| 8 | IRKUTSK2 | 9,887 | 14 | Royaume de France | 3 | 130 | ✅ | 10x (441) |
| 9 | Stone | 9,081 | 58 | Moonshadows | 2 | 130 | ❌ | 8x (441) |
| 10 | Suri | 5,496 | 158 | Mate | 1 | 130 | ❌ | 5x (441) |
| 11 | A1B2C3 | 4,894 | 62 | Die Elemente | 3 | 130 | ❌ | - |
| 12 | Team Gbass | 4,671 | 50 | gun | 2 | 130 | ❌ | - |
| 13 | dogyep | 4,287 | 102 | Die GERMANEN | 3 | 130 | ❌ | - |
| 14 | 1201Beyond | 2,753 | 62 | Formosa | 2 | 130 | ❌ | - |
| 15 | Edorion | 154 | 336 | French Kiss | 3 | 130 | ✅ | - |

**Legend:**
- 🥇🥈🥉 = Top 3 medals
- ✅ = Clan Commander
- ❌ = Not Commander
- ⭐ = Star Money
- (441) = Consumable item ID 441

### Raw API Response Structure

The API returns ranking data in three separate objects that need to be combined:

**1. Points Object (sorted by value to get ranking):**
```json
{
  "points": {
    "4588565": 38986,
    "35979991": 25717,
    "22457031": 22541,
    "25741597": 15531,
    "35449277": 14322,
    "46730366": 12029,
    "16913075": 10628,
    "2298620": 9887,
    "9726864": 9081,
    "26440135": 5496,
    "14587587": 4894,
    "8243370": 4671,
    "16868683": 4287,
    "10559844": 2753,
    "51109737": 0
  }
}
```

**2. Users Object (player details keyed by user ID):**
```json
{
  "users": {
    "4588565": {
      "id": "4588565",
      "name": "DeDe",
      "serverId": "2",
      "level": "130",
      "clanId": "352",
      "clanTitle": "Ritter der Kokosnuss",
      "clanRole": "3",
      "commander": true,
      "leagueId": 2,
      "avatarId": "833",
      "frameId": 194,
      "lastLoginTime": "1767279844"
    }
    // ... more users
  }
}
```

**3. Rewards Array (placement rewards):**
```json
{
  "rewards": [
    {
      "place": 1,
      "reward": {
        "avatar": {"1595": 1},
        "starmoney": 50000,
        "consumable": {"441": 100}
      }
    },
    {
      "place": 2,
      "reward": {
        "starmoney": 25000,
        "consumable": {"441": 50}
      }
    }
    // ... more rewards
  ]
}
```

### Processed Ranking Data Structure

After combining the three objects above:

```json
{
  "ranking": [
    {
      "rank": 1,
      "userId": "4588565",
      "name": "DeDe",
      "points": 38986,
      "serverId": "2",
      "clanTitle": "Ritter der Kokosnuss",
      "leagueId": 2,
      "level": "130",
      "commander": true,
      "reward": {
        "avatar": {"1595": 1},
        "starmoney": 50000,
        "consumable": {"441": 100}
      }
    },
    {
      "rank": 2,
      "userId": "35979991",
      "name": "One Peace",
      "points": 25717,
      "serverId": "218",
      "clanTitle": "Peaks End",
      "leagueId": 3,
      "level": "130",
      "commander": true,
      "reward": {
        "starmoney": 25000,
        "consumable": {"441": 50}
      }
    }
    // ... more entries
  ]
}
```

### Ranking Format Examples

#### JSON Format
```json
{
  "tournamentId": 1798000009,
  "timestamp": 1767283375.210103,
  "totalParticipants": 15,
  "rankings": [
    {
      "rank": 1,
      "player": {
        "id": "4588565",
        "name": "DeDe",
        "serverId": "2",
        "level": "130",
        "clan": {
          "id": "352",
          "title": "Ritter der Kokosnuss",
          "role": "3"
        },
        "league": 2
      },
      "points": 38986,
      "reward": {
        "avatar": {"1595": 1},
        "starmoney": 50000,
        "consumable": {"441": 100}
      }
    }
  ]
}
```

#### CSV Format
```csv
Rank,Player Name,User ID,Points,Server,Clan,League,Level,Commander,Reward
1,DeDe,4588565,38986,2,Ritter der Kokosnuss,2,130,true,"Avatar (1595), 50000 ⭐, 100x (441)"
2,One Peace,35979991,25717,218,Peaks End,3,130,true,"25000 ⭐, 50x (441)"
3,Shirox,22457031,22541,134,pyonpyon,3,130,true,"15000 ⭐, 25x (441)"
```

#### Markdown Table Format
```markdown
| Rank | Player | Points | Server | Clan | League | Reward |
|------|--------|--------|--------|------|--------|--------|
| 1 | DeDe | 38,986 | 2 | Ritter der Kokosnuss | 2 | Avatar (1595), 50,000 ⭐, 100x (441) |
| 2 | One Peace | 25,717 | 218 | Peaks End | 3 | 25,000 ⭐, 50x (441) |
```

### Ranking Statistics

From the example response:

- **Total Participants:** 15 players
- **Highest Points:** 38,986 (DeDe)
- **Lowest Points:** 154 (Edorion)
- **Average Points:** ~12,000
- **Median Points:** ~9,081
- **Players with 0 Points:** 0
- **Active Players:** 15 (100%)

### League Distribution

| League | Count | Percentage |
|--------|-------|------------|
| League 1 | 2 | 13.3% |
| League 2 | 5 | 33.3% |
| League 3 | 8 | 53.3% |

### Server Distribution

| Server | Players |
|--------|---------|
| 218 | 2 (SkyLight, One Peace) |
| 62 | 2 (1201Beyond, A1B2C3) |
| 102 | 2 (Carro, dogyep) |
| Others | 9 (1 each) |

### Points Distribution

| Range | Count |
|-------|-------|
| 30,000+ | 1 |
| 20,000-29,999 | 2 |
| 10,000-19,999 | 4 |
| 5,000-9,999 | 3 |
| 1-4,999 | 5 |
| 0 | 0 |

---

## Example Combined Request

A typical request combines both methods:

**Request:**
```json
{
  "calls": [
    {
      "name": "powerTournament_getState",
      "args": {},
      "context": {
        "actionTs": 186571
      },
      "ident": "body"
    },
    {
      "name": "powerTournament_getGroupInfo",
      "args": {},
      "context": {
        "actionTs": 186571
      },
      "ident": "powerTournament_getGroupInfo"
    }
  ]
}
```

**Note on `ident` field:**
- When calling `powerTournament_getState` alone, use `"ident": "body"`
- When calling `powerTournament_getGroupInfo` alone, use `"ident": "body"`
- When calling both together, use `"ident": "body"` for getState and `"ident": "powerTournament_getGroupInfo"` for getGroupInfo
- The `ident` value in the response will match the `ident` value in the request

**Response:**
```json
{
  "date": 1767283375.210103,
  "results": [
    {
      "ident": "body",
      "result": {
        "response": {
          /* powerTournament_getState response */
        }
      }
    },
    {
      "ident": "body",
      "result": {
        "response": {
          /* powerTournament_getGroupInfo response */
        }
      }
    }
  ]
}
```

---

## Response Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 500 | Server Error |

---

## Notes

1. **Timestamps:** All timestamps are Unix timestamps (seconds since epoch).
2. **Action Timestamp:** The `actionTs` in the context represents the action timestamp and should be incremented for each request.
3. **Request ID:** The `X-Request-Id` header should be incremented for each request (e.g., 10, 11, 12...).
4. **Signature:** The `X-Auth-Signature` header is likely a hash of the request body and other parameters for security.
5. **Consumable IDs:** Consumable item IDs reference specific in-game items (e.g., 339, 297, 296, 51, 441).
6. **Tournament State:** State value `1` indicates an active tournament.
7. **Reward Farming:** `isFarmed` value `1` means the reward has been claimed, `0` means it's available but not claimed.

---

## Example cURL Request

```bash
curl -X POST https://heroes-wb.nextersglobal.com/api/ \
  -H "Content-Type: application/json; charset=UTF-8" \
  -H "X-Auth-Token: ps-LqNdXulBPIeMbDWURTgrmiAhVs+oOEfGStQyZnY/pJzCjv-1767283188-104.28.205.136-53d312d244e15d1ed08d319248213100" \
  -H "X-Auth-User-Id: 73660848" \
  -H "X-Auth-Player-Id: 35979991" \
  -H "X-Auth-Session-Id: 0t870fr0fz40b5" \
  -H "X-Auth-Signature: e04ff410c0f087034b5ed994e0ad078b" \
  -H "X-Auth-Application-Id: 3" \
  -H "X-Auth-Network-Ident: web" \
  -H "X-Request-Id: 10" \
  -d '{
    "calls": [
      {
        "name": "powerTournament_getState",
        "args": {},
        "context": {"actionTs": 186571},
        "ident": "body"
      },
      {
        "name": "powerTournament_getGroupInfo",
        "args": {},
        "context": {"actionTs": 186571},
        "ident": "powerTournament_getGroupInfo"
      }
    ]
  }'
```

---

## Data Analysis

From the example response:

- **Tournament ID:** 1798000009
- **Duration:** ~5 days (start: 1767232800, end: 1767664799)
- **Type:** Heroes tournament
- **Group Size:** 15 players
- **Top Player:** 38,986 points
- **Current Player:** 25,717 points (ranked 2nd in group)
- **Daily Rewards:** 4 milestones (300, 1000, 2200, 4000 points)
- **Placement Rewards:** 11 ranks with rewards

---

*Last Updated: Based on HAR file from 2026-01-01*

