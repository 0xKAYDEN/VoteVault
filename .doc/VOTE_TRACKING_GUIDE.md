# Vote Tracking Feature - Server Owner Guide

## Overview
Server owners can now track which players voted from specific sources using custom tracking parameters. This helps you understand which marketing channels are most effective and reward players accordingly.

---

## How It Works

### 1. Generate a Vote Link with Tracking Parameter

**Endpoint:** `GET /api/votes/tracking/{server_id}/link?tracking_param=<your_param>`

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/votes/tracking/123/link?tracking_param=discord_announcement"
```

**Response:**
```json
{
  "voteUrl": "http://localhost:5173/server/123?vote=true&ref=discord_announcement",
  "tracking_param": "discord_announcement",
  "instructions": "Share this link with your players. When they vote, you can track them using the tracking parameter."
}
```

### 2. Share the Link

Share the generated `voteUrl` with your players through different channels:
- Discord announcements: `?ref=discord_announcement`
- In-game NPCs: `?ref=ingame_npc`
- Website banner: `?ref=website_banner`
- Forum posts: `?ref=forum_post`
- YouTube videos: `?ref=youtube_video`

### 3. Track Votes by Parameter

**Endpoint:** `GET /api/votes/tracking/{server_id}/votes?tracking_param=<param>&limit=100`

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/votes/tracking/123/votes?tracking_param=discord_announcement"
```

**Response:**
```json
{
  "votes": [
    {
      "public_id": "8b1e...",
      "voted_at": "2026-04-24T03:12:01Z",
      "tracking_param": "discord_announcement",
      "username": "player123",
      "display_name": "Player 123",
      "challenge_type_passed": "math",
      "referrer": "https://discord.com/..."
    }
  ],
  "summary": [
    { "tracking_param": "discord_announcement", "count": 45 },
    { "tracking_param": "website_banner", "count": 32 },
    { "tracking_param": "ingame_npc", "count": 28 }
  ],
  "total": 105
}
```

---

## Use Cases

### 1. **Track Marketing Effectiveness**
Compare which channels drive the most votes:
- Discord announcements vs. forum posts
- In-game NPCs vs. website banners
- YouTube videos vs. Twitch streams

### 2. **Reward Specific Players**
Identify and reward players who voted from specific sources:
```javascript
// Get all votes from in-game NPC
const response = await fetch('/api/votes/tracking/123/votes?tracking_param=ingame_npc');
const { votes } = await response.json();

// Reward these players in-game
votes.forEach(vote => {
  rewardPlayer(vote.username, 'vote_reward');
});
```

### 3. **A/B Testing**
Test different messaging:
- `?ref=discord_v1` - "Vote for rewards!"
- `?ref=discord_v2` - "Help us reach #1!"

### 4. **Community Engagement**
Track which community members are most active:
```javascript
// Get summary of all tracking params
const response = await fetch('/api/votes/tracking/123/votes');
const { summary } = await response.json();

console.log('Top sources:');
summary.forEach(s => {
  console.log(`${s.tracking_param}: ${s.count} votes`);
});
```

---

## Integration Examples

### JavaScript/Node.js
```javascript
const API_URL = 'http://localhost:5000/api';
const TOKEN = 'your_jwt_token';

// Generate vote link
async function generateVoteLink(serverId, trackingParam) {
  const res = await fetch(
    `${API_URL}/votes/tracking/${serverId}/link?tracking_param=${trackingParam}`,
    { headers: { 'Authorization': `Bearer ${TOKEN}` } }
  );
  const data = await res.json();
  return data.voteUrl;
}

// Get tracked votes
async function getTrackedVotes(serverId, trackingParam) {
  const res = await fetch(
    `${API_URL}/votes/tracking/${serverId}/votes?tracking_param=${trackingParam}`,
    { headers: { 'Authorization': `Bearer ${TOKEN}` } }
  );
  return await res.json();
}

// Usage
const discordLink = await generateVoteLink(123, 'discord_announcement');
console.log('Share this link:', discordLink);

const votes = await getTrackedVotes(123, 'discord_announcement');
console.log(`${votes.total} players voted from Discord`);
```

### Python
```python
import requests

API_URL = 'http://localhost:5000/api'
TOKEN = 'your_jwt_token'
headers = {'Authorization': f'Bearer {TOKEN}'}

# Generate vote link
def generate_vote_link(server_id, tracking_param):
    r = requests.get(
        f'{API_URL}/votes/tracking/{server_id}/link',
        params={'tracking_param': tracking_param},
        headers=headers
    )
    return r.json()['voteUrl']

# Get tracked votes
def get_tracked_votes(server_id, tracking_param):
    r = requests.get(
        f'{API_URL}/votes/tracking/{server_id}/votes',
        params={'tracking_param': tracking_param},
        headers=headers
    )
    return r.json()

# Usage
discord_link = generate_vote_link(123, 'discord_announcement')
print(f'Share this link: {discord_link}')

votes = get_tracked_votes(123, 'discord_announcement')
print(f"{votes['total']} players voted from Discord")
for vote in votes['votes']:
    print(f"  - {vote['username']} at {vote['voted_at']}")
```

### C# (for Conquer Online servers)
```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;
using Newtonsoft.Json;

public class VoteTracker
{
    private readonly HttpClient _client;
    private readonly string _token;
    private const string API_URL = "http://localhost:5000/api";

    public VoteTracker(string token)
    {
        _token = token;
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
    }

    public async Task<string> GenerateVoteLink(int serverId, string trackingParam)
    {
        var response = await _client.GetAsync(
            $"{API_URL}/votes/tracking/{serverId}/link?tracking_param={trackingParam}"
        );
        var json = await response.Content.ReadAsStringAsync();
        var data = JsonConvert.DeserializeObject<dynamic>(json);
        return data.voteUrl;
    }

    public async Task<VoteData> GetTrackedVotes(int serverId, string trackingParam)
    {
        var response = await _client.GetAsync(
            $"{API_URL}/votes/tracking/{serverId}/votes?tracking_param={trackingParam}"
        );
        var json = await response.Content.ReadAsStringAsync();
        return JsonConvert.DeserializeObject<VoteData>(json);
    }
}

// Usage in your game server
var tracker = new VoteTracker("your_jwt_token");
var link = await tracker.GenerateVoteLink(123, "ingame_npc");
Console.WriteLine($"Vote link: {link}");

var votes = await tracker.GetTrackedVotes(123, "ingame_npc");
foreach (var vote in votes.Votes)
{
    // Reward player in-game
    RewardPlayer(vote.Username, "VoteReward");
}
```

---

## Best Practices

1. **Use Descriptive Parameters**
   - Good: `discord_announcement_2024_04`, `ingame_npc_twin_city`
   - Bad: `a`, `test`, `123`

2. **Track Multiple Sources**
   - Create different links for each marketing channel
   - Compare effectiveness over time

3. **Automate Rewards**
   - Poll the API every few minutes
   - Automatically reward players who voted

4. **Monitor Trends**
   - Check the summary to see which sources are most effective
   - Adjust your marketing strategy accordingly

5. **Keep Parameters Consistent**
   - Use the same naming convention
   - Document your tracking parameters

---

## Database Schema

The vote tracking adds these columns to the `votes` table:
- `tracking_param` (VARCHAR 255) - The custom tracking parameter
- `referrer` (VARCHAR 500) - The HTTP referrer header

---

## API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/votes/tracking/{server_id}/link` | GET | Required | Generate vote link with tracking |
| `/api/votes/tracking/{server_id}/votes` | GET | Required | Get votes by tracking parameter |
| `/api/votes/analytics` | GET | Required | Get all vote analytics (includes tracking_param filter) |

---

## Migration Applied

Migration file: `010_add_vote_tracking.sql`
- Added `tracking_param` column to votes table
- Added `referrer` column to votes table
- Added index on `tracking_param` for fast queries

---

## Next Steps

1. Generate vote links for your different marketing channels
2. Share the links with your players
3. Monitor which sources drive the most votes
4. Reward players who vote from specific sources
5. Optimize your marketing strategy based on the data

For more information, see the updated API documentation at `/api-docs`.
