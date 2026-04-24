import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="font-display text-2xl font-bold mb-3">{title}</h2>
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="glass rounded-lg p-4 text-xs font-mono-num overflow-x-auto text-foreground/90"><code>{children}</code></pre>
);

const CodeTabs = ({ javascript, python, csharp }: { javascript: string; python?: string; csharp?: string }) => (
  <Tabs defaultValue="javascript" className="w-full">
    <TabsList className="glass">
      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
      {python && <TabsTrigger value="python">Python</TabsTrigger>}
      {csharp && <TabsTrigger value="csharp">C#</TabsTrigger>}
    </TabsList>
    <TabsContent value="javascript">
      <Code>{javascript}</Code>
    </TabsContent>
    {python && (
      <TabsContent value="python">
        <Code>{python}</Code>
      </TabsContent>
    )}
    {csharp && (
      <TabsContent value="csharp">
        <Code>{csharp}</Code>
      </TabsContent>
    )}
  </Tabs>
);

const ApiDocs = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Server Owner API — VoteVault";
  }, []);

  useEffect(() => {
    if (!loading && profile) {
      const roles = profile.roles || [];
      const hasAccess = roles.includes("server_owner") || roles.includes("admin") || roles.includes("mod") || roles.includes("vip");

      if (!hasAccess) {
        navigate("/");
      }
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="container py-10 max-w-4xl">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const base = `${window.location.origin}/api`;

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-8 animate-fade-in">
        <span className="text-xs uppercase tracking-widest text-primary">Server Owner API</span>
        <h1 className="font-display text-4xl font-bold mt-1">API Documentation</h1>
        <p className="text-muted-foreground mt-2">Track votes, manage your server, and integrate with VoteVault programmatically.</p>
      </div>

      <div className="glass rounded-lg p-6 mb-8 border border-primary/20">
        <h3 className="font-semibold text-foreground mb-2">Important: Server Owner API Only</h3>
        <p className="text-sm text-muted-foreground">This API is designed for server owners to manage their servers and track votes. Social features like chat, friends, and notifications are available through the website interface only and are not exposed via public API. Server management (editing details, adding tags, etc.) should be done through the website dashboard.</p>
      </div>

      <Section title="Authentication">
        <p>All endpoints require authentication via JWT token in the <code className="text-primary-glow">Authorization</code> header.</p>
        <Code>{`Authorization: Bearer <your_jwt_token>`}</Code>
        <p>Get your token by logging in through the website, then navigate to Dashboard → API Keys to generate your server API key.</p>
      </Section>

      <Section title="Rate Limits">
        <p>Up to 100 requests per 15 minutes per IP. Responses include <code className="text-primary-glow">x-ratelimit-remaining</code>.</p>
      </Section>

      <Section title="Active Players Tracking">
        <p>Game servers can report their current active player count to display real-time statistics.</p>

        <h3 className="font-semibold text-foreground text-base mt-4">Update Active Players</h3>
        <p>Send the current number of active players on your game server. This should be called periodically (every 1-5 minutes).</p>
        <Code>{`POST ${base}/server-owner/{server_id}/active-players
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json
Body:
{
  "active_players": 245
}`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Response</h3>
        <Code>{`{
  "message": "Active players updated successfully",
  "active_players": 245
}`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Example Implementation</h3>
        <CodeTabs
          javascript={`const API_URL = '${base}';
const TOKEN = 'your_jwt_token';
const SERVER_ID = 123;

// Update active players every 2 minutes
setInterval(async () => {
  const activePlayers = getActivePlayerCount(); // Your game server function

  await fetch(\`\${API_URL}/server-owner/\${SERVER_ID}/active-players\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${TOKEN}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active_players: activePlayers })
  });
}, 120000); // 2 minutes`}
          python={`import requests
import time

API_URL = '${base}'
TOKEN = 'your_jwt_token'
SERVER_ID = 123

def update_active_players():
    active_players = get_active_player_count()  # Your game server function

    requests.post(
        f'{API_URL}/server-owner/{SERVER_ID}/active-players',
        headers={'Authorization': f'Bearer {TOKEN}'},
        json={'active_players': active_players}
    )

# Update every 2 minutes
while True:
    update_active_players()
    time.sleep(120)`}
          csharp={`using System;
using System.Net.Http;
using System.Text;
using System.Threading;
using Newtonsoft.Json;

public class ActivePlayersTracker
{
    private readonly HttpClient _client;
    private const string API_URL = "${base}";
    private const int SERVER_ID = 123;

    public ActivePlayersTracker(string token)
    {
        _client = new HttpClient();
        _client.DefaultRequestHeaders.Add("Authorization", $"Bearer {token}");
    }

    public async Task UpdateActivePlayers(int count)
    {
        var json = JsonConvert.SerializeObject(new { active_players = count });
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        await _client.PostAsync(
            $"{API_URL}/server-owner/{SERVER_ID}/active-players",
            content
        );
    }

    public void StartTracking()
    {
        var timer = new Timer(async _ => {
            int activePlayers = GetActivePlayerCount(); // Your game server function
            await UpdateActivePlayers(activePlayers);
        }, null, 0, 120000); // Update every 2 minutes
    }
}`}
        />
      </Section>

      <Section title="Vote Tracking">
        <p>Track which players voted from specific sources (Discord, website, in-game NPCs, etc.) using custom tracking parameters.</p>

        <h3 className="font-semibold text-foreground text-base mt-4">Generate Vote Link with Tracking</h3>
        <p>Create a custom vote link with a tracking parameter to identify the source.</p>
        <Code>{`GET ${base}/votes/tracking/{server_id}/link?tracking_param=discord_announcement
Headers:
  Authorization: Bearer <token>`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Response</h3>
        <Code>{`{
  "voteUrl": "https://conquer-toplist.com/server/123?vote=true&ref=discord_announcement",
  "tracking_param": "discord_announcement",
  "instructions": "Share this link with your players..."
}`}</Code>

        <h3 className="font-semibold text-foreground text-base mt-6">Get Votes by Tracking Parameter</h3>
        <p>View all votes with a specific tracking parameter to see who voted from each source.</p>
        <Code>{`GET ${base}/votes/tracking/{server_id}/votes?tracking_param=discord_announcement&limit=100
Headers:
  Authorization: Bearer <token>`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Response</h3>
        <Code>{`{
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
}`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Example: Reward Players Who Voted</h3>
        <CodeTabs
          javascript={`async function rewardVoters(serverId, trackingParam) {
  const res = await fetch(
    \`\${API_URL}/votes/tracking/\${serverId}/votes?tracking_param=\${trackingParam}\`,
    { headers: { 'Authorization': \`Bearer \${TOKEN}\` } }
  );
  const { votes } = await res.json();

  // Reward each player in-game
  votes.forEach(vote => {
    rewardPlayerInGame(vote.username, 'VoteReward');
    console.log(\`Rewarded \${vote.username} for voting from \${trackingParam}\`);
  });
}

// Check for new votes every 5 minutes
setInterval(() => rewardVoters(123, 'ingame_npc'), 300000);`}
          python={`def reward_voters(server_id, tracking_param):
    r = requests.get(
        f'{API_URL}/votes/tracking/{server_id}/votes',
        params={'tracking_param': tracking_param},
        headers={'Authorization': f'Bearer {TOKEN}'}
    )
    votes = r.json()['votes']

    for vote in votes:
        reward_player_in_game(vote['username'], 'VoteReward')
        print(f"Rewarded {vote['username']} for voting from {tracking_param}")

# Check for new votes every 5 minutes
import schedule
schedule.every(5).minutes.do(lambda: reward_voters(123, 'ingame_npc'))

while True:
    schedule.run_pending()
    time.sleep(1)`}
          csharp={`public async Task RewardVoters(int serverId, string trackingParam)
{
    var response = await _client.GetAsync(
        $"{API_URL}/votes/tracking/{serverId}/votes?tracking_param={trackingParam}"
    );
    var json = await response.Content.ReadAsStringAsync();
    var data = JsonConvert.DeserializeObject<VoteData>(json);

    foreach (var vote in data.Votes)
    {
        RewardPlayerInGame(vote.Username, "VoteReward");
        Console.WriteLine($"Rewarded {vote.Username} for voting from {trackingParam}");
    }
}

// Check for new votes every 5 minutes
var timer = new Timer(async _ => {
    await RewardVoters(123, "ingame_npc");
}, null, 0, 300000);`}
        />
      </Section>

      <Section title="Server Analytics">
        <h3 className="font-semibold text-foreground text-base">Get Vote Analytics</h3>
        <p>Retrieve detailed vote analytics for your server(s).</p>
        <Code>{`GET ${base}/votes/analytics?server_id=123&from=2026-04-01&to=2026-04-30&tracking_param=discord
Headers:
  Authorization: Bearer <token>`}</Code>

        <h3 className="font-semibold text-foreground text-base mt-4">Get Server Analytics</h3>
        <p>View detailed analytics including views, clicks, and votes over time.</p>
        <Code>{`GET ${base}/server-owner/{server_id}/analytics?days=30
Headers:
  Authorization: Bearer <token>`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Response</h3>
        <Code>{`{
  "analytics": [
    { "date": "2026-04-23", "views": 45, "clicks": 12, "votes": 5 },
    { "date": "2026-04-22", "views": 38, "clicks": 10, "votes": 4 }
  ],
  "totals": {
    "total_views": 1250,
    "total_clicks": 340,
    "total_votes": 105
  }
}`}</Code>
      </Section>


      <Section title="Website-Only Features">
        <p>The following features are available through the website interface only:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Server Management</strong> - Edit server details, add tags, upload banners, manage updates</li>
          <li><strong>Friends System</strong> - Send friend requests, manage friends list</li>
          <li><strong>Chat/Messaging</strong> - Real-time chat with friends via WebSocket</li>
          <li><strong>Notifications</strong> - In-app and email notifications</li>
          <li><strong>User Blocking & Reporting</strong> - Block users, report content</li>
          <li><strong>Server Reviews</strong> - Write and read server reviews</li>
          <li><strong>User Profiles</strong> - View and edit user profiles, social media links, achievements</li>
        </ul>
        <p className="mt-3">These features require interactive website sessions and are not suitable for programmatic API access.</p>
      </Section>

      <Section title="Error Responses">
        <p>All endpoints return standard HTTP status codes and JSON error messages.</p>
        <Code>{`{
  "error": "Error message here",
  "status": 400
}`}</Code>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="text-primary-glow">400</code> - Bad Request (invalid parameters)</li>
          <li><code className="text-primary-glow">401</code> - Unauthorized (missing/invalid token)</li>
          <li><code className="text-primary-glow">403</code> - Forbidden (insufficient permissions)</li>
          <li><code className="text-primary-glow">404</code> - Not Found</li>
          <li><code className="text-primary-glow">429</code> - Too Many Requests (rate limited)</li>
          <li><code className="text-primary-glow">500</code> - Internal Server Error</li>
        </ul>
      </Section>

      <Section title="Additional Resources">
        <ul className="list-disc pl-5 space-y-1">
          <li><a href="/vote-tracking-guide" className="text-primary-glow hover:underline">Vote Tracking Guide</a> - Comprehensive guide with more examples</li>
          <li><a href="/dashboard" className="text-primary-glow hover:underline">Server Dashboard</a> - Manage your servers through the web interface</li>
          <li><a href="/dashboard/api-keys" className="text-primary-glow hover:underline">API Keys</a> - Generate and manage your API keys</li>
        </ul>
      </Section>
    </div>
  );
};

export default ApiDocs;
