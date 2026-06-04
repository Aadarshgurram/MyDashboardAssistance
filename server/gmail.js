const { google } = require("googleapis");
const { oauth2Client } = require("./auth");

const tagMap = {
  "notifications@vercel.com": "alert",
  "security@google.com": "alert",
  "no-reply@accounts.google.com": "alert",
  "ibmskillsbuild": "action",
  "kaggle": "action",
  "unstop": "action",
  "internshala": "action",
  "linkedin": "action",
  "medium": "read",
  "uppbeat": "read",
  "jobalertshub": "read",
};

function getTag(sender) {
  const s = sender.toLowerCase();
  for (const [key, val] of Object.entries(tagMap)) {
    if (s.includes(key)) return val;
  }
  return "read";
}

function getColor(tag) {
  if (tag === "alert") return { color: "#E24B4A", bg: "#FCEBEB", dbg: "#501313" };
  if (tag === "action") return { color: "#854F0B", bg: "#FAEEDA", dbg: "#412402" };
  return { color: "#2C2C2A", bg: "#F1EFE8", dbg: "#2C2C2A" };
}

function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

async function fetchEmails() {
  try {
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread in:inbox newer_than:3d",
      maxResults: 15,
    });

    const messages = listRes.data.messages || [];
    if (!messages.length) return [];

    const emails = await Promise.all(
      messages.map(async ({ id }) => {
        const msg = await gmail.users.messages.get({
          userId: "me",
          id,
          format: "metadata",
          metadataHeaders: ["From", "Subject", "Date"],
        });

        const headers = msg.data.payload.headers;
        const get = (name) => headers.find((h) => h.name === name)?.value || "";
        const from = get("From").replace(/<.*>/, "").trim().replace(/"/g, "");
        const sender = get("From");
        const subject = get("Subject");
        const date = get("Date");
        const snippet = msg.data.snippet?.replace(/&#39;/g, "'").replace(/&amp;/g, "&") || "";
        const tag = getTag(sender);
        const { color, bg, dbg } = getColor(tag);

        return {
          from: from || "Unknown",
          color, bg, dbg,
          subject: subject || "(no subject)",
          note: snippet.slice(0, 90),
          tag,
          time: timeAgo(date),
        };
      })
    );

    return emails;
  } catch (err) {
    console.error("Gmail fetch error:", err.message);
    return [];
  }
}

module.exports = { fetchEmails };
