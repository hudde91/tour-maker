# Tour Maker API Documentation

## Overview

This document outlines all API endpoints required for the Tour Maker backend. The Tour Maker is a golf tournament management system supporting individual, team, and Ryder Cup formats with comprehensive scoring, leaderboards, and multi-device player management.

## Base URL

```
https://api.tourmaker.com/v1
```

## Authentication

All endpoints require authentication using Bearer tokens:

```
Authorization: Bearer <token>
```

Device-specific operations use a device ID header:

```
X-Device-ID: <device-id>
```

---

## Table of Contents

1. [Tournaments](#tournaments)
2. [Players](#players)
3. [Teams](#teams)
4. [Rounds](#rounds)
5. [Scoring](#scoring)
6. [Match Play & Ryder Cup](#match-play--ryder-cup)
7. [Leaderboards](#leaderboards)
8. [Statistics](#statistics)
9. [Settings](#settings)

---

## Tournaments

### Create Tournament

```http
POST /tours
```

**Request Body:**

```json
{
  "name": "Summer Championship 2024",
  "description": "Annual summer golf tournament",
  "format": "individual" | "team" | "ryder-cup"
}
```

**Response:** `201 Created`

```json
{
  "id": "tour_abc123",
  "name": "Summer Championship 2024",
  "description": "Annual summer golf tournament",
  "format": "individual",
  "createdAt": "2024-06-15T10:00:00Z",
  "shareableUrl": "https://tourmaker.com/tour/tour_abc123",
  "players": [],
  "teams": [],
  "rounds": [],
  "isActive": true,
  "archived": false
}
```

---

### Get All Tournaments

```http
GET /tours
```

**Query Parameters:**

- `archived` (boolean, optional): Filter by archived status
- `format` (string, optional): Filter by format (individual/team/ryder-cup)
- `limit` (number, optional): Pagination limit
- `offset` (number, optional): Pagination offset

**Response:** `200 OK`

```json
{
  "tours": [
    {
      "id": "tour_abc123",
      "name": "Summer Championship 2024",
      "format": "individual",
      "createdAt": "2024-06-15T10:00:00Z",
      "isActive": true,
      "archived": false,
      "playerCount": 12,
      "roundCount": 3
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

### Get Tournament by ID

```http
GET /tours/:tourId
```

**Response:** `200 OK`

```json
{
  "id": "tour_abc123",
  "name": "Summer Championship 2024",
  "description": "Annual summer golf tournament",
  "format": "individual",
  "createdAt": "2024-06-15T10:00:00Z",
  "shareableUrl": "https://tourmaker.com/tour/tour_abc123",
  "players": [...],
  "teams": [...],
  "rounds": [...],
  "isActive": true,
  "archived": false
}
```

---

### Update Tournament Details

```http
PUT /tours/:tourId
```

**Request Body:**

```json
{
  "name": "Updated Tournament Name",
  "description": "Updated description"
}
```

**Response:** `200 OK`

---

### Update Tournament Format

```http
PATCH /tours/:tourId/format
```

**Request Body:**

```json
{
  "format": "team"
}
```

**Response:** `200 OK`

---

### Archive/Unarchive Tournament

```http
PATCH /tours/:tourId/archive
```

**Request Body:**

```json
{
  "archived": true
}
```

**Response:** `200 OK`

---

### Delete Tournament

```http
DELETE /tours/:tourId
```

**Response:** `204 No Content`

---

## Players

### Add Player to Tournament

```http
POST /tours/:tourId/players
```

**Request Body:**

```json
{
  "name": "John Doe",
  "handicap": 12.5,
  "teamId": "team_xyz789" // Optional, for team tournaments
}
```

**Response:** `201 Created`

```json
{
  "id": "player_def456",
  "name": "John Doe",
  "handicap": 12.5,
  "teamId": "team_xyz789",
  "claimedBy": null,
  "playerCode": "A1B2C3"
}
```

---

### Get All Players in Tournament

```http
GET /tours/:tourId/players
```

**Query Parameters:**

- `teamId` (string, optional): Filter by team
- `claimed` (boolean, optional): Filter by claimed status

**Response:** `200 OK`

```json
{
  "players": [
    {
      "id": "player_def456",
      "name": "John Doe",
      "handicap": 12.5,
      "teamId": "team_xyz789",
      "claimedBy": "device_12345",
      "playerCode": "A1B2C3"
    }
  ]
}
```

---

### Update Player

```http
PUT /tours/:tourId/players/:playerId
```

**Request Body:**

```json
{
  "name": "John Smith",
  "handicap": 10.0,
  "teamId": "team_xyz789"
}
```

**Response:** `200 OK`

---

### Claim Player (by Device)

```http
POST /tours/:tourId/players/:playerId/claim
```

**Headers:**

- `X-Device-ID: <device-id>`

**Response:** `200 OK`

```json
{
  "id": "player_def456",
  "claimedBy": "device_12345",
  "playerCode": "A1B2C3"
}
```

---

### Claim Player (by Code)

```http
POST /tours/:tourId/players/claim-by-code
```

**Request Body:**

```json
{
  "playerCode": "A1B2C3"
}
```

**Headers:**

- `X-Device-ID: <device-id>`

**Response:** `200 OK`

```json
{
  "id": "player_def456",
  "name": "John Doe",
  "claimedBy": "device_12345"
}
```

---

### Unclaim Player

```http
DELETE /tours/:tourId/players/:playerId/claim
```

**Response:** `204 No Content`

---

### Remove Player from Tournament

```http
DELETE /tours/:tourId/players/:playerId
```

**Response:** `204 No Content`

---

## Teams

### Create Team

```http
POST /tours/:tourId/teams
```

**Request Body:**

```json
{
  "name": "Team Eagle",
  "color": "#FF5733",
  "captainId": "player_def456",
  "playerIds": ["player_def456", "player_ghi789"]
}
```

**Response:** `201 Created`

```json
{
  "id": "team_xyz789",
  "name": "Team Eagle",
  "color": "#FF5733",
  "captainId": "player_def456",
  "playerIds": ["player_def456", "player_ghi789"]
}
```

---

### Update Team

```http
PUT /tours/:tourId/teams/:teamId
```

**Request Body:**

```json
{
  "name": "Team Birdie",
  "color": "#33A1FF"
}
```

**Response:** `200 OK`

---

### Add Player to Team

```http
POST /tours/:tourId/teams/:teamId/players/:playerId
```

**Response:** `200 OK`

---

### Remove Player from Team

```http
DELETE /tours/:tourId/teams/:teamId/players/:playerId
```

**Response:** `204 No Content`

---

### Set Team Captain

```http
PATCH /tours/:tourId/teams/:teamId/captain
```

**Request Body:**

```json
{
  "captainId": "player_ghi789"
}
```

**Response:** `200 OK`

---

### Reorder Team Players

```http
PATCH /tours/:tourId/teams/:teamId/players/order
```

**Request Body:**

```json
{
  "playerIds": ["player_ghi789", "player_def456", "player_jkl012"]
}
```

**Response:** `200 OK`

---

### Delete Team

```http
DELETE /tours/:tourId/teams/:teamId
```

**Response:** `204 No Content`

---

## Rounds

### Create Round

```http
POST /tours/:tourId/rounds
```

**Request Body:**

```json
{
  "name": "Round 1 - Championship",
  "courseName": "Pebble Beach",
  "format": "stroke-play",
  "holes": 18,
  "holeInfo": [
    {
      "number": 1,
      "par": 4,
      "yardage": 380,
      "handicap": 10,
      "closestToPin": false,
      "longestDrive": true
    }
    // ... holes 2-18
  ],
  "totalPar": 72,
  "teeBoxes": "Championship",
  "slopeRating": "73.5",
  "totalYardage": "7040",
  "playerIds": ["player_def456", "player_ghi789"],
  "settings": {
    "strokesGiven": true,
    "stablefordScoring": false,
    "teamScoring": null,
    "matchPlayFormat": null,
    "skinsValue": null
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "round_mno345",
  "name": "Round 1 - Championship",
  "courseName": "Pebble Beach",
  "format": "stroke-play",
  "holes": 18,
  "holeInfo": [...],
  "totalPar": 72,
  "status": "created",
  "createdAt": "2024-06-15T10:00:00Z",
  "scores": {},
  "competitionWinners": {
    "closestToPin": {},
    "longestDrive": {}
  }
}
```

---

### Get Round by ID

```http
GET /tours/:tourId/rounds/:roundId
```

**Response:** `200 OK`

---

### Update Round

```http
PUT /tours/:tourId/rounds/:roundId
```

**Request Body:** Same as create, all fields optional

**Response:** `200 OK`

---

### Update Round Course Details

```http
PATCH /tours/:tourId/rounds/:roundId/course
```

**Request Body:**

```json
{
  "courseName": "Augusta National",
  "teeBoxes": "Blue",
  "slopeRating": "72.0",
  "totalYardage": "6800"
}
```

**Response:** `200 OK`

---

### Update Round Start Time

```http
PATCH /tours/:tourId/rounds/:roundId/start-time
```

**Request Body:**

```json
{
  "startTime": "2024-06-15T08:00:00Z"
}
```

**Response:** `200 OK`

---

### Start Round

```http
POST /tours/:tourId/rounds/:roundId/start
```

**Response:** `200 OK`

```json
{
  "id": "round_mno345",
  "status": "in-progress",
  "startedAt": "2024-06-15T08:00:00Z"
}
```

---

### Complete Round

```http
POST /tours/:tourId/rounds/:roundId/complete
```

**Response:** `200 OK`

```json
{
  "id": "round_mno345",
  "status": "completed",
  "completedAt": "2024-06-15T12:30:00Z"
}
```

---

### Delete Round

```http
DELETE /tours/:tourId/rounds/:roundId
```

**Response:** `204 No Content`

---

## Scoring

### Update Player Score

```http
POST /tours/:tourId/rounds/:roundId/scores/:playerId
```

**Request Body:**

```json
{
  "scores": [4, 3, 5, 4, null, null, ...], // 18 elements, null for unplayed holes
  "handicapStrokes": 12,
  "stablefordManual": null // Optional Stableford override
}
```

**Response:** `200 OK`

```json
{
  "playerId": "player_def456",
  "scores": [4, 3, 5, 4, null, null, ...],
  "totalScore": 35, // Holes played only
  "totalToPar": -1,
  "handicapStrokes": 12,
  "netScore": 23,
  "netToPar": -13,
  "isTeamScore": false
}
```

---

### Update Team Score (Scramble/Best Ball)

```http
POST /tours/:tourId/rounds/:roundId/team-scores/:teamId
```

**Request Body:**

```json
{
  "scores": [4, 3, 4, 5, 3, ...], // Combined team score per hole
  "teamId": "team_xyz789"
}
```

**Response:** `200 OK`

```json
{
  "playerId": "team_xyz789_score",
  "teamId": "team_xyz789",
  "scores": [4, 3, 4, 5, 3, ...],
  "totalScore": 72,
  "totalToPar": 0,
  "isTeamScore": true
}
```

---

### Record Competition Winner (Closest to Pin / Longest Drive)

```http
POST /tours/:tourId/rounds/:roundId/competition-winners
```

**Request Body:**

```json
{
  "holeNumber": 7,
  "type": "closestToPin" | "longestDrive",
  "winnerId": "player_def456",
  "distance": "8 feet 3 inches",
  "matchId": "match_pqr678" // Optional, for match play
}
```

**Response:** `201 Created`

```json
{
  "holeNumber": 7,
  "type": "closestToPin",
  "winners": [
    {
      "playerId": "player_def456",
      "distance": "8 feet 3 inches",
      "matchId": null
    }
  ]
}
```

---

## Match Play & Ryder Cup

### Create Match Play Round

```http
POST /tours/:tourId/rounds/:roundId/matches
```

**Request Body:**

```json
{
  "format": "singles" | "foursomes" | "four-ball",
  "teamA": {
    "id": "team_xyz789",
    "playerIds": ["player_def456", "player_ghi789"] // 1 for singles, 2 for teams
  },
  "teamB": {
    "id": "team_abc123",
    "playerIds": ["player_jkl012", "player_mno345"]
  }
}
```

**Response:** `201 Created`

```json
{
  "id": "match_pqr678",
  "roundId": "round_mno345",
  "format": "foursomes",
  "teamA": {...},
  "teamB": {...},
  "holes": [], // Empty array initially
  "status": "in-progress",
  "result": "ongoing",
  "points": {
    "teamA": 0,
    "teamB": 0
  }
}
```

---

### Update Match Play Hole Result

```http
PUT /tours/:tourId/rounds/:roundId/matches/:matchId/holes/:holeNumber
```

**Request Body:**

```json
{
  "teamAScore": 4,
  "teamBScore": 5,
  "result": "team-a" | "team-b" | "tie"
}
```

**Response:** `200 OK`

```json
{
  "matchId": "match_pqr678",
  "holeNumber": 1,
  "teamAScore": 4,
  "teamBScore": 5,
  "result": "team-a",
  "currentStanding": {
    "leader": "team-a",
    "holesUp": 1,
    "holesRemaining": 17
  }
}
```

---

### Create Ryder Cup Session

```http
POST /tours/:tourId/rounds/:roundId/ryder-cup-sessions
```

**Request Body:**

```json
{
  "session": "day1-foursomes" | "day1-fourball" | "day2-foursomes" | "day2-fourball" | "day3-singles",
  "matches": [
    {
      "teamA": {
        "id": "team_usa",
        "playerIds": ["player_1", "player_2"]
      },
      "teamB": {
        "id": "team_europe",
        "playerIds": ["player_3", "player_4"]
      },
      "format": "foursomes"
    }
    // ... more matches
  ]
}
```

**Response:** `201 Created`

```json
{
  "sessionId": "session_stu901",
  "session": "day1-foursomes",
  "matches": [...],
  "teamPoints": {
    "teamA": 2.5,
    "teamB": 1.5
  }
}
```

---

### Get Ryder Cup Tournament Status

```http
GET /tours/:tourId/rounds/:roundId/ryder-cup
```

**Response:** `200 OK`

```json
{
  "teamAPoints": 10.5,
  "teamBPoints": 7.5,
  "targetPoints": 14.5,
  "sessions": {
    "day1Foursomes": ["match_1", "match_2", "match_3", "match_4"],
    "day1FourBall": ["match_5", "match_6", "match_7", "match_8"],
    "day2Foursomes": [...],
    "day2FourBall": [...],
    "day3Singles": [...]
  },
  "matches": [...]
}
```

---

## Leaderboards

### Get Tournament Leaderboard

```http
GET /tours/:tourId/leaderboard
```

**Query Parameters:**

- `type` (string): `individual` | `team` | `stableford`
- `sortBy` (string): `gross` | `net` | `stableford`
- `limit` (number, optional): Limit results

**Response:** `200 OK`

```json
{
  "type": "individual",
  "lastUpdated": "2024-06-15T12:30:00Z",
  "entries": [
    {
      "position": 1,
      "player": {
        "id": "player_def456",
        "name": "John Doe",
        "handicap": 12.5
      },
      "totalScore": 216,
      "totalToPar": 0,
      "netScore": 204,
      "netToPar": -12,
      "handicapStrokes": 12,
      "roundsPlayed": 3,
      "positionChange": 2, // Moved up 2 positions
      "currentRoundScore": 72,
      "currentRoundToPar": 0
    }
  ]
}
```

---

### Get Round Leaderboard

```http
GET /tours/:tourId/rounds/:roundId/leaderboard
```

**Query Parameters:**

- `type` (string): `individual` | `team` | `matchplay` | `scramble`
- `live` (boolean): Include in-progress scores

**Response:** `200 OK`

```json
{
  "roundId": "round_mno345",
  "roundName": "Round 1 - Championship",
  "type": "individual",
  "entries": [
    {
      "position": 1,
      "player": {...},
      "totalScore": 68,
      "totalToPar": -4,
      "netScore": 64,
      "netToPar": -8,
      "thru": 18, // Holes completed (for live scoring)
      "currentHole": null
    }
  ]
}
```

---

### Get Team Leaderboard

```http
GET /tours/:tourId/leaderboard/teams
```

**Response:** `200 OK`

```json
{
  "entries": [
    {
      "position": 1,
      "team": {
        "id": "team_xyz789",
        "name": "Team Eagle",
        "color": "#FF5733"
      },
      "totalScore": 432,
      "totalToPar": -12,
      "netScore": 420,
      "netToPar": -24,
      "totalHandicapStrokes": 48,
      "playersWithScores": 4,
      "totalPlayers": 4,
      "ryderCupPoints": 15.5 // For Ryder Cup format
    }
  ]
}
```

---

## Statistics

### Get Player Statistics

```http
GET /tours/:tourId/rounds/:roundId/players/:playerId/stats
```

**Response:** `200 OK`

```json
{
  "playerId": "player_def456",
  "roundId": "round_mno345",
  "birdieCount": 4,
  "parCount": 10,
  "bogeyCount": 3,
  "doubleBogeyOrWorse": 1,
  "eagleOrBetter": 0,
  "bestHole": {
    "holeNumber": 7,
    "score": 2,
    "toPar": -2
  },
  "worstHole": {
    "holeNumber": 15,
    "score": 7,
    "toPar": 3
  },
  "currentStreak": {
    "type": "par",
    "length": 3
  },
  "front9": {
    "score": 34,
    "toPar": -2,
    "holesPlayed": 9
  },
  "back9": {
    "score": 36,
    "toPar": 0,
    "holesPlayed": 9
  }
}
```

---

### Get Tournament Statistics

```http
GET /tours/:tourId/stats
```

**Query Parameters:**

- `type` (string): `overview` | `player-rankings` | `team-rankings`

**Response:** `200 OK`

```json
{
  "totalRounds": 3,
  "totalPlayers": 12,
  "completedRounds": 2,
  "averageScore": 74.5,
  "lowestRound": {
    "playerId": "player_def456",
    "roundId": "round_mno345",
    "score": 66,
    "toPar": -6
  },
  "totalBirdies": 142,
  "totalEagles": 8,
  "mostBirdies": {
    "playerId": "player_def456",
    "count": 18
  }
}
```

---

## Settings

### Get App Settings

```http
GET /settings
```

**Response:** `200 OK`

```json
{
  "theme": "dark",
  "defaultHandicap": 18,
  "preferredScoringDisplay": "both",
  "measurementUnit": "yards",
  "dateFormat": "MM/DD/YYYY",
  "timeFormat": "12h",
  "showTips": true,
  "compactMode": false
}
```

---

### Update App Settings

```http
PUT /settings
```

**Request Body:**

```json
{
  "theme": "light",
  "measurementUnit": "meters"
}
```

**Response:** `200 OK`

---

## Error Responses

All endpoints follow standard HTTP error codes:

### 400 Bad Request

```json
{
  "error": "validation_error",
  "message": "Invalid handicap value",
  "details": {
    "field": "handicap",
    "value": "invalid",
    "expected": "number between -10 and 54"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired authentication token"
}
```

### 403 Forbidden

```json
{
  "error": "forbidden",
  "message": "Player already claimed by another device"
}
```

### 404 Not Found

```json
{
  "error": "not_found",
  "message": "Tournament not found",
  "resourceId": "tour_abc123"
}
```

### 409 Conflict

```json
{
  "error": "conflict",
  "message": "Round already started, cannot modify players"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "requestId": "req_xyz789"
}
```

---

## Data Types Reference

### Tour Formats

- `individual`: Traditional individual stroke play
- `team`: Team-based tournaments (scramble, best ball)
- `ryder-cup`: Ryder Cup format with sessions and match play

### Play Formats

- `stroke-play`: Traditional stroke play
- `match-play`: Head-to-head match play
- `stableford`: Point-based scoring
- `scramble`: Team scramble format
- `best-ball`: Best ball team format
- `alternate-shot`: Alternate shot team format
- `skins`: Skins game format
- `foursomes`: Match play foursomes (2v2)
- `four-ball`: Match play four-ball (2v2)
- `singles`: Match play singles (1v1)

### Round Status

- `created`: Round created but not started
- `in-progress`: Round actively being played
- `completed`: Round finished

### Match Play Results

- `team-a`: Team A wins the hole
- `team-b`: Team B wins the hole
- `tie`: Hole tied (halved)
- `ongoing`: Match still in progress

---

## Rate Limiting

All endpoints are rate limited to:

- **Authenticated requests**: 1000 requests per hour
- **Score updates**: 500 requests per hour (per tournament)
- **Leaderboard queries**: 200 requests per hour

Rate limit headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1623845400
```

---

## Webhooks (Optional)

Configure webhooks to receive real-time updates:

### Events

- `tour.created`
- `tour.updated`
- `tour.deleted`
- `round.started`
- `round.completed`
- `score.updated`
- `match.completed`
- `leaderboard.changed`

### Webhook Payload

```json
{
  "event": "score.updated",
  "timestamp": "2024-06-15T12:30:00Z",
  "data": {
    "tourId": "tour_abc123",
    "roundId": "round_mno345",
    "playerId": "player_def456",
    "score": {...}
  }
}
```

---

## WebSocket API (Real-time Updates)

For live leaderboards and scoring:

```
wss://api.tourmaker.com/v1/ws
```

### Subscribe to Tournament

```json
{
  "action": "subscribe",
  "channel": "tour:tour_abc123"
}
```

### Subscribe to Round

```json
{
  "action": "subscribe",
  "channel": "round:round_mno345"
}
```

### Receive Updates

```json
{
  "channel": "round:round_mno345",
  "event": "score_updated",
  "data": {
    "playerId": "player_def456",
    "holeNumber": 7,
    "score": 4
  }
}
```

---

## Additional Notes

### Handicap System

The system follows USGA handicap rules:

- Handicaps range from -10 to 54
- Strokes are allocated per hole based on hole handicap index
- Net scores calculated: `Gross Score - Allocated Strokes`

### Scoring Calculations

- **Gross Score**: Actual strokes taken
- **Net Score**: Gross score minus handicap strokes
- **Stableford Points**:
  - Eagle or better: 4 points
  - Birdie: 3 points
  - Par: 2 points
  - Bogey: 1 point
  - Double bogey or worse: 0 points

### Match Play Scoring

- Win: 1.0 point
- Tie (halve): 0.5 points each
- Loss: 0.0 points
- Ryder Cup target: 14.5 points to win

---
