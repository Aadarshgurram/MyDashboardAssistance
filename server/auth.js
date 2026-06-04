const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

const TOKEN_PATH = path.join(__dirname, "token.json");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
];

// Load token — from env var (Render) OR file (local)
function loadToken() {
  try {
    // First try env var (works on Render)
    if (process.env.GOOGLE_TOKEN) {
      const token = JSON.parse(process.env.GOOGLE_TOKEN);
      oauth2Client.setCredentials(token);
      return true;
    }
    // Fallback to file (works locally)
    if (fs.existsSync(TOKEN_PATH)) {
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
      oauth2Client.setCredentials(token);
      return true;
    }
    return false;
  } catch (e) {
    console.error("loadToken error:", e.message);
    return false;
  }
}

// Save token — to file locally AND log for Render
function saveToken(token) {
  try {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  } catch (e) {
    // On Render, file system may be read-only — that's ok
  }
  oauth2Client.setCredentials(token);
  // Print token so you can copy it into Render env vars
  console.log("\n=== COPY THIS TOKEN INTO RENDER ENV VARS ===");
  console.log("GOOGLE_TOKEN=" + JSON.stringify(token));
  console.log("=============================================\n");
}

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getTokenFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  saveToken(tokens);
  return tokens;
}

oauth2Client.on("tokens", (tokens) => {
  if (tokens.refresh_token) saveToken(tokens);
});

module.exports = { oauth2Client, loadToken, getAuthUrl, getTokenFromCode };