"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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

import { useSkyBackground } from "./engine/useSkyBackground";
import type { SkyStateInput } from "./engine/skyTypes";
import {
  getSunPosition,
  estimateSunriseSunset,
  estimateMoonPhase,
  estimateMoonElevation,
  getSeason,
  getLocalTimeString,
} from "./engine/skyAstronomy";

/* ── types ───────────────────────────────────────────── */

interface WeatherData {
  location: string;
  country: string;
  latitude: number;
  longitude: number;
  temp: number;
  feelsLike: number;
  description: string;
  icon: string;
  weatherCode: number;
  cloudCover: number;
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
  const props = { size, weight: "fill" as const, className };

  switch (c) {
    case "01":
      return <Sun {...props} color="#FFD666" />;
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

/* ── WMO → sky weather mapping ───────────────────────── */

function wmoToSkyWeather(code: number, cloudCover: number, windSpeed: number, windDeg: number): SkyStateInput["weather"] {
  let precipitation: "none" | "rain" | "snow" | "storm" = "none";
  let fogDensity = 0;

  if (code >= 95) precipitation = "storm";
  else if (code >= 80 && code <= 82) precipitation = "rain";
  else if (code >= 85 && code <= 86) precipitation = "snow";
  else if (code >= 71 && code <= 77) precipitation = "snow";
  else if (code >= 61 && code <= 67) precipitation = "rain";
  else if (code >= 51 && code <= 57) precipitation = "rain";
  else if (code >= 40 && code <= 48) fogDensity = code <= 45 ? 0.5 : 0.8;

  return {
    cloudCover: cloudCover / 100, // API returns 0-100
    precipitation,
    fogDensity,
    visibility: fogDensity > 0 ? 2 : 10,
    windSpeed,
    windDirection: windDeg,
    weatherCode: code,
  };
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

  /* ── build SkyStateInput from weather data ────────── */
  const skyState = useMemo<SkyStateInput>(() => {
    if (!data) {
      // Default state (night sky) while loading
      return {
        time: { localTime: "12:00", sunrise: "07:00", sunset: "18:00" },
        astronomy: { sunElevation: 45, sunAzimuth: 180, moonElevation: -10, moonPhase: 0.5 },
        weather: { cloudCover: 0.2, precipitation: "none", fogDensity: 0, visibility: 10 },
        environment: { latitude: 60, longitude: 25, season: "winter" },
      };
    }

    const now = new Date();
    const { latitude, longitude } = data;
    const sunPos = getSunPosition(now, latitude, longitude);
    const moonPhase = estimateMoonPhase(now);
    const moonElevation = estimateMoonElevation(now, latitude, moonPhase);
    const season = getSeason(now, latitude);
    const localTime = getLocalTimeString(now);
    const sunTimes = estimateSunriseSunset(now, latitude, longitude);

    return {
      time: {
        localTime,
        sunrise: sunTimes.sunrise,
        sunset: sunTimes.sunset,
      },
      astronomy: {
        sunElevation: sunPos.elevation,
        sunAzimuth: sunPos.azimuth,
        moonElevation,
        moonPhase,
      },
      weather: wmoToSkyWeather(data.weatherCode, data.cloudCover, data.wind, data.windDeg),
      environment: {
        latitude,
        longitude,
        season,
      },
    };
  }, [data]);

  const { canvasRef, cloudsCanvasRef } = useSkyBackground(skyState);

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
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover` +
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
          latitude,
          longitude,
          temp: Math.round(wx.current.temperature_2m),
          feelsLike: Math.round(wx.current.apparent_temperature),
          description: describeWMO(wx.current.weather_code),
          icon: wmoToIcon(wx.current.weather_code),
          weatherCode: wx.current.weather_code,
          cloudCover: wx.current.cloud_cover ?? 0,
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
    <div className="h-full relative overflow-hidden">
      {/* ── sky background canvases ──────────────────── */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-screen h-screen"
        style={{ zIndex: -2 }}
      />
      <canvas
        ref={cloudsCanvasRef}
        className="fixed inset-0 w-screen h-screen pointer-events-none"
        style={{ zIndex: -1 }}
      />

      {/* ── dark overlay while loading ──────────────── */}
      <div
        className="fixed inset-0 w-screen h-screen pointer-events-none"
        style={{
          zIndex: 0,
          background: "#0a0a0f",
          opacity: data ? 0 : 1,
          transition: "opacity 800ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      {/* ── scrollable content over sky ──────────────── */}
      <div className="relative h-full overflow-y-auto">
        <div className="max-w-[680px] mx-auto px-4 py-3 space-y-4">
          {/* ── search ─────────────────────────────────── */}
          <div className="flex justify-center mb-2">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-300 w-[260px] backdrop-blur-md ${
                searchFocused
                  ? "saturate-130 border border-white/[0.18] shadow-lg"
                  : "saturate-130 border border-white/[0.08]"
              }`}
            >
              <MagnifyingGlass
                size={14}
                weight="regular"
                className="text-white shrink-0"
              />
              <input
                type="text"
                placeholder="Search city..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="flex-1 text-[12px] !bg-transparent !border-none !ring-0 !outline-none text-white placeholder:text-white/70"
              />
            </div>
          </div>

          {loading && !data && (
            <div className="flex items-center justify-center py-32">
              <div className="w-5 h-5 border-[1.5px] border-white/[0.1] border-t-white/40 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="text-center py-24">
              <p className="text-[12px] text-red-300/60">{error}</p>
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
                      weight="regular"
                      className="text-white"
                      style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.28))" }}
                    />
                    <span
                      className="text-[13px] text-white tracking-wide"
                      style={{ textShadow: "0 2px 10px rgba(0,0,0,0.32)" }}
                    >
                      {data.location}
                    </span>
                    <span
                      className="text-[11px] text-white"
                      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.28)" }}
                    >
                      {data.country}
                    </span>
                  </div>

                  {/* temp */}
                  <div className="relative flex items-center justify-center mb-4">
                    <span
                      className="text-[112px] font-extralight text-white tracking-tighter leading-none tabular-nums"
                      style={{ fontWeight: 100, textShadow: "0 4px 48px rgba(0,0,0,0.32), 0 1.5px 0 rgba(0,0,0,0.18)" }}
                    >
                      {data.temp}°
                    </span>
                  </div>

                  {/* description */}
                  <p
                    className="text-[14px] text-white capitalize mb-1.5"
                    style={{ textShadow: "0 2px 12px rgba(0,0,0,0.28), 0 1px 0 rgba(0,0,0,0.18)" }}
                  >
                    {data.description}
                  </p>

                  {/* high / low */}
                  <div className="flex items-center gap-3 text-[12px] tabular-nums text-white">
                    <span style={{ textShadow: "0 1.5px 6px rgba(0,0,0,0.22)" }}>H {data.high}°</span>
                    <span className="w-px h-2.5 bg-white/15" />
                    <span style={{ textShadow: "0 1.5px 6px rgba(0,0,0,0.22)" }}>L {data.low}°</span>
                  </div>
                </div>
              </div>

              {/* ── hourly ─────────────────────────────── */}
              <div className="rounded-4xl saturate-130 backdrop-blur-lg border border-white/[0.08] overflow-hidden">
                <div className="px-5 pt-3.5 pb-2">
                  <span className="text-[10px] uppercase tracking-[0.12em] text-white font-medium">
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
                              ? "text-white font-semibold"
                              : "text-white"
                          }`}
                        >
                          {h.time}
                        </span>
                        <div
                          className={`mb-2 ${isNow ? "text-white group-hover:text-white" : "text-white group-hover:text-white"} transition-colors`}
                        >
                          <WeatherIcon code={h.icon} size={16} />
                        </div>
                        {/* mini bar */}
                        <div className="w-[3px] rounded-full bg-white/[0.06] h-8 relative mb-2">
                          <div
                            className={`absolute bottom-0 w-full rounded-full transition-all ${
                              isNow
                                ? "bg-white/40"
                                : "bg-white/[0.1] group-hover:bg-white/[0.2]"
                            }`}
                            style={{ height: `${Math.max(15, pct)}%` }}
                          />
                        </div>
                        <span
                          className={`text-[11px] tabular-nums ${
                            isNow
                              ? "text-white font-semibold"
                              : "text-white group-hover:text-white"
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
                <div className="col-span-3 rounded-4xl saturate-130 backdrop-blur-lg border border-white/[0.08] overflow-hidden">
                  <div className="px-5 pt-3.5 pb-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-white font-medium">
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
                          className="flex items-center px-3 py-[9px] gap-3 rounded-xl hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="text-[11px] text-white w-8 shrink-0 font-medium">
                            {d.day}
                          </span>
                          <div className="text-white w-4 shrink-0 flex justify-center">
                            <WeatherIcon code={d.icon} size={14} />
                          </div>
                          <span className="text-[10px] text-white tabular-nums w-6 text-right shrink-0">
                            {d.low}°
                          </span>
                          <div className="flex-1 h-[3px] rounded-full bg-white/[0.08] relative mx-1.5 min-w-[60px]">
                            <div
                              className="absolute inset-y-0 rounded-full"
                              style={{
                                left: `${barLeft}%`,
                                right: `${barRight}%`,
                                background:
                                  "linear-gradient(90deg, #7DD3FC 0%, #4ADE80 40%, #FACC15 65%, #FB923C 85%, #EF4444 100%)",
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-white tabular-nums w-6 text-right shrink-0 font-medium">
                            {d.high}°
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* detail stack (2 cols) */}
                <div className="col-span-2 space-y-4">
                  <div className="rounded-4xl saturate-130 backdrop-blur-lg border border-white/[0.08] p-4 space-y-4">
                    <MiniStat
                      icon={<ThermometerSimple size={13} weight="regular" />}
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
                    <div className="h-px bg-white/[0.06]" />
                    <MiniStat
                      icon={<Wind size={13} weight="regular" />}
                      label="Wind"
                      value={`${data.wind} km/h`}
                      sub={windDirection(data.windDeg)}
                    />
                    <div className="h-px bg-white/[0.06]" />
                    <MiniStat
                      icon={<Gauge size={13} weight="regular" />}
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

                  <div className="rounded-4xl saturate-130 backdrop-blur-lg border border-white/[0.08] p-4 space-y-4">
                    <MiniStat
                      icon={<Drop size={13} weight="regular" />}
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
                    <div className="h-px bg-white/[0.06]" />
                    <MiniStat
                      icon={<Eye size={13} weight="regular" />}
                      label="Visibility"
                      value={`${data.visibility} km`}
                      sub="Clear"
                    />
                  </div>
                </div>
              </div>

              {/* ── sunrise / sunset strip ──────────────── */}
              <div className="rounded-4xl saturate-130 backdrop-blur-lg border border-white/[0.08] overflow-hidden">
                <div className="flex">
                  <div className="flex-1 p-4 flex items-center gap-3 border-r border-white/[0.06]">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <SunHorizon
                        size={16}
                        weight="fill"
                        className="text-amber-300"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-white mb-0.5">
                        Sunrise
                      </p>
                      <p className="text-[14px] text-white tabular-nums font-medium">
                        {data.sunrise}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <Moon
                        size={16}
                        weight="fill"
                        className="text-indigo-400"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-white mb-0.5">
                        Sunset
                      </p>
                      <p className="text-[14px] text-white tabular-nums font-medium">
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
        <span className="text-white/25">{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.1em] text-white font-medium">
          {label}
        </span>
      </div>
      <div className="text-right">
        <span className="text-[13px] text-white tabular-nums font-medium">
          {value}
        </span>
        {sub && <p className="text-[9px] text-white mt-0.5">{sub}</p>}
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
