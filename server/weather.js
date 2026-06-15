const https = require("https");

// Default fallback location (Hyderabad) if no coords provided
const DEFAULT_LAT = 17.385;
const DEFAULT_LON = 78.4867;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
  });
}

// Map OpenWeather icon codes -> tabler icon classes used in the UI
function mapIcon(owIcon, condition) {
  const c = (condition || "").toLowerCase();
  if (c.includes("thunder")) return "ti-cloud-bolt";
  if (c.includes("drizzle")) return "ti-cloud-drizzle";
  if (c.includes("rain"))    return "ti-cloud-rain";
  if (c.includes("snow"))    return "ti-snowflake";
  if (c.includes("cloud")) {
    return owIcon?.includes("d") || owIcon === "02d" || owIcon === "02n"
      ? "ti-cloud-sun" : "ti-cloud";
  }
  if (c.includes("clear")) return owIcon?.includes("n") ? "ti-moon" : "ti-sun";
  if (c.includes("mist") || c.includes("fog") || c.includes("haze")) return "ti-cloud-fog";
  return "ti-cloud-sun";
}

async function fetchWeather(lat, lon) {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      console.error("Weather fetch error: OPENWEATHER_API_KEY not set");
      return null;
    }

    const latitude = lat || DEFAULT_LAT;
    const longitude = lon || DEFAULT_LON;

    // Current weather
    const currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const current = await fetchJson(currentUrl);

    if (current.cod && current.cod !== 200) {
      console.error("Weather fetch error:", current.message);
      return null;
    }

    // 5-day/3-hour forecast (free tier) — used to build a daily summary
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;
    const forecast = await fetchJson(forecastUrl);

    const dailyMap = {};
    (forecast.list || []).forEach((entry) => {
      const date = new Date(entry.dt * 1000);
      const key = date.toLocaleDateString("en-IN", { weekday: "short" });
      if (!dailyMap[key]) dailyMap[key] = { temps: [], pops: [], icons: [], conditions: [] };
      dailyMap[key].temps.push(entry.main.temp);
      dailyMap[key].pops.push(entry.pop || 0);
      dailyMap[key].icons.push(entry.weather?.[0]?.icon);
      dailyMap[key].conditions.push(entry.weather?.[0]?.main);
    });

    const week = Object.entries(dailyMap).slice(0, 5).map(([day, v]) => {
      const high = Math.round(Math.max(...v.temps));
      const rain = Math.round(Math.max(...v.pops) * 100);
      // pick the most common condition/icon for the day
      const condition = v.conditions[Math.floor(v.conditions.length / 2)];
      const icon = v.icons[Math.floor(v.icons.length / 2)];
      return { day, high, rain, icon: mapIcon(icon, condition) };
    });

    return {
      city: current.name || "Unknown",
      temp: Math.round(current.main?.temp),
      feelsLike: Math.round(current.main?.feels_like),
      condition: current.weather?.[0]?.main || "",
      description: current.weather?.[0]?.description || "",
      icon: mapIcon(current.weather?.[0]?.icon, current.weather?.[0]?.main),
      humidity: current.main?.humidity,
      windSpeed: current.wind?.speed,
      week,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Weather fetch error:", err.message);
    return null;
  }
}

module.exports = { fetchWeather };