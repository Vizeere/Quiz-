// German quiz — the page itself is a static asset (public/index.html).
// This worker only handles POST /api/explain: it asks Claude why a typed
// answer was wrong. Needs the ANTHROPIC_API_KEY secret set in Cloudflare
// (Worker → Settings → Variables and Secrets). Without it the endpoint
// replies "not_configured" and the page says so.

import Anthropic from "@anthropic-ai/sdk";

const MAX_FIELD = 400;

const SYSTEM = `You are a friendly German tutor for an English-speaking learner at about B1 level (living in Hamburg).
The learner was shown an English sentence and typed a German translation. You are given the expected answer and the tutor's note for it.

Explain, briefly, what is wrong with the learner's answer and why:
- Point to the specific word(s) that differ and name the rule (case — accusative/dative, verb position, auxiliary haben/sein, gender, conjugation, word choice, etc.).
- If the learner's version is actually correct or natural German too, say so plainly and mention any nuance.
- Ignore capitalisation and punctuation differences.

Keep it to 2–4 short sentences, plain text, no headings or bullet lists. Quote German words in 'single quotes'.`;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function field(v) {
  return typeof v === "string" ? v.trim().slice(0, MAX_FIELD) : "";
}

async function explain(request, env) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: "not_configured" }, 503);

  // Only accept calls from the quiz page itself, not from other sites.
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: "forbidden" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const english = field(body.english);
  const expected = field(body.expected);
  const typed = field(body.typed);
  const note = field(body.note).replace(/<[^>]+>/g, "");
  if (!english || !expected || !typed) return json({ error: "bad_request" }, 400);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            `English: ${english}\n` +
            `Expected German: ${expected}\n` +
            (note ? `Tutor's note: ${note}\n` : "") +
            `Learner typed: ${typed}`,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return json({ error: "refused" }, 502);
    }
    const text = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (!text) return json({ error: "empty" }, 502);
    return json({ explanation: text });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: "bad_key" }, 502);
    } else if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "rate_limited" }, 429);
    } else if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return json({ error: "upstream" }, 502);
    }
    console.error(error);
    return json({ error: "upstream" }, 502);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/explain") {
      if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      return explain(request, env);
    }
    // Anything else that isn't a static file.
    return env.ASSETS.fetch(request);
  },
};
