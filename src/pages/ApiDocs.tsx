import { useEffect } from "react";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="font-display text-2xl font-bold mb-3">{title}</h2>
    <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">{children}</div>
  </section>
);

const Code = ({ children }: { children: React.ReactNode }) => (
  <pre className="glass rounded-lg p-4 text-xs font-mono-num overflow-x-auto text-foreground/90"><code>{children}</code></pre>
);

const ApiDocs = () => {
  useEffect(() => { document.title = "API Docs — Conquer Top 100"; }, []);

  const base = `${window.location.origin}/api`;

  return (
    <div className="container py-10 max-w-4xl">
      <div className="mb-8 animate-fade-in">
        <span className="text-xs uppercase tracking-widest text-primary">Developer reference</span>
        <h1 className="font-display text-4xl font-bold mt-1">API Documentation</h1>
        <p className="text-muted-foreground mt-2">Verify votes for your Conquer Online server programmatically. All requests require an API key.</p>
      </div>

      <Section title="Authentication">
        <p>Include your API key in the <code className="text-primary-glow">x-api-key</code> header. Generate keys from your dashboard.</p>
        <Code>{`x-api-key: ct_xxxxxxxxxxxxxxxxxxxxxxxx`}</Code>
        <p>Keep keys secret. Revoke and regenerate any leaked key from the dashboard.</p>
      </Section>

      <Section title="Rate Limits">
        <p>Up to 100 requests per hour per API key. Responses include <code className="text-primary-glow">x-ratelimit-remaining</code>.</p>
      </Section>

      <Section title="GET /servers/{server_id}/votes">
        <p>List recent votes for one of your servers. <code className="text-primary-glow">server_id</code> is the public UUID.</p>
        <Code>{`GET ${base}/servers/{server_id}/votes?since=2026-01-01T00:00:00Z&limit=50
Headers:
  x-api-key: ct_xxxxxxxxxxxxxxxxxxxxxxxx`}</Code>

        <h3 className="font-semibold text-foreground mt-4">Query parameters</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><code className="text-primary-glow">since</code> — ISO 8601 timestamp (optional, default last 24h)</li>
          <li><code className="text-primary-glow">limit</code> — 1–200 (default 50)</li>
        </ul>

        <h3 className="font-semibold text-foreground mt-4">Example response</h3>
        <Code>{`{
  "server_id": "0d3f8e22-...",
  "count": 2,
  "votes": [
    {
      "id": "8b1e...",
      "voted_at": "2026-04-23T17:12:01Z",
      "country": "US",
      "challenge": "math",
      "suspicious": false
    },
    {
      "id": "7a02...",
      "voted_at": "2026-04-23T17:09:55Z",
      "country": "DE",
      "challenge": "slider",
      "suspicious": false
    }
  ]
}`}</Code>
      </Section>

      <Section title="Code samples">
        <h3 className="font-semibold text-foreground">cURL</h3>
        <Code>{`curl -H "x-api-key: $KEY" \\
  "${base}/servers/<server_id>/votes?limit=20"`}</Code>

        <h3 className="font-semibold text-foreground">JavaScript</h3>
        <Code>{`const res = await fetch(\`${base}/servers/\${id}/votes\`, {
  headers: { "x-api-key": process.env.CT_API_KEY }
});
const data = await res.json();`}</Code>

        <h3 className="font-semibold text-foreground">Python</h3>
        <Code>{`import requests
r = requests.get(
  f"${base}/servers/{server_id}/votes",
  headers={"x-api-key": API_KEY}
)
print(r.json())`}</Code>
      </Section>

      <Section title="Webhooks (coming soon)">
        <p>Subscribe to vote events delivered as POST requests to your URL with HMAC signature verification.</p>
      </Section>
    </div>
  );
};

export default ApiDocs;
