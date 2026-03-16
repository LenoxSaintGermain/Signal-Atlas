import { useState } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, Area, AreaChart } from "recharts";

const COLORS = {
  bg: "#EDEAE2",
  bgAlt: "#E5E2DA",
  dark: "#1B1E1C",
  darkMid: "#252A27",
  teal: "#4B9E8D",
  tealLight: "#6BBFAF",
  tealDim: "#2D7A6B",
  amber: "#C9853A",
  risk: "#B84E3A",
  muted: "#8A8A7A",
  mutedLight: "#AEADA0",
  border: "#D0CEC5",
  borderDark: "#303530",
  cream: "#F5F2EA",
};

const SIGNAL_DATA = [
  { name: "Market Fit", value: 73, fill: COLORS.teal },
  { name: "Signal Clarity", value: 41, fill: COLORS.amber },
  { name: "Narrative Cohesion", value: 58, fill: COLORS.tealLight },
];

const MARKET_BARS = [
  { label: "AI/ML Leadership", demand: 94, supply: 61, fit: 87 },
  { label: "Enterprise Transformation", demand: 88, supply: 70, fit: 79 },
  { label: "Platform Product", demand: 72, supply: 82, fit: 65 },
  { label: "GenAI Consulting", demand: 91, supply: 55, fit: 83 },
];

const MOMENTUM_DATA = [
  { t: "Q3'24", v: 42 }, { t: "Q4'24", v: 48 }, { t: "Q1'25", v: 51 },
  { t: "Q2'25", v: 59 }, { t: "Q3'25", v: 63 }, { t: "Q4'25", v: 71 },
  { t: "Q1'26", v: 74 },
];

const SignalBadge = ({ value, label, variant = "neutral" }) => {
  const colors = {
    positive: { bg: "#1B2E28", text: COLORS.teal, border: COLORS.tealDim },
    warning: { bg: "#2E2414", text: COLORS.amber, border: "#6B4A1A" },
    risk: { bg: "#2E1A16", text: "#E07060", border: "#6B2A1A" },
    neutral: { bg: "#202420", text: "#AEADA0", border: "#333" },
  };
  const c = colors[variant];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      padding: "6px 14px", display: "inline-flex", gap: 10,
      alignItems: "center", fontFamily: "'IBM Plex Mono', monospace",
    }}>
      <span style={{ fontSize: 18, fontWeight: 700, color: c.text, letterSpacing: "-0.5px" }}>{value}</span>
      <span style={{ fontSize: 9, color: c.text, opacity: 0.7, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.3 }}>{label}</span>
    </div>
  );
};

const SectionLabel = ({ children, accent }) => (
  <div style={{
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 9, letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: accent ? COLORS.teal : COLORS.muted,
    marginBottom: 12,
    display: "flex", alignItems: "center", gap: 8,
  }}>
    {accent && <span style={{ width: 16, height: 1, background: COLORS.teal, display: "inline-block" }} />}
    {children}
  </div>
);

const Divider = ({ style }) => (
  <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "0", ...style }} />
);

const MarketBar = ({ label, demand, supply, fit }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.dark, letterSpacing: "0.06em" }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: COLORS.teal, fontWeight: 700 }}>FIT {fit}</span>
    </div>
    <div style={{ position: "relative", height: 6, background: COLORS.bgAlt, borderRadius: 0, overflow: "visible" }}>
      <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${demand}%`, background: `${COLORS.teal}30`, borderRight: `2px solid ${COLORS.teal}` }} />
      <div style={{ position: "absolute", top: -2, left: `${fit}%`, width: 2, height: 10, background: COLORS.amber }} />
    </div>
    <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.mutedLight }}>▲ DEMAND {demand}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.mutedLight }}>◆ SUPPLY {supply}</span>
    </div>
  </div>
);

const EvidenceItem = ({ n, text, strength = "high" }) => {
  const strengths = { high: COLORS.teal, mid: COLORS.amber, low: "#6B6B5A" };
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${COLORS.border}20` }}>
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700,
        color: strengths[strength], minWidth: 22, paddingTop: 2,
        letterSpacing: "0.04em",
      }}>
        {String(n).padStart(2, "0")}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 14, lineHeight: 1.5, color: COLORS.darkMid, margin: 0 }}>{text}</p>
      </div>
      <div style={{ display: "flex", gap: 3, paddingTop: 5 }}>
        {[...Array(3)].map((_, i) => (
          <div key={i} style={{
            width: 5, height: 5, borderRadius: "50%",
            background: i < (strength === "high" ? 3 : strength === "mid" ? 2 : 1) ? strengths[strength] : `${strengths[strength]}30`,
          }} />
        ))}
      </div>
    </div>
  );
};

export default function ProfessionalDNABrief() {
  const [activeTab, setActiveTab] = useState("framing");

  const tabs = [
    { id: "framing", label: "Framing" },
    { id: "suite", label: "Your Suite" },
    { id: "plan", label: "Your Plan" },
    { id: "profile", label: "Your Profile" },
    { id: "operator", label: "Operator View" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'EB Garamond', Georgia, serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;700&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&display=swap');
        
        * { box-sizing: border-box; }
        
        .tab-btn { background: none; border: none; cursor: pointer; transition: all 0.15s; }
        .tab-btn:hover { opacity: 0.8; }
        
        .signal-pulse::after {
          content: '';
          display: inline-block;
          width: 6px; height: 6px;
          border-radius: 50%;
          background: ${COLORS.teal};
          margin-left: 6px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        
        .card-hover { transition: border-color 0.2s, transform 0.2s; }
        .card-hover:hover { border-color: ${COLORS.teal} !important; }
      `}</style>

      {/* ── COMMAND BAR ─────────────────────────────────────────── */}
      <div style={{
        background: COLORS.dark,
        borderBottom: `1px solid ${COLORS.borderDark}`,
        padding: "8px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <SignalBadge value="73" label={"Market\nFit"} variant="positive" />
          <SignalBadge value="41" label={"Signal\nClarity"} variant="warning" />
          <SignalBadge value="B+" label={"Comp\nIndex"} variant="neutral" />
          <SignalBadge value="HIGH" label={"Adapt\nPressure"} variant="warning" />
          <div style={{ width: 1, height: 32, background: COLORS.borderDark, margin: "0 4px" }} />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.12em" }}>
            <span className="signal-pulse" style={{ color: COLORS.teal }}>LIVE DOSSIER</span>
          </div>
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.10em" }}>
          operator@thirdsignal.ai
        </div>
      </div>

      {/* ── MASTHEAD ─────────────────────────────────────────────── */}
      <div style={{
        background: COLORS.dark,
        padding: "32px 40px 0",
        borderBottom: `1px solid ${COLORS.borderDark}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.teal, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                05 / 18 · MODULE · ARTIFACT UNLOCKED
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                PROFESSIONAL DNA
              </span>
            </div>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 52, fontWeight: 900, color: "#F0EDE5",
              margin: "0 0 6px", letterSpacing: "-1px", lineHeight: 1,
            }}>
              The Brief.
            </h1>
            <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 16, color: COLORS.mutedLight, margin: 0, fontStyle: "italic" }}>
              What we learned, what matters now, and what to do next.
            </p>
          </div>
          <div style={{
            background: "#1B2E28", border: `1px solid ${COLORS.tealDim}`,
            padding: "16px 20px", maxWidth: 240,
          }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.teal, letterSpacing: "0.14em", marginBottom: 8 }}>ABSTRACT · VERDICT</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontStyle: "italic", color: "#D0EDE6", margin: "0 0 8px", lineHeight: 1.4 }}>
              Viable with adaptation pressure.
            </p>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 12, color: COLORS.mutedLight, margin: 0, lineHeight: 1.5 }}>
              Next move built around proof, fit, and compensation posture.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: 2 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className="tab-btn"
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "10px 18px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: activeTab === t.id ? COLORS.dark : COLORS.muted,
                background: activeTab === t.id ? COLORS.bg : "transparent",
                borderTop: activeTab === t.id ? `2px solid ${COLORS.teal}` : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div style={{ padding: "0 40px 60px" }}>

        {/* ── ROW 1: THESIS + MARKET MOMENTUM ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 1, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 0 }}>

          {/* Thesis Block */}
          <div style={{ padding: "36px 36px 36px 0", borderRight: `1px solid ${COLORS.border}` }}>
            <SectionLabel>Report Thesis</SectionLabel>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 34, fontWeight: 700, color: COLORS.dark,
              lineHeight: 1.2, margin: "0 0 24px", letterSpacing: "-0.5px",
            }}>
              Your profile has value.{" "}
              <span style={{
                background: `${COLORS.teal}18`,
                borderBottom: `2px solid ${COLORS.teal}`,
                paddingBottom: 1,
              }}>
                The issue is whether that value is legible enough to clear the market.
              </span>
            </h2>

            {/* 3-Signal Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                {
                  label: "Primary Opportunity", icon: "↑", variant: "positive",
                  text: "Convert existing experience into clearer, decision-grade proof.",
                  tag: "EXPLOIT",
                },
                {
                  label: "Primary Risk", icon: "⚠", variant: "risk",
                  text: "Asking the market to infer too much from broad narrative alone.",
                  tag: "MITIGATE",
                },
                {
                  label: "Recommended Habitat", icon: "◎", variant: "neutral",
                  text: "Teams that reward visible ownership, translation, and clear operational scope.",
                  tag: "TARGET",
                },
              ].map((card) => {
                const accent = card.variant === "positive" ? COLORS.teal : card.variant === "risk" ? COLORS.risk : COLORS.amber;
                return (
                  <div
                    key={card.label}
                    className="card-hover"
                    style={{
                      border: `1px solid ${COLORS.border}`,
                      padding: "16px",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height: 2, background: accent,
                    }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: COLORS.muted, letterSpacing: "0.14em", textTransform: "uppercase" }}>{card.label}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: accent, letterSpacing: "0.1em" }}>{card.tag}</span>
                    </div>
                    <p style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: 14, lineHeight: 1.5, color: COLORS.dark, margin: 0 }}>{card.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Momentum Chart */}
          <div style={{ padding: "36px 0 36px 32px" }}>
            <SectionLabel accent>Career Market Signal</SectionLabel>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: COLORS.dark }}>+74</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.teal }}>▲ +3 MoM</span>
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.1em", marginBottom: 16, marginTop: 0 }}>COMPOSITE SIGNAL INDEX · Q1 2026</p>
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={MOMENTUM_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sigGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fill: COLORS.muted }} axisLine={false} tickLine={false} />
                <YAxis domain={[30, 85]} hide />
                <Tooltip
                  contentStyle={{ background: COLORS.dark, border: `1px solid ${COLORS.tealDim}`, borderRadius: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10 }}
                  labelStyle={{ color: COLORS.teal }} itemStyle={{ color: COLORS.mutedLight }}
                />
                <Area type="monotone" dataKey="v" stroke={COLORS.teal} strokeWidth={2} fill="url(#sigGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Signal Breakdown</SectionLabel>
              {[
                { label: "Narrative Clarity", val: 41, max: 100 },
                { label: "Market Demand Fit", val: 73, max: 100 },
                { label: "Network Capital", val: 55, max: 100 },
                { label: "Proof Density", val: 38, max: 100 },
              ].map((item) => (
                <div key={item.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.08em" }}>{item.label}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: item.val > 60 ? COLORS.teal : item.val > 45 ? COLORS.amber : COLORS.risk, fontWeight: 700 }}>{item.val}</span>
                  </div>
                  <div style={{ height: 3, background: COLORS.bgAlt, position: "relative" }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, height: "100%",
                      width: `${item.val}%`,
                      background: item.val > 60 ? COLORS.teal : item.val > 45 ? COLORS.amber : COLORS.risk,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: MARKET DEMAND + COMPENSATION POSTURE ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 1, borderBottom: `1px solid ${COLORS.border}` }}>

          {/* Market Demand Panel */}
          <div style={{ padding: "32px 36px 32px 0", borderRight: `1px solid ${COLORS.border}` }}>
            <SectionLabel accent>Market Demand Analysis</SectionLabel>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 15, fontStyle: "italic", color: COLORS.muted, marginBottom: 24, marginTop: 0, lineHeight: 1.5 }}>
              Role-habitat demand vs. supply vs. your estimated fit score across target environments.
            </p>
            {MARKET_BARS.map((d) => <MarketBar key={d.label} {...d} />)}
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              {[
                { color: `${COLORS.teal}30`, border: COLORS.teal, label: "Market Demand" },
                { color: "transparent", border: COLORS.amber, label: "Your Fit Score", dash: true },
              ].map((l) => (
                <div key={l.label} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ width: 20, height: 6, background: l.color, borderRight: `2px solid ${l.border}` }} />
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted, letterSpacing: "0.08em" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Compensation Posture */}
          <div style={{ background: COLORS.dark, padding: "32px 32px" }}>
            <SectionLabel>Compensation Posture</SectionLabel>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 22, color: "#D0EDE6", margin: "0 0 20px", lineHeight: 1.3 }}>
              Ask from evidence,<br />not aspiration.
            </p>

            <div style={{ marginBottom: 24 }}>
              {[
                { label: "Current Position", grade: "B+", delta: "±0", note: "Stable but suppressed" },
                { label: "Narrative-Adjusted", grade: "A−", delta: "+1.5 lvl", note: "With proof packaging" },
                { label: "Market Ceiling", grade: "A+", delta: "+3 lvl", note: "18-month horizon" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: `1px solid ${COLORS.borderDark}`,
                }}>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: COLORS.muted, letterSpacing: "0.12em", marginBottom: 3 }}>{row.label}</div>
                    <div style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: COLORS.mutedLight, fontStyle: "italic" }}>{row.note}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 20, fontWeight: 700, color: i === 0 ? COLORS.amber : i === 1 ? COLORS.teal : "#90EED8", letterSpacing: "-0.5px" }}>{row.grade}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: COLORS.muted }}>{row.delta}</div>
                  </div>
                </div>
              ))}
            </div>

            <SectionLabel>Needle Movers</SectionLabel>
            {[
              { n: "01", text: "Refining the executive narrative to reduce market friction.", strength: "high" },
              { n: "02", text: "Activating dormant network capital for warm introductions.", strength: "mid" },
              { n: "03", text: "Mapping market demand against specific skill leverage.", strength: "high" },
            ].map((item) => (
              <div key={item.n} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: `1px solid ${COLORS.borderDark}` }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, fontWeight: 700, color: item.strength === "high" ? COLORS.teal : COLORS.amber, minWidth: 20 }}>{item.n}</span>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: COLORS.mutedLight, margin: 0, lineHeight: 1.5 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── ROW 3: EXEC SUMMARY + EVIDENCE LEDGER + 72H ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, borderBottom: `1px solid ${COLORS.border}` }}>

          {/* Executive Summary */}
          <div style={{ padding: "32px 32px 32px 0", borderRight: `1px solid ${COLORS.border}` }}>
            <SectionLabel accent>Executive Summary</SectionLabel>
            {[
              { n: "01", text: "Current role maintenance is the primary operational constraint.", strength: "high" },
              { n: "02", text: "Strategic job search requires high-signal outreach over volume.", strength: "high" },
              { n: "03", text: "Pace is set to standard to ensure sustainable execution without burnout.", strength: "mid" },
            ].map((item) => <EvidenceItem key={item.n} {...item} />)}

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Extinction Risks</SectionLabel>
              {[
                { text: "Narrative breadth masking depth signal", level: "HIGH" },
                { text: "No proof artifacts for AI implementation scale", level: "MED" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontFamily: "'EB Garamond', serif", fontSize: 13, color: COLORS.dark, lineHeight: 1.4, flex: 1 }}>{r.text}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: r.level === "HIGH" ? COLORS.risk : COLORS.amber, fontWeight: 700, marginLeft: 12, paddingTop: 3, letterSpacing: "0.08em" }}>{r.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Adaptive Assets */}
          <div style={{ padding: "32px", borderRight: `1px solid ${COLORS.border}` }}>
            <SectionLabel accent>Adaptive Assets</SectionLabel>
            {[
              { text: "Cross-functional AI implementation with measurable COE outcomes", strength: "high" },
              { text: "15+ yr Fortune 500 pattern recognition + GenAI synthesis layer", strength: "high" },
              { text: "Founder + operator credibility in same profile — rare in market", strength: "mid" },
              { text: "Deep systems thinking applied to organizational transformation", strength: "mid" },
            ].map((item, i) => <EvidenceItem key={i} n={i + 1} {...item} />)}

            <div style={{ marginTop: 20 }}>
              <SectionLabel>Genome Markers</SectionLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {["Systems Architect", "Translation Layer", "Proof-Builder", "Compound Thinker", "Enterprise + Founder", "AI Pioneer"].map((tag) => (
                  <span key={tag} style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8, letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: `${COLORS.teal}15`,
                    border: `1px solid ${COLORS.teal}40`,
                    color: COLORS.teal,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 72-Hour War Room */}
          <div style={{ padding: "32px 0 32px 32px" }}>
            <SectionLabel accent>Next 72 Hours</SectionLabel>
            <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: 20, color: COLORS.dark, margin: "0 0 20px", lineHeight: 1.3 }}>
              Momentum<br />without noise.
            </p>

            {[
              { n: "01", label: "Action", text: "Audit existing professional collateral for signal strength.", urgency: "DO NOW", color: COLORS.teal },
              { n: "02", label: "Action", text: "Identify five high-optionality target organizations.", urgency: "DO NOW", color: COLORS.teal },
              { n: "03", label: "Setup", text: "Draft one proof narrative for AI cost reduction outcome at GFS.", urgency: "48H", color: COLORS.amber },
              { n: "04", label: "Setup", text: "Activate two warm intro paths through existing network.", urgency: "72H", color: COLORS.amber },
            ].map((action) => (
              <div key={action.n} style={{
                border: `1px solid ${COLORS.border}`,
                padding: "14px 16px",
                marginBottom: 8,
                position: "relative",
                overflow: "hidden",
              }}>
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: action.color }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: COLORS.muted, letterSpacing: "0.12em" }}>
                    {action.n} · {action.label}
                  </span>
                  <span style={{
                    fontFamily: "'IBM Plex Mono', monospace", fontSize: 8,
                    color: action.color, letterSpacing: "0.1em", fontWeight: 700,
                  }}>{action.urgency}</span>
                </div>
                <p style={{ fontFamily: "'EB Garamond', serif", fontSize: 14, color: COLORS.dark, margin: 0, lineHeight: 1.5 }}>{action.text}</p>
              </div>
            ))}

            <button style={{
              width: "100%", marginTop: 8,
              background: COLORS.teal,
              border: "none", cursor: "pointer",
              padding: "14px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10, letterSpacing: "0.16em",
              color: "#fff", textTransform: "uppercase", fontWeight: 700,
            }}>
              Open Your Plan →
            </button>
          </div>
        </div>

        {/* ── FOOTER TICKER ─── */}
        <div style={{
          borderTop: `1px solid ${COLORS.border}`,
          padding: "12px 0",
          display: "flex", gap: 32, alignItems: "center",
          overflowX: "auto",
        }}>
          {[
            { label: "REPORT GENERATED", value: "MAR 10, 2026" },
            { label: "MODEL", value: "DNA ENRICHMENT v2" },
            { label: "SECTIONS ACTIVE", value: "8 / 8" },
            { label: "EVIDENCE NODES", value: "14" },
            { label: "CONFIDENCE", value: "MODERATE-HIGH" },
            { label: "NEXT REVIEW", value: "30 DAYS" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: COLORS.muted, letterSpacing: "0.12em" }}>{item.label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: COLORS.dark, fontWeight: 700, letterSpacing: "0.08em" }}>{item.value}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
