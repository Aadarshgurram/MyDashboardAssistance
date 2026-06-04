const { google } = require("googleapis");
const { oauth2Client } = require("./auth");

async function fetchCalendarEvents() {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const weekEnd = new Date();
    weekEnd.setDate(now.getDate() + 7);

    const res = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
      maxResults: 20,
    });

    const events = res.data.items || [];

    return events.map((e) => {
      const start = e.start?.dateTime || e.start?.date;
      const end = e.end?.dateTime || e.end?.date;
      const startDate = new Date(start);

      return {
        id: e.id,
        title: e.summary || "Untitled Event",
        start: startDate.toLocaleDateString("en-IN", {
          weekday: "short", month: "short", day: "numeric",
          hour: e.start?.dateTime ? "2-digit" : undefined,
          minute: e.start?.dateTime ? "2-digit" : undefined,
        }),
        end: end ? new Date(end).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
        location: e.location || "",
        attendees: (e.attendees || []).map((a) => a.email).slice(0, 3),
        isAllDay: !e.start?.dateTime,
        meetLink: e.hangoutLink || "",
      };
    });
  } catch (err) {
    console.error("Calendar fetch error:", err.message);
    return [];
  }
}

module.exports = { fetchCalendarEvents };