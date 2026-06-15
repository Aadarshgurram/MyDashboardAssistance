require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const express = require("express");
const cors = require("cors");
const { fetchWeather } = require("./weather");
const cron = require("node-cron");
const { oauth2Client, loadToken, getAuthUrl, getTokenFromCode } = require("./auth");
const { fetchEmails } = require("./gmail");
const { fetchCalendarEvents } = require("./calendar");
const { fetchSlackMessages } = require("./slack");

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS — allow Vercel frontend + localhost ──────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any vercel.app subdomain
    if (origin.endsWith(".vercel.app")) return cb(null, true);
    cb(new Error("CORS: " + origin + " not allowed"));
  },
  credentials: true,
}));

app.use(express.json());

// Cache
let cache = { emails: [], events: [], slack: [], weather: null, lastUpdated: null };
// ── Health check ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ success: true, message: "Dashboard Backend Running ✅", time: new Date().toISOString() });
});

// ── Auth Routes ───────────────────────────────────────────
app.get("/auth/google", (req, res) => {
  res.redirect(getAuthUrl());
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code received");
  try {
    await getTokenFromCode(code);
    res.send(`
      <html>
      <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="font-family:sans-serif;padding:2rem;background:#161618;color:#e8e6df;text-align:center">
        <div style="font-size:48px;margin-bottom:16px">✅</div>
        <h2 style="margin:0 0 8px">Google Auth Successful!</h2>
        <p style="color:#8a8884;margin:0 0 20px">Your token has been saved.</p>
        <p style="color:#8a8884;font-size:13px">⚠️ Check your server terminal/logs and copy the<br>
        <strong style="color:#5b9bd5">GOOGLE_TOKEN</strong> value into your Render environment variables.</p>
        <p style="color:#8a8884;font-size:13px;margin-top:16px">You can close this tab now.</p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send("Auth failed: " + err.message);
  }
});

app.get("/auth/status", (req, res) => {
  res.json({ authenticated: loadToken() });
});

// ── Data Routes ───────────────────────────────────────────
async function refreshAllData() {
  console.log("🔄 Refreshing...", new Date().toISOString());
  const [emails, events, slack, weather] = await Promise.all([
    fetchEmails(),
    fetchCalendarEvents(),
    fetchSlackMessages(),
    fetchWeather(),
  ]);
  cache = { emails, events, slack, weather, lastUpdated: new Date().toISOString() };
  console.log(`✅ ${emails.length} emails, ${events.length} events, ${slack.length} slack, weather: ${weather ? weather.temp + "°C" : "n/a"}`);
  return cache;
}

app.get("/api/dashboard", async (req, res) => {
  const isAuth = loadToken();
  if (!isAuth) return res.status(401).json({ error: "not_authenticated", authUrl: getAuthUrl() });
  try {
    const age = cache.lastUpdated ? (Date.now() - new Date(cache.lastUpdated)) / 60000 : 999;
    if (age > 15 || req.query.force === "true") await refreshAllData();
    res.json({ success: true, data: cache });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/refresh", async (req, res) => {
  if (!loadToken()) return res.status(401).json({ error: "not_authenticated" });
  try {
    res.json({ success: true, data: await refreshAllData() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Cron jobs ─────────────────────────────────────────────
cron.schedule("*/30 * * * *", () => { if (loadToken()) refreshAllData(); });
cron.schedule("30 0 * * *",   () => { if (loadToken()) { console.log("🌅 6AM IST briefing"); refreshAllData(); } });

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on port ${PORT}`);
  loadToken();
});

// const { fetchWeather } = require("./weather");

// ── Weather Route (separate, location-aware) ──────────────
app.get("/api/weather", async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    const weather = await fetchWeather(
      isNaN(lat) ? undefined : lat,
      isNaN(lon) ? undefined : lon
    );
    if (!weather) return res.status(500).json({ error: "weather_fetch_failed" });
    res.json({ success: true, data: weather });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});