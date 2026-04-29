import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth.context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BASE = "http://localhost:5000/api/v1";

const Method = ({ m }: { m: string }) => {
  const colors: Record<string, string> = { GET: "bg-blue-500/20 text-blue-400", POST: "bg-green-500/20 text-green-400", PUT: "bg-yellow-500/20 text-yellow-400", DELETE: "bg-red-500/20 text-red-400" };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${colors[m] || "bg-white/10 text-muted-foreground"}`}>{m}</span>;
};

const CopyCode = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="glass rounded-lg p-4 text-xs font-mono overflow-x-auto text-foreground/90 pr-10">{code}</pre>
      <button
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); toast.success("Copied!"); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded glass hover:bg-white/10"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
    </div>
  );
};

const Endpoint = ({ method, path, desc, children }: { method: string; path: string; desc: string; children?: React.ReactNode }) => (
  <div className="glass rounded-xl p-5 space-y-3">
    <div className="flex items-start gap-3 flex-wrap">
      <Method m={method} />
      <code className="text-sm font-mono text-primary-glow flex-1">{path}</code>
    </div>
    <p className="text-sm text-muted-foreground">{desc}</p>
    {children}
  </div>
);

const PLAN_LIMITS = [
  { plan: "Free",       daily: "500",       perMin: "10",    color: "text-muted-foreground" },
  { plan: "Starter",    daily: "5,000",     perMin: "60",    color: "text-blue-400" },
  { plan: "Pro",        daily: "50,000",    perMin: "300",   color: "text-purple-400" },
  { plan: "Enterprise", daily: "Unlimited", perMin: "1,000", color: "text-amber-400" },
];

const ApiDocs = () => {
  const { profile } = useAuth();
  useEffect(() => { document.title = "API Docs — VoteVault"; }, []);

  return (
    <div className="container py-10 max-w-5xl">
      <div className="mb-10">
        <span className="text-xs uppercase tracking-widest text-primary">Public API</span>
        <h1 className="font-display text-4xl font-bold mt-1 mb-2">API Documentation</h1>
        <p className="text-muted-foreground">Integrate VoteVault into your game server. Track votes, check player vote status, and pull server stats.</p>
        {!profile && (
          <div className="mt-4 glass rounded-xl p-4 border border-yellow-500/20 flex items-center gap-3">
            <span className="text-yellow-400 text-sm">Sign in and go to <Link to="/dashboard/api-keys" className="underline">Dashboard → API Keys</Link> to generate your key.</span>
          </div>
        )}
      </div>

      {/* Authentication */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Authentication</h2>
        <div className="glass rounded-xl p-5 space-y-4">
          <p className="text-sm text-muted-foreground">All API requests require an API key in the <code className="text-primary-glow">Authorization</code> header.</p>
          <CopyCode code={`Authorization: Bearer vv_your_api_key_here`} />
          <p className="text-sm text-muted-foreground">Generate your key at <Link to="/dashboard/api-keys" className="text-primary hover:underline">Dashboard → API Keys</Link>. Keys start with <code className="text-primary-glow">vv_</code>.</p>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Rate Limits</h2>
        <div className="glass rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="bg-white/5 border-b border-white/10">
              <th className="p-3 text-left font-medium">Plan</th>
              <th className="p-3 text-left font-medium">Daily Limit</th>
              <th className="p-3 text-left font-medium">Per Minute</th>
              <th className="p-3 text-left font-medium">Price</th>
            </tr></thead>
            <tbody className="divide-y divide-white/5">
              {PLAN_LIMITS.map(r => (
                <tr key={r.plan} className="hover:bg-white/5">
                  <td className={`p-3 font-semibold ${r.color}`}>{r.plan}</td>
                  <td className="p-3 font-mono">{r.daily}</td>
                  <td className="p-3 font-mono">{r.perMin}</td>
                  <td className="p-3 text-muted-foreground">{r.plan === "Free" ? "$0" : r.plan === "Starter" ? "$4.99/mo" : r.plan === "Pro" ? "$14.99/mo" : "$39.99/mo"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Rate limit headers: <code className="text-primary-glow">X-RateLimit-Daily-Remaining</code>, <code className="text-primary-glow">X-RateLimit-Minute-Remaining</code></p>
      </section>

      {/* Base URL */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Base URL</h2>
        <CopyCode code={BASE} />
      </section>

      {/* Endpoints */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Endpoints</h2>
        <div className="space-y-4">

          <Endpoint method="GET" path="/me" desc="Get info about the API key owner and current plan limits.">
            <CopyCode code={`curl -H "Authorization: Bearer vv_your_key" ${BASE}/me`} />
            <CopyCode code={`{
  "data": { "id": "...", "username": "Shadow", "display_name": "Shadow" },
  "apiKey": { "plan": "pro", "limits": { "daily": 50000, "perMinute": 300 } }
}`} />
          </Endpoint>

          <Endpoint method="GET" path="/servers" desc="List all approved servers, ordered by vote count. Supports pagination and filtering.">
            <CopyCode code={`GET ${BASE}/servers?page=1&limit=20&region=EU&version=5165`} />
            <CopyCode code={`{
  "data": [{ "id": 1, "name": "My Server", "slug": "my-server-abc123",
             "vote_count": 1250, "is_online": true, "region": "EU" }],
  "total": 42, "page": 1, "pageSize": 20
}`} />
          </Endpoint>

          <Endpoint method="GET" path="/servers/:slug" desc="Get full details for a single server by its slug.">
            <CopyCode code={`GET ${BASE}/servers/my-server-abc123`} />
          </Endpoint>

          <Endpoint method="POST" path="/servers/:slug/vote-link" desc="Generate a vote URL with your own custom ref token. Your game server calls this, gets back a URL, then redirects the player to it. After the player votes, call vote-check?ref=<token> to confirm.">
            <CopyCode code={`POST ${BASE}/servers/my-server-abc123/vote-link
Authorization: Bearer vv_your_key
Content-Type: application/json

{ "ref": "player_shadow_session_abc123" }`} />
            <CopyCode code={`{
  "voteUrl": "http://localhost:8080/server/my-server-abc123?vote=1&ref=player_shadow_session_abc123",
  "ref": "player_shadow_session_abc123",
  "slug": "my-server-abc123",
  "serverName": "My Server",
  "hint": "Redirect your player to voteUrl. After they vote, call vote-check?ref=<your_ref> to confirm."
}`} />
          </Endpoint>

          <Endpoint method="GET" path="/servers/:slug/vote-check" desc="Check if a player voted. Two modes: by VoteVault username, or by the custom ref token you embedded in the vote URL.">
            <CopyCode code={`// Mode 1 — by username (if you know their VoteVault username)
GET ${BASE}/servers/my-server-abc123/vote-check?username=Shadow

// Mode 2 — by ref token (recommended for game servers)
GET ${BASE}/servers/my-server-abc123/vote-check?ref=player_shadow_session_abc123`} />
            <CopyCode code={`// Voted (ref mode — also returns the VoteVault username):
{ "hasVoted": true, "cooldownLeft": 28800000,
  "cooldownEndsAt": "2026-04-29T10:00:00Z",
  "trackingParam": "player_shadow_session_abc123",
  "ref": "player_shadow_session_abc123",
  "username": "Shadow" }

// Not voted yet:
{ "hasVoted": false, "cooldownLeft": null, "ref": "player_shadow_session_abc123", "username": null }`} />
          </Endpoint>

          <Endpoint method="GET" path="/servers/:slug/votes" desc="Get recent votes for your server (owner's key only). Filter by tracking param to see votes from a specific source.">
            <CopyCode code={`// All recent votes
GET ${BASE}/servers/my-server-abc123/votes?limit=50

// Only votes from Discord link
GET ${BASE}/servers/my-server-abc123/votes?tracking_param=discord&limit=50

// Votes since a date
GET ${BASE}/servers/my-server-abc123/votes?from=2026-04-01T00:00:00Z`} />
            <CopyCode code={`{
  "data": [
    { "public_id": "...", "voted_at": "2026-04-28T12:00:00Z",
      "voter_username": "Shadow", "voter_country": "Egypt",
      "tracking_param": "discord", "is_suspicious": false }
  ],
  "total": 50,
  "summary": [
    { "tracking_param": "discord",    "count": 120 },
    { "tracking_param": "ingame_npc", "count": 85 },
    { "tracking_param": "website",    "count": 40 }
  ]
}`} />
          </Endpoint>

          <Endpoint method="POST" path="/servers/:slug/active-players" desc="Update your server's active player count. Call every 1–5 minutes from your game server. Owner's key only.">
            <CopyCode code={`POST ${BASE}/servers/my-server-abc123/active-players
Authorization: Bearer vv_your_key
Content-Type: application/json

{ "active_players": 245 }`} />
            <CopyCode code={`{ "message": "Active players updated", "active_players": 245, "slug": "my-server-abc123" }`} />
          </Endpoint>

        </div>
      </section>

      {/* Dynamic Vote Links */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Dynamic Vote Links — Game Server Flow</h2>
        <div className="glass rounded-xl p-5 space-y-5">
          <p className="text-sm text-muted-foreground">
            This is the recommended integration for game servers. Your server generates a unique token per player, embeds it in the vote URL, and later uses it to confirm the vote and grant the reward — <strong className="text-foreground">without needing to know the player's VoteVault username</strong>.
          </p>

          {/* Flow diagram */}
          <div className="grid md:grid-cols-4 gap-2 text-center text-xs">
            {[
              { step: "1", title: "Player logs in", desc: "Player connects to your game server" },
              { step: "2", title: "Generate link", desc: "Your server calls POST /vote-link with a unique ref token" },
              { step: "3", title: "Player votes", desc: "Redirect player to the returned voteUrl" },
              { step: "4", title: "Confirm & reward", desc: "Call vote-check?ref=<token> — if hasVoted, grant reward" },
            ].map(s => (
              <div key={s.step} className="glass-strong rounded-xl p-3 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-primary/20 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-2">{s.step}</div>
                <div className="font-semibold text-foreground mb-1">{s.title}</div>
                <div className="text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">What to use as the ref token?</p>
            <p className="text-xs text-muted-foreground">Any unique string that identifies the player in your game — their character name, account ID, session token, or a combination. Max 255 characters.</p>
            <CopyCode code={`// Examples of good ref tokens:
"shadow"                          // character name (simple)
"shadow_1714300000"               // character name + timestamp (unique per session)
"acc_12345_sess_abc"              // account ID + session ID
"sha256_of_account_id"            // hashed account ID`} />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Important: ref tokens are single-use per 12h cooldown</p>
            <p className="text-xs text-muted-foreground">
              Once a player votes with a ref token, <code className="text-primary-glow">vote-check?ref=&lt;token&gt;</code> will return <code className="text-primary-glow">hasVoted: true</code> for the next 12 hours.
              After the cooldown expires, the same token can be used again for the next vote cycle.
              Use a new token each session if you want to distinguish separate vote events.
            </p>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section className="mb-10">
        <h2 className="font-display text-2xl font-bold mb-4">Code Examples</h2>
        <Tabs defaultValue="js">
          <TabsList className="glass mb-4">
            <TabsTrigger value="js">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="csharp">C#</TabsTrigger>
          </TabsList>

          <TabsContent value="js">
            <CopyCode code={`const API_KEY = 'vv_your_key_here';
const BASE = '${BASE}';
const SLUG  = 'my-server-abc123';

// ── Step 2: Generate a vote link for a player ─────────────────────────────
async function getVoteLink(playerToken) {
  const res = await fetch(\`\${BASE}/servers/\${SLUG}/vote-link\`, {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ref: playerToken }),
  });
  const { voteUrl } = await res.json();
  return voteUrl; // redirect the player here
}

// ── Step 4: Check if the player voted and grant reward ────────────────────
async function checkAndReward(playerToken) {
  const res = await fetch(
    \`\${BASE}/servers/\${SLUG}/vote-check?ref=\${encodeURIComponent(playerToken)}\`,
    { headers: { 'Authorization': \`Bearer \${API_KEY}\` } }
  );
  const data = await res.json();

  if (data.hasVoted) {
    grantVoteReward(data.username ?? playerToken); // data.username = VoteVault name
    return true;
  }
  return false; // player hasn't voted yet
}

// ── Usage ─────────────────────────────────────────────────────────────────
// When player types /vote in game:
const token   = \`\${player.name}_\${Date.now()}\`; // unique per session
const voteUrl = await getVoteLink(token);
sendToPlayer(player, \`Vote here: \${voteUrl}\`);

// When player types /claim in game:
const rewarded = await checkAndReward(token);
if (!rewarded) sendToPlayer(player, 'You have not voted yet!');

// Update active players every 5 minutes
async function updateActivePlayers(count) {
  await fetch(\`\${BASE}/servers/\${SLUG}/active-players\`, {
    method: 'POST',
    headers: { 'Authorization': \`Bearer \${API_KEY}\`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ active_players: count }),
  });
}`} />
          </TabsContent>

          <TabsContent value="python">
            <CopyCode code={`import requests, time

API_KEY = 'vv_your_key_here'
BASE    = '${BASE}'
SLUG    = 'my-server-abc123'
HEADERS = {'Authorization': f'Bearer {API_KEY}'}

def get_vote_link(player_token: str) -> str:
    """Step 2: Generate a vote URL for a player."""
    r = requests.post(f'{BASE}/servers/{SLUG}/vote-link',
                      json={'ref': player_token},
                      headers={**HEADERS, 'Content-Type': 'application/json'})
    return r.json()['voteUrl']

def check_and_reward(player_token: str) -> bool:
    """Step 4: Check if the player voted and grant reward."""
    r = requests.get(f'{BASE}/servers/{SLUG}/vote-check',
                     params={'ref': player_token}, headers=HEADERS)
    data = r.json()
    if data.get('hasVoted'):
        grant_vote_reward(data.get('username') or player_token)
        return True
    return False

# Usage
token    = f"{player.name}_{int(time.time())}"
vote_url = get_vote_link(token)
send_to_player(player, f"Vote here: {vote_url}")

# When player claims reward:
if not check_and_reward(token):
    send_to_player(player, "You haven't voted yet!")`} />
          </TabsContent>

          <TabsContent value="csharp">
            <CopyCode code={`using System.Net.Http;
using System.Net.Http.Json;

public class VoteVaultClient(string apiKey, string slug)
{
    private readonly HttpClient _http = new() {
        DefaultRequestHeaders = { { "Authorization", $"Bearer {apiKey}" } }
    };
    private const string Base = "${BASE}";

    // Step 2: Generate a vote link for a player
    public async Task<string> GetVoteLinkAsync(string playerToken)
    {
        var res  = await _http.PostAsJsonAsync($"{Base}/servers/{slug}/vote-link",
                       new { @ref = playerToken });
        var data = await res.Content.ReadFromJsonAsync<VoteLinkResult>();
        return data!.VoteUrl;
    }

    // Step 4: Check if the player voted
    public async Task<VoteCheckResult?> CheckVoteAsync(string playerToken) =>
        await _http.GetFromJsonAsync<VoteCheckResult>(
            $"{Base}/servers/{slug}/vote-check?ref={Uri.EscapeDataString(playerToken)}");

    // Update active players
    public async Task UpdateActivePlayersAsync(int count) =>
        await _http.PostAsJsonAsync($"{Base}/servers/{slug}/active-players",
            new { active_players = count });
}

// Usage
var client = new VoteVaultClient("vv_your_key_here", "my-server-abc123");

// When player types /vote:
var token   = $"{player.Name}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}";
var voteUrl = await client.GetVoteLinkAsync(token);
SendToPlayer(player, $"Vote here: {voteUrl}");

// When player types /claim:
var result = await client.CheckVoteAsync(token);
if (result?.HasVoted == true)
    GrantVoteReward(result.Username ?? player.Name);
else
    SendToPlayer(player, "You haven't voted yet!");

public record VoteLinkResult(string VoteUrl, string Ref, string ServerName);
public record VoteCheckResult(bool HasVoted, long? CooldownLeft,
    string? CooldownEndsAt, string? TrackingParam, string? Username);`} />
          </TabsContent>
        </Tabs>
      </section>

      <div className="glass rounded-xl p-5 border border-primary/20 text-center">
        <p className="text-sm text-muted-foreground mb-3">Ready to integrate? Generate your API key in the dashboard.</p>
        <Link to="/dashboard/api-keys">
          <Button variant="hero">Go to API Keys</Button>
        </Link>
      </div>
    </div>
  );
};

export default ApiDocs;
