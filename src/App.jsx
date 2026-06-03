import { useState } from "react";

const today = new Date();
const dayName = today.toLocaleDateString("en-IN", { weekday: "long" });
const dateStr = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const timeStr = today.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

const weather = {
  location: "Hyderabad, TG",
  temp: 94,
  condition: "Partly Sunny",
  icon: "ti-cloud-sun",
  week: [
    { day: "Wed", high: 96, rain: 15, icon: "ti-cloud-sun" },
    { day: "Thu", high: 96, rain: 50, icon: "ti-cloud-rain" },
    { day: "Fri", high: 94, rain: 65, icon: "ti-cloud-rain" },
    { day: "Sat", high: 94, rain: 35, icon: "ti-cloud-drizzle" },
    { day: "Sun", high: 94, rain: 35, icon: "ti-cloud-drizzle" },
  ]
};

const emails = [
  { from: "Google Security", color: "#E24B4A", dbg: "#501313", bg: "#FCEBEB", subject: "Security alert", note: "Claude for Gmail & Calendar access granted — confirm it was you", tag: "alert", time: "9:14 AM", priority: 1 },
  { from: "Kaggle", color: "#0F6E56", bg: "#E1F5EE", dbg: "#04342C", subject: "5-Day AI Agents Course", note: "Reminder: Intensive Vibe Coding Course with Google, June 15–19", tag: "action", time: "Jun 2", priority: 2 },
  { from: "LinkedIn", color: "#185FA5", bg: "#E6F1FB", dbg: "#042C53", subject: "10+ new invitations", note: "Multiple connection requests waiting for your response", tag: "action", time: "Jun 2", priority: 2 },
  { from: "Google Cloud", color: "#185FA5", bg: "#E6F1FB", dbg: "#042C53", subject: "AI agents in 2026", note: "5 trends defining AI agents — insights from 3,466 executives", tag: "read", time: "8:10 AM", priority: 3 },
  { from: "Medium", color: "#2C2C2A", bg: "#F1EFE8", dbg: "#2C2C2A", subject: "AI Agents: Complete Course", note: "Daily digest — Marina Wyss in Data Science Collective", tag: "read", time: "Jun 2", priority: 3 },
  { from: "Internshala", color: "#854F0B", bg: "#FAEEDA", dbg: "#412402", subject: "Top Web Dev internships", note: "New openings matching your profile in your area", tag: "read", time: "Jun 2", priority: 3 },
];

const slackMessages = [
  { channel: "#general", from: "Lizzie", color: "#534AB7", bg: "#EEEDFE", dbg: "#26215C", text: "Joined the channel", time: "Jun 2, 3:10 PM", priority: 3 }
];

const priorityItems = [
  { score: 99, label: "Critical", color: "#E24B4A", bg: "#FCEBEB", dbg: "#501313", dc: "#F09595", icon: "ti-shield-exclamation", source: "Gmail", title: "Security alert from Google", desc: "Confirm Claude's access to your Gmail & Calendar was authorised by you." },
  { score: 82, label: "High", color: "#D85A30", bg: "#FAECE7", dbg: "#4A1B0C", dc: "#F0997B", icon: "ti-brand-slack", source: "Slack", title: "Channel activity in #general", desc: "Lizzie joined #general — good time to say hello or share a quick update." },
  { score: 74, label: "High", color: "#D85A30", bg: "#FAECE7", dbg: "#4A1B0C", dc: "#F0997B", icon: "ti-users", source: "Gmail · LinkedIn", title: "10+ pending connection requests", desc: "Review and respond to LinkedIn invitations — network while intent is fresh." },
  { score: 61, label: "Medium", color: "#854F0B", bg: "#FAEEDA", dbg: "#412402", dc: "#FAC775", icon: "ti-school", source: "Gmail · Kaggle", title: "AI Agents course starting June 15", desc: "Register for the Kaggle intensive course with Google before spots fill up." },
  { score: 38, label: "Low", color: "#3B6D11", bg: "#EAF3DE", dbg: "#173404", dc: "#97C459", icon: "ti-calendar-off", source: "Calendar", title: "Calendar is clear this week", desc: "No meetings scheduled — ideal for deep work, planning, or personal goals." },
];

const weeklySummary = {
  totalEmails: 10,
  unread: 10,
  actionNeeded: 2,
  meetings: 0,
  slackMessages: 1,
  highlights: [
    { icon: "ti-shield-exclamation", color: "#E24B4A", text: "1 security alert requiring your confirmation" },
    { icon: "ti-school", color: "#0F6E56", text: "AI Agents course with Google starts June 15 — registration open" },
    { icon: "ti-users", color: "#185FA5", text: "10+ LinkedIn connection requests pending a response" },
    { icon: "ti-calendar", color: "#378ADD", text: "Week is completely free — zero meetings scheduled" },
    { icon: "ti-brand-slack", color: "#534AB7", text: "Slack quiet — 1 message in #general, no DMs" },
  ]
};

const tagMeta = {
  alert: { bg: "#FCEBEB", color: "#A32D2D", dbg: "#501313", dc: "#F09595" },
  action: { bg: "#FAEEDA", color: "#854F0B", dbg: "#412402", dc: "#FAC775" },
  read: { bg: "#EAF3DE", color: "#3B6D11", dbg: "#173404", dc: "#97C459" },
};

const tabs = [
  { id: "briefing", label: "Briefing", icon: "ti-sparkles" },
  { id: "priority", label: "Priority", icon: "ti-star" },
  { id: "weekly", label: "Weekly", icon: "ti-chart-bar" },
  { id: "calendar", label: "Calendar", icon: "ti-calendar" },
  { id: "email", label: "Gmail", icon: "ti-mail" },
  { id: "slack", label: "Slack", icon: "ti-brand-slack" },
];

const briefingPoints = [
  { icon: "ti-shield-exclamation", color: "#E24B4A", text: "Review the Google security alert about Claude's Gmail & Calendar access — confirm it was you." },
  { icon: "ti-users", color: "#185FA5", text: "You have 10+ pending LinkedIn invitations — worth a quick review." },
  { icon: "ti-school", color: "#0F6E56", text: "Kaggle reminder: AI Agents Intensive Course with Google starts June 15 — register if interested." },
  { icon: "ti-brand-slack", color: "#639922", text: "Slack is quiet — only a channel join in #general, no urgent messages." },
  { icon: "ti-calendar-off", color: "#378ADD", text: "Calendar is completely clear this week — great time for focused work." },
];

const ScoreBar = ({ score, color, dark }) => (
  <div style={{ height: 4, borderRadius: 4, background: dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)", overflow: "hidden", width: "100%" }}>
    <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
  </div>
);

export default function Dashboard() {
  const [tab, setTab] = useState("briefing");
  const [dark, setDark] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(timeStr);

  const d = dark;
  const bg = d ? "#1a1a1a" : "#ffffff";
  const bg2 = d ? "#252525" : "#f5f4f0";
  const bg3 = d ? "#2e2e2e" : "#eeedea";
  const text = d ? "#e8e6e0" : "#1a1a1a";
  const text2 = d ? "#9a9890" : "#666560";
  const text3 = d ? "#5a5856" : "#aaa9a5";
  const border = d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const border2 = d ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.18)";

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setLastRefresh(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })); }, 1800);
  };

  const card = { background: bg, border: `0.5px solid ${border}`, borderRadius: 12, overflow: "hidden" };

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1.25rem", background: bg, minHeight: "100vh", color: text, borderRadius: 16, transition: "background 0.25s" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .drow:hover{background:${bg3}!important}
        .brow:hover{border-color:${border2}!important}
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0, color: text }}>Good morning, Aadarsh 👋</h1>
          <p style={{ fontSize: 13, color: text2, margin: "4px 0 0" }}>{dayName}, {dateStr}</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setDark(!d)} style={{ background: bg2, border: `0.5px solid ${border}`, borderRadius: 20, padding: "5px 11px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: text2, fontSize: 13 }}>
            <i className={`ti ${d ? "ti-sun" : "ti-moon"}`} style={{ fontSize: 14 }} aria-hidden="true" />{d ? "Light" : "Dark"}
          </button>
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: d ? "#185FA5" : "#185FA5", border: "none", borderRadius: 20, padding: "5px 13px", cursor: refreshing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: 13, opacity: refreshing ? 0.7 : 1 }}>
            <i className="ti ti-refresh" style={{ fontSize: 14, animation: refreshing ? "spin 0.8s linear infinite" : "none" }} aria-hidden="true" />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Weather Widget ── */}
      <div style={{ background: d ? "#0c2d4a" : "#E6F1FB", border: `0.5px solid ${d ? "#1a5580" : "#b5d4f4"}`, borderRadius: 12, padding: "14px 16px", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <i className="ti ti-map-pin" style={{ fontSize: 13, color: d ? "#6fa8dc" : "#185FA5" }} aria-hidden="true" />
              <span style={{ fontSize: 12, color: d ? "#6fa8dc" : "#185FA5", fontWeight: 500 }}>{weather.location}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <i className={`ti ${weather.icon}`} style={{ fontSize: 32, color: d ? "#6fa8dc" : "#185FA5" }} aria-hidden="true" />
              <div>
                <p style={{ fontSize: 28, fontWeight: 500, margin: 0, color: d ? "#e8e6e0" : "#042C53" }}>{weather.temp}°F</p>
                <p style={{ fontSize: 12, color: d ? "#6fa8dc" : "#185FA5", margin: 0 }}>{weather.condition}</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {weather.week.map((w, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: d ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.55)", borderRadius: 8, padding: "6px 8px", minWidth: 40 }}>
                <span style={{ fontSize: 10, color: text2, fontWeight: 500 }}>{w.day}</span>
                <i className={`ti ${w.icon}`} style={{ fontSize: 14, color: d ? "#6fa8dc" : "#185FA5" }} aria-hidden="true" />
                <span style={{ fontSize: 11, fontWeight: 500, color: d ? "#e8e6e0" : "#042C53" }}>{w.high}°</span>
                <span style={{ fontSize: 10, color: w.rain >= 50 ? "#E24B4A" : text3 }}>{w.rain}%</span>
              </div>
            ))}
          </div>
        </div>
        <p style={{ fontSize: 11, color: d ? "#6fa8dc" : "#185FA5", margin: "8px 0 0" }}>
          <i className="ti ti-umbrella" style={{ fontSize: 11 }} aria-hidden="true" /> Rain likely Thu–Fri (50–65%) — keep an umbrella handy
        </p>
      </div>

      {/* ── Stat row ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { icon: "ti-calendar", label: "Events this week", value: "0", accent: "#378ADD", abg: d ? "#042C53" : "#E6F1FB" },
          { icon: "ti-mail", label: "Unread emails", value: "10+", accent: "#D85A30", abg: d ? "#4A1B0C" : "#FAECE7" },
          { icon: "ti-brand-slack", label: "Slack messages", value: "1", accent: "#3B6D11", abg: d ? "#173404" : "#EAF3DE" },
        ].map(({ icon, label, value, accent, abg }) => (
          <div key={label} style={{ background: bg2, borderRadius: 10, padding: "14px 16px", border: `0.5px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: abg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${icon}`} style={{ fontSize: 15, color: accent }} aria-hidden="true" />
              </div>
              <span style={{ fontSize: 12, color: text2 }}>{label}</span>
            </div>
            <p style={{ fontSize: 26, fontWeight: 500, margin: 0, color: text }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom: `0.5px solid ${border}`, marginBottom: "1.25rem", display: "flex", gap: 0, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "7px 11px", border: "none", background: "transparent", cursor: "pointer", marginBottom: -1, whiteSpace: "nowrap", borderBottom: tab === t.id ? `2px solid ${d ? "#6fa8dc" : "#185FA5"}` : "2px solid transparent", color: tab === t.id ? (d ? "#6fa8dc" : "#185FA5") : text2, fontWeight: tab === t.id ? 500 : 400, transition: "color 0.15s" }}>
            <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} aria-hidden="true" />{t.label}
          </button>
        ))}
      </div>

      {/* ── Briefing ── */}
      {tab === "briefing" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: text2, margin: "0 0 4px" }}>Here's what matters today — across all your connected services.</p>
          {briefingPoints.map((pt, i) => (
            <div key={i} className="brow" style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: bg, border: `0.5px solid ${border}`, borderRadius: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: pt.color + (d ? "30" : "18"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className={`ti ${pt.icon}`} style={{ fontSize: 15, color: pt.color }} aria-hidden="true" />
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: text }}>{pt.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Priority Scoring ── */}
      {tab === "priority" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <p style={{ fontSize: 13, color: text2, margin: "0 0 4px" }}>Items ranked by urgency, source, and action required — tackle the top ones first.</p>
          {priorityItems.map((p, i) => (
            <div key={i} style={{ background: bg, border: `0.5px solid ${border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: d ? p.dbg : p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className={`ti ${p.icon}`} style={{ fontSize: 16, color: p.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{p.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 500, marginLeft: "auto", background: d ? p.dbg : p.bg, color: d ? p.dc : p.color, whiteSpace: "nowrap" }}>{p.label}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 12, color: text2, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ScoreBar score={p.score} color={p.color} dark={d} />
                <span style={{ fontSize: 11, fontWeight: 500, color: p.color, minWidth: 28, textAlign: "right" }}>{p.score}</span>
                <span style={{ fontSize: 10, color: text3, whiteSpace: "nowrap" }}>{p.source}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Weekly Summary ── */}
      {tab === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "Emails this week", value: weeklySummary.totalEmails, icon: "ti-mail", color: "#D85A30", abg: d ? "#4A1B0C" : "#FAECE7" },
              { label: "Action needed", value: weeklySummary.actionNeeded, icon: "ti-alert-circle", color: "#E24B4A", abg: d ? "#501313" : "#FCEBEB" },
              { label: "Slack messages", value: weeklySummary.slackMessages, icon: "ti-brand-slack", color: "#534AB7", abg: d ? "#26215C" : "#EEEDFE" },
            ].map(({ label, value, icon, color, abg }) => (
              <div key={label} style={{ background: bg2, borderRadius: 10, padding: "14px 16px", border: `0.5px solid ${border}`, textAlign: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: abg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                  <i className={`ti ${icon}`} style={{ fontSize: 16, color }} aria-hidden="true" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 500, margin: "0 0 4px", color: text }}>{value}</p>
                <p style={{ fontSize: 11, color: text2, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
          <div style={{ ...card }}>
            <div style={{ padding: "12px 14px", borderBottom: `0.5px solid ${border}` }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: text }}>Week highlights</span>
            </div>
            {weeklySummary.highlights.map((h, i) => (
              <div key={i} className="drow" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: bg, borderBottom: i < weeklySummary.highlights.length - 1 ? `0.5px solid ${border}` : "none" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: h.color + (d ? "30" : "18"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                  <i className={`ti ${h.icon}`} style={{ fontSize: 13, color: h.color }} aria-hidden="true" />
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: text }}>{h.text}</p>
              </div>
            ))}
          </div>
          <div style={{ background: d ? "#042C53" : "#E6F1FB", border: `0.5px solid ${d ? "#1a5580" : "#b5d4f4"}`, borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <i className="ti ti-chart-bar" style={{ fontSize: 14, color: d ? "#6fa8dc" : "#185FA5" }} aria-hidden="true" />
              <span style={{ fontSize: 13, fontWeight: 500, color: d ? "#6fa8dc" : "#185FA5" }}>Week summary</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: d ? "#b5d4f4" : "#0C447C" }}>
              This is a light week — no meetings, low Slack activity, and manageable email volume. Two items need your action: the security alert and LinkedIn invitations. A good week to learn something new or get ahead on projects.
            </p>
          </div>
        </div>
      )}

      {/* ── Calendar ── */}
      {tab === "calendar" && (
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2.5rem", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: d ? "#042C53" : "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-calendar-off" style={{ fontSize: 26, color: "#378ADD" }} aria-hidden="true" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 500, margin: 0, color: text }}>No events this week</p>
          <p style={{ fontSize: 13, color: text2, margin: 0, textAlign: "center", maxWidth: 260 }}>Your calendar is completely clear — a good opportunity to plan ahead.</p>
        </div>
      )}

      {/* ── Gmail ── */}
      {tab === "email" && (
        <div style={{ ...card, animation: "fadeIn 0.2s ease" }}>
          {emails.map((e, i) => (
            <div key={i} className="drow" style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "11px 14px", background: bg, borderBottom: i < emails.length - 1 ? `0.5px solid ${border}` : "none" }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: d ? e.dbg : e.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <i className="ti ti-mail" style={{ fontSize: 15, color: e.color }} aria-hidden="true" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{e.from}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, background: d ? tagMeta[e.tag].dbg : tagMeta[e.tag].bg, color: d ? tagMeta[e.tag].dc : tagMeta[e.tag].color }}>{e.tag}</span>
                  <span style={{ fontSize: 11, color: text3, marginLeft: "auto" }}>{e.time}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: text, marginBottom: 1 }}>{e.subject}</p>
                <p style={{ margin: 0, fontSize: 12, color: text2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Slack ── */}
      {tab === "slack" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, animation: "fadeIn 0.2s ease" }}>
          <div style={{ ...card }}>
            {slackMessages.map((m, i) => (
              <div key={i} className="drow" style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 14px", background: bg }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: d ? m.dbg : m.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-brand-slack" style={{ fontSize: 16, color: m.color }} aria-hidden="true" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: text }}>{m.from} <span style={{ fontWeight: 400, color: text2, fontSize: 12 }}>in {m.channel}</span></span>
                    <span style={{ fontSize: 11, color: text3 }}>{m.time}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: text2 }}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: d ? "#173404" : "#EAF3DE", borderRadius: 10, border: `0.5px solid ${border}` }}>
            <i className="ti ti-check" style={{ fontSize: 14, color: "#3B6D11" }} aria-hidden="true" />
            <p style={{ margin: 0, fontSize: 13, color: d ? "#97C459" : "#3B6D11" }}>All caught up — no unread mentions or DMs</p>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5rem", paddingTop: "1rem", borderTop: `0.5px solid ${border}` }}>
        <span style={{ fontSize: 11, color: text3, fontStyle: "italic" }}>Created by Itachi</span>
        <span style={{ fontSize: 11, color: text3 }}>Last fetched: {lastRefresh} IST · Gmail · Calendar · Slack</span>
      </div>
    </div>
  );
}