"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useWorkouts } from "@/hooks/useWorkouts";
import { useVitals, VitalType } from "@/hooks/useVitals";
import { useHealthMetric, TimeRange } from "@/hooks/useHealthMetric";
import { useStreak } from "@/hooks/useStreak";
import { useUnitPreference } from "@/hooks/useUnitPreference";
import { useWearableSync, ProviderType } from "@/hooks/useWearableSync";
import { useExerciseLibrary } from "@/hooks/useExerciseLibrary";
import { useLocalDraft, ExerciseEntryDraft } from "@/hooks/useLocalDraft";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import {
  Activity,
  Heart,
  TrendingUp,
  Plus,
  Trash,
  Settings,
  RefreshCw,
  Zap,
  Check,
  Database,
  LogOut,
  Calendar,
  Sparkles,
  Clock,
  Compass,
  ChevronDown,
  User,
  Gauge,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated, login, signup, logout, completeOnboarding } = useAuth();
  const { workouts, addWorkout, deleteWorkout } = useWorkouts();
  const { vitals, addVital } = useVitals();
  const { streak } = useStreak();
  const { unitPref, toggleUnits, formatWeight, formatDistance } = useUnitPreference();
  const { connectedProviders, syncing, lastSynced, connect, disconnect, syncNow } = useWearableSync();
  const { exercises, searchQuery, setSearchQuery, addCustomExercise } = useExerciseLibrary();
  const { draft, saveDraft, clearDraft } = useLocalDraft();

  const [activeTab, setActiveTab] = useState<"dashboard" | "workouts" | "vitals" | "wearables" | "settings">("dashboard");
  const [selectedMetric, setSelectedMetric] = useState<VitalType>("hr");
  const [selectedRange, setSelectedRange] = useState<TimeRange>("7d");

  // Chart statistics using health metrics hook
  const { chartData, average, averageSecondary, trendPercent, latest, isWarning } = useHealthMetric(selectedMetric, selectedRange);

  // Form states
  const [authEmail, setAuthEmail] = useState("");
  const [authName, setAuthName] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Onboarding form state
  const [onboardAge, setOnboardAge] = useState(25);
  const [onboardHeight, setOnboardHeight] = useState(175);
  const [onboardWeight, setOnboardWeight] = useState(70);
  const [onboardGoal, setOnboardGoal] = useState<"strength" | "cardio" | "general_health">("general_health");

  // Vitals manual log form state
  const [logVitalType, setLogVitalType] = useState<VitalType>("weight");
  const [logVitalValue, setLogVitalValue] = useState("");
  const [logVitalSecondary, setLogVitalSecondary] = useState("");

  // Active workout logger states
  const [wType, setWType] = useState<"strength" | "cardio" | "custom">("strength");
  const [wNotes, setWNotes] = useState("");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customExerciseCat, setCustomExerciseCat] = useState<"strength" | "cardio">("strength");

  // Auto-init draft if empty
  const ensureDraft = () => {
    if (!draft) {
      saveDraft({
        type: wType,
        notes: wNotes,
        exercises: [],
      });
    }
  };

  const handleAddExerciseToWorkout = (exName: string, exCat: "strength" | "cardio" | "custom") => {
    ensureDraft();
    const currentDraft = draft || { type: wType, notes: wNotes, exercises: [] };
    const newEx: ExerciseEntryDraft = {
      id: `ex_draft_${Date.now()}`,
      name: exName,
      category: exCat,
      sets: exCat === "strength" ? [{ reps: 10, weightKg: 60 }] : [],
      durationSec: exCat === "cardio" ? 1800 : undefined,
      distanceKm: exCat === "cardio" ? 5 : undefined,
    };
    saveDraft({
      ...currentDraft,
      exercises: [...currentDraft.exercises, newEx],
    });
  };

  const handleUpdateSet = (exId: string, setIndex: number, reps: number, weight: number) => {
    if (!draft) return;
    const updatedExs = draft.exercises.map((ex) => {
      if (ex.id === exId && ex.sets) {
        const nextSets = [...ex.sets];
        nextSets[setIndex] = { reps, weightKg: weight };
        return { ...ex, sets: nextSets };
      }
      return ex;
    });
    saveDraft({ ...draft, exercises: updatedExs });
  };

  const handleAddSet = (exId: string) => {
    if (!draft) return;
    const updatedExs = draft.exercises.map((ex) => {
      if (ex.id === exId && ex.sets) {
        return {
          ...ex,
          sets: [...ex.sets, { reps: 10, weightKg: 60 }],
        };
      }
      return ex;
    });
    saveDraft({ ...draft, exercises: updatedExs });
  };

  const handleRemoveExercise = (exId: string) => {
    if (!draft) return;
    saveDraft({
      ...draft,
      exercises: draft.exercises.filter((ex) => ex.id !== exId),
    });
  };

  const handleSaveWorkout = async () => {
    if (!draft || draft.exercises.length === 0) return;
    await addWorkout({
      type: draft.type,
      notes: draft.notes,
      exercises: draft.exercises,
      date: new Date().toISOString(),
    });
    clearDraft();
    setWNotes("");
    setActiveTab("dashboard");
  };

  const handleSaveVital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logVitalValue) return;
    await addVital({
      type: logVitalType,
      value: parseFloat(logVitalValue),
      secondaryValue: logVitalSecondary ? parseFloat(logVitalSecondary) : undefined,
      source: "manual",
    });
    setLogVitalValue("");
    setLogVitalSecondary("");
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify({ workouts, user }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vitalis_backup_${Date.now()}.json`;
    link.click();
  };

  // Auth gate
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-radial from-[#1e293b] via-[#0f172a] to-[#020617] px-4">
        <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#334155]/60 bg-[#0f172a]/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 animate-pulse">
              <Activity className="h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              Vitalis Health
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Personalized health & fitness insights at your fingertips.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (authMode === "login") {
                login(authEmail, authName || "User");
              } else {
                signup(authEmail, authName);
              }
            }}
            className="mt-8 space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</label>
              <input
                type="text"
                required
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Your Name"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 hover:to-violet-700 transition duration-300"
            >
              {authMode === "login" ? "Sign In" : "Sign Up"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            {authMode === "login" ? (
              <button onClick={() => setAuthMode("signup")} className="hover:text-indigo-400 transition">
                Need an account? Sign up
              </button>
            ) : (
              <button onClick={() => setAuthMode("login")} className="hover:text-indigo-400 transition">
                Already have an account? Log in
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Onboarding gate
  if (user && !user.isOnboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-radial from-[#1e293b] via-[#0f172a] to-[#020617] px-4">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#334155]/60 bg-[#0f172a]/80 backdrop-blur-xl p-8 shadow-2xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3 w-3" /> Quick Onboarding
            </span>
            <h2 className="mt-3 text-2xl font-bold text-white">Let's Customize Your Vitalis Profile</h2>
            <p className="mt-1 text-sm text-slate-400">
              We'll use these metrics to calibrate your healthy vital ranges.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              completeOnboarding({
                age: onboardAge,
                heightCm: onboardHeight,
                weightKg: onboardWeight,
                goal: onboardGoal,
              });
            }}
            className="mt-6 space-y-4"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Age (years)</label>
                <input
                  type="number"
                  value={isNaN(onboardAge) || !onboardAge ? "" : onboardAge}
                  onChange={(e) => setOnboardAge(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Height (cm)</label>
                <input
                  type="number"
                  value={isNaN(onboardHeight) || !onboardHeight ? "" : onboardHeight}
                  onChange={(e) => setOnboardHeight(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400">Weight (kg)</label>
                <input
                  type="number"
                  value={isNaN(onboardWeight) || !onboardWeight ? "" : onboardWeight}
                  onChange={(e) => setOnboardWeight(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400">Primary Health & Fitness Goal</label>
              <select
                value={onboardGoal}
                onChange={(e) => setOnboardGoal(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white focus:outline-none"
              >
                <option value="strength">Strength & Progressive Overload</option>
                <option value="cardio">Cardio & Heart Rate Conditioning</option>
                <option value="general_health">General Vitals Tracking</option>
              </select>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 transition"
            >
              Complete Onboarding
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-[#070b15]/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="font-bold text-xl tracking-tight text-white">
                Vitalis
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-slate-300">
              Streak: {streak} Days
            </span>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">Hello, {user?.name}</span>
              <button
                onClick={logout}
                title="Log Out"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-6 md:flex-row">
          {/* Navigation Sidebar */}
          <aside className="w-full shrink-0 md:w-60">
            <nav className="flex flex-row gap-1 rounded-2xl bg-slate-900/40 p-1.5 md:flex-col border border-slate-800/80">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition duration-200 md:justify-start ${
                  activeTab === "dashboard" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className="md:inline">Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab("workouts")}
                className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition duration-200 md:justify-start ${
                  activeTab === "workouts" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className="md:inline">Log Workouts</span>
              </button>
              <button
                onClick={() => setActiveTab("vitals")}
                className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition duration-200 md:justify-start ${
                  activeTab === "vitals" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className="md:inline">Vitals History</span>
              </button>
              <button
                onClick={() => setActiveTab("wearables")}
                className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition duration-200 md:justify-start ${
                  activeTab === "wearables" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className="md:inline">Wearable Sync</span>
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition duration-200 md:justify-start ${
                  activeTab === "settings" ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/15" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <span className="md:inline">Settings</span>
              </button>
            </nav>
          </aside>

          {/* Core Content Views */}
          <div className="flex-1 min-w-0">
            {/* DASHBOARD TAB */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Highlights */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
                      <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-white">{streak} Days</p>
                    <p className="mt-1 text-xs text-emerald-400 font-semibold">Keep it going!</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Latest Sleep</span>
                      <Clock className="h-5 w-5 text-indigo-400" />
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {vitals.find((v) => v.type === "sleep")?.value || "N/A"} hrs
                    </p>
                    <p className="mt-1 text-xs text-indigo-400 font-semibold">Source: Fitbit sync</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Latest SpO2</span>
                      <Activity className="h-5 w-5 text-teal-400" />
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {vitals.find((v) => v.type === "spo2")?.value || "N/A"}%
                    </p>
                    <p className="mt-1 text-xs text-teal-400 font-semibold">Source: Google Fit</p>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-5 shadow-sm">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">Last Workout</span>
                      <Calendar className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-white">
                      {workouts[0] ? workouts[0].type : "None"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 font-semibold truncate">
                      {workouts[0] ? new Date(workouts[0].date).toLocaleDateString() : "Log your first session"}
                    </p>
                  </div>
                </div>

                {/* Vitals Trend Chart Area */}
                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">Vitals & Health Metrics</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMetric}
                        onChange={(e) => setSelectedMetric(e.target.value as VitalType)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white"
                      >
                        <option value="hr">Resting Heart Rate (bpm)</option>
                        <option value="weight">Body Weight (kg)</option>
                        <option value="sleep">Sleep Hours</option>
                        <option value="bp">Blood Pressure</option>
                        <option value="spo2">Oxygen Saturation (SpO2)</option>
                      </select>

                      <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-700">
                        {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => setSelectedRange(r)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                              selectedRange === r ? "bg-indigo-500 text-white" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Summary Bar */}
                  <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                    <div>
                      <p className="text-xs text-slate-400">Average Value</p>
                      <p className="text-xl font-bold text-white">
                        {average} {selectedMetric === "hr" ? "bpm" : selectedMetric === "weight" ? "kg" : selectedMetric === "sleep" ? "hrs" : selectedMetric === "bp" ? `/${averageSecondary}` : "%"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Trend Change</p>
                      <span className={`text-sm font-semibold inline-flex items-center gap-0.5 ${trendPercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        <TrendingUp className="h-3.5 w-3.5" /> {trendPercent}%
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Status Check</p>
                      {isWarning ? (
                        <span className="text-xs font-bold inline-flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          <AlertTriangle className="h-3 w-3" /> Alert Range
                        </span>
                      ) : (
                        <span className="text-xs font-bold inline-flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                          Optimal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Chart Visualizer */}
                  <div className="mt-6 h-64 w-full">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} />
                          <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" }} />
                          <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#metricGrad)" />
                          {selectedMetric === "bp" && (
                            <Area type="monotone" dataKey="secondaryValue" stroke="#22c55e" strokeWidth={2.5} fillOpacity={0} />
                          )}
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-500">
                        No health data entries for selected period.
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid for Past Sessions */}
                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Recent Workouts History</h3>
                  {workouts.length > 0 ? (
                    <div className="space-y-3">
                      {workouts.slice(0, 3).map((w) => (
                        <div key={w.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 capitalize border border-indigo-500/20">
                                {w.type}
                              </span>
                              <span className="text-xs text-slate-400">{new Date(w.date).toLocaleDateString()}</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-slate-200">
                              {w.exercises.length} Exercises completed
                            </p>
                            {w.notes && <p className="text-xs text-slate-400 italic">"{w.notes}"</p>}
                          </div>
                          <button
                            onClick={() => deleteWorkout(w.id)}
                            className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-rose-400 transition"
                          >
                            <Trash className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No workouts logged. Go to the "Log Workouts" tab to start logging progressive overload.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WORKOUTS TAB */}
            {activeTab === "workouts" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Workout Details & Draft Form */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-4">Active Workout Session</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-400">Workout Type</label>
                        <select
                          value={draft ? draft.type : wType}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            setWType(val);
                            if (draft) saveDraft({ ...draft, type: val });
                          }}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                        >
                          <option value="strength">Strength Training</option>
                          <option value="cardio">Cardiovascular / Runs</option>
                          <option value="custom">Custom Session</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-400">Workout Notes</label>
                        <input
                          type="text"
                          value={draft ? draft.notes : wNotes}
                          placeholder="e.g. Morning Push day, Leg hypertrophy"
                          onChange={(e) => {
                            const val = e.target.value;
                            setWNotes(val);
                            if (draft) saveDraft({ ...draft, notes: val });
                          }}
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Active exercises inside the draft session */}
                    {draft && draft.exercises.length > 0 ? (
                      <div className="space-y-4">
                        {draft.exercises.map((ex) => (
                          <div key={ex.id} className="rounded-xl bg-slate-900/60 p-4 border border-slate-800/80">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-bold text-white">{ex.name}</span>
                              <button
                                onClick={() => handleRemoveExercise(ex.id)}
                                className="text-xs text-rose-400 hover:underline"
                              >
                                Remove
                              </button>
                            </div>

                            {ex.category === "strength" && ex.sets ? (
                              <div className="space-y-2">
                                <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-slate-400 uppercase">
                                  <span>Set</span>
                                  <span>Reps</span>
                                  <span>Weight ({unitPref === "metric" ? "kg" : "lbs"})</span>
                                  <span></span>
                                </div>
                                {ex.sets.map((set, sIdx) => (
                                  <div key={sIdx} className="grid grid-cols-4 gap-2 items-center">
                                    <span className="text-xs text-slate-300 font-bold">#{sIdx + 1}</span>
                                    <input
                                      type="number"
                                      value={isNaN(set.reps) ? "" : set.reps}
                                      onChange={(e) => handleUpdateSet(ex.id, sIdx, parseInt(e.target.value) || 0, set.weightKg)}
                                      className="rounded bg-slate-800 text-white text-xs px-2 py-1 focus:outline-none"
                                    />
                                    <input
                                      type="number"
                                      value={isNaN(set.weightKg) ? "" : set.weightKg}
                                      onChange={(e) => handleUpdateSet(ex.id, sIdx, set.reps, parseFloat(e.target.value) || 0)}
                                      className="rounded bg-slate-800 text-white text-xs px-2 py-1 focus:outline-none"
                                    />
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddSet(ex.id)}
                                  className="mt-2 text-xs font-semibold text-indigo-400 flex items-center gap-1 hover:text-white"
                                >
                                  <Plus className="h-3 w-3" /> Add Set
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-xs text-slate-400">Duration (sec)</label>
                                  <input
                                    type="number"
                                    value={ex.durationSec === undefined || isNaN(ex.durationSec) ? "" : ex.durationSec}
                                    onChange={(e) => {
                                      const nextExs = draft.exercises.map((x) =>
                                        x.id === ex.id ? { ...x, durationSec: parseInt(e.target.value) || 0 } : x
                                      );
                                      saveDraft({ ...draft, exercises: nextExs });
                                    }}
                                    className="mt-1 w-full rounded bg-slate-800 text-white text-xs px-2 py-1 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-slate-400">Distance (km)</label>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={ex.distanceKm === undefined || isNaN(ex.distanceKm) ? "" : ex.distanceKm}
                                    onChange={(e) => {
                                      const nextExs = draft.exercises.map((x) =>
                                        x.id === ex.id ? { ...x, distanceKm: parseFloat(e.target.value) || 0 } : x
                                      );
                                      saveDraft({ ...draft, exercises: nextExs });
                                    }}
                                    className="mt-1 w-full rounded bg-slate-800 text-white text-xs px-2 py-1 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          onClick={handleSaveWorkout}
                          className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-600 hover:to-violet-700 transition"
                        >
                          Save Workout Session
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-sm bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                        Workout is empty. Search and add exercises from the panel to get started!
                      </div>
                    )}
                  </div>
                </div>

                {/* Exercise Selection Panel */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-white mb-3">Add Exercises</h3>

                    <input
                      type="text"
                      placeholder="Search exercises..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none mb-4"
                    />

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                      {exercises.map((ex) => (
                        <button
                          key={ex.id}
                          onClick={() => handleAddExerciseToWorkout(ex.name, ex.category)}
                          className="w-full flex items-center justify-between rounded-xl bg-slate-900/50 p-3 text-left hover:bg-slate-800/80 transition text-sm border border-slate-800"
                        >
                          <span className="font-semibold text-slate-200">{ex.name}</span>
                          <span className="text-xs text-slate-400 capitalize">{ex.category}</span>
                        </button>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 mt-6 pt-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-400">Create Custom Exercise</p>
                      <input
                        type="text"
                        placeholder="Exercise Name (e.g. Lateral Raise)"
                        value={customExerciseName}
                        onChange={(e) => setCustomExerciseName(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!customExerciseName) return;
                            addCustomExercise(customExerciseName, "strength");
                            setCustomExerciseName("");
                          }}
                          className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-white"
                        >
                          + Strength
                        </button>
                        <button
                          onClick={() => {
                            if (!customExerciseName) return;
                            addCustomExercise(customExerciseName, "cardio");
                            setCustomExerciseName("");
                          }}
                          className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs text-white"
                        >
                          + Cardio
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VITALS TAB */}
            {activeTab === "vitals" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Manual Vitals Logging */}
                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Log Health Vitals</h3>
                  <form onSubmit={handleSaveVital} className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-400">Vital Type</label>
                      <select
                        value={logVitalType}
                        onChange={(e) => setLogVitalType(e.target.value as VitalType)}
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                      >
                        <option value="weight">Body Weight (kg)</option>
                        <option value="bp">Blood Pressure (Systolic)</option>
                        <option value="hr">Resting Heart Rate (bpm)</option>
                        <option value="sleep">Sleep (Hours)</option>
                        <option value="spo2">Oxygen Saturation (SpO2 %)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-400">
                        Primary Value {logVitalType === "bp" && "(Systolic)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={logVitalValue}
                        onChange={(e) => setLogVitalValue(e.target.value)}
                        placeholder="e.g. 72"
                        className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>

                    {logVitalType === "bp" && (
                      <div>
                        <label className="text-xs font-semibold text-slate-400">Diastolic Value</label>
                        <input
                          type="number"
                          required
                          value={logVitalSecondary}
                          onChange={(e) => setLogVitalSecondary(e.target.value)}
                          placeholder="e.g. 80"
                          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none"
                        />
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 transition"
                    >
                      Log Vital Entry
                    </button>
                  </form>
                </div>

                {/* Vitals History Listing */}
                <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Vitals Logs History</h3>
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                    {vitals.map((v) => (
                      <div key={v.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-300 capitalize">{v.type === "hr" ? "Heart Rate" : v.type === "bp" ? "Blood Pressure" : v.type}</span>
                            <span className="text-[10px] text-slate-400">{new Date(v.recordedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="mt-1 text-lg font-bold text-white">
                            {v.value}
                            {v.secondaryValue ? `/${v.secondaryValue}` : ""}
                            <span className="text-xs font-normal text-slate-400 ml-1">
                              {v.type === "hr" ? "bpm" : v.type === "weight" ? "kg" : v.type === "sleep" ? "hrs" : v.type === "spo2" ? "%" : ""}
                            </span>
                          </p>
                        </div>
                        <span className="rounded bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold text-indigo-400 capitalize border border-indigo-500/20">
                          {v.source}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* WEARABLES TAB */}
            {activeTab === "wearables" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white">Integrate Wearable Devices</h3>
                  <p className="text-xs text-slate-400">Sync metrics from your Google Fit or Fitbit device.</p>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6">
                    {/* Google Fit Integration */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-white">Google Fit REST API</h4>
                          <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                            connectedProviders.includes("google_fit") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            {connectedProviders.includes("google_fit") ? "Connected" : "Disconnected"}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Integrates via Google OAuth2 credentials. Syncs daily steps counts, average heart rates, and Sleep intervals.
                        </p>
                        {lastSynced.google_fit && (
                          <p className="mt-2 text-[10px] text-slate-500">
                            Last synced: {new Date(lastSynced.google_fit).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex gap-2">
                        {connectedProviders.includes("google_fit") ? (
                          <>
                            <button
                              onClick={() => syncNow("google_fit")}
                              disabled={syncing.google_fit}
                              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-1"
                            >
                              <RefreshCw className={`h-3 w-3 ${syncing.google_fit ? "animate-spin" : ""}`} /> Sync Now
                            </button>
                            <button
                              onClick={() => disconnect("google_fit")}
                              className="rounded-xl border border-rose-500/30 hover:bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => connect("google_fit")}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-indigo-600 hover:to-violet-700 transition"
                          >
                            Connect Google Fit Account
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Apple Health Integration */}
                    <div className="rounded-2xl border border-slate-800 bg-[#0a0f1d] p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-bold text-white">Apple HealthKit</h4>
                          <span className={`rounded px-2.5 py-0.5 text-xs font-semibold ${
                            connectedProviders.includes("apple_health") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-400"
                          }`}>
                            {connectedProviders.includes("apple_health") ? "Connected" : "Disconnected"}
                          </span>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Secure sync with Apple HealthKit data database. Import workout volumes, resting heart rate history, and sleep patterns directly.
                        </p>
                        {lastSynced.apple_health && (
                          <p className="mt-2 text-[10px] text-slate-500">
                            Last synced: {new Date(lastSynced.apple_health).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="mt-6 flex gap-2">
                        {connectedProviders.includes("apple_health") ? (
                          <>
                            <button
                              onClick={() => syncNow("apple_health")}
                              disabled={syncing.apple_health}
                              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-1"
                            >
                              <RefreshCw className={`h-3 w-3 ${syncing.apple_health ? "animate-spin" : ""}`} /> Sync Now
                            </button>
                            <button
                              onClick={() => disconnect("apple_health")}
                              className="rounded-xl border border-rose-500/30 hover:bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-400"
                            >
                              Disconnect
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => connect("apple_health")}
                            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 py-2.5 text-xs font-semibold text-white shadow-lg hover:from-indigo-600 hover:to-violet-700 transition"
                          >
                            Connect Apple Health
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SETTINGS TAB */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-800 bg-[#0e1626] p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-white mb-4">Application Preferences</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">System Unit Metrics</p>
                        <p className="text-xs text-slate-400">Current Unit System: {unitPref === "metric" ? "Metric (kg, cm, km)" : "Imperial (lbs, ft/in, mi)"}</p>
                      </div>
                      <button
                        onClick={toggleUnits}
                        className="rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-600"
                      >
                        Switch Unit Preference
                      </button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4 border border-slate-800">
                      <div>
                        <p className="text-sm font-semibold text-slate-200">Data Backup & Sync Export</p>
                        <p className="text-xs text-slate-400">Backup your logs and user configurations offline in JSON format.</p>
                      </div>
                      <button
                        onClick={handleExportData}
                        className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                      >
                        Export backup.json
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
