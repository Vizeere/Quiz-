# German quiz

A German (B1) practice quiz with spaced repetition. The page is `public/index.html`;
progress is saved in the browser (localStorage).

Deployed as the Cloudflare Worker `quiz` — every push to `main` redeploys it.

## My mistakes

Every answer that isn't exactly right is logged on the device (localStorage,
last 1000). **My mistakes** on the home screen ranks the words you mix up
(e.g. den → dem), leave out, add, or put in the wrong place, plus your weakest
categories and most-missed sentences. **Analyse my patterns with Claude** sends
the last 80 mistakes to `POST /api/patterns` for a summary of your top patterns.

## "Why? Ask Claude"

After a wrong (or nearly right) answer, the **Why? Ask Claude** button sends your answer
to `src/worker.js` (`POST /api/explain`), which asks Claude to explain the mistake.

To turn it on, add your Anthropic API key once:

1. Create a key at console.anthropic.com → **API keys** (and set a monthly spend limit
   under **Billing → Limits** if you like).
2. Cloudflare dashboard → **Workers & Pages → quiz → Settings → Variables and Secrets →
   Add** → type **Secret**, name `ANTHROPIC_API_KEY`, paste the key, **Deploy**.

Until then the button just says it isn't set up yet.
