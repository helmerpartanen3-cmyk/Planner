"use client";

import { useEffect, useState, useRef } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Drop,
  ThermometerSimple,
  MapPin,
  MagnifyingGlass,
  Eye,
  CloudFog,
  CloudSun,
  Gauge,
  ArrowUp,
} from "@phosphor-icons/react";

/* ── types ───────────────────────────────────────────── */

interface WeatherData {
  location: string;
  country: string;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  humidity: number;
  wind: number;
  windDeg: number;
  pressure: number;
  visibility: number;
  high: number;
  low: number;
  sunrise: string;
  sunset: string;
  forecast: ForecastDay[];
  hourly: HourlyItem[];
}

interface ForecastDay {
  day: string;
  date: string;
  high: number;
  low: number;
  icon: string;
  description: string;
}

interface HourlyItem {
  time: string;
  temp: number;
  icon: string;
}

/* ── icon mapping ────────────────────────────────────── */

function WeatherIcon({
  code,
  size = 24,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  const c = code?.slice(0, 2) ?? "01";
  const props = { size, weight: "light" as const, className };

  switch (c) {
    case "01":
      return <Sun {...props} />;
    case "02":
      return <CloudSun {...props} />;
    case "03":
    case "04":
      return <Cloud {...props} />;
    case "09":
    case "10":
      return <CloudRain {...props} />;
    case "11":
      return <CloudLightning {...props} />;
    case "13":
      return <CloudSnow {...props} />;
    case "50":
      return <CloudFog {...props} />;
    default:
      return <Sun {...props} />;
  }
}

/* ── component ───────────────────────────────────────── */

export default function WeatherView() {
  const [city, setCity] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clarity-weather-city") || "Helsinki";
    }
    return "Helsinki";
  });
  const [input, setInput] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const hourlyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      setLoading(true);
      setError("");

      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`
        );
        const geoJson = await geoRes.json();
        if (!geoJson.results?.length) {
          if (!cancelled) setError("City not found");
          if (!cancelled) setLoading(false);
          return;
        }

        const loc = geoJson.results[0];
        const { latitude, longitude, name, country } = loc;

        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure` +
            `&hourly=temperature_2m,weather_code` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset` +
            `&timezone=auto&forecast_days=7`
        );
        const wx = await wxRes.json();

        if (cancelled) return;

        const wmoToIcon = (code: number): string => {
          if (code <= 1) return "01d";
          if (code <= 2) return "02d";
          if (code <= 3) return "03d";
          if (code <= 48) return "50d";
          if (code <= 57) return "09d";
          if (code <= 67) return "10d";
          if (code <= 77) return "13d";
          if (code <= 82) return "10d";
          if (code <= 86) return "13d";
          if (code <= 99) return "11d";
          return "01d";
        };

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        const forecast: ForecastDay[] = wx.daily.time.slice(1, 7).map(
          (t: string, i: number) => {
            const dt = new Date(t + "T00:00:00");
            return {
              day: dayNames[dt.getDay()],
              date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
              high: Math.round(wx.daily.temperature_2m_max[i + 1]),
              low: Math.round(wx.daily.temperature_2m_min[i + 1]),
              icon: wmoToIcon(wx.daily.weather_code[i + 1]),
              description: describeWMO(wx.daily.weather_code[i + 1]),
            };
          }
        );

        const nowHour = new Date().getHours();
        const hourly: HourlyItem[] = wx.hourly.time
          .slice(nowHour, nowHour + 24)
          .map((t: string, i: number) => {
            const dt = new Date(t);
            return {
              time:
                i === 0
                  ? "Now"
                  : dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
              temp: Math.round(wx.hourly.temperature_2m[nowHour + i]),
              icon: wmoToIcon(wx.hourly.weather_code[nowHour + i]),
            };
          });

        const sunrise = new Date(wx.daily.sunrise[0]);
        const sunset = new Date(wx.daily.sunset[0]);

        setData({
          location: name,
          country,
          temp: Math.round(wx.current.temperature_2m),
          feelsLike: Math.round(wx.current.apparent_temperature),
          description: describeWMO(wx.current.weather_code),
          icon: wmoToIcon(wx.current.weather_code),
          humidity: wx.current.relative_humidity_2m,
          wind: Math.round(wx.current.wind_speed_10m),
          windDeg: wx.current.wind_direction_10m,
          pressure: Math.round(wx.current.surface_pressure),
          visibility: 10,
          high: Math.round(wx.daily.temperature_2m_max[0]),
          low: Math.round(wx.daily.temperature_2m_min[0]),
          sunrise: sunrise.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
          sunset: sunset.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
          forecast,
          hourly,
        });
      } catch {
        if (!cancelled) setError("Failed to fetch weather data");
      }
      if (!cancelled) setLoading(false);
    }

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [city]);

  const handleSearch = () => {
    const q = input.trim();
    if (!q) return;
    setCity(q);
    localStorage.setItem("clarity-weather-city", q);
    setInput("");
  };

  /* temp range for forecast bar rendering */
  const allLows = data ? [data.low, ...data.forecast.map((f) => f.low)] : [];
  const allHighs = data ? [data.high, ...data.forecast.map((f) => f.high)] : [];
  const rangeMin = Math.min(...allLows) - 2;
  const rangeMax = Math.max(...allHighs) + 2;
  const rangeSpan = rangeMax - rangeMin || 1;

  return (
    <div className="h-full overflow-y-auto bg-neutral-900">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
        {/* ── search ─────────────────────────────────── */}
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-full transition-all duration-200 ${
            searchFocused
              ? "bg-neutral-700/70 border border-white/[0.12]"
              : "bg-neutral-800/70 border border-white/[0.06]"
          }`}
          style={{ maxWidth: 320 }}
        >
          <MagnifyingGlass size={18} weight="light" className="text-white/25 shrink-0" />
          <input
            type="text"
            placeholder="Search city..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 text-[13px] !bg-transparent !border-none !ring-0 !outline-none text-white/85 placeholder:text-white/20"
          />
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-[13px] text-red-400/60">{error}</p>
          </div>
        )}

        {data && (
          <>
{/* ── hero: current weather ─────────────── */}
<div className="relative px-6 pt-5 pb-6 overflow-hidden">
  <div className="flex flex-col items-center text-center space-y-3">

    {/* Location */}
    <div className="flex items-center gap-1.5">
      <MapPin size={13} weight="light" className="text-white/30" />
      <span className="text-[12px] text-white/40">
        {data.location}, {data.country}
      </span>
    </div>

    {/* Temperature */}
    <div className="flex items-baseline gap-1">
      <span className="text-[56px] font-extralight text-white/90 tabular-nums tracking-tight leading-none">
        {data.temp}
      </span>
      <span className="text-[22px] font-extralight text-white/40">°C</span>
    </div>

    {/* Description */}
    <p className="text-[13px] text-white/50 capitalize leading-tight">
      {data.description}
    </p>

    {/* High / Low */}
    <p className="text-[12px] text-white/30 tabular-nums">
      H {data.high}° · L {data.low}°
    </p>

  </div>
</div>


            {/* ── hourly forecast (scrollable) ─────── */}
            <div className="rounded-3xl bg-neutral-800/70 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <span className="text-[11px] uppercase tracking-wider text-white/25 font-medium">
                  Hourly
                </span>
              </div>
              <div
                ref={hourlyRef}
                className="flex overflow-x-auto py-4 px-3 gap-0 scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                {data.hourly.map((h, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-2.5 px-3.5 min-w-[56px] shrink-0 ${
                      i === 0 ? "opacity-100" : "opacity-70 hover:opacity-100"
                    } transition-opacity`}
                  >
                    <span
                      className={`text-[10px] tabular-nums ${
                        i === 0 ? "text-blue-400/70 font-medium" : "text-white/25"
                      }`}
                    >
                      {h.time}
                    </span>
                    <div className="text-white/35">
                      <WeatherIcon code={h.icon} size={20} />
                    </div>
                    <span
                      className={`text-[12px] tabular-nums ${
                        i === 0 ? "text-white/80 font-medium" : "text-white/50"
                      }`}
                    >
                      {h.temp}°
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 6-day forecast ───────────────────── */}
            <div className="rounded-3xl bg-neutral-800/70 border border-neutral-800 overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.04]">
                <span className="text-[11px] uppercase tracking-wider text-white/25 font-medium">
                  6-Day Forecast
                </span>
              </div>
              <div>
                {data.forecast.map((d, i) => {
                  const barLeft = ((d.low - rangeMin) / rangeSpan) * 100;
                  const barRight = 100 - ((d.high - rangeMin) / rangeSpan) * 100;

                  return (
                    <div
                      key={i}
                      className="flex items-center px-5 py-3 gap-3 border-b border-white/[0.025] last:border-0 hover:bg-white/[0.015] transition-colors"
                    >
                      <span className="text-[12px] text-white/50 w-9 shrink-0">
                        {d.day}
                      </span>
                      <div className="text-white/30 w-5 shrink-0 flex justify-center">
                        <WeatherIcon code={d.icon} size={20} />
                      </div>
                      <span className="text-[11px] text-white/25 tabular-nums w-8 text-right shrink-0">
                        {d.low}°
                      </span>
                      <div className="flex-1 h-[4px] rounded-full bg-white/[0.05] relative mx-2 min-w-[80px]">
                        <div
                          className="absolute inset-y-0 rounded-full"
                          style={{
                            left: `${barLeft}%`,
                            right: `${barRight}%`,
                            background: "linear-gradient(90deg, rgba(96,165,250,0.45), rgba(251,191,36,0.45))",
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-white/55 tabular-nums w-8 text-right shrink-0 font-medium">
                        {d.high}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── detail cards grid ────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatCard
                icon={<ThermometerSimple size={15} weight="light" />}
                label="Feels Like"
                value={`${data.feelsLike}°`}
                extra={
                  data.feelsLike > data.temp
                    ? "Warmer than actual"
                    : data.feelsLike < data.temp
                    ? "Cooler than actual"
                    : "Similar to actual"
                }
              />
              <StatCard
                icon={<Drop size={15} weight="light" />}
                label="Humidity"
                value={`${data.humidity}%`}
                extra={
                  data.humidity > 70
                    ? "High humidity"
                    : data.humidity < 30
                    ? "Low humidity"
                    : "Comfortable"
                }
              />
              <StatCard
                icon={<Wind size={15} weight="light" />}
                label="Wind"
                value={`${data.wind} km/h`}
                extra={windDirection(data.windDeg)}
              />
              <StatCard
                icon={<Gauge size={15} weight="light" />}
                label="Pressure"
                value={`${data.pressure} hPa`}
                extra={
                  data.pressure > 1020
                    ? "High pressure"
                    : data.pressure < 1000
                    ? "Low pressure"
                    : "Normal"
                }
              />
              <StatCard
                icon={<Eye size={15} weight="light" />}
                label="Visibility"
                value={`${data.visibility} km`}
                extra="Clear"
              />
              <StatCard
                icon={<Sun size={15} weight="light" />}
                label="Sunrise / Sunset"
                value={data.sunrise}
                extra={`Sunset ${data.sunset}`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── stat card ───────────────────────────────────────── */

function StatCard({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: string;
}) {
  return (
    <div className="rounded-xl bg-white/[0.025] border border-white/[0.06] p-4 flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center gap-2 text-white/25 mb-3">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <div>
        <span className="text-[18px] font-medium text-white/80 tabular-nums leading-none">
          {value}
        </span>
        {extra && (
          <p className="text-[11px] text-white/25 mt-1.5">{extra}</p>
        )}
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────── */

function windDirection(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const idx = Math.round(deg / 45) % 8;
  return `From ${dirs[idx]}`;
}

function describeWMO(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code <= 3) return "Overcast";
  if (code <= 48) return "Foggy";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}
