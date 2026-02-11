// Keskittymis-näkymä. Pomodoro-ajastin pitkän kestävyyden rakentamiseen.

"use client";
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  SkipForward,
  Timer,
  Coffee,
  Lightning,
  Fire,
  TrendUp,
  Clock,
  Target,
} from "@phosphor-icons/react";
import type { FocusSession } from "../../types";
import { MODES } from "./constants";
import type { ModeKey } from "./constants";
import { todayStr } from "../../lib";

interface Props {
  sessions: FocusSession[];
  onSessionsChange: (sessions: FocusSession[]) => void;
}

export default function FocusView({ sessions, onSessionsChange }: Props) {
  const [mode, setMode] = useState<ModeKey>("work");
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentMode = MODES[mode];
  const totalDuration = currentMode.duration;
  const progress = 1 - timeLeft / totalDuration;

  const today = todayStr();
  const todaySessions = sessions.filter((s) => s.completedAt.startsWith(today) && s.type === "work");
  const todayMinutes = Math.round(todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60);

  // Weekly data for chart
  const weekData = useMemo(() => {
    const days = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(d);
      date.setDate(d.getDate() - i);
      const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const mins = Math.round(
        sessions
          .filter((s) => s.completedAt.startsWith(ds) && s.type === "work")
          .reduce((sum, s) => sum + s.duration, 0) / 60
      );
      days.push({
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        minutes: mins,
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions]);

  const weekTotal = weekData.reduce((sum, d) => sum + d.minutes, 0);
  const weekMax = Math.max(...weekData.map((d) => d.minutes), 25);

  // SVG ring
  const ringSize = 300;
  const strokeWidth = 5;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - progress * circumference;

  const completeSession = useCallback(() => {
    if (mode === "work") {
      const newSession: FocusSession = {
        id: Date.now().toString(),
        duration: totalDuration,
        completedAt: new Date().toISOString(),
        type: "work",
      };
      onSessionsChange([...sessions, newSession]);
      setSessionsCompleted((s) => s + 1);
    }

    if (mode === "work") {
      const nextSessions = sessionsCompleted + 1;
      if (nextSessions % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(MODES.longBreak.duration);
      } else {
        setMode("shortBreak");
        setTimeLeft(MODES.shortBreak.duration);
      }
    } else {
      setMode("work");
      setTimeLeft(MODES.work.duration);
    }
    setIsRunning(false);
  }, [mode, sessionsCompleted, totalDuration, sessions, onSessionsChange]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startTimeRef.current = Date.now() - (totalDuration - timeLeft) * 1000;

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = Math.max(0, totalDuration - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        completeSession();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, totalDuration, completeSession]);

  const toggleRunning = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalDuration);
  };
  const skipSession = () => {
    setIsRunning(false);
    completeSession();
  };
  const switchMode = (newMode: ModeKey) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 lg:gap-14">
        {/* Timer section */}
        <div className="flex flex-col items-center">
          {/* Mode selector */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-10">
            {(Object.keys(MODES) as ModeKey[]).map((key) => {
              const m = MODES[key];
              return (
                <button
                  key={key}
                  onClick={() => switchMode(key)}
                  className={`px-4 py-[7px] text-[12px] rounded-lg transition-expo font-medium ${
                    mode === key ? "bg-white/[0.07] text-white/80" : "text-white/30 hover:text-white/50"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Timer ring */}
          <div className="relative mb-8">
            <svg width={ringSize} height={ringSize} className="transform -rotate-90">
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth={strokeWidth}
              />
              <circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                fill="none"
                stroke={currentMode.color}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-300 ease-linear"
                style={{
                  opacity: isRunning ? 1 : 0.5,
                  filter: isRunning ? `drop-shadow(0 0 12px ${currentMode.color}40)` : "none",
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-[60px] font-extralight text-white/90 tabular-nums tracking-tight"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatTime(timeLeft)}
              </span>
              <span className="text-[12px] text-white/25 font-medium uppercase tracking-widest mt-1">
                {currentMode.label}
              </span>
            </div>

            {isRunning && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none animate-float"
                style={{ border: `1px solid ${currentMode.color}15` }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-5 mb-8">
            <button
              onClick={resetTimer}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/35 hover:text-white/60 transition-expo press-effect"
              title="Reset"
            >
              <ArrowCounterClockwise size={17} />
            </button>

            <button
              onClick={toggleRunning}
              className="w-[68px] h-[68px] rounded-full flex items-center justify-center transition-expo press-effect"
              style={{
                background: isRunning ? "rgba(255,255,255,0.07)" : `${currentMode.color}20`,
                color: isRunning ? "rgba(255,255,255,0.7)" : currentMode.color,
                boxShadow: !isRunning ? `0 0 30px ${currentMode.color}15` : "none",
              }}
            >
              {isRunning ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" className="ml-0.5" />}
            </button>

            <button
              onClick={skipSession}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/35 hover:text-white/60 transition-expo press-effect"
              title="Skip"
            >
              <SkipForward size={17} />
            </button>
          </div>

          {/* Session dots */}
          <div className="flex items-center gap-2.5">
            {Array.from({ length: 4 }, (_, i) => {
              const filled = i < sessionsCompleted % 4 || (sessionsCompleted % 4 === 0 && sessionsCompleted > 0);
              return (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full transition-all duration-500"
                  style={{
                    background: filled ? currentMode.color : "rgba(255,255,255,0.06)",
                    boxShadow: filled ? `0 0 8px ${currentMode.color}40` : "none",
                  }}
                />
              );
            })}
            <span className="text-[10px] text-white/20 ml-1">until long break</span>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-3 w-72 shrink-0">
          {/* Stats */}
          <div className="glass-card-static p-4 animate-modal">
            <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
              <Target size={13} weight="bold" />
              Today&apos;s Progress
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Minutes", value: todayMinutes, icon: Timer, color: "#528BFF" },
                { label: "Sessions", value: todaySessions.length, icon: Lightning, color: "#34D399" },
                { label: "Round", value: sessionsCompleted, icon: Fire, color: "#F59E0B" },
              ].map((s, i) => (
                <div key={i} className="p-2.5 rounded-xl text-center" style={{ background: `${s.color}08` }}>
                  <s.icon size={14} weight="bold" style={{ color: s.color }} className="mx-auto mb-1" />
                  <div className="text-[17px] font-bold text-white/85 stat-number">{s.value}</div>
                  <div className="text-[10px] text-white/25 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly chart */}
          <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "50ms" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] font-semibold text-white/50 flex items-center gap-1.5">
                <TrendUp size={13} weight="bold" />
                This Week
              </div>
              <span className="text-[11px] font-bold text-white/40">{weekTotal}m</span>
            </div>
            <div className="flex items-end gap-[6px] h-24">
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full relative" style={{ height: "80px" }}>
                    <div
                      className="absolute bottom-0 w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${Math.max(2, (d.minutes / weekMax) * 100)}%`,
                        background: d.isToday ? "#528BFF" : "rgba(255,255,255,0.06)",
                        boxShadow: d.isToday ? "0 0 12px #528BFF30" : "none",
                      }}
                    />
                  </div>
                  <span
                    className={`text-[9px] font-medium ${d.isToday ? "text-white/60" : "text-white/20"}`}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "100ms" }}>
            <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
              <Clock size={13} weight="bold" />
              Recent Sessions
            </div>
            {todaySessions.length === 0 ? (
              <p className="text-[12px] text-white/20 text-center py-4">No sessions yet today</p>
            ) : (
              <div className="space-y-1.5">
                {todaySessions
                  .slice(-6)
                  .reverse()
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.03] transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
                        <span className="text-[12px] text-white/40">
                          {new Date(s.completedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <span className="text-[11px] text-white/25 tabular-nums font-medium">
                        {Math.round(s.duration / 60)}m
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Technique tip */}
          <div className="glass-card-accent p-4 animate-modal" style={{ animationDelay: "150ms" }}>
            <div className="text-[12px] font-semibold text-white/50 mb-2">Focus Tip</div>
            <p className="text-[11px] text-white/30 leading-relaxed">
              Close all distractions before starting a session. The Pomodoro technique works best when you commit fully to one task per session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
