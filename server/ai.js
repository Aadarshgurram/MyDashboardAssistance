const https = require("https");

function callOpenRouter(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return reject(new Error("OPENROUTER_API_KEY not set"));

    const body = JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [{ role: "user", content: prompt }],
    });

    const options = {
      hostname: "openrouter.ai",
      path: "/api/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(body),
        // Optional but recommended by OpenRouter
        "HTTP-Referer": process.env.FRONTEND_URL || "https://my-dashboard-assistance.vercel.app",
        "X-Title": "Morning Dashboard",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message || JSON.stringify(json.error)));
          const text = json.choices?.[0]?.message?.content || "";
          resolve(text.trim());
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function generateEmailReply({ from, subject, note }) {
  const prompt = `You are drafting a short, polite, professional email reply on behalf of the user.

Original email:
From: ${from}
Subject: ${subject}
Content: ${note}

Write a concise reply (2-4 sentences). Match a friendly but professional tone. Do not include a subject line. Do not include "Dear X" greetings if the sender's name is unclear — use a simple greeting like "Hi," or "Hello,". Sign off with "Best regards," (no name).

Reply:`;

  try {
    const reply = await callOpenRouter(prompt);
    return reply;
  } catch (err) {
    console.error("AI reply generation error:", err.message);
    throw err;
  }
}

module.exports = { generateEmailReply };