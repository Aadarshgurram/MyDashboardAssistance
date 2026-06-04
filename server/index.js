require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const cron = require("node-cron");
const { oauth2Client, loadToken, getAuthUrl, getTokenFromCode } = require("./auth");
const { fetchEmails } = require("./gmail");
const { fetchCalendarEvents } = require("./calendar");
const { fetchSlackMessages } = require("./slack");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

// Cache to avoid hammering APIs on every frontend refresh
let cache = { emails: [], events: [], slack: [], lastUpdated: null };
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Dashboard Backend Running"
  });
});
// ── Auth Routes ──────────────────────────────────────────────
// Step 1: Visit this in browser to login with Google
app.get("/auth/google", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// Step 2: Google redirects here with code
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code received");
  try {
    await getTokenFromCode(code);
    res.send(`
      <html><body style="font-family:sans-serif;padding:2rem;background:#1a1a1a;color:#e8e6e0">
        <h2>✅ Google Auth Successful!</h2>
        <p>You can close this tab and go back to your dashboard.</p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send("Auth failed: " + err.message);
  }
});

// Check if authenticated
app.get("/auth/status", (req, res) => {
  const authenticated = loadToken();
  res.json({ authenticated });
});

// ── Data Routes ──────────────────────────────────────────────
async function refreshAllData() {
  console.log("🔄 Refreshing all data...", new Date().toLocaleTimeString());
  const [emails, events, slack] = await Promise.all([
    fetchEmails(),
    fetchCalendarEvents(),
    fetchSlackMessages(),
  ]);
  cache = { emails, events, slack, lastUpdated: new Date().toISOString() };
  console.log(`✅ Done — ${emails.length} emails, ${events.length} events, ${slack.length} slack msgs`);
  return cache;
}

// Get all dashboard data
app.get("/api/dashboard", async (req, res) => {
  const isAuth = loadToken();
  if (!isAuth) return res.status(401).json({ error: "not_authenticated", authUrl: getAuthUrl() });

  try {
    // If cache is older than 15 mins, refresh
    const cacheAge = cache.lastUpdated ? (Date.now() - new Date(cache.lastUpdated)) / 60000 : 999;
    if (cacheAge > 15 || req.query.force === "true") await refreshAllData();
    res.json({ success: true, data: cache });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Force refresh
app.post("/api/refresh", async (req, res) => {
  const isAuth = loadToken();
  if (!isAuth) return res.status(401).json({ error: "not_authenticated" });
  try {
    const data = await refreshAllData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cron: Auto refresh every 30 mins ────────────────────────
cron.schedule("*/30 * * * *", () => {
  if (loadToken()) refreshAllData();
});

// ── Cron: Morning briefing at 6:00 AM IST ───────────────────
// IST = UTC+5:30, so 6AM IST = 0:30 UTC
cron.schedule("30 0 * * *", () => {
  if (loadToken()) {
    console.log("🌅 6:00 AM morning briefing refresh triggered");
    refreshAllData();
  }
});

// ── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Dashboard backend running at http://localhost:${PORT}`);
  console.log(`\n👉 First time? Open this in your browser to login with Google:`);
  console.log(`   http://localhost:${PORT}/auth/google\n`);
  loadToken(); // Try loading existing token on startup
});