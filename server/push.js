const webpush = require("web-push");
const fs = require("fs");
const path = require("path");

const SUB_PATH = path.join(__dirname, "subscriptions.json");

webpush.setVapidDetails(
  "mailto:" + (process.env.VAPID_CONTACT_EMAIL || "admin@example.com"),
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Load subscriptions — from env var (Render) OR file (local)
function loadSubscriptions() {
  try {
    if (process.env.PUSH_SUBSCRIPTIONS) {
      return JSON.parse(process.env.PUSH_SUBSCRIPTIONS);
    }
    if (fs.existsSync(SUB_PATH)) {
      return JSON.parse(fs.readFileSync(SUB_PATH));
    }
    return [];
  } catch (e) {
    console.error("loadSubscriptions error:", e.message);
    return [];
  }
}

function saveSubscriptions(subs) {
  try {
    fs.writeFileSync(SUB_PATH, JSON.stringify(subs));
  } catch (e) {
    // Render fs may be ephemeral/read-only — that's ok
  }
  // Print so it can be copied to Render env vars if needed
  console.log("\n=== PUSH SUBSCRIPTIONS (copy to PUSH_SUBSCRIPTIONS env var if needed) ===");
  console.log("PUSH_SUBSCRIPTIONS=" + JSON.stringify(subs));
  console.log("==========================================================================\n");
}

function addSubscription(sub) {
  const subs = loadSubscriptions();
  // Avoid duplicates (by endpoint)
  const exists = subs.find((s) => s.endpoint === sub.endpoint);
  if (!exists) {
    subs.push(sub);
    saveSubscriptions(subs);
  }
  return subs;
}

function removeSubscription(endpoint) {
  let subs = loadSubscriptions();
  subs = subs.filter((s) => s.endpoint !== endpoint);
  saveSubscriptions(subs);
  return subs;
}

async function sendNotificationToAll(payload) {
  const subs = loadSubscriptions();
  if (!subs.length) {
    console.log("📭 No push subscriptions registered");
    return;
  }

  const results = await Promise.allSettled(
    subs.map((sub) => webpush.sendNotification(sub, JSON.stringify(payload)))
  );

  // Remove subscriptions that are no longer valid (410 Gone / 404)
  const invalidEndpoints = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const statusCode = r.reason?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        invalidEndpoints.push(subs[i].endpoint);
      } else {
        console.error("Push send error:", r.reason?.message || r.reason);
      }
    }
  });

  if (invalidEndpoints.length) {
    let updated = loadSubscriptions();
    updated = updated.filter((s) => !invalidEndpoints.includes(s.endpoint));
    saveSubscriptions(updated);
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  console.log(`📤 Push sent to ${sent}/${subs.length} subscription(s)`);
}

module.exports = { addSubscription, removeSubscription, loadSubscriptions, sendNotificationToAll };