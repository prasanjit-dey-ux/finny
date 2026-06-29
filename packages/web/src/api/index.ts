import { Hono } from 'hono';
import { cors } from "hono/cors";
import { stream } from 'hono/streaming';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(context?: Record<string, any>): string {
  let contextBlock = "";
  if (context) {
    contextBlock = `
## User's Current Financial Snapshot (use this to personalize answers):
- Name: ${context.name ?? "User"}
- Monthly Income: ₹${context.monthlyIncome?.toLocaleString("en-IN") ?? "unknown"}
- Monthly Budget (spending limit): ₹${context.monthlyBudget?.toLocaleString("en-IN") ?? "not set"}
- Current Balance: ₹${context.balance?.toLocaleString("en-IN") ?? "unknown"}
- Total Active Subscriptions/month: ₹${context.totalSubscriptions?.toLocaleString("en-IN") ?? "unknown"}
- Unpaid Bills: ₹${context.unpaidBills?.toLocaleString("en-IN") ?? "0"}
- Total Expenses Logged: ₹${context.totalExpensesLogged?.toLocaleString("en-IN") ?? "0"}
- Wishes: ${context.wishes?.map((w: any) => `${w.name} (₹${w.price?.toLocaleString("en-IN")}, saved ₹${w.saved?.toLocaleString("en-IN")})`).join(", ") ?? "none"}

Always reference this data when answering questions about their finances. Never make up numbers.
Monthly Budget is DIFFERENT from Monthly Income — budget is how much the user plans to spend, income is what they earn.
`;
  }

  return `You are Finny, a friendly and sharp personal finance AI assistant.${contextBlock}

Your capabilities:
- Budget advice (50/30/20 rule, savings rate)
- EMI/loan calculations: EMI = P × r × (1+r)^n / ((1+r)^n - 1)
- Investment guidance (index funds, ETFs, savings accounts, CDs)
- Bill and subscription tracking advice
- Savings goals and wish planning
- Logging expenses when user mentions spending

When a user says they spent money (e.g. "I spent ₹500 on food"), respond naturally AND include an action tag at the very end of your response like this:
[ACTION:{"action":"log_expense","amount":500,"category":"Food","note":"mentioned by user"}]

When a user asks to mark a bill paid, include:
[ACTION:{"action":"mark_bill_paid","name":"bill name"}]

When a user wants to add a wish:
[ACTION:{"action":"add_wish","name":"item name","price":9000}]

When a user wants to set or update their monthly budget:
[ACTION:{"action":"set_budget","amount":5000}]

IMPORTANT: The [ACTION:...] tag must be valid JSON inside the brackets. Keep it on a single line at the very end of your response. Do NOT split it across lines or add extra text after it.

Rules:
- Always use INR ₹ with Indian number formatting (1,00,000.00)
- Be concise — bullet points over paragraphs
- Use the user's actual data when answering personal questions
- Be honest and practical, not salesy
- Never fabricate numbers not in the snapshot`;
}

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true, exposeHeaders: ["set-auth-token"] }))
  .get('/ping', (c) => c.json({ message: `Pong! ${Date.now()}` }, 200))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))
  .post('/chat', async (c) => {
    const body = await c.req.json();
    const { messages, context } = body;

    const groqMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt(context);

    return stream(c, async (stream) => {
      const chatStream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...groqMessages],
        stream: true,
        max_tokens: 1024,
      });

      for await (const chunk of chatStream) {
        const text = chunk.choices[0]?.delta?.content || '';
        if (text) {
          await stream.write(text);
        }
      }
    });
  })
  .post('/transcribe', async (c) => {
    try {
      const formData = await c.req.formData();
      const audioFile = formData.get('audio');
      if (!audioFile || !(audioFile instanceof File)) {
        return c.json({ error: 'No audio file provided' }, 400);
      }

      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        language: 'en',
        response_format: 'json',
      });

      return c.json({ text: transcription.text });
    } catch (err: any) {
      console.error('Transcribe error:', err);
      return c.json({ error: 'Transcription failed' }, 500);
    }
  })
  .post('/chat-sync', async (c) => {
    const body = await c.req.json();
    const { messages, context } = body;

    const groqMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    const systemPrompt = buildSystemPrompt(context);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: systemPrompt }, ...groqMessages],
      stream: false,
      max_tokens: 1024,
    });

    const text = completion.choices[0]?.message?.content || '';
    return c.json({ content: text });
  })
  .post('/price-check', async (c) => {
    const body = await c.req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return c.json({ error: "URL required" }, 400);
    }

    try {
      // Fetch the page HTML
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-IN,en;q=0.9",
        },
      });
      clearTimeout(timeout);

      const html = await res.text();

      // Extract useful text — title, meta, price-related elements
      // Take first 8000 chars to stay within LLM context
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";

      // Look for common price patterns in HTML
      const pricePatterns = [
        // JSON-LD structured data
        /\"price\"\s*:\s*\"?(\d[\d,]*\.?\d*)\"?/gi,
        // Meta tags
        /content=\"(\d[\d,]*\.?\d*)\"[^>]*property=\"product:price/gi,
        /property=\"product:price[^>]*content=\"(\d[\d,]*\.?\d*)\"/gi,
        /itemprop=\"price\"[^>]*content=\"(\d[\d,]*\.?\d*)\"/gi,
        // Common price class patterns
        /class=\"[^\"]*price[^\"]*\"[^>]*>[\s₹$]*(\d[\d,]*\.?\d*)/gi,
        // INR patterns
        /₹\s*(\d[\d,]*\.?\d*)/g,
        /Rs\.?\s*(\d[\d,]*\.?\d*)/gi,
        /INR\s*(\d[\d,]*\.?\d*)/gi,
      ];

      const foundPrices: number[] = [];
      for (const pattern of pricePatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const num = parseFloat(match[1].replace(/,/g, ""));
          if (num > 10 && num < 10000000) { // Reasonable price range in INR
            foundPrices.push(num);
          }
        }
      }

      // If we found prices directly from HTML patterns
      if (foundPrices.length > 0) {
        // The most common price or the first one is usually the product price
        const priceMap = new Map<number, number>();
        for (const p of foundPrices) {
          priceMap.set(p, (priceMap.get(p) || 0) + 1);
        }
        // Sort by frequency, take most common
        const sorted = [...priceMap.entries()].sort((a, b) => b[1] - a[1]);
        const price = sorted[0][0];

        // Clean product name from title
        const name = title
          .replace(/\s*[-|:]\s*(Buy|Amazon|Flipkart|Myntra|Ajio|Croma|Tata|Online|India|\.com|\.in).*$/gi, "")
          .replace(/\s*\(.*?\)\s*$/, "")
          .trim()
          .slice(0, 60);

        return c.json({ price: Math.round(price), name: name || null, source: url });
      }

      // Fallback: use LLM to extract price from truncated HTML
      const truncated = html.replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 4000);

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: `Extract the product name and price in INR from this webpage text. Respond ONLY with JSON: {"name":"product name","price":12345}. If you can't find a price, respond {"name":null,"price":null}.\n\nPage title: ${title}\nPage text: ${truncated}`,
        }],
        stream: false,
        max_tokens: 100,
        temperature: 0,
      });

      const raw = completion.choices[0]?.message?.content || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.price && typeof parsed.price === "number") {
          return c.json({ price: Math.round(parsed.price), name: parsed.name || null, source: url });
        }
      }

      return c.json({ price: null, name: title || null, error: "Could not extract price" });
    } catch (err: any) {
      console.error("Price check error:", err.message);
      return c.json({ price: null, error: "Failed to fetch or parse URL" }, 500);
    }
  })
  .post('/wish-suggest', async (c) => {
    const body = await c.req.json();
    const { wishes, profile, expenses } = body;

    const wishList = (wishes || []).map((w: any) =>
      `- ${w.name}: ₹${w.price?.toLocaleString("en-IN")} (saved ₹${w.saved?.toLocaleString("en-IN")})`
    ).join("\n");

    const expenseSummary = (expenses || []).slice(0, 30).map((e: any) =>
      `${e.category}: ₹${e.amount}`
    ).join(", ");

    const prompt = `You are Finny, a sharp personal finance AI. Analyze this user's wish cart and give ONE actionable suggestion.

## User Profile
- Name: ${profile?.name ?? "User"}
- Monthly Income: ₹${profile?.monthlyIncome?.toLocaleString("en-IN") ?? "0"}
- Monthly Budget: ₹${profile?.monthlyBudget?.toLocaleString("en-IN") ?? "0"}
- Savings Goal: ₹${profile?.savingsGoal?.toLocaleString("en-IN") ?? "0"}
- Balance: ₹${profile?.balance?.toLocaleString("en-IN") ?? "0"}

## Wish Cart
${wishList || "Empty"}

## Recent Expenses
${expenseSummary || "None logged"}

## Cart Total
₹${(wishes || []).reduce((a: number, w: any) => a + (w.price || 0), 0).toLocaleString("en-IN")}

Pick the MOST relevant suggestion type:
1. **BUY_ORDER** — which item to buy first and why (cheapest first? most saved? highest priority?)
2. **SPENDING_CUT** — identify a category where cutting ₹X saves Y weeks toward a specific wish
3. **REALITY_CHECK** — cart total vs savings rate, how long it'll actually take, what to drop
4. **BEHAVIOUR_NUDGE** — if cart is ambitious vs actual savings, nudge to set a savings target

Respond in this EXACT JSON format (no markdown, no code blocks):
{"type":"BUY_ORDER","title":"Short punchy title","body":"2-3 lines of actionable advice with specific numbers","highlight":"The key number or timeframe"}`;

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        max_tokens: 300,
        temperature: 0.7,
      });

      const raw = completion.choices[0]?.message?.content || '';
      // Extract JSON from response
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return c.json(parsed);
      }
      return c.json({ type: "REALITY_CHECK", title: "Let's plan this out", body: raw.slice(0, 200), highlight: "" });
    } catch (err: any) {
      console.error('Wish suggest error:', err);
      return c.json({ type: "REALITY_CHECK", title: "Stay on track", body: "Keep saving consistently — every bit counts!", highlight: "" });
    }
  })
  .get('/download', async (c) => {
    try {
      const res = await fetch('https://expo.dev/artifacts/eas/qYpKQeDmQzPAwYrG2VDh5d.apk', { redirect: 'follow' });
      if (!res.ok) return c.text('Download failed', 502);
      c.header('Content-Type', 'application/vnd.android.package-archive');
      c.header('Content-Disposition', 'attachment; filename="Finny.apk"');
      if (res.headers.get('content-length')) {
        c.header('Content-Length', res.headers.get('content-length')!);
      }
      return c.body(res.body as ReadableStream);
    } catch (err: any) {
      console.error('Download proxy error:', err.message);
      return c.text('Download failed', 502);
    }
  });

export type AppType = typeof app;
export default app;
