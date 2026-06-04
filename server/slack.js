const axios = require("axios");

const SLACK_API = "https://slack.com/api";

async function slackGet(endpoint, params = {}) {
  const res = await axios.get(`${SLACK_API}/${endpoint}`, {
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}` },
    params,
  });
  return res.data;
}

async function fetchSlackMessages() {
  try {
    // Get all channels the bot is in
    const chRes = await slackGet("conversations.list", {
      types: "public_channel,private_channel",
      limit: 20,
    });

    const channels = (chRes.channels || []).filter((c) => c.is_member);
    if (!channels.length) return [];

    const allMessages = [];

    for (const ch of channels) {
      const oldest = Math.floor((Date.now() - 48 * 60 * 60 * 1000) / 1000);
      const histRes = await slackGet("conversations.history", {
        channel: ch.id,
        oldest,
        limit: 10,
      });

      const messages = histRes.messages || [];

      for (const msg of messages) {
        if (msg.subtype === "channel_join") continue;
        if (!msg.text) continue;

        // Get user display name
        let fromName = "Unknown";
        if (msg.user) {
          const userRes = await slackGet("users.info", { user: msg.user });
          fromName = userRes.user?.real_name || userRes.user?.name || "Unknown";
        }

        const ts = new Date(parseFloat(msg.ts) * 1000);
        allMessages.push({
          channel: `#${ch.name}`,
          channelId: ch.id,
          from: fromName,
          text: msg.text.slice(0, 120),
          time: ts.toLocaleDateString("en-IN", {
            month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
          }),
          ts: msg.ts,
        });
      }
    }

    // Sort newest first
    return allMessages.sort((a, b) => parseFloat(b.ts) - parseFloat(a.ts)).slice(0, 15);
  } catch (err) {
    console.error("Slack fetch error:", err.message);
    return [];
  }
}

module.exports = { fetchSlackMessages };