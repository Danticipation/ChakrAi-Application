export default function ChakraiPlans() {
  const plans = [
    {
      id: "free",
      name: "Free",
      emoji: "🆓",
      price: "$0",
      blurb: "Great to start your wellness journey.",
      highlight: false,
    },
    {
      id: "premium",
      name: "Premium",
      emoji: "💎",
      price: "$9.99/mo",
      blurb: "Unlimited conversations + deeper insights.",
      highlight: true,
    },
    {
      id: "pro",
      name: "Professional",
      emoji: "🏥",
      price: "Contact Sales",
      blurb: "For clinics & enterprises with compliance needs.",
      highlight: false,
    },
  ];

  type Feature = {
    label: string;
    tiers: { free?: boolean | string; premium?: boolean | string; pro?: boolean | string };
    note?: string;
    group?: string;
  };

  const features: Feature[] = [
    { group: "Core",
      label: "Basic Traits",
      tiers: { free: "10", premium: "190+", pro: "190+" }
    },
    {
      label: "Psychological Domains",
      tiers: { free: "Overview", premium: "9 Complete", pro: "9 Complete + Clinical" },
    },
    { label: "Monthly Analyses", tiers: { free: "1", premium: "Unlimited", pro: "Unlimited" } },
    {
      label: "Therapeutic Guidance",
      tiers: { free: "Basic tips", premium: "Clinical-grade", pro: "Professional protocols" },
    },
    { group: "Productivity",
      label: "Progress Tracking",
      tiers: { free: false, premium: true, pro: "Advanced" },
    },
    { label: "Export Reports", tiers: { free: false, premium: true, pro: "Clinical-grade" } },
    { label: "Domain Deep‑dives", tiers: { free: false, premium: true, pro: true } },
    { group: "Pro / Enterprise",
      label: "Multi‑client Management",
      tiers: { free: false, premium: false, pro: true },
    },
    { label: "API Access", tiers: { free: false, premium: false, pro: true } },
    { label: "White‑label Options", tiers: { free: false, premium: false, pro: true } },
    { label: "HIPAA Compliance", tiers: { free: "Basic", premium: "Enhanced", pro: "Full" } },
    { label: "Support Level", tiers: { free: "Community", premium: "Priority", pro: "Dedicated" } },
    { label: "Clinical Reporting", tiers: { free: false, premium: false, pro: true } },
    { label: "Research Tools", tiers: { free: false, premium: false, pro: true } },
  ];

  const groups = [
    { key: "Core", label: "Core Capabilities" },
    { key: "Productivity", label: "Productivity & Insights" },
    { key: "Pro / Enterprise", label: "Pro & Enterprise" },
  ];

  const tick = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="currentColor" d="M9.55 17.54 4.8 12.8l1.4-1.4 3.35 3.34 7.4-7.39 1.4 1.41-8.8 8.78z" />
    </svg>
  );

  const x = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z" />
    </svg>
  );

  function Cell({ value }: { value: boolean | string | undefined }) {
    if (value === true) return <span className="inline-flex items-center justify-center rounded-md bg-emerald-600/10 px-2 py-1 text-sm font-medium text-emerald-600">{tick}</span>;
    if (value === false) return <span className="inline-flex items-center justify-center rounded-md bg-rose-600/10 px-2 py-1 text-sm font-medium text-rose-600">{x}</span>;
    if (typeof value === "string") return <span className="text-sm font-medium text-slate-200">{value}</span>;
    return <span className="text-slate-400">—</span>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 text-slate-100">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Choose Your Chakrai Plan</h2>
        <p className="mt-3 text-slate-300">Built for individuals, professionals, and clinics. Upgrade anytime.</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className={`relative rounded-2xl border bg-gradient-to-b from-slate-800/60 to-slate-900/60 backdrop-blur-sm p-6 shadow-xl ${
              p.highlight ? "border-emerald-400/40 ring-2 ring-emerald-400/30" : "border-white/10"
            }`}
          >
            {p.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-black shadow-lg">
                Most Popular
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-2xl" aria-hidden>{p.emoji}</span>
              <h3 className="text-xl font-bold">{p.name}</h3>
            </div>
            <div className="mt-2 text-2xl font-semibold">{p.price}</div>
            <p className="mt-1 text-sm text-slate-300">{p.blurb}</p>

            <button
              className={`mt-5 w-full rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
                p.highlight
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-white/10 hover:bg-white/15"
              }`}
            >
              {p.id === "free" ? "Get Started" : p.id === "premium" ? "Upgrade to Premium" : "Contact Sales"}
            </button>
          </div>
        ))}
      </div>

      {/* Feature Matrix (pretty) */}
      <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="grid grid-cols-12 items-end gap-2 pb-4 border-b border-white/10">
          <div className="col-span-6 md:col-span-6" />
          <div className="col-span-2 text-center font-semibold">Free</div>
          <div className="col-span-2 text-center font-semibold">Premium</div>
          <div className="col-span-2 text-center font-semibold">Professional</div>
        </div>

        {groups.map((g) => (
          <div key={g.key} className="divide-y divide-white/5">
            <div className="py-3 text-sm uppercase tracking-wider text-slate-300/80">{g.label}</div>
            {features
              .filter((f) => (f.group ?? "Core") === g.key)
              .map((f, idx) => (
                <div
                  key={f.label}
                  className={`grid grid-cols-12 items-center gap-2 py-3 ${idx % 2 === 0 ? "bg-white/2" : ""}`}
                >
                  <div className="col-span-6 md:col-span-6 text-sm font-medium">{f.label}</div>
                  <div className="col-span-2 text-center"><Cell value={f.tiers.free} /></div>
                  <div className="col-span-2 text-center"><Cell value={f.tiers.premium} /></div>
                  <div className="col-span-2 text-center"><Cell value={f.tiers.pro} /></div>
                </div>
              ))}
          </div>
        ))}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-slate-300">
          <p>All plans include secure data handling, privacy controls, and mobile‑first experience.</p>
          <a href="#" className="underline decoration-emerald-400/60 underline-offset-4 hover:decoration-emerald-300">See full plan details</a>
        </div>
      </div>
    </div>
  );
}
