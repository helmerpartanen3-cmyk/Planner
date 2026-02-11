// Tavoitteet-näkymä. Aseta ja seuraa pitkän aikavälin tavoitteita.

"use client";
import React, { useState, useMemo, useCallback } from "react";
import {
  Plus,
  X,
  Trash,
  Target,
  CheckCircle,
  Circle,
  Trophy,
  CalendarBlank,
  TrendUp,
  Flag,
  ArrowRight,
  Star,
} from "@phosphor-icons/react";
import type { Goal, Milestone } from "../../types";
import { APP_COLORS } from "../../config";

interface GoalsViewProps {
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
}

export default function GoalsView({ goals, setGoals }: GoalsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(APP_COLORS[0]);
  const [newTargetDate, setNewTargetDate] = useState("");
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const addGoal = useCallback(() => {
    if (!newTitle.trim()) return;
    const goal: Goal = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      description: newDescription.trim(),
      color: newColor,
      targetDate: newTargetDate || undefined,
      progress: 0,
      milestones: [],
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [...prev, goal]);
    setNewTitle("");
    setNewDescription("");
    setNewColor(APP_COLORS[0]);
    setNewTargetDate("");
    setShowForm(false);
  }, [newTitle, newDescription, newColor, newTargetDate, setGoals]);

  const deleteGoal = useCallback(
    (id: string) => {
      setGoals((prev) => prev.filter((g) => g.id !== id));
      if (selectedGoal === id) setSelectedGoal(null);
    },
    [setGoals, selectedGoal]
  );

  const addMilestone = useCallback(
    (goalId: string) => {
      if (!newMilestoneTitle.trim()) return;
      const milestone: Milestone = {
        id: Date.now().toString(),
        title: newMilestoneTitle.trim(),
        completed: false,
      };
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const milestones = [...g.milestones, milestone];
          const completedCount = milestones.filter((m) => m.completed).length;
          return { ...g, milestones, progress: milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0 };
        })
      );
      setNewMilestoneTitle("");
    },
    [newMilestoneTitle, setGoals]
  );

  const toggleMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const milestones = g.milestones.map((m) => (m.id === milestoneId ? { ...m, completed: !m.completed } : m));
          const completedCount = milestones.filter((m) => m.completed).length;
          return { ...g, milestones, progress: milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0 };
        })
      );
    },
    [setGoals]
  );

  const deleteMilestone = useCallback(
    (goalId: string, milestoneId: string) => {
      setGoals((prev) =>
        prev.map((g) => {
          if (g.id !== goalId) return g;
          const milestones = g.milestones.filter((m) => m.id !== milestoneId);
          const completedCount = milestones.filter((m) => m.completed).length;
          return { ...g, milestones, progress: milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0 };
        })
      );
    },
    [setGoals]
  );

  const activeGoals = goals.filter((g) => g.progress < 100);
  const completedGoals = goals.filter((g) => g.progress === 100);
  const overallProgress = goals.length
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  const detail = selectedGoal ? goals.find((g) => g.id === selectedGoal) : null;

  const getDaysLeft = (targetDate?: string) => {
    if (!targetDate) return null;
    const diff = Math.ceil((new Date(targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="flex h-full gap-4 p-6 overflow-hidden">
      {/* Left column */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-y-auto pr-1" style={{ scrollbarWidth: "none" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-white/90 text-gradient">Goals</h1>
            <p className="text-[13px] text-white/40 mt-0.5">
              {activeGoals.length} active · {completedGoals.length} achieved
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 press-effect ${
              showForm
                ? "bg-white/[0.08] text-white/60"
                : "bg-[#528BFF]/15 text-[#528BFF] hover:bg-[#528BFF]/25"
            }`}
          >
            {showForm ? <X size={14} weight="light" /> : <Plus size={14} weight="light" />}
            {showForm ? "Cancel" : "New Goal"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Active", value: activeGoals.length, icon: Target, color: "#528BFF" },
            { label: "Progress", value: `${overallProgress}%`, icon: TrendUp, color: "#34D399" },
            { label: "Achieved", value: completedGoals.length, icon: Trophy, color: "#F59E0B" },
          ].map((s, i) => (
            <div key={i} className="glass-card-static p-3 flex items-center gap-3" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                <s.icon size={18} weight="bold" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-[17px] font-bold text-white/90 stat-number">{s.value}</div>
                <div className="text-[11px] text-white/35 font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* New goal form */}
        {showForm && (
          <div className="glass-card-static p-4 animate-modal space-y-3">
            <div className="text-[13px] font-semibold text-white/70">New Goal</div>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[13px] text-white/90 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
              placeholder="What do you want to achieve?"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              autoFocus
            />
            <textarea
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[13px] text-white/80 placeholder:text-white/25 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors resize-none"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="text-[11px] text-white/35 mb-1.5 font-medium">Target Date</div>
                <input
                  type="date"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[12px] text-white/60 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                  value={newTargetDate}
                  onChange={(e) => setNewTargetDate(e.target.value)}
                />
              </div>
              <div>
                <div className="text-[11px] text-white/35 mb-1.5 font-medium">Color</div>
                <div className="flex gap-1.5">
                  {APP_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-7 h-7 rounded-lg transition-all ${newColor === c ? "scale-110 ring-2 ring-white/30" : "hover:scale-105"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={addGoal}
              className="w-full py-2 rounded-xl text-[13px] font-semibold text-white press-effect transition-expo"
              style={{ background: "var(--accent)" }}
            >
              Create Goal
            </button>
          </div>
        )}

        {/* Empty state */}
        {goals.length === 0 && !showForm && (
          <div className="glass-card-static p-8 text-center animate-modal">
            <Target size={32} weight="light" className="text-white/15 mx-auto mb-3" />
            <div className="text-[14px] font-semibold text-white/60 mb-1">No goals yet</div>
            <div className="text-[12px] text-white/30">Set your first goal and start making progress</div>
          </div>
        )}

        {/* Goal cards */}
        {activeGoals.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">In Progress</div>
            <div className="flex flex-col gap-2">
              {activeGoals.map((goal, idx) => {
                const daysLeft = getDaysLeft(goal.targetDate);
                const isSelected = selectedGoal === goal.id;

                return (
                  <div
                    key={goal.id}
                    className={`glass-card p-4 cursor-pointer transition-expo ${isSelected ? "ring-1" : ""}`}
                    style={{
                      animationDelay: `${idx * 40}ms`,
                      borderColor: isSelected ? `${goal.color}40` : undefined,
                    }}
                    onClick={() => setSelectedGoal(isSelected ? null : goal.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${goal.color}15` }}
                      >
                        <Target size={18} weight="bold" style={{ color: goal.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-semibold text-white/85 truncate">{goal.title}</span>
                          {daysLeft !== null && daysLeft >= 0 && (
                            <span className="badge text-[10px]" style={{ background: `${goal.color}15`, color: goal.color }}>
                              {daysLeft}d left
                            </span>
                          )}
                          {daysLeft !== null && daysLeft < 0 && (
                            <span className="badge text-[10px]" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                              overdue
                            </span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-[11px] text-white/30 mt-0.5 truncate">{goal.description}</p>
                        )}
                        {/* Progress bar */}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${goal.progress}%`, background: goal.color }}
                            />
                          </div>
                          <span className="text-[11px] font-bold tabular-nums" style={{ color: goal.color }}>
                            {goal.progress}%
                          </span>
                        </div>
                        <div className="text-[10px] text-white/20 mt-1">
                          {goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length} milestones
                        </div>
                      </div>
                      <ArrowRight
                        size={14}
                        className={`text-white/20 transition-all shrink-0 mt-1 ${isSelected ? "rotate-90 text-white/40" : ""}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Completed goals */}
        {completedGoals.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-white/30 uppercase tracking-wider mb-2">Achieved</div>
            <div className="flex flex-col gap-2">
              {completedGoals.map((goal, idx) => (
                <div
                  key={goal.id}
                  className="glass-card p-3.5 cursor-pointer opacity-60 hover:opacity-80 transition-all"
                  onClick={() => setSelectedGoal(selectedGoal === goal.id ? null : goal.id)}
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${goal.color}15` }}>
                      <Trophy size={16} weight="fill" style={{ color: goal.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] font-medium text-white/60 line-through truncate block">{goal.title}</span>
                    </div>
                    <CheckCircle size={18} weight="fill" style={{ color: goal.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel - detail */}
      <div className="w-72 flex flex-col gap-3 shrink-0 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        {detail ? (
          <>
            {/* Goal detail header */}
            <div className="glass-card-static p-4 animate-modal">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${detail.color}20` }}
                  >
                    {detail.progress === 100 ? (
                      <Trophy size={20} weight="fill" style={{ color: detail.color }} />
                    ) : (
                      <Target size={20} weight="bold" style={{ color: detail.color }} />
                    )}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-white/90">{detail.title}</div>
                    {detail.targetDate && (
                      <div className="text-[11px] text-white/30 flex items-center gap-1">
                        <CalendarBlank size={10} />
                        {new Date(detail.targetDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteGoal(detail.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash size={14} />
                </button>
              </div>

              {detail.description && (
                <p className="text-[12px] text-white/35 leading-relaxed mb-3">{detail.description}</p>
              )}

              {/* Big progress */}
              <div className="text-center py-3">
                <div className="text-[36px] font-bold stat-number" style={{ color: detail.color }}>
                  {detail.progress}%
                </div>
                <div className="text-[11px] text-white/30 font-medium">completed</div>
                <div className="w-full h-2 rounded-full bg-white/5 mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${detail.progress}%`, background: detail.color }}
                  />
                </div>
              </div>
            </div>

            {/* Milestones */}
            <div className="glass-card-static p-4 animate-modal" style={{ animationDelay: "50ms" }}>
              <div className="text-[12px] font-semibold text-white/50 mb-3 flex items-center gap-1.5">
                <Flag size={13} weight="bold" />
                Milestones ({detail.milestones.filter((m) => m.completed).length}/{detail.milestones.length})
              </div>

              {detail.milestones.length === 0 && (
                <p className="text-[12px] text-white/20 text-center py-3">No milestones yet</p>
              )}

              <div className="space-y-1.5">
                {detail.milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition-all group"
                  >
                    <button
                      onClick={() => toggleMilestone(detail.id, milestone.id)}
                      className="shrink-0 transition-all"
                    >
                      {milestone.completed ? (
                        <CheckCircle size={18} weight="fill" style={{ color: detail.color }} />
                      ) : (
                        <Circle size={18} className="text-white/20 hover:text-white/40" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-[12px] ${
                        milestone.completed ? "text-white/30 line-through" : "text-white/60"
                      }`}
                    >
                      {milestone.title}
                    </span>
                    <button
                      onClick={() => deleteMilestone(detail.id, milestone.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-white/15 hover:text-red-400 transition-all"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add milestone */}
              <div className="mt-3 pt-2 border-t border-white/[0.04]">
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-[12px] text-white/70 placeholder:text-white/20 outline-none focus:border-[#528BFF]/60 focus:ring-1 focus:ring-[#528BFF]/40 transition-colors"
                  placeholder="Add milestone..."
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addMilestone(detail.id);
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="glass-card-accent p-4 animate-modal" style={{ animationDelay: "100ms" }}>
              <div className="text-[12px] font-semibold text-white/50 mb-2 flex items-center gap-1.5">
                <Star size={13} weight="bold" />
                Insight
              </div>
              <p className="text-[11px] text-white/30 leading-relaxed">
                {detail.progress === 100
                  ? "Congratulations! You've achieved this goal. Consider setting new challenges."
                  : detail.progress >= 75
                    ? "Almost there! Stay focused and push through the final stretch."
                    : detail.progress >= 50
                      ? "Great progress! You're past the halfway point. Keep the momentum."
                      : detail.milestones.length === 0
                        ? "Add milestones to break this goal into manageable steps."
                        : "Early stages — consistency is key. Complete one milestone at a time."}
              </p>
            </div>
          </>
        ) : (
          <div className="glass-card-static p-5 flex flex-col items-center justify-center text-center h-64 animate-modal">
            <Target size={32} weight="light" className="text-white/15 mx-auto mb-3" />
            <div className="text-[13px] font-semibold text-white/50 mb-1">Select a goal</div>
            <div className="text-[11px] text-white/25 leading-relaxed">
              Click on any goal to see details<br />and manage milestones
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
