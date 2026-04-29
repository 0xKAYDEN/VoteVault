using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Threading.Tasks;
using System.Collections.Generic;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System.Diagnostics;

namespace VoteTrackerApp
{
    class Program
    {
        private static readonly string PUBLIC_API = "http://localhost:5000/api/v1";

        static async Task Main(string[] args)
        {
            Console.WriteLine("╔══════════════════════════════════════╗");
            Console.WriteLine("║     VoteVault API Tester (C#)        ║");
            Console.WriteLine("╚══════════════════════════════════════╝");
            Console.WriteLine();

            Console.Write("Enter your API Key (vv_...): ");
            string apiKey = Console.ReadLine()?.Trim() ?? "";
            if (string.IsNullOrEmpty(apiKey)) { Console.WriteLine("API key required."); return; }

            Console.Write("Enter server slug (e.g. my-server): ");
            string slug = Console.ReadLine()?.Trim() ?? "";

            var client = new ApiClient(apiKey, PUBLIC_API);

            while (true)
            {
                Console.WriteLine();
                Console.WriteLine("─────────────────────────────────────");
                Console.WriteLine("  1. Get my info & plan limits");
                Console.WriteLine("  2. List servers");
                Console.WriteLine("  3. Get server details");
                Console.WriteLine("  4. Check vote by username");
                Console.WriteLine("  5. Check vote by ref token");
                Console.WriteLine("  6. Generate vote link with custom ref");
                Console.WriteLine("  7. Get recent votes (owner only)");
                Console.WriteLine("  8. Get votes by tracking param (owner only)");
                Console.WriteLine("  9. Update active players (owner only)");
                Console.WriteLine("  s. Change server slug");
                Console.WriteLine("  0. Exit");
                Console.WriteLine("─────────────────────────────────────");
                Console.Write("Choice: ");
                string choice = Console.ReadLine()?.Trim() ?? "";

                try
                {
                    switch (choice)
                    {
                        case "1": await client.GetMe(); break;
                        case "2": await client.ListServers(); break;
                        case "3":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            await client.GetServer(slug);
                            break;
                        case "4":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            Console.Write("Enter username: ");
                            string username = Console.ReadLine()?.Trim() ?? "";
                            await client.CheckVoteByUsername(slug, username);
                            break;
                        case "5":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            Console.Write("Enter ref token: ");
                            string refToken = Console.ReadLine()?.Trim() ?? "";
                            await client.CheckVoteByRef(slug, refToken);
                            break;
                        case "6":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            Console.Write("Enter custom ref (e.g. player_shadow_session_abc): ");
                            string customRef = Console.ReadLine()?.Trim() ?? "";
                            await client.GenerateVoteLink(slug, customRef);
                            break;
                        case "7":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            await client.GetRecentVotes(slug, null);
                            break;
                        case "8":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            Console.Write("Enter tracking param (e.g. discord, ingame_npc): ");
                            string tp = Console.ReadLine()?.Trim() ?? "";
                            await client.GetRecentVotes(slug, string.IsNullOrEmpty(tp) ? null : tp);
                            break;
                        case "9":
                            if (string.IsNullOrEmpty(slug)) { Console.Write("Enter slug: "); slug = Console.ReadLine()?.Trim() ?? ""; }
                            await client.UpdateActivePlayers(slug);
                            break;
                        case "s":
                            Console.Write("Enter new slug: ");
                            slug = Console.ReadLine()?.Trim() ?? "";
                            Console.WriteLine($"Slug set to: {slug}");
                            break;
                        case "0": Console.WriteLine("Goodbye!"); return;
                        default: Console.WriteLine("Invalid choice."); break;
                    }
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"Error: {ex.Message}");
                    Console.ResetColor();
                }
            }
        }
    }

    class ApiClient
    {
        private readonly HttpClient _http;
        private readonly string _publicBase;

        public ApiClient(string apiKey, string publicBase)
        {
            _publicBase = publicBase;
            _http = new HttpClient();
            _http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        }

        // ── GET /api/v1/me ────────────────────────────────────────────────────
        public async Task GetMe()
        {
            var (json, headers) = await GetWithHeaders($"{_publicBase}/me");
            var data = json["data"];
            var apiKey = json["apiKey"];

            Console.WriteLine();
            Console.WriteLine("┌─ Account Info ─────────────────────────────");
            Console.WriteLine($"│ Username    : {data?["username"]}");
            Console.WriteLine($"│ Display Name: {data?["display_name"]}");
            Console.WriteLine($"│ Roles       : {data?["roles"]}");
            Console.WriteLine("├─ API Plan ──────────────────────────────────");
            Console.WriteLine($"│ Plan        : {apiKey?["plan"]}");
            var limits = apiKey?["limits"];
            if (limits != null)
            {
                Console.WriteLine($"│ Daily Limit : {limits["daily"]}");
                Console.WriteLine($"│ Per-Minute  : {limits["perMinute"]}");
            }
            Console.WriteLine("└─────────────────────────────────────────────");
            PrintRateLimitHeaders(headers);
        }

        // ── GET /api/v1/servers ───────────────────────────────────────────────
        public async Task ListServers()
        {
            Console.Write("Search (leave blank for all): ");
            string search = Console.ReadLine()?.Trim() ?? "";
            string url = $"{_publicBase}/servers?limit=10";
            if (!string.IsNullOrEmpty(search)) url += $"&search={Uri.EscapeDataString(search)}";

            var (json, headers) = await GetWithHeaders(url);
            var servers = json["data"] as JArray;
            int total = json["total"]?.Value<int>() ?? 0;

            Console.WriteLine();
            Console.WriteLine($"┌─ Servers ({total} total) ─────────────────────────────────────────────────────────");
            Console.WriteLine($"│ {"Name",-25} {"Slug",-20} {"Votes",6} {"Rating",7} {"Online",7}");
            Console.WriteLine($"│ {"────────────────────────",25} {"──────────────────",20} {"─────",6} {"──────",7} {"──────",7}");
            if (servers != null)
            {
                foreach (var s in servers)
                {
                    string name = s["name"]?.ToString() ?? "";
                    if (name.Length > 24) name = name[..24];
                    Console.WriteLine($"│ {name,-25} {s["slug"],-20} {s["vote_count"],6} {s["rating_avg"],7:F1} {(s["is_online"]?.Value<bool>() == true ? "✓" : "✗"),7}");
                }
            }
            Console.WriteLine("└──────────────────────────────────────────────────────────────────────────────────");
            PrintRateLimitHeaders(headers);
        }

        // ── GET /api/v1/servers/:slug ─────────────────────────────────────────
        public async Task GetServer(string slug)
        {
            var (json, headers) = await GetWithHeaders($"{_publicBase}/servers/{slug}");
            var s = json["data"];

            Console.WriteLine();
            Console.WriteLine("┌─ Server Details ────────────────────────────");
            Console.WriteLine($"│ Name        : {s?["name"]}");
            Console.WriteLine($"│ Slug        : {s?["slug"]}");
            Console.WriteLine($"│ Version     : {s?["version"]}");
            Console.WriteLine($"│ Region      : {s?["region"]}");
            Console.WriteLine($"│ Votes       : {s?["vote_count"]}");
            Console.WriteLine($"│ Rating      : {s?["rating_avg"]:F1} ({s?["rating_count"]} reviews)");
            Console.WriteLine($"│ Online      : {(s?["is_online"]?.Value<bool>() == true ? "Yes" : "No")}");
            Console.WriteLine($"│ Verified    : {(s?["is_verified"]?.Value<bool>() == true ? "Yes" : "No")}");
            Console.WriteLine($"│ Active Plrs : {s?["active_players"]}");
            Console.WriteLine($"│ Website     : {s?["website_url"]}");
            Console.WriteLine($"│ Discord     : {s?["discord_url"]}");
            Console.WriteLine("└─────────────────────────────────────────────");
            PrintRateLimitHeaders(headers);
        }

        // ── GET /api/v1/servers/:slug/vote-check?username= ───────────────────
        public async Task CheckVoteByUsername(string slug, string username)
        {
            var (json, headers) = await GetWithHeaders(
                $"{_publicBase}/servers/{slug}/vote-check?username={Uri.EscapeDataString(username)}");
            PrintVoteCheckResult(json, $"username: {username}", headers);
        }

        // ── GET /api/v1/servers/:slug/vote-check?ref= ────────────────────────
        public async Task CheckVoteByRef(string slug, string refToken)
        {
            var (json, headers) = await GetWithHeaders(
                $"{_publicBase}/servers/{slug}/vote-check?ref={Uri.EscapeDataString(refToken)}");
            PrintVoteCheckResult(json, $"ref: {refToken}", headers);
        }

        private static void PrintVoteCheckResult(JObject json, string lookup, HttpResponseHeaders headers)
        {
            bool hasVoted = json["hasVoted"]?.Value<bool>() ?? false;
            Console.WriteLine();
            Console.WriteLine("┌─ Vote Check ────────────────────────────────");
            Console.WriteLine($"│ Lookup      : {lookup}");
            Console.WriteLine($"│ Has Voted   : {(hasVoted ? "✓ Yes" : "✗ No")}");
            if (hasVoted)
            {
                Console.WriteLine($"│ Voted At    : {json["cooldownEndsAt"]}");
                long ms = json["cooldownLeft"]?.Value<long>() ?? 0;
                TimeSpan ts = TimeSpan.FromMilliseconds(ms);
                Console.WriteLine($"│ Cooldown    : {ts.Hours}h {ts.Minutes}m {ts.Seconds}s left");
                if (json["trackingParam"]?.Type != JTokenType.Null)
                    Console.WriteLine($"│ Ref/Param   : {json["trackingParam"]}");
                if (json["username"]?.Type != JTokenType.Null)
                    Console.WriteLine($"│ Username    : {json["username"]}");
            }
            Console.WriteLine("└─────────────────────────────────────────────");
            PrintRateLimitHeaders(headers);
        }

        // ── POST /api/v1/servers/:slug/vote-link ─────────────────────────────
        public async Task GenerateVoteLink(string slug, string customRef)
        {
            if (string.IsNullOrEmpty(customRef)) { Console.WriteLine("Ref is required."); return; }

            var payload = JsonConvert.SerializeObject(new { @ref = customRef });
            var content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
            var resp    = await _http.PostAsync($"{_publicBase}/servers/{slug}/vote-link", content);
            string body = await resp.Content.ReadAsStringAsync();

            Console.WriteLine();
            if (resp.IsSuccessStatusCode)
            {
                var json = JObject.Parse(body);
                Console.WriteLine("┌─ Vote Link Generated ───────────────────────");
                Console.WriteLine($"│ Server      : {json["serverName"]}");
                Console.WriteLine($"│ Ref Token   : {json["ref"]}");
                Console.WriteLine($"│ Vote URL    : {json["voteUrl"]}");
                Console.WriteLine("├─────────────────────────────────────────────");
                Console.WriteLine("│ Send this URL to your player.");
                Console.WriteLine("│ After they vote, call vote-check?ref=<token>");
                Console.WriteLine("│ to confirm and grant the in-game reward.");
                Console.WriteLine("└─────────────────────────────────────────────");
                PrintRateLimitHeaders(resp.Headers);
            }
            else
            {
                var err = JObject.Parse(body);
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"✗ Failed ({(int)resp.StatusCode}): {err["error"] ?? body}");
                Console.ResetColor();
            }
        }

        // ── GET /api/v1/servers/:slug/votes ──────────────────────────────────
        public async Task GetRecentVotes(string slug, string? trackingParam)
        {
            string url = $"{_publicBase}/servers/{slug}/votes?limit=20";
            if (!string.IsNullOrEmpty(trackingParam))
                url += $"&tracking_param={Uri.EscapeDataString(trackingParam)}";

            var (json, headers) = await GetWithHeaders(url);
            var votes = json["data"] as JArray;
            int total = json["total"]?.Value<int>() ?? 0;
            var summary = json["summary"] as JArray;

            string header = string.IsNullOrEmpty(trackingParam)
                ? $"Recent Votes ({total})"
                : $"Votes with param '{trackingParam}' ({total})";

            Console.WriteLine();
            Console.WriteLine($"┌─ {header} ──────────────────────────────────────────────────────");
            Console.WriteLine($"│ {"Username",-20} {"Voted At",-22} {"Param",-15} {"Country",-10} {"Suspicious",10}");
            Console.WriteLine($"│ {"──────────────────",20} {"────────────────────",22} {"─────────────",15} {"───────",10} {"─────────",10}");
            if (votes != null)
            {
                foreach (var v in votes)
                {
                    string votedAt = v["voted_at"]?.ToString() ?? "";
                    if (DateTime.TryParse(votedAt, out DateTime dt))
                        votedAt = dt.ToString("yyyy-MM-dd HH:mm");
                    string param = v["tracking_param"]?.ToString() ?? "-";
                    if (param.Length > 14) param = param[..14];
                    Console.WriteLine($"│ {v["voter_username"],-20} {votedAt,-22} {param,-15} {v["voter_country"],-10} {(v["is_suspicious"]?.Value<bool>() == true ? "⚠ Yes" : "No"),10}");
                }
            }
            Console.WriteLine("└──────────────────────────────────────────────────────────────────────────");

            // Show summary breakdown when no filter is applied
            if (string.IsNullOrEmpty(trackingParam) && summary != null && summary.Count > 0)
            {
                Console.WriteLine();
                Console.WriteLine("  Votes by tracking param:");
                foreach (var s in summary)
                    Console.WriteLine($"    {s["tracking_param"],-20} {s["count"],6} votes");
            }

            PrintRateLimitHeaders(headers);
        }

        // ── POST /api/v1/servers/:slug/active-players ────────────────────────
        public async Task UpdateActivePlayers(string slug)
        {
            Console.Write("Enter active player count: ");
            if (!int.TryParse(Console.ReadLine()?.Trim(), out int count) || count < 0)
            { Console.WriteLine("Invalid number."); return; }

            var payload = JsonConvert.SerializeObject(new { active_players = count });
            var content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");
            var resp = await _http.PostAsync($"{_publicBase}/servers/{slug}/active-players", content);
            string body = await resp.Content.ReadAsStringAsync();

            Console.WriteLine();
            if (resp.IsSuccessStatusCode)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine($"✓ Active players updated to {count} for '{slug}'");
                Console.ResetColor();
                PrintRateLimitHeaders(resp.Headers);
            }
            else
            {
                JObject err = JObject.Parse(body);
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine($"✗ Failed ({(int)resp.StatusCode}): {err["error"] ?? body}");
                Console.ResetColor();
            }
        }

        // ── Helpers ───────────────────────────────────────────────────────────
        private async Task<(JObject json, HttpResponseHeaders headers)> GetWithHeaders(string url)
        {
            var resp = await _http.GetAsync(url);
            string body = await resp.Content.ReadAsStringAsync();

            if (!resp.IsSuccessStatusCode)
            {
                JObject err = JObject.Parse(body);
                throw new Exception($"HTTP {(int)resp.StatusCode}: {err["error"] ?? body}");
            }

            return (JObject.Parse(body), resp.Headers);
        }

        private static void PrintRateLimitHeaders(HttpResponseHeaders headers)
        {
            bool any = false;
            if (headers.TryGetValues("X-RateLimit-Limit", out var limit))
            { if (!any) { Console.WriteLine(); any = true; } Console.WriteLine($"  Rate Limit : {string.Join("", limit)} req/min"); }
            if (headers.TryGetValues("X-RateLimit-Remaining", out var remaining))
            { Console.WriteLine($"  Remaining  : {string.Join("", remaining)}"); }
            if (headers.TryGetValues("X-RateLimit-Reset", out var reset))
            { Console.WriteLine($"  Resets At  : {string.Join("", reset)}"); }
        }
    }
}
//vv_b9d69c917e9a7ef9af7e5ccec4818a77