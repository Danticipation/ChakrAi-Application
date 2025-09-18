import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { CheckCircle2, Shield, Mic, MessageCircle, Download, TrendingUp, Activity, HeartHandshake, Building2 } from "lucide-react";

// --- Mock Data ---
const summary = {
  partner: "Acme University Counseling Center",
  dates: "June 10 â€“ Aug 4, 2025 (8 weeks)",
  participants: { enrolled: 120, active: 96 },
  weeklySessions: 3.2,
  headline: "Average PHQâ€‘9 reduced by 36%",
};

const wellbeing = [
  { metric: "PHQâ€‘9", baseline: 13.4, final: 8.6 },
  { metric: "GADâ€‘7", baseline: 12.1, final: 7.4 },
  { metric: "WHOâ€‘5", baseline: 44, final: 62 },
];

const engagementByWeek = [
  { week: "W1", sessions: 210, activeUsers: 74 },
  { week: "W2", sessions: 248, activeUsers: 81 },
  { week: "W3", sessions: 276, activeUsers: 86 },
  { week: "W4", sessions: 297, activeUsers: 89 },
  { week: "W5", sessions: 311, activeUsers: 91 },
  { week: "W6", sessions: 326, activeUsers: 93 },
  { week: "W7", sessions: 334, activeUsers: 94 },
  { week: "W8", sessions: 341, activeUsers: 96 },
];

const voiceVsText = [
  { name: "Voice", value: 58 },
  { name: "Text", value: 42 },
];

const moodTrend = [
  { week: "W1", mood: 5.1, forecast: 5.1 },
  { week: "W2", mood: 5.3, forecast: 5.2 },
  { week: "W3", mood: 5.6, forecast: 5.4 },
  { week: "W4", mood: 5.8, forecast: 5.6 },
  { week: "W5", mood: 6.1, forecast: 5.9 },
  { week: "W6", mood: 6.3, forecast: 6.1 },
  { week: "W7", mood: 6.5, forecast: 6.3 },
  { week: "W8", mood: 6.7, forecast: 6.5 },
];

const featureUse = [
  { feature: "Voice Journaling", users: 68 },
  { feature: "Mood Tracker Daily", users: 54 },
  { feature: "Personality Insights", users: 61 },
  { feature: "Guided Meditations", users: 49 },
  { feature: "Therapist Portal", users: 23 },
];

const safety = { crisisFlags: 3, medianResolutionMins: 11, escalatedPct: 100 };

const npsScore = 58; // out of 100 (converted from 0-10 scale to 0-100 for radial)

const roi = [
  { title: "Reduced Absenteeism", value: "$42k est." },
  { title: "Productivity Uplift", value: "+3.4%" },
  { title: "Therapy Load Offset", value: "â€‘18%" },
];

const COLORS = ["#0d82da", "#c3c3c3", "#00cc66", "#ffcc00", "#cc0000"]; // onâ€‘brand palette

// Utility to compute % change text
const pct = (base: number, fin: number, invert = false) => {
  const change = invert ? ((fin - base) / base) * 100 : ((base - fin) / base) * 100;
  return `${change > 0 ? "â†“" : "â†‘"} ${Math.abs(change).toFixed(1)}%`;
};

export default function ChakraiPilotDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-zinc-900 text-white p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Chakrai Pilot Analytics</h1>
            <p className="text-white/70">{summary.partner} â€¢ {summary.dates}</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 transition">
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </header>

      {/* Executive Summary */}
      <section className="max-w-7xl mx-auto grid md:grid-cols-5 gap-4 mb-8">
        <div className="md:col-span-3 rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="text-sky-400" />
            <h2 className="text-xl font-semibold">Executive Summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryChip icon={<Activity className="w-4 h-4" />} label="Participants" value={`${summary.participants.active}/${summary.participants.enrolled}`} />
            <SummaryChip icon={<MessageCircle className="w-4 h-4" />} label="Sessions / wk" value={summary.weeklySessions.toFixed(1)} />
            <SummaryChip icon={<Mic className="w-4 h-4" />} label="Voice Usage" value="58%" />
            <SummaryChip icon={<Shield className="w-4 h-4" />} label="Compliance" value="HIPAA / GDPR" />
          </div>
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-sky-500/20 to-emerald-500/20 border border-white/10">
            <p className="text-sky-300 font-medium">Headline Result</p>
            <p className="text-2xl font-semibold mt-1">{summary.headline}</p>
          </div>
        </div>

        {/* NPS Gauge */}
        <div className="md:col-span-2 rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
          <div className="flex items-center gap-3 mb-3">
            <HeartHandshake className="text-emerald-400" />
            <h2 className="text-xl font-semibold">User Satisfaction (NPS)</h2>
          </div>
          <div className="h-44 -mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="60%" outerRadius="100%" data={[{ name: "NPS", value: npsScore }]} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={8} fill="#0d82da" />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-3">
            <div className="text-3xl font-bold">{(npsScore/10).toFixed(1)}</div>
            <div className="text-xs text-white/70">Likelihood to recommend (0â€“10)</div>
          </div>
        </div>
      </section>

      {/* Wellbeing Impact */}
      <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-4 mb-8">
        <Card title="Wellbeing Impact â€” Baseline vs Final">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wellbeing} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis dataKey="metric" stroke="#c3c3c3" />
                <YAxis stroke="#c3c3c3" />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e2a3a", borderRadius: 12 }} />
                <Legend />
                <Bar dataKey="baseline" name="Baseline" fill="#c3c3c3" radius={[8,8,0,0]} />
                <Bar dataKey="final" name="Final" fill="#0d82da" radius={[8,8,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 text-sm">
            {wellbeing.map((w, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-white/70">{w.metric}</p>
                <p className="text-lg font-semibold">{w.baseline} â†’ {w.final}</p>
                <p className={`text-xs ${w.metric === "WHOâ€‘5" ? "text-emerald-400" : "text-sky-300"}`}>
                  {w.metric === "WHOâ€‘5" ? pct(w.baseline, w.final, true) : pct(w.baseline, w.final)}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Engagement Overview */}
        <Card title="Engagement Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={engagementByWeek}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                  <XAxis dataKey="week" stroke="#c3c3c3" />
                  <YAxis yAxisId="left" stroke="#c3c3c3" />
                  <YAxis yAxisId="right" orientation="right" stroke="#c3c3c3" />
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e2a3a", borderRadius: 12 }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="sessions" name="Sessions" stroke="#0d82da" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="activeUsers" name="Active Users" stroke="#00cc66" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={voiceVsText} cx="50%" cy="50%" outerRadius={85} label>
                    {voiceVsText.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e2a3a", borderRadius: 12 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
            <Badge label="Avg. session length" value="9m 12s" />
            <Badge label="Topics recalled by memory" value="2.1 / session" />
            <Badge label="Retention (W1â†’W8)" value="+22%" />
          </div>
        </Card>
      </section>

      {/* Mood + Feature Use */}
      <section className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-4 mb-8">
        <Card title="Mood Trend & Forecast">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moodTrend}>
                <defs>
                  <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d82da" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#0d82da" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis dataKey="week" stroke="#c3c3c3" />
                <YAxis stroke="#c3c3c3" domain={[4.5, 7.5]} />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e2a3a", borderRadius: 12 }} />
                <Area type="monotone" dataKey="mood" stroke="#0d82da" fillOpacity={1} fill="url(#colorMood)" name="Mood" />
                <Line type="monotone" dataKey="forecast" stroke="#c3c3c3" strokeDasharray="4 4" name="Forecast" />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Feature Utilization (Users %)">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUse} layout="vertical" barCategoryGap={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                <XAxis type="number" stroke="#c3c3c3" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="feature" stroke="#c3c3c3" width={140} />
                <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1e2a3a", borderRadius: 12 }} formatter={(v: number) => `${v}%`} />
                <Bar dataKey="users" fill="#0d82da" radius={[0,8,8,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Safety + ROI + Testimonials */}
      <section className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-4 mb-10">
        <Card title="Crisis & Safety Metrics">
          <div className="grid grid-cols-3 gap-3">
            <Kpi label="# Crisis Flags" value={String(safety.crisisFlags)} />
            <Kpi label="Median Resolution" value={`${safety.medianResolutionMins}m`} />
            <Kpi label="Escalated" value={`${safety.escalatedPct}%`} />
          </div>
          <div className="mt-3 text-xs text-white/70 flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" /> All alerts followed partner protocol
          </div>
        </Card>

        <Card title="ROI Snapshot (Modelled)">
          <div className="grid gap-3">
            {roi.map((r) => (
              <div key={r.title} className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between">
                <span className="text-white/80">{r.title}</span>
                <span className="text-lg font-semibold">{r.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60 mt-2">*Estimates use conservative industry assumptions for absenteeism and productivity.</p>
        </Card>

        <Card title="Satisfaction Quotes">
          <blockquote className="text-sm text-white/80 italic">â€œThe voice journaling felt like talking to a real person.â€</blockquote>
          <blockquote className="text-sm text-white/80 italic mt-3">â€œIt remembered my last session â€” no other app Iâ€™ve tried does that.â€</blockquote>
          <blockquote className="text-sm text-white/80 italic mt-3">â€œThe mood charts helped me notice triggers earlier.â€</blockquote>
        </Card>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto">
        <div className="rounded-2xl p-6 bg-gradient-to-r from-sky-500/15 to-emerald-500/15 border border-white/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2"><Building2 className="text-sky-400" /> Ready for Enterprise Rollout</h3>
              <p className="text-white/80">EHR/FHIR integration â€¢ Therapist portal â€¢ SOC2 path â€¢ HIPAA BAA template</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-2xl bg-sky-600 hover:bg-sky-500 transition">Schedule Expansion Call</button>
              <button className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 transition">View Detailed Data</button>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto mt-6 text-xs text-white/50 text-center">
        Â© {new Date().getFullYear()} Chakrai â€¢ Pilot Analytics Report
      </footer>
    </div>
  );
}

// --- Small Presentational Components ---
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function SummaryChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-base font-semibold">{value}</div>
      </div>
    </div>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-white/70">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <div className="text-xs text-white/70">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
