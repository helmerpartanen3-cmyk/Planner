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
  SunHorizon,
  Moon,
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
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`,
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
            `&timezone=auto&forecast_days=7`,
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

        const forecast: ForecastDay[] = wx.daily.time
          .slice(1, 7)
          .map((t: string, i: number) => {
            const dt = new Date(t + "T00:00:00");
            return {
              day: dayNames[dt.getDay()],
              date: dt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }),
              high: Math.round(wx.daily.temperature_2m_max[i + 1]),
              low: Math.round(wx.daily.temperature_2m_min[i + 1]),
              icon: wmoToIcon(wx.daily.weather_code[i + 1]),
              description: describeWMO(wx.daily.weather_code[i + 1]),
            };
          });

        const nowHour = new Date().getHours();
        const hourly: HourlyItem[] = wx.hourly.time
          .slice(nowHour, nowHour + 24)
          .map((t: string, i: number) => {
            const dt = new Date(t);
            return {
              time:
                i === 0
                  ? "Now"
                  : dt.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      hour12: false,
                    }),
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
          sunrise: sunrise.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
          sunset: sunset.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
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
  const allLows = data
    ? [data.low, ...data.forecast.map((f) => f.low)]
    : [];
  const allHighs = data
    ? [data.high, ...data.forecast.map((f) => f.high)]
    : [];
  const rangeMin = Math.min(...allLows) - 2;
  const rangeMax = Math.max(...allHighs) + 2;
  const rangeSpan = rangeMax - rangeMin || 1;

  /* hourly temp range for sparkline bars */
  const hourlyTemps = data?.hourly.map((h) => h.temp) ?? [];
  const hMin = Math.min(...hourlyTemps);
  const hMax = Math.max(...hourlyTemps);
  const hSpan = hMax - hMin || 1;

  return (
    <div className="h-full overflow-y-auto bg-neutral-900">
      <div className="max-w-[680px] mx-auto px-8 py-8 space-y-4">
        {/* ── search ─────────────────────────────────── */}
        <div className="flex justify-center mb-2">
          <div
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 w-[260px] ${
              searchFocused
                ? "bg-white/[0.08] border border-white/[0.14] shadow-lg shadow-black/20"
                : "bg-white/[0.04] border border-white/[0.06]"
            }`}
          >
            <MagnifyingGlass
              size={14}
              weight="light"
              className="text-white/20 shrink-0"
            />
            <input
              type="text"
              placeholder="Search city..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="flex-1 text-[12px] !bg-transparent !border-none !ring-0 !outline-none text-white/80 placeholder:text-white/20"
            />
          </div>
        </div>

        {loading && !data && (
          <div className="flex items-center justify-center py-32">
            <div className="w-5 h-5 border-[1.5px] border-white/[0.06] border-t-white/30 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-center py-24">
            <p className="text-[12px] text-red-400/50">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* ── hero ───────────────────────────────── */}
            <div className="relative pt-4 pb-6">
              <div className="flex flex-col items-center text-center">
                {/* location */}
                <div className="flex items-center gap-1.5 mb-5">
                  <MapPin
                    size={13}
                    weight="light"
                    className="text-white/30"
                  />
                  <span className="text-[13px] text-white/40 tracking-wide">
                    {data.location}
                  </span>
                  <span className="text-[11px] text-white/20">
                    {data.country}
                  </span>
                </div>

                {/* icon + temp */}
                <div className="relative flex items-center justify-center mb-4">
                  <span className="text-[112px] font-[200] text-white tracking-tighter leading-none tabular-nums">
                    {data.temp}°
                  </span>
                </div>

                {/* description */}
                <p className="text-[14px] text-white/50 capitalize mb-1.5">
                  {data.description}
                </p>

                {/* high / low */}
                <div className="flex items-center gap-3 text-[12px] tabular-nums text-white/30">
                  <span>H {data.high}°</span>
                  <span className="w-px h-2.5 bg-white/10" />
                  <span>L {data.low}°</span>
                </div>
              </div>
            </div>

            {/* ── hourly ─────────────────────────────── */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
              <div className="px-5 pt-3.5 pb-2">
                <span className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-medium">
                  24-Hour Forecast
                </span>
              </div>
              <div
                ref={hourlyRef}
                className="flex overflow-x-auto pb-4 pt-1 px-2 scrollbar-none"
                style={{ scrollbarWidth: "none" }}
              >
                {data.hourly.map((h, i) => {
                  const pct = ((h.temp - hMin) / hSpan) * 100;
                  const isNow = i === 0;

                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center min-w-[52px] shrink-0 group"
                    >
                      <span
                        className={`text-[10px] tabular-nums mb-2 ${
                          isNow
                            ? "text-blue-400/80 font-semibold"
                            : "text-white/20"
                        }`}
                      >
                        {h.time}
                      </span>
                      <div
                        className={`mb-2 ${isNow ? "text-white/50" : "text-white/20 group-hover:text-white/35"} transition-colors`}
                      >
                        <WeatherIcon code={h.icon} size={16} />
                      </div>
                      {/* mini bar */}
                      <div className="w-[3px] rounded-full bg-white/[0.04] h-8 relative mb-2">
                        <div
                          className={`absolute bottom-0 w-full rounded-full transition-all ${
                            isNow
                              ? "bg-blue-400/40"
                              : "bg-white/[0.08] group-hover:bg-white/[0.15]"
                          }`}
                          style={{ height: `${Math.max(15, pct)}%` }}
                        />
                      </div>
                      <span
                        className={`text-[11px] tabular-nums ${
                          isNow
                            ? "text-white/80 font-semibold"
                            : "text-white/35 group-hover:text-white/55"
                        } transition-colors`}
                      >
                        {h.temp}°
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── two-col: forecast + details ────────── */}
            <div className="grid grid-cols-5 gap-4">
              {/* forecast (3 cols) */}
              <div className="col-span-3 rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
                <div className="px-5 pt-3.5 pb-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white/20 font-medium">
                    6-Day Forecast
                  </span>
                </div>
                <div className="px-2 pb-2">
                  {data.forecast.map((d, i) => {
                    const barLeft =
                      ((d.low - rangeMin) / rangeSpan) * 100;
                    const barRight =
                      100 - ((d.high - rangeMin) / rangeSpan) * 100;

                    return (
                      <div
                        key={i}
                        className="flex items-center px-3 py-[9px] gap-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-[11px] text-white/35 w-8 shrink-0 font-medium">
                          {d.day}
                        </span>
                        <div className="text-white/20 w-4 shrink-0 flex justify-center">
                          <WeatherIcon code={d.icon} size={14} />
                        </div>
                        <span className="text-[10px] text-white/20 tabular-nums w-6 text-right shrink-0">
                          {d.low}°
                        </span>
                        <div className="flex-1 h-[3px] rounded-full bg-white/[0.04] relative mx-1.5 min-w-[60px]">
                          <div
                            className="absolute inset-y-0 rounded-full"
                            style={{
                              left: `${barLeft}%`,
                              right: `${barRight}%`,
                              background:
                                "linear-gradient(90deg, rgba(96,165,250,0.35), rgba(234,179,8,0.35))",
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-white/45 tabular-nums w-6 text-right shrink-0 font-medium">
                          {d.high}°
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* detail stack (2 cols) */}
              <div className="col-span-2 space-y-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-4">
                  <MiniStat
                    icon={<ThermometerSimple size={13} weight="light" />}
                    label="Feels Like"
                    value={`${data.feelsLike}°`}
                    sub={
                      data.feelsLike > data.temp
                        ? "Warmer than actual"
                        : data.feelsLike < data.temp
                          ? "Cooler than actual"
                          : "Similar to actual"
                    }
                  />
                  <div className="h-px bg-white/[0.04]" />
                  <MiniStat
                    icon={<Wind size={13} weight="light" />}
                    label="Wind"
                    value={`${data.wind} km/h`}
                    sub={windDirection(data.windDeg)}
                  />
                  <div className="h-px bg-white/[0.04]" />
                  <MiniStat
                    icon={<Gauge size={13} weight="light" />}
                    label="Pressure"
                    value={`${data.pressure} hPa`}
                    sub={
                      data.pressure > 1020
                        ? "High"
                        : data.pressure < 1000
                          ? "Low"
                          : "Normal"
                    }
                  />
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] p-4 space-y-4">
                  <MiniStat
                    icon={<Drop size={13} weight="light" />}
                    label="Humidity"
                    value={`${data.humidity}%`}
                    sub={
                      data.humidity > 70
                        ? "High"
                        : data.humidity < 30
                          ? "Dry"
                          : "Comfortable"
                    }
                  />
                  <div className="h-px bg-white/[0.04]" />
                  <MiniStat
                    icon={<Eye size={13} weight="light" />}
                    label="Visibility"
                    value={`${data.visibility} km`}
                    sub="Clear"
                  />
                </div>
              </div>
            </div>

            {/* ── sunrise / sunset strip ──────────────── */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.05] overflow-hidden">
              <div className="flex">
                <div className="flex-1 p-4 flex items-center gap-3 border-r border-white/[0.04]">
                  <div className="w-8 h-8 rounded-full bg-amber-400/[0.06] flex items-center justify-center">
                    <SunHorizon
                      size={16}
                      weight="light"
                      className="text-amber-400/50"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/20 mb-0.5">
                      Sunrise
                    </p>
                    <p className="text-[14px] text-white/70 tabular-nums font-medium">
                      {data.sunrise}
                    </p>
                  </div>
                </div>
                <div className="flex-1 p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-400/[0.06] flex items-center justify-center">
                    <Moon
                      size={16}
                      weight="light"
                      className="text-indigo-400/50"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-white/20 mb-0.5">
                      Sunset
                    </p>
                    <p className="text-[14px] text-white/70 tabular-nums font-medium">
                      {data.sunset}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── mini stat row ───────────────────────────────────── */

function MiniStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-white/15">{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.1em] text-white/20 font-medium">
          {label}
        </span>
      </div>
      <div className="text-right">
        <span className="text-[13px] text-white/70 tabular-nums font-medium">
          {value}
        </span>
        {sub && <p className="text-[9px] text-white/20 mt-0.5">{sub}</p>}
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
