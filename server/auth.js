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

// Load saved token if exists
function loadToken() {
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(token);
    return true;
  }
  return false;
}

// Save token to file
function saveToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  oauth2Client.setCredentials(token);
}

// Generate auth URL for first-time login
function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

// Exchange code for token
async function getTokenFromCode(code) {
  const { tokens } = await oauth2Client.getToken(code);
  saveToken(tokens);
  return tokens;
}

// Auto refresh token when expired
oauth2Client.on("tokens", (tokens) => {
  if (tokens.refresh_token) saveToken(tokens);
});

module.exports = { oauth2Client, loadToken, getAuthUrl, getTokenFromCode };