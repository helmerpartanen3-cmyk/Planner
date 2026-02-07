"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Play,
  Pause,
  ArrowCounterClockwise,
  SkipForward,
  Timer,
  Coffee,
  Lightning,
} from "@phosphor-icons/react";
import type { FocusSession } from "../types";

const MODES = {
  work: { label: "Focus", duration: 25 * 60, color: "#528BFF", icon: Lightning },
  shortBreak: { label: "Short Break", duration: 5 * 60, color: "#34D399", icon: Coffee },
  longBreak: { label: "Long Break", duration: 15 * 60, color: "#A78BFA", icon: Coffee },
} as const;

type ModeKey = keyof typeof MODES;

interface Props {
  sessions: FocusSession[];
  onSessionsChange: (sessions: FocusSession[]) => void;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function FocusView({ sessions, onSessionsChange }: Props) {
  const [mode, setMode] = useState<ModeKey>("work");
  const [timeLeft, setTimeLeft] = useState(MODES.work.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  const currentMode = MODES[mode];
  const totalDuration = currentMode.duration;
  const progress = 1 - timeLeft / totalDuration;

  // Today's stats
  const today = todayStr();
  const todaySessions = sessions.filter(
    (s) => s.completedAt.startsWith(today) && s.type === "work"
  );
  const todayMinutes = Math.round(
    todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60
  );

  // SVG ring calculations
  const ringSize = 280;
  const strokeWidth = 4;
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

    // Auto-advance to next mode
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

  // Timer effect
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

  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

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
    <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-6 animate-viewEnter">
      <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-16">
        {/* Timer section */}
        <div className="flex flex-col items-center">
          {/* Mode selector */}
          <div className="flex rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 mb-12">
          {(Object.keys(MODES) as ModeKey[]).map((key) => {
            const m = MODES[key];
            return (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`px-4 py-[6px] text-[12px] rounded-lg transition-all duration-200 font-medium ${
                  mode === key
                    ? "bg-white/[0.07] text-white/80"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Timer ring */}
        <div className="relative mb-10">
          <svg
            width={ringSize}
            height={ringSize}
            className="transform -rotate-90"
          >
            {/* Background ring */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={strokeWidth}
            />
            {/* Progress ring */}
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
              style={{ opacity: isRunning ? 1 : 0.6 }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[56px] font-extralight text-white/90 tabular-nums tracking-tight"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatTime(timeLeft)}
            </span>
            <span className="text-[12px] text-white/30 font-medium uppercase tracking-wider mt-1">
              {currentMode.label}
            </span>
          </div>

          {/* Breathing ring (while running) */}
          {isRunning && (
            <div
              className="absolute inset-0 rounded-full breathing-ring pointer-events-none"
              style={{
                border: `1px solid ${currentMode.color}20`,
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-12">
          <button
            onClick={resetTimer}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-all duration-200"
            title="Reset"
          >
            <ArrowCounterClockwise size={17} weight="light" />
          </button>

          <button
            onClick={toggleRunning}
            className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: isRunning
                ? "rgba(255,255,255,0.08)"
                : currentMode.color + "25",
              color: isRunning ? "rgba(255,255,255,0.7)" : currentMode.color,
            }}
          >
            {isRunning ? (
              <Pause size={24} weight="fill" />
            ) : (
              <Play size={24} weight="fill" className="ml-0.5" />
            )}
          </button>

          <button
            onClick={skipSession}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/60 transition-all duration-200"
            title="Skip"
          >
            <SkipForward size={17} weight="light" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4 text-center">
            <Timer size={16} weight="light" className="text-blue-400/50 mx-auto mb-1.5" />
            <p className="text-xl font-semibold text-white/80 tabular-nums">{todayMinutes}</p>
            <p className="text-[10px] text-white/25 mt-0.5">Minutes today</p>
          </div>
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4 text-center">
            <Lightning size={16} weight="light" className="text-green-400/50 mx-auto mb-1.5" />
            <p className="text-xl font-semibold text-white/80 tabular-nums">{todaySessions.length}</p>
            <p className="text-[10px] text-white/25 mt-0.5">Sessions</p>
          </div>
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-4 text-center">
            <Coffee size={16} weight="light" className="text-purple-400/50 mx-auto mb-1.5" />
            <p className="text-xl font-semibold text-white/80 tabular-nums">{sessionsCompleted}</p>
            <p className="text-[10px] text-white/25 mt-0.5">This round</p>
          </div>
        </div>

        {/* Session dots */}
        {sessionsCompleted > 0 && (
          <div className="flex items-center gap-2 mt-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                  i < sessionsCompleted % 4 || (sessionsCompleted % 4 === 0 && sessionsCompleted > 0)
                    ? ""
                    : "bg-white/[0.06]"
                }`}
                style={
                  i < sessionsCompleted % 4 || (sessionsCompleted % 4 === 0 && sessionsCompleted > 0)
                    ? { background: currentMode.color }
                    : undefined
                }
              />
            ))}
            <span className="text-[10px] text-white/20 ml-1">
              until long break
            </span>
          </div>
        )}
        </div>

        {/* Side info panel */}
        <div className="hidden lg:flex flex-col gap-4 w-64 mt-4">
          {/* How Pomodoro works */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
            <h3 className="text-[12px] font-medium text-white/40 mb-4 uppercase tracking-wider">How it works</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-blue-400 font-medium">1</span>
                </div>
                <p className="text-[12px] text-white/35 leading-relaxed">Focus for 25 minutes on your task</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-green-400 font-medium">2</span>
                </div>
                <p className="text-[12px] text-white/35 leading-relaxed">Take a 5-minute break</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-purple-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-purple-400 font-medium">3</span>
                </div>
                <p className="text-[12px] text-white/35 leading-relaxed">After 4 sessions, enjoy a longer 15-minute break</p>
              </div>
            </div>
          </div>

          {/* Session history */}
          <div className="rounded-2xl bg-white/[0.025] border border-white/[0.06] p-5">
            <h3 className="text-[12px] font-medium text-white/40 mb-4 uppercase tracking-wider">Today&apos;s sessions</h3>
            {todaySessions.length === 0 ? (
              <p className="text-[12px] text-white/20 text-center py-4">No sessions yet today</p>
            ) : (
              <div className="space-y-2">
                {todaySessions.slice(-5).reverse().map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lightning size={12} weight="light" className="text-blue-400/50" />
                      <span className="text-[12px] text-white/40">
                        {new Date(s.completedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/25 tabular-nums">{Math.round(s.duration / 60)}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
