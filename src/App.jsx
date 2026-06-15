import { useState, useEffect, useCallback } from "react";

const API = "https://mydashboardassistance.onrender.com";
const today = new Date();
const dayName  = today.toLocaleDateString("en-IN", { weekday: "long" });
const dateStr  = today.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
const greeting = today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";

const tagMeta = {
  alert:  { bg:"#FCEBEB", color:"#A32D2D", dbg:"#501313", dc:"#F09595", icon:"ti-alert-circle"      },
  action: { bg:"#FAEEDA", color:"#854F0B", dbg:"#412402", dc:"#FAC775", icon:"ti-circle-arrow-right" },
  read:   { bg:"#EAF3DE", color:"#3B6D11", dbg:"#173404", dc:"#97C459", icon:"ti-eye"                },
};

const ALL_TABS = [
  { id:"briefing", label:"Briefing",  icon:"ti-sparkles"    },
  { id:"priority", label:"Priority",  icon:"ti-star"        },
  { id:"weekly",   label:"Weekly",    icon:"ti-chart-bar"   },
  { id:"calendar", label:"Calendar",  icon:"ti-calendar"    },
  { id:"email",    label:"Gmail",     icon:"ti-mail"        },
  { id:"slack",    label:"Slack",     icon:"ti-brand-slack" },
];

const BOTTOM_TABS = [
  { id:"briefing", label:"Briefing",  icon:"ti-sparkles"    },
  { id:"email",    label:"Gmail",     icon:"ti-mail"        },
  { id:"calendar", label:"Calendar",  icon:"ti-calendar"    },
  { id:"slack",    label:"Slack",     icon:"ti-brand-slack" },
  { id:"priority", label:"More",      icon:"ti-dots"        },
];

function getPriorityItems(emails, slack) {
  const items = [];
  const alerts  = emails.filter(e => e.tag === "alert");
  const actions = emails.filter(e => e.tag === "action");
  if (alerts.length)  items.push({ score:99, label:"Critical", color:"#E24B4A", bg:"#FCEBEB", dbg:"#501313", dc:"#F09595", icon:"ti-shield-exclamation", source:"Gmail",    title:`${alerts.length} critical alert${alerts.length>1?"s":""}`,  desc: alerts.map(e=>e.subject).slice(0,2).join(" · ") });
  if (actions.length) items.push({ score:78, label:"High",     color:"#D85A30", bg:"#FAECE7", dbg:"#4A1B0C", dc:"#F0997B", icon:"ti-mail",               source:"Gmail",    title:`${actions.length} emails need your action`,               desc: actions.map(e=>e.subject).slice(0,2).join(" · ") });
  if (slack.length)   items.push({ score:60, label:"Medium",   color:"#854F0B", bg:"#FAEEDA", dbg:"#412402", dc:"#FAC775", icon:"ti-brand-slack",        source:"Slack",    title:`${slack.length} Slack message${slack.length>1?"s":""}`,    desc: slack.slice(0,2).map(m=>`${m.from} in ${m.channel}`).join(" · ") });
  items.push(                     { score:30, label:"Low",      color:"#3B6D11", bg:"#EAF3DE", dbg:"#173404", dc:"#97C459", icon:"ti-calendar",           source:"Calendar", title:"Review your week ahead",                                   desc:"Check calendar for upcoming deadlines or meetings." });
  return items;
}

function getBriefing(emails, events, slack) {
  const pts = [];
  const alerts  = emails.filter(e => e.tag === "alert");
  const actions = emails.filter(e => e.tag === "action");
  if (alerts.length)  pts.push({ icon:"ti-shield-exclamation", color:"#E24B4A", text:`🚨 ${alerts.length} alert${alerts.length>1?"s":""}: ${alerts[0]?.subject}. Review immediately.` });
  if (actions.length) pts.push({ icon:"ti-mail",               color:"#D85A30", text:`📬 ${actions.length} emails need action — ${actions.slice(0,2).map(e=>e.subject).join(", ")}.` });
  if (events.length)  pts.push({ icon:"ti-calendar",           color:"#378ADD", text:`📅 ${events.length} event${events.length>1?"s":""} — next: ${events[0]?.title} on ${events[0]?.start}.` });
  else                pts.push({ icon:"ti-calendar-off",       color:"#378ADD", text:"📅 Calendar is clear this week — great time for deep work." });
  if (slack.length)   pts.push({ icon:"ti-brand-slack",        color:"#534AB7", text:`💬 ${slack.length} Slack message${slack.length>1?"s":""} — latest from ${slack[0]?.from} in ${slack[0]?.channel}.` });
  else                pts.push({ icon:"ti-brand-slack",        color:"#639922", text:"💬 Slack is quiet — no unread messages." });
  return pts;
}

const ScoreBar = ({ score, color, dark }) => (
  <div style={{ height:5, borderRadius:5, background:dark?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.07)", overflow:"hidden", flex:1 }}>
    <div className="score-fill" style={{ width:`${score}%`, height:"100%", background:`linear-gradient(90deg,${color}99,${color})`, borderRadius:5 }} />
  </div>
);

const IconCircle = ({ icon, color, bg, size=36 }) => (
  <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <i className={`ti ${icon}`} style={{ fontSize:size*0.42, color }} />
  </div>
);

const IconSquare = ({ icon, color, bg, size=30, radius=8 }) => (
  <div style={{ width:size, height:size, borderRadius:radius, background:bg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <i className={`ti ${icon}`} style={{ fontSize:size*0.46, color }} />
  </div>
);

const SkeletonBlock = ({ h=52 }) => (
  <div className="pulse-anim" style={{ width:"100%", height:h, borderRadius:10, background:"rgba(128,128,128,0.12)" }} />
);

export default function App() {
  const [tab,        setTab]        = useState("briefing");
  const [dark,       setDark]       = useState(true);
  const [status,     setStatus]     = useState("loading");
  const [data,       setData]       = useState({ emails:[], events:[], slack:[], lastUpdated:null });
  const [refreshing, setRefreshing] = useState(false);
  const [authUrl,    setAuthUrl]    = useState("");
  const [waking,     setWaking]     = useState(false);
  const [weather,    setWeather]    = useState(null);

  const d      = dark;
  const bg     = d ? "#161618" : "#f7f7f5";
  const bgCard = d ? "#1e1e21" : "#ffffff";
  const bg2    = d ? "#252528" : "#f0efec";
  const bg3    = d ? "#2a2a2e" : "#e8e7e3";
  const text   = d ? "#e8e6df" : "#18181a";
  const text2  = d ? "#8a8884" : "#64635e";
  const text3  = d ? "#525250" : "#a8a7a2";
  const border = d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
  const accent = d ? "#5b9bd5" : "#185FA5";
  const card   = { background:bgCard, border:`1px solid ${border}`, borderRadius:14, overflow:"hidden" };

  const loadData = useCallback(async (force=false) => {
    setWaking(false);
    try {
      // Wake up Render first with a ping
      const controller = new AbortController();
      const timeout = setTimeout(() => { setWaking(true); }, 3000);
      const res = await fetch(`${API}/api/dashboard${force?"?force=true":""}`, { signal: controller.signal });
      clearTimeout(timeout);
      setWaking(false);
      if (res.status === 401) {
        const json = await res.json();
        setAuthUrl(json.authUrl || `${API}/auth/google`);
        setStatus("auth_needed");
        return;
      }
      const json = await res.json();
      if (json.success) { setData(json.data); setStatus("ready"); }
      else setStatus("error");
    } catch { setStatus("error"); setWaking(false); }
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      const res  = await fetch(`${API}/api/refresh`, { method:"POST" });
      const json = await res.json();
      if (json.success) { setData(json.data); setStatus("ready"); }
    } catch { setStatus("error"); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const getWeather = (lat, lon) => {
      fetch(`${API}/api/weather?lat=${lat}&lon=${lon}`)
        .then(res => res.json())
        .then(json => { if (json.success) setWeather(json.data); })
        .catch(() => {});
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => getWeather(pos.coords.latitude, pos.coords.longitude),
        () => getWeather(17.385, 78.4867) // fallback: Hyderabad
      );
    } else {
      getWeather(17.385, 78.4867);
    }
  }, []);

  const { emails, events, slack } = data;

  const openGmailReply = (e) => {
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(e.email || "")}&su=${encodeURIComponent("Re: " + e.subject)}&body=${encodeURIComponent(e.draftReply || "")}`;
    window.open(url, "_blank");
  };

  const briefingPoints = getBriefing(emails, events, slack);
  const priorityItems  = getPriorityItems(emails, slack);
  const lastFetch = data.lastUpdated
    ? new Date(data.lastUpdated).toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })
    : "--:--";

  return (
    <div style={{ background:bg, minHeight:"100dvh", color:text, transition:"background 0.3s,color 0.3s" }}>

      {/* ── Fixed mobile top bar ──────────────────────────── */}
      <div className="mobile-topbar" style={{ background: d?"rgba(22,22,24,0.95)":"rgba(247,247,245,0.95)", borderBottom:`1px solid ${border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:10, background:"linear-gradient(135deg,#185FA5,#5b9bd5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <i className="ti ti-layout-dashboard" style={{ fontSize:16, color:"#fff" }} />
          </div>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:600, color:text }}>Dashboard</p>
            <p style={{ margin:0, fontSize:10, color:text3 }}>{dayName.slice(0,3)}, {today.getDate()} {today.toLocaleString("en-IN",{month:"short"})}</p>
          </div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {/* Dark mode toggle — bigger on mobile */}
          <button onClick={()=>setDark(!d)} style={{ width:40, height:40, borderRadius:12, background:bg2, border:`1px solid ${border}`, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:text2 }}>
            <i className={`ti ${d?"ti-sun":"ti-moon"}`} style={{ fontSize:18 }} />
          </button>
          {/* Refresh button — bigger on mobile */}
          <button onClick={handleRefresh} disabled={refreshing||status!=="ready"}
            style={{ width:40, height:40, borderRadius:12, background:accent, border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", opacity:refreshing?0.7:1 }}>
            <i className={`ti ti-refresh ${refreshing?"spin":""}`} style={{ fontSize:18 }} />
          </button>
        </div>
      </div>

      <div className="main-pad">

        {/* ── Desktop header (hidden on mobile) ───────────── */}
        <div className="desktop-header" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"1.25rem" }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:600, margin:0, letterSpacing:"-0.3px" }}>{greeting}, Aadarsh 👋</h1>
            <p style={{ fontSize:13, color:text2, margin:"4px 0 0", display:"flex", alignItems:"center", gap:6 }}>
              <i className="ti ti-calendar-event" style={{ fontSize:12 }} />{dayName}, {dateStr}
            </p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-hover" onClick={()=>setDark(!d)}
              style={{ background:bg2, border:`1px solid ${border}`, borderRadius:22, padding:"7px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:text2, fontSize:13 }}>
              <i className={`ti ${d?"ti-sun":"ti-moon"}`} style={{ fontSize:15 }} />{d?"Light":"Dark"}
            </button>
            <button className="btn-hover" onClick={handleRefresh} disabled={refreshing||status!=="ready"}
              style={{ background:accent, border:"none", borderRadius:22, padding:"7px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:6, color:"#fff", fontSize:13, opacity:refreshing?0.7:1 }}>
              <i className={`ti ti-refresh ${refreshing?"spin":""}`} style={{ fontSize:15 }} />
              {refreshing?"Syncing…":"Refresh"}
            </button>
          </div>
        </div>

        {/* ── Mobile greeting (shown on mobile) ───────────── */}
        <div className="mobile-greeting">
          <h1 style={{ fontSize:19, fontWeight:600, margin:"0 0 2px", letterSpacing:"-0.3px" }}>{greeting}, Aadarsh 👋</h1>
          <p style={{ fontSize:12, color:text2, margin:0 }}>{dateStr}</p>
        </div>

        {/* ── Waking banner ───────────────────────────────── */}
        {waking && (
          <div style={{ background:d?"rgba(91,155,213,0.15)":"rgba(24,95,165,0.08)", border:`1px solid ${accent}40`, borderRadius:10, padding:"10px 14px", marginBottom:"1rem", display:"flex", alignItems:"center", gap:8 }}>
            <i className="ti ti-cloud spin" style={{ fontSize:16, color:accent }} />
            <p style={{ margin:0, fontSize:13, color:accent }}>Waking up server... takes ~30s on first load</p>
          </div>
        )}

        {/* ── Auth needed ─────────────────────────────────── */}
        {status === "auth_needed" && (
          <div className="anim-pop" style={{ ...card, padding:"2.5rem 1.5rem", textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:20, background:"linear-gradient(135deg,#4285F4,#34A853)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px" }}>
              <i className="ti ti-brand-google" style={{ fontSize:30, color:"#fff" }} />
            </div>
            <h2 style={{ fontSize:18, fontWeight:600, margin:"0 0 8px" }}>Connect Google Account</h2>
            <p style={{ fontSize:14, color:text2, marginBottom:24, lineHeight:1.6 }}>Authorise Gmail & Calendar access — one time only.</p>
            <a href={authUrl} target="_blank" rel="noreferrer"
              style={{ background:"linear-gradient(135deg,#185FA5,#2476C3)", color:"#fff", padding:"13px 28px", borderRadius:24, fontSize:15, display:"inline-flex", alignItems:"center", gap:8, boxShadow:"0 4px 14px rgba(24,95,165,0.4)" }}>
              <i className="ti ti-login" style={{ fontSize:18 }} /> Login with Google
            </a>
            <p style={{ fontSize:12, color:text3, marginTop:16 }}>After login, tap Refresh above.</p>
          </div>
        )}

        {/* ── Loading ──────────────────────────────────────── */}
        {status === "loading" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <SkeletonBlock h={100} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
              <SkeletonBlock h={85} /><SkeletonBlock h={85} /><SkeletonBlock h={85} />
            </div>
            <SkeletonBlock h={60} /><SkeletonBlock h={60} /><SkeletonBlock h={60} />
          </div>
        )}

        {/* ── Error ───────────────────────────────────────── */}
        {status === "error" && (
          <div className="anim-pop" style={{ ...card, padding:"2rem", textAlign:"center" }}>
            <div style={{ width:64, height:64, borderRadius:20, background:"#FCEBEB", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:32 }}>
              📡
            </div>
            <p style={{ fontWeight:600, fontSize:16, marginBottom:8, color:text }}>Can't reach backend</p>
            <p style={{ fontSize:13, color:text2, marginBottom:4, lineHeight:1.7 }}>
              Render free tier sleeps after 15 mins.<br/>
              First load takes <strong style={{ color:text }}>30–60 seconds</strong> to wake up.
            </p>
            <p style={{ fontSize:12, color:text3, marginBottom:20 }}>Just tap Try Again and wait a moment ☕</p>
            <button onClick={()=>{ setStatus("loading"); loadData(); }}
              style={{ background:accent, color:"#fff", border:"none", borderRadius:24, padding:"12px 32px", cursor:"pointer", fontSize:14, display:"inline-flex", alignItems:"center", gap:8, fontWeight:500, boxShadow:`0 4px 14px ${accent}44` }}>
              🔄 Try Again
            </button>
          </div>
        )}

        {/* ── Dashboard ───────────────────────────────────── */}
        {status === "ready" && (<>

          {/* Weather */}
          {weather && (
          <div style={{ background:d?"linear-gradient(135deg,#0d2d47,#0c3d60)":"linear-gradient(135deg,#daeeff,#c2dfff)", border:`1px solid ${d?"rgba(91,155,213,0.2)":"rgba(24,95,165,0.15)"}`, borderRadius:16, padding:"14px 16px", marginBottom:"1rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <i className={`ti ${weather.icon}`} style={{ fontSize:38, color:d?"#6fa8dc":"#185FA5", flexShrink:0 }} />
                <div>
                  <p style={{ fontSize:28, fontWeight:700, margin:0, color:d?"#e8e6df":"#042C53", letterSpacing:"-0.5px" }}>{weather.temp}°C</p>
                  <p style={{ fontSize:12, color:d?"#6fa8dc":"#185FA5", margin:0 }}>
                    <i className="ti ti-map-pin" style={{ fontSize:11 }} /> {weather.city} · {weather.condition}
                  </p>
                </div>
              </div>
              {weather.week?.length > 0 && (
                <div className="weather-week" style={{ display:"flex", gap:4 }}>
                  {weather.week.map((w,i)=>(
                    <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, background:d?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.6)", borderRadius:10, padding:"5px 6px", minWidth:32 }}>
                      <span style={{ fontSize:9, color:text2, fontWeight:600 }}>{w.day}</span>
                      <i className={`ti ${w.icon}`} style={{ fontSize:12, color:d?"#6fa8dc":"#185FA5" }} />
                      <span style={{ fontSize:10, fontWeight:600, color:text }}>{w.high}°</span>
                      <span style={{ fontSize:9, color:w.rain>=50?"#E24B4A":text3 }}>{w.rain}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {weather.week?.some(w=>w.rain>=50) && (
              <p style={{ fontSize:11, color:d?"#6fa8dc":"#185FA5", marginTop:10 }}>
                <i className="ti ti-umbrella" style={{ fontSize:11 }} /> Rain expected — carry an umbrella
              </p>
            )}
          </div>
          )}

          {/* Stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:"1rem" }}>
            {[
              { icon:"ti-calendar",    label:"Events", value:events.length||"0", accent:"#378ADD", abg:d?"rgba(4,44,83,0.8)":"#daeeff"   },
              { icon:"ti-mail",        label:"Unread", value:emails.length||"0", accent:"#D85A30", abg:d?"rgba(74,27,12,0.8)":"#FAECE7"  },
              { icon:"ti-brand-slack", label:"Slack",  value:slack.length||"0",  accent:"#534AB7", abg:d?"rgba(38,33,92,0.8)":"#EEEDFE"  },
            ].map(({ icon,label,value,accent,abg })=>(
              <div key={label} style={{ background:bgCard, borderRadius:14, padding:"12px 14px", border:`1px solid ${border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                  <IconSquare icon={icon} color={accent} bg={abg} size={28} radius={8} />
                  <span style={{ fontSize:11, color:text2, fontWeight:500 }}>{label}</span>
                </div>
                <p style={{ fontSize:26, fontWeight:700, margin:0, letterSpacing:"-0.5px" }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Desktop tabs */}
          <div className="desktop-tabs tabs-scroll" style={{ borderBottom:`1px solid ${border}`, marginBottom:"1rem", display:"flex" }}>
            {ALL_TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{ display:"flex", alignItems:"center", gap:5, fontSize:12, padding:"8px 12px", border:"none", background:"transparent", cursor:"pointer", marginBottom:-1, whiteSpace:"nowrap",
                  borderBottom: tab===t.id?`2px solid ${accent}`:"2px solid transparent",
                  color: tab===t.id?accent:text2, fontWeight: tab===t.id?600:400, transition:"color 0.15s" }}>
                <i className={`ti ${t.icon}`} style={{ fontSize:13 }} />{t.label}
              </button>
            ))}
          </div>

          {/* Briefing */}
          {tab==="briefing" && (
            <div className="anim-tab stagger" style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <p style={{ fontSize:13, color:text2, marginBottom:4, display:"flex", alignItems:"center", gap:5 }}>
                <i className="ti ti-sparkles" style={{ fontSize:13, color:accent }} /> Here's what matters today
              </p>
              {briefingPoints.map((pt,i)=>(
                <div key={i} className="brow" style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"13px 14px", background:bgCard, border:`1px solid ${border}`, borderRadius:12 }}>
                  <IconSquare icon={pt.icon} color={pt.color} bg={pt.color+"22"} size={32} radius={9} />
                  <p style={{ margin:0, fontSize:14, lineHeight:1.7, color:text }}>{pt.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Priority */}
          {tab==="priority" && (
            <div className="anim-tab stagger" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <p style={{ fontSize:13, color:text2, marginBottom:4 }}>
                <i className="ti ti-star" style={{ fontSize:13, color:accent }} /> Ranked by urgency
              </p>
              {priorityItems.map((p,i)=>(
                <div key={i} style={{ background:bgCard, border:`1px solid ${border}`, borderRadius:13, padding:"13px 14px" }}>
                  <div style={{ display:"flex", gap:11, marginBottom:10 }}>
                    <IconSquare icon={p.icon} color={p.color} bg={d?p.dbg:p.bg} size={34} radius={10} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                        <span style={{ fontSize:13, fontWeight:600, color:text }}>{p.title}</span>
                        <span className="tag-pill" style={{ marginLeft:"auto", background:d?p.dbg:p.bg, color:d?p.dc:p.color, flexShrink:0 }}>{p.label}</span>
                      </div>
                      <p style={{ margin:0, fontSize:12, color:text2, lineHeight:1.55 }}>{p.desc}</p>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <ScoreBar score={p.score} color={p.color} dark={d} />
                    <span style={{ fontSize:12, fontWeight:700, color:p.color, minWidth:26 }}>{p.score}</span>
                    <span style={{ fontSize:10, color:text3, whiteSpace:"nowrap" }}>{p.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly */}
          {tab==="weekly" && (
            <div className="anim-tab" style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"Total emails", value:emails.length,                           icon:"ti-mail",         color:"#D85A30", abg:d?"rgba(74,27,12,0.8)":"#FAECE7" },
                  { label:"Need action",  value:emails.filter(e=>e.tag!=="read").length,  icon:"ti-alert-circle", color:"#E24B4A", abg:d?"rgba(80,19,19,0.8)":"#FCEBEB" },
                  { label:"Slack msgs",   value:slack.length,                            icon:"ti-brand-slack",  color:"#534AB7", abg:d?"rgba(38,33,92,0.8)":"#EEEDFE" },
                ].map(({ label,value,icon,color,abg })=>(
                  <div key={label} style={{ background:bgCard, borderRadius:13, padding:"13px", border:`1px solid ${border}`, textAlign:"center" }}>
                    <IconSquare icon={icon} color={color} bg={abg} size={32} radius={9} />
                    <p style={{ fontSize:24, fontWeight:700, margin:"8px 0 3px" }}>{value}</p>
                    <p style={{ fontSize:11, color:text2, margin:0 }}>{label}</p>
                  </div>
                ))}
              </div>
              <div style={{ ...card, borderRadius:14 }}>
                <div style={{ padding:"11px 14px", borderBottom:`1px solid ${border}`, display:"flex", alignItems:"center", gap:7 }}>
                  <i className="ti ti-list-check" style={{ fontSize:14, color:accent }} />
                  <span style={{ fontSize:13, fontWeight:600 }}>Week highlights</span>
                </div>
                {briefingPoints.map((h,i)=>(
                  <div key={i} className="drow" style={{ display:"flex", gap:10, padding:"11px 14px", background:bgCard, borderBottom:i<briefingPoints.length-1?`1px solid ${border}`:"none", alignItems:"flex-start" }}>
                    <IconSquare icon={h.icon} color={h.color} bg={h.color+"22"} size={26} radius={7} />
                    <p style={{ margin:0, fontSize:13, lineHeight:1.65, color:text }}>{h.text}</p>
                  </div>
                ))}
              </div>
              <div style={{ background:d?"rgba(4,44,83,0.6)":"#daeeff", border:`1px solid ${d?"rgba(91,155,213,0.2)":"rgba(24,95,165,0.2)"}`, borderRadius:13, padding:"13px 15px" }}>
                <p style={{ margin:"0 0 6px", fontSize:13, fontWeight:600, color:accent, display:"flex", alignItems:"center", gap:6 }}>
                  <i className="ti ti-chart-bar" style={{ fontSize:14 }} /> Weekly summary
                </p>
                <p style={{ margin:0, fontSize:13, lineHeight:1.7, color:d?"#b5d4f4":"#0C447C" }}>
                  {emails.length} unread emails with {emails.filter(e=>e.tag!=="read").length} needing action.
                  {events.length===0?" Calendar is clear — ideal for focused work.":" Check calendar for upcoming events."}
                  {slack.length===0?" Slack is quiet.":" "+slack.length+" Slack messages to review."}
                </p>
              </div>
            </div>
          )}

          {/* Calendar */}
          {tab==="calendar" && (
            events.length===0
              ? <div className="anim-pop" style={{ ...card, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", padding:"3rem 1.5rem", gap:12 }}>
                  <div style={{ width:60, height:60, borderRadius:18, background:d?"rgba(4,44,83,0.8)":"#daeeff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <i className="ti ti-calendar-off" style={{ fontSize:30, color:"#378ADD" }} />
                  </div>
                  <p style={{ fontSize:16, fontWeight:600, margin:0 }}>No events this week</p>
                  <p style={{ fontSize:13, color:text2, margin:0, textAlign:"center", lineHeight:1.6 }}>Your calendar is clear — great time to plan ahead.</p>
                </div>
              : <div className="anim-tab stagger" style={{ ...card, borderRadius:14 }}>
                  {events.map((e,i)=>(
                    <div key={i} className="drow" style={{ display:"flex", gap:12, padding:"13px 14px", background:bgCard, borderBottom:i<events.length-1?`1px solid ${border}`:"none" }}>
                      <IconCircle icon="ti-calendar-event" color="#378ADD" bg={d?"rgba(4,44,83,0.8)":"#daeeff"} size={40} />
                      <div style={{ flex:1 }}>
                        <p style={{ margin:0, fontSize:14, fontWeight:600, color:text }}>{e.title}</p>
                        <p style={{ margin:"3px 0 0", fontSize:12, color:text2 }}>
                          <i className="ti ti-clock" style={{ fontSize:11 }} /> {e.start}
                          {e.location&&<span> · <i className="ti ti-map-pin" style={{ fontSize:11 }} /> {e.location}</span>}
                        </p>
                        {e.meetLink && <a href={e.meetLink} target="_blank" rel="noreferrer" style={{ fontSize:12, color:"#378ADD", display:"inline-flex", alignItems:"center", gap:3, marginTop:4, fontWeight:500 }}><i className="ti ti-video" style={{ fontSize:12 }} /> Join Meet</a>}
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Gmail */}
          {tab==="email" && (
            <div className="anim-tab stagger" style={{ ...card, borderRadius:14 }}>
              {emails.length===0
                ? <div style={{ padding:"2.5rem", textAlign:"center" }}>
                    <i className="ti ti-mail-check" style={{ fontSize:36, color:"#3B6D11" }} />
                    <p style={{ margin:"12px 0 0", color:text2, fontSize:14 }}>All caught up — inbox is clear 🎉</p>
                  </div>
                : emails.map((e,i)=>(
                    <div key={i} className="drow" style={{ display:"flex", flexDirection:"column", gap:8, padding:"13px 14px", background:bgCard, borderBottom:i<emails.length-1?`1px solid ${border}`:"none" }}>
                      <div style={{ display:"flex", gap:12 }}>
                        <IconCircle icon="ti-mail" color={e.color} bg={d?e.dbg:e.bg} size={40} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:text }}>{e.from}</span>
                            <span className="tag-pill" style={{ background:d?tagMeta[e.tag]?.dbg:tagMeta[e.tag]?.bg, color:d?tagMeta[e.tag]?.dc:tagMeta[e.tag]?.color }}>
                              <i className={`ti ${tagMeta[e.tag]?.icon}`} style={{ fontSize:9 }} />{e.tag}
                            </span>
                            <span style={{ fontSize:11, color:text3, marginLeft:"auto", whiteSpace:"nowrap" }}>{e.time}</span>
                          </div>
                          <p style={{ margin:0, fontSize:13, fontWeight:500, color:text, marginBottom:2 }}>{e.subject}</p>
                          <p style={{ margin:0, fontSize:12, color:text2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{e.note}</p>
                        </div>
                      </div>
                      {(e.tag==="action" || e.tag==="alert") && e.draftReply && (
                        <div style={{ marginLeft:52, background:d?"rgba(255,255,255,0.04)":"#F7F6F2", border:`1px solid ${border}`, borderRadius:10, padding:"10px 12px" }}>
                          <p style={{ margin:"0 0 6px", fontSize:10, fontWeight:700, color:text3, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                            <i className="ti ti-sparkles" style={{ fontSize:11, marginRight:4 }} />AI Draft Reply
                          </p>
                          <p style={{ margin:"0 0 10px", fontSize:12, color:text2, lineHeight:1.5, whiteSpace:"pre-wrap" }}>{e.draftReply}</p>
                          <button
                            onClick={() => openGmailReply(e)}
                            style={{ display:"inline-flex", alignItems:"center", gap:6, background:accent, color:"#fff", border:"none", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, cursor:"pointer" }}
                          >
                            <i className="ti ti-send" style={{ fontSize:13 }} /> Send Reply
                          </button>
                        </div>
                      )}
                    </div>
                  ))
              }
            </div>
          )}

          {/* Slack */}
          {tab==="slack" && (
            <div className="anim-tab" style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {slack.length===0
                ? <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 16px", background:d?"rgba(23,52,4,0.6)":"#EAF3DE", borderRadius:13, border:`1px solid ${border}` }}>
                    <IconSquare icon="ti-circle-check" color="#3B6D11" bg={d?"rgba(59,109,17,0.25)":"rgba(59,109,17,0.12)"} size={32} radius={9} />
                    <p style={{ margin:0, fontSize:14, color:d?"#97C459":"#3B6D11", fontWeight:500 }}>All caught up — no unread messages</p>
                  </div>
                : <div className="stagger" style={{ ...card, borderRadius:14 }}>
                    {slack.map((m,i)=>(
                      <div key={i} className="drow" style={{ display:"flex", gap:12, padding:"13px 14px", background:bgCard, borderBottom:i<slack.length-1?`1px solid ${border}`:"none" }}>
                        <IconCircle icon="ti-brand-slack" color="#534AB7" bg={d?"rgba(38,33,92,0.8)":"#EEEDFE"} size={40} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                            <span style={{ fontSize:13, fontWeight:600, color:text }}>{m.from} <span style={{ fontWeight:400, color:text2, fontSize:12 }}>in {m.channel}</span></span>
                            <span style={{ fontSize:11, color:text3, whiteSpace:"nowrap" }}>{m.time}</span>
                          </div>
                          <p style={{ margin:0, fontSize:13, color:text2, lineHeight:1.5 }}>{m.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* Footer */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:"1.75rem", paddingTop:"1rem", borderTop:`1px solid ${border}` }}>
            <span style={{ fontSize:11, color:text3, fontStyle:"italic" }}>
              <i className="ti ti-code" style={{ fontSize:11 }} /> Created by Itachi
            </span>
            <span style={{ fontSize:11, color:text3 }}>
              <i className="ti ti-refresh" style={{ fontSize:11 }} /> {lastFetch} IST
            </span>
          </div>

        </>)}
      </div>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="bottom-nav" style={{ background:d?"rgba(20,20,22,0.96)":"rgba(247,247,245,0.96)" }}>
        {BOTTOM_TABS.map(t=>(
          <button key={t.id} className="bottom-nav-btn" onClick={()=>setTab(t.id)}
            style={{ color: tab===t.id ? accent : text3 }}>
            <i className={`ti ${t.icon}`} style={{ fontSize:22 }} />
            <span style={{ fontSize:10, fontWeight:tab===t.id?600:400 }}>{t.label}</span>
            <div className="bottom-nav-dot" style={{ background:accent, opacity:tab===t.id?1:0, transform:tab===t.id?"scale(1)":"scale(0)" }} />
          </button>
        ))}
      </nav>
    </div>
  );
}