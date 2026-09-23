# German quiz

A German (B1) practice quiz with spaced repetition. The page is `public/index.html`;
progress is saved in the browser (localStorage).

Deployed as the Cloudflare Worker `quiz` — every push to `main` redeploys it.

## "Why? Ask Claude"

After a wrong (or nearly right) answer, the **Why? Ask Claude** button sends your answer
to `src/worker.js` (`POST /api/explain`), which asks Claude to explain the mistake.

To turn it on, add your Anthropic API key once:

1. Create a key at console.anthropic.com → **API keys** (and set a monthly spend limit
   under **Billing → Limits** if you like).
2. Cloudflare dashboard → **Workers & Pages → quiz → Settings → Variables and Secrets →
   Add** → type **Secret**, name `ANTHROPIC_API_KEY`, paste the key, **Deploy**.

Until then the button just says it isn't set up yet.
