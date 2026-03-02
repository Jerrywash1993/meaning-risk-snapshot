import { useState, useEffect } from "react";
import { generatePDF } from './generatePDF.js';

// ─── CONFIGURATION ────────────────────────────────────────────────
const FAILURE_TYPES = [
  {
    id: "referent-ambiguity",
    name: "Referent Ambiguity",
    short: "Referent",
    icon: "👤",
    color: "#E8927C",
    definition: "A word or phrase points to different things for different people. Neither side knows they're talking about different referents.",
    repairMoves: ["Term Pinning", "Who/They Resolution", "Grounding Verification"],
    repairDetail: "When you catch a vague referent, stop and pin it: 'When we say the client, I mean [Name] at [Company]. Does that match your understanding?' Replace every 'they' with a specific name and role.",
    moduleLink: "Module 2 & Module 5"
  },
  {
    id: "scope-drift",
    name: "Scope Drift",
    short: "Scope",
    icon: "🔀",
    color: "#D4A574",
    definition: "The boundaries of a task, decision, or conversation shift without anyone naming the shift. The original question is never answered.",
    repairMoves: ["Scope Check", "Decision Framing", "Clarity Minute"],
    repairDetail: "Deploy the Scope Check mid-meeting: 'Are we still deciding [original question], or has the question changed?' Name the drift so the team can choose whether to follow it or return.",
    moduleLink: "Module 6 & Module 7"
  },
  {
    id: "assumption-gap",
    name: "Assumption Gap",
    short: "Assumption",
    icon: "🕳️",
    color: "#7C9EB8",
    definition: "Context one person holds but hasn't shared, because they believe everyone already knows it. The most dangerous gaps feel too obvious to state.",
    repairMoves: ["Hypothesis Opener", "Curiosity Opener", "Grounding Verification"],
    repairDetail: "Use the Hypothesis Opener before every handoff: 'I want to check my understanding — my assumption is [X]. Does that match yours?' State the obvious. The 'obvious' is where gaps hide.",
    moduleLink: "Module 3 & Module 5"
  },
  {
    id: "hinge-term",
    name: "Hinge-Term Confusion",
    short: "Hinge-Term",
    icon: "⚖️",
    color: "#9B8EC4",
    definition: "A term carrying real operational weight means something different to different people. 'Soon,' 'priority,' 'done' — these pivot decisions, and their ambiguity is invisible.",
    repairMoves: ["Term Pinning", "Zoom-In Word", "Next-Step Precision"],
    repairDetail: "Deploy the Zoom-In Word: 'When you say priority, can you give me a concrete timeline?' Force vague operational language into specific, actionable form before anyone leaves the room.",
    moduleLink: "Module 5 & Module 7"
  },
  {
    id: "status-misalignment",
    name: "Status Misalignment",
    short: "Status",
    icon: "📊",
    color: "#6BAF8D",
    definition: "People disagree about where a task, project, or decision stands — in progress vs. complete, my responsibility vs. yours — without realizing they disagree.",
    repairMoves: ["Next-Step Precision", "DACI Roles", "Decision Log"],
    repairDetail: "Close every decision with Next-Step Precision: who does what by when, documented. Use DACI roles assigned before the decision begins. If you can't name the Driver, the decision hasn't been made.",
    moduleLink: "Module 7"
  },
  {
    id: "context-collapse",
    name: "Context Collapse",
    short: "Context",
    icon: "🌫️",
    color: "#C4857B",
    definition: "Information available in one setting does not travel to the next setting where it's needed. The meaning was clear once; it collapsed in transit.",
    repairMoves: ["Clarity Minute", "Decision Log", "Grounding Verification"],
    repairDetail: "Treat every meeting-to-meeting transition as a potential collapse point. End with a Clarity Minute: 'What have we agreed to so far?' Then document it where the next audience will actually see it.",
    moduleLink: "Module 6 & Module 9"
  }
];

const QUESTIONS = [
  // ── Referent Ambiguity ──
  { failureType: "referent-ambiguity", scenario: "In your last team meeting, someone referred to 'the client' or 'the stakeholder.'", question: "How confident are you that everyone in the room pictured the same person?", lowLabel: "We were definitely picturing different people", highLabel: "I'm certain we all meant the same person", reverseScored: true },
  { failureType: "referent-ambiguity", scenario: "Your team is discussing 'the project' in a group conversation.", question: "How often do you later discover people were thinking of different deliverables or phases?", lowLabel: "Almost never — we're always aligned", highLabel: "Frequently — it happens most weeks", reverseScored: false },
  { failureType: "referent-ambiguity", scenario: "In a recent email thread or Slack conversation, someone wrote 'they should handle that.'", question: "How often are you unsure who exactly 'they' refers to?", lowLabel: "Rarely — pronouns are clear in context", highLabel: "Often — I have to ask for clarification", reverseScored: false },
  // ── Scope Drift ──
  { failureType: "scope-drift", scenario: "Your team starts a meeting with a clear agenda item to decide.", question: "How often does the meeting end having addressed a different question than the one originally posed?", lowLabel: "Rarely — we stay on topic", highLabel: "Frequently — we drift almost every time", reverseScored: false },
  { failureType: "scope-drift", scenario: "A decision was reached in a previous meeting.", question: "In the past month, how often has a decision been reopened or re-discussed without anyone acknowledging it was already made?", lowLabel: "Never — our decisions stick", highLabel: "Multiple times — we re-decide constantly", reverseScored: false },
  { failureType: "scope-drift", scenario: "Mid-conversation, the topic visibly shifts from the original subject.", question: "How often does someone on your team explicitly name the shift — saying something like 'we've moved away from the original question'?", lowLabel: "Almost always — we're disciplined about this", highLabel: "Almost never — shifts go unnamed", reverseScored: false },
  // ── Assumption Gap ──
  { failureType: "assumption-gap", scenario: "Work has begun on a new task or initiative.", question: "How often do you discover — after work has started — that a teammate was operating under a key assumption you didn't share?", lowLabel: "Rarely — we surface assumptions early", highLabel: "Frequently — hidden assumptions derail us", reverseScored: false },
  { failureType: "assumption-gap", scenario: "You hand off a piece of work to a colleague.", question: "How much context do you typically assume they already have that you don't state explicitly?", lowLabel: "Very little — I over-communicate deliberately", highLabel: "A lot — I assume shared knowledge", reverseScored: false },
  { failureType: "assumption-gap", scenario: "A task needs to be redone because of a misunderstanding.", question: "How often does your team experience rework because someone didn't know something that seemed 'obvious' to others?", lowLabel: "Almost never", highLabel: "It's one of our biggest time sinks", reverseScored: false },
  // ── Hinge-Term Confusion ──
  { failureType: "hinge-term", scenario: "A teammate marks a task as 'done' or 'complete.'", question: "How confident are you that their definition of 'done' matches yours?", lowLabel: "Very confident — we have shared definitions", highLabel: "Not at all — 'done' means different things", reverseScored: false },
  { failureType: "hinge-term", scenario: "Someone labels a request as 'urgent' or 'high priority.'", question: "How often do those words produce different response times from different team members?", lowLabel: "Rarely — we have calibrated urgency levels", highLabel: "Frequently — 'urgent' is meaningless", reverseScored: false },
  { failureType: "hinge-term", scenario: "A colleague says they'll get something to you 'soon' or 'shortly.'", question: "How often does their actual timeline match what you expected?", lowLabel: "Almost always — our timelines align", highLabel: "Rarely — 'soon' could mean anything", reverseScored: false },
  // ── Status Misalignment ──
  { failureType: "status-misalignment", scenario: "You check in on a shared project.", question: "How often do you and a teammate disagree about whether a task is 'in progress,' 'pending review,' or 'complete'?", lowLabel: "Rarely — our status tracking is clear", highLabel: "Often — we're frequently out of sync", reverseScored: false },
  { failureType: "status-misalignment", scenario: "A project milestone is discussed in a meeting.", question: "How often do team members have different understandings of who owns the next step?", lowLabel: "Rarely — ownership is always explicit", highLabel: "Often — ownership is assumed, not assigned", reverseScored: false },
  { failureType: "status-misalignment", scenario: "A topic comes up that was discussed previously.", question: "How often does your team experience confusion about whether a decision has actually been made or is still open?", lowLabel: "Rarely — our decision states are clear", highLabel: "Frequently — nobody knows what's decided", reverseScored: false },
  // ── Context Collapse ──
  { failureType: "context-collapse", scenario: "Important information emerges in a team meeting.", question: "How reliably does that information reach the people who need it but weren't in the room?", lowLabel: "Very reliably — we have strong handoff practices", highLabel: "Poorly — critical info gets lost in transit", reverseScored: false },
  { failureType: "context-collapse", scenario: "A key decision or insight surfaces in a side conversation, DM, or chat thread.", question: "How often does it reach everyone who is affected by it?", lowLabel: "Almost always — we route information well", highLabel: "Rarely — side channels are black holes", reverseScored: false },
  { failureType: "context-collapse", scenario: "During a team discussion, someone says 'I didn't know about that.'", question: "How often does this happen regarding information that was shared in a different setting?", lowLabel: "Almost never", highLabel: "It's a recurring frustration", reverseScored: false }
];

const CONTENT_PREFERENCES = [
  { id: "micro-protocols", label: "Micro-protocols I can use in my next meeting" },
  { id: "case-studies", label: "Real-world case studies of meaning breakdown" },
  { id: "leader-tools", label: "Leadership tools for building psychological safety" },
  { id: "measurement", label: "How to measure communication health over time" },
  { id: "cultural", label: "Adapting repair across cultures and power distances" },
  { id: "decision-tools", label: "Decision frameworks that prevent re-deciding loops" },
  { id: "debrief", label: "Debrief structures for learning from breakdowns" },
  { id: "remote-teams", label: "Meaning repair for distributed / remote teams" }
];

// ─── STYLES ───────────────────────────────────────────────────────
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
  :root {
    --ink: #1a1a2e;
    --ink-light: #3d3d56;
    --ink-muted: #6b6b82;
    --parchment: #f7f5f0;
    --parchment-warm: #f0ece4;
    --parchment-deep: #e8e2d6;
    --gold: #c9a84c;
    --gold-bright: #dbb94e;
    --gold-muted: #b89a45;
    --red-risk: #c94c4c;
    --orange-risk: #d4855a;
    --yellow-risk: #c9a84c;
    --green-safe: #5a9e6f;
    --font-display: 'Cormorant Garamond', Georgia, serif;
    --font-body: 'DM Sans', -apple-system, sans-serif;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--parchment); color: var(--ink); }
  ::selection { background: var(--gold); color: white; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;

// ─── UTILITY COMPONENTS ───────────────────────────────────────────
function ProgressBar({ current, total, phase }) {
  const pct = (current / total) * 100;
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(247,245,240,0.95)", backdropFilter: "blur(8px)",
      borderBottom: "1px solid var(--parchment-deep)", padding: "12px 24px"
    }}>
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600,
          color: "var(--gold-muted)", letterSpacing: "0.05em", textTransform: "uppercase",
          whiteSpace: "nowrap"
        }}>{phase}</span>
        <div style={{ flex: 1, height: 3, background: "var(--parchment-deep)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: "var(--gold)", borderRadius: 2, transition: "width 0.5s cubic-bezier(0.4,0,0.2,1)" }} />
        </div>
        <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>{current} / {total}</span>
      </div>
    </div>
  );
}

function FadeIn({ children, delay = 0, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", style: overrides = {} }) {
  const [hovered, setHovered] = useState(false);
  const base = {
    fontFamily: "var(--font-display)", fontWeight: 600, border: "none",
    cursor: disabled ? "default" : "pointer", letterSpacing: "0.04em",
    transition: "all 0.3s ease", display: "inline-flex", alignItems: "center", gap: 8
  };
  const variants = {
    primary: {
      fontSize: 16, padding: "14px 40px",
      background: disabled ? "var(--parchment-deep)" : hovered ? "var(--gold-muted)" : "var(--ink)",
      color: disabled ? "var(--ink-muted)" : "var(--parchment)", opacity: disabled ? 0.6 : 1,
    },
    secondary: {
      fontSize: 14, padding: "12px 28px",
      background: hovered ? "var(--parchment-warm)" : "white",
      color: "var(--ink)", border: "1px solid var(--parchment-deep)",
    },
    gold: {
      fontSize: 16, padding: "14px 36px",
      background: hovered ? "var(--gold-bright)" : "var(--gold)",
      color: "var(--ink)",
    }
  };
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variants[variant], ...overrides }}>
      {children}
    </button>
  );
}

// ─── LANDING SCREEN ───────────────────────────────────────────────
function LandingScreen({ onStart }) {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", padding: "40px 24px",
      background: `radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.08) 0%, transparent 60%), var(--parchment)`
    }}>
      <FadeIn>
        <div style={{ textAlign: "center", maxWidth: 640 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold-muted)", marginBottom: 24 }}>
            What Time Binds — Meaning Repair for High-Stakes Teams
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 500, lineHeight: 1.15, color: "var(--ink)", marginBottom: 8 }}>
            The Meaning Risk<br />Snapshot
          </h1>
          <div style={{ width: 60, height: 2, background: "var(--gold)", margin: "24px auto" }} />
          <p style={{ fontFamily: "var(--font-display)", fontSize: "clamp(18px, 2.5vw, 22px)", fontWeight: 400, fontStyle: "italic", color: "var(--ink-light)", lineHeight: 1.5, marginBottom: 32 }}>
            Where is meaning failing on your team right now?
          </p>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.7, maxWidth: 520, margin: "0 auto 40px" }}>
            This 5-minute diagnostic measures your team's communication health across six
            failure types identified in the MRCI framework. You'll receive a personalized
            Meaning Risk Heatmap, a targeted Repair Conversation Guide, and a downloadable PDF report.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center", marginBottom: 48 }}>
            {[
              ["18 scenario-based questions", "3 per failure type"],
              ["Visual heatmap", "showing where drift is most severe"],
              ["Downloadable PDF report", "with your personalized repair guide"]
            ].map(([title, sub], i) => (
              <FadeIn key={i} delay={300 + i * 150}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, fontFamily: "var(--font-body)", fontSize: 14 }}>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>—</span>
                  <span style={{ fontWeight: 500, color: "var(--ink-light)" }}>{title}</span>
                  <span style={{ color: "var(--ink-muted)", fontSize: 13 }}>{sub}</span>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={800}>
            <Btn onClick={onStart}>Begin Assessment →</Btn>
          </FadeIn>
          <FadeIn delay={1000}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-muted)", marginTop: 24, fontStyle: "italic" }}>
              No account required. Your responses are used to generate your report only.
            </p>
          </FadeIn>
        </div>
      </FadeIn>
    </div>
  );
}

// ─── CONTEXT SCREEN ───────────────────────────────────────────────
function ContextScreen({ onSubmit }) {
  const [role, setRole] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [industry, setIndustry] = useState("");
  const [setting, setSetting] = useState("");
  const canProceed = role && teamSize;

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 24px", background: "var(--parchment)" }}>
      <FadeIn>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold-muted)", marginBottom: 12 }}>Before we begin</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.2 }}>Tell us about your team</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", marginBottom: 36, lineHeight: 1.6 }}>
            This context helps calibrate your results. Only role and team size are required.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <FieldGroup label="Your role on the team *" value={role} onChange={setRole} options={["Team leader / Manager", "Individual contributor", "Executive / Senior leader", "External consultant or coach"]} />
            <FieldGroup label="Team size *" value={teamSize} onChange={setTeamSize} options={["2–5 people", "6–12 people", "13–25 people", "25+ people"]} />
            <FieldGroup label="Industry (optional)" value={industry} onChange={setIndustry} options={["Technology", "Healthcare", "Education", "Government / Military", "Financial services", "Consulting / Professional services", "Nonprofit", "Other"]} />
            <FieldGroup label="Work setting (optional)" value={setting} onChange={setSetting} options={["Fully remote", "Hybrid", "Fully in-person"]} />
          </div>
          <div style={{ marginTop: 40 }}>
            <Btn onClick={() => canProceed && onSubmit({ role, teamSize, industry, setting })} disabled={!canProceed}>Start the Snapshot →</Btn>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

function FieldGroup({ label, value, onChange, options }) {
  return (
    <div>
      <label style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--ink-light)", display: "block", marginBottom: 10, letterSpacing: "0.02em" }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)} style={{
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400, padding: "8px 16px",
            background: value === opt ? "var(--ink)" : "white",
            color: value === opt ? "var(--parchment)" : "var(--ink-light)",
            border: `1px solid ${value === opt ? "var(--ink)" : "var(--parchment-deep)"}`,
            cursor: "pointer", transition: "all 0.2s ease", lineHeight: 1.4
          }}>{opt}</button>
        ))}
      </div>
    </div>
  );
}

// ─── QUESTION SCREEN ──────────────────────────────────────────────
function QuestionScreen({ question, questionIndex, totalQuestions, onAnswer }) {
  const [value, setValue] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const ft = FAILURE_TYPES.find(f => f.id === question.failureType);

  const handleSubmit = () => {
    if (value !== null && !submitted) {
      setSubmitted(true);
      setTimeout(() => onAnswer(value), 400);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 24px 40px", background: "var(--parchment)" }}>
      <ProgressBar current={questionIndex + 1} total={totalQuestions} phase={ft.name} />
      <div key={questionIndex} style={{
        maxWidth: 620, width: "100%",
        opacity: submitted ? 0 : 1, transform: submitted ? "translateX(-20px)" : "translateX(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease"
      }}>
        <FadeIn>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <span style={{ fontSize: 22 }}>{ft.icon}</span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: ft.color }}>{ft.name}</span>
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontStyle: "italic", color: "var(--ink-muted)", marginBottom: 12, lineHeight: 1.5, borderLeft: `2px solid ${ft.color}`, paddingLeft: 16 }}>
            {question.scenario}
          </div>
        </FadeIn>
        <FadeIn delay={200}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3.5vw, 30px)", fontWeight: 500, color: "var(--ink)", lineHeight: 1.35, marginBottom: 40 }}>
            {question.question}
          </h2>
        </FadeIn>
        <FadeIn delay={350}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-muted)" }}>
              <span style={{ maxWidth: "40%", lineHeight: 1.4 }}>{question.lowLabel}</span>
              <span style={{ maxWidth: "40%", textAlign: "right", lineHeight: 1.4 }}>{question.highLabel}</span>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setValue(n)} style={{
                  width: 56, height: 56, borderRadius: "50%",
                  border: `2px solid ${value === n ? ft.color : "var(--parchment-deep)"}`,
                  background: value === n ? ft.color : "white",
                  color: value === n ? "white" : "var(--ink-light)",
                  fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600,
                  cursor: "pointer", transition: "all 0.25s ease",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}>{n}</button>
              ))}
            </div>
          </div>
        </FadeIn>
        <FadeIn delay={500}>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 36 }}>
            <Btn onClick={handleSubmit} disabled={value === null}>
              {questionIndex < totalQuestions - 1 ? "Next →" : "See My Results →"}
            </Btn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── HEATMAP ──────────────────────────────────────────────────────
function Heatmap({ scores }) {
  const getRiskLevel = (score) => {
    const pct = (score / 15) * 100;
    if (pct >= 73) return { label: "High Risk", color: "var(--red-risk)", bg: "#c94c4c15" };
    if (pct >= 47) return { label: "Moderate Risk", color: "var(--orange-risk)", bg: "#d4855a12" };
    if (pct >= 27) return { label: "Low Risk", color: "var(--yellow-risk)", bg: "#c9a84c10" };
    return { label: "Healthy", color: "var(--green-safe)", bg: "#5a9e6f0d" };
  };

  const sortedTypes = [...FAILURE_TYPES].sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0));

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {sortedTypes.map((ft, i) => {
          const score = scores[ft.id] || 0;
          const pct = (score / 15) * 100;
          const risk = getRiskLevel(score);
          return (
            <FadeIn key={ft.id} delay={i * 120}>
              <div style={{
                display: "grid", gridTemplateColumns: "140px 1fr 100px",
                alignItems: "center", gap: 16, padding: "14px 18px",
                background: risk.bg, borderLeft: `3px solid ${risk.color}`, transition: "all 0.3s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{ft.icon}</span>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--ink-light)" }}>{ft.short}</span>
                </div>
                <div style={{ height: 10, background: "var(--parchment-deep)", borderRadius: 5, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: `linear-gradient(90deg, ${risk.color}cc, ${risk.color})`,
                    borderRadius: 5, transition: "width 1s cubic-bezier(0.4,0,0.2,1)", transitionDelay: `${i * 120 + 300}ms`
                  }} />
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 600, color: risk.color, textAlign: "right", letterSpacing: "0.03em" }}>{risk.label}</span>
              </div>
            </FadeIn>
          );
        })}
      </div>
      <FadeIn delay={900}>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 24, flexWrap: "wrap" }}>
          {[{ label: "High Risk", color: "var(--red-risk)" }, { label: "Moderate", color: "var(--orange-risk)" }, { label: "Low Risk", color: "var(--yellow-risk)" }, { label: "Healthy", color: "var(--green-safe)" }].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-muted)" }}>{item.label}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}

// ─── RESULTS SCREEN ───────────────────────────────────────────────
function ResultsScreen({ answers, context, scores, onPreferences }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const sortedTypes = [...FAILURE_TYPES].sort((a, b) => scores[b.id] - scores[a.id]);
  const topTwo = sortedTypes.slice(0, 2);
  const healthiest = sortedTypes[sortedTypes.length - 1];
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const overallPct = Math.round((totalScore / 90) * 100);

  const getOverallLabel = (pct) => {
    if (pct >= 70) return "Significant meaning risk detected";
    if (pct >= 45) return "Moderate meaning risk — repair opportunities exist";
    if (pct >= 25) return "Below-average meaning risk — some areas to watch";
    return "Low meaning risk — strong communication foundations";
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      generatePDF(scores, FAILURE_TYPES, context, answers, QUESTIONS);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setTimeout(() => setPdfLoading(false), 1000);
  };

  return (
    <div style={{ minHeight: "100vh", padding: "60px 24px 80px", background: `radial-gradient(ellipse at 20% 10%, rgba(201,168,76,0.06) 0%, transparent 60%), var(--parchment)` }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold-muted)", marginBottom: 12, textAlign: "center" }}>Your Meaning Risk Snapshot</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 500, color: "var(--ink)", textAlign: "center", marginBottom: 8, lineHeight: 1.2 }}>
            {getOverallLabel(overallPct)}
          </h1>
          <div style={{ width: 60, height: 2, background: "var(--gold)", margin: "20px auto 40px" }} />
        </FadeIn>

        {/* Overall Score + PDF Download */}
        <FadeIn delay={200}>
          <div style={{ textAlign: "center", marginBottom: 48, padding: "28px", background: "white", border: "1px solid var(--parchment-deep)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: 700, color: overallPct >= 70 ? "var(--red-risk)" : overallPct >= 45 ? "var(--orange-risk)" : overallPct >= 25 ? "var(--yellow-risk)" : "var(--green-safe)", lineHeight: 1 }}>
              {overallPct}<span style={{ fontSize: 28, fontWeight: 400 }}>%</span>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 13, color: "var(--ink-muted)", marginTop: 4, marginBottom: 20 }}>Overall Meaning Risk Index</div>
            <Btn variant="secondary" onClick={handleDownloadPDF}
              style={{ fontSize: 13, padding: "10px 24px" }}>
              {pdfLoading ? "Generating…" : "⤓  Download PDF Report"}
            </Btn>
          </div>
        </FadeIn>

        {/* Heatmap */}
        <FadeIn delay={400}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, color: "var(--ink)", marginBottom: 20 }}>Risk Heatmap by Failure Type</h3>
          <Heatmap scores={scores} />
        </FadeIn>

        {/* Top Risks */}
        <FadeIn delay={800}>
          <div style={{ background: "white", border: "1px solid var(--parchment-deep)", padding: "32px", marginBottom: 32 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)", marginBottom: 20 }}>Your Top Two Risk Areas</h3>
            {topTwo.map((ft, i) => (
              <div key={ft.id} style={{
                marginBottom: i === 0 ? 28 : 0, paddingBottom: i === 0 ? 28 : 0,
                borderBottom: i === 0 ? "1px solid var(--parchment-deep)" : "none"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{ft.icon}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--ink)" }}>{ft.name}</span>
                </div>
                <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6, marginBottom: 12 }}>{ft.definition}</p>
                <div style={{ background: "var(--parchment-warm)", padding: "16px 20px", borderLeft: `3px solid ${ft.color}` }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: ft.color, marginBottom: 8 }}>Recommended Repair Moves</div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-light)", lineHeight: 1.65 }}>{ft.repairDetail}</p>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: "var(--ink-muted)", marginTop: 10, fontStyle: "italic" }}>
                    Protocols: {ft.repairMoves.join(" · ")} — See {ft.moduleLink}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Strength */}
        <FadeIn delay={1000}>
          <div style={{ background: "#5a9e6f0a", border: "1px solid #5a9e6f30", padding: "24px 28px", marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 18 }}>{healthiest.icon}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--green-safe)" }}>Strongest Area: {healthiest.name}</span>
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.6 }}>
              This is where your team's shared understanding is most intact. Protect it. Notice what practices maintain alignment here and consider applying them to your higher-risk areas.
            </p>
          </div>
        </FadeIn>

        {/* CTA */}
        <FadeIn delay={1200}>
          <div style={{ textAlign: "center", padding: "40px 28px", background: "var(--ink)", color: "var(--parchment)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 500, marginBottom: 12 }}>One more step</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(247,245,240,0.7)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto 24px" }}>
              Help shape the next modules of <em>Meaning Repair for High-Stakes Teams</em>. Tell us what content would be most valuable to your team.
            </p>
            <Btn variant="gold" onClick={onPreferences}>Share My Content Preferences →</Btn>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── PREFERENCES SCREEN ──────────────────────────────────────────
function PreferencesScreen({ onComplete }) {
  const [selected, setSelected] = useState([]);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "40px 24px", background: "var(--parchment)" }}>
        <FadeIn>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 500, color: "var(--ink)", marginBottom: 12 }}>Thank you</h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 15, color: "var(--ink-muted)", lineHeight: 1.6 }}>Your preferences will shape the next modules of the course.</p>
          </div>
        </FadeIn>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "60px 24px", background: "var(--parchment)" }}>
      <FadeIn>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold-muted)", marginBottom: 12 }}>Shape the course</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 500, color: "var(--ink)", marginBottom: 8, lineHeight: 1.2 }}>What content matters most to your team?</h2>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", marginBottom: 32, lineHeight: 1.6 }}>
            Select all that apply. This directly influences which modules and protocols are developed next.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
            {CONTENT_PREFERENCES.map(pref => (
              <button key={pref.id} onClick={() => toggle(pref.id)} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", background: "white",
                border: `1px solid ${selected.includes(pref.id) ? "var(--gold)" : "var(--parchment-deep)"}`,
                cursor: "pointer", textAlign: "left", transition: "all 0.2s ease"
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 3,
                  border: `2px solid ${selected.includes(pref.id) ? "var(--gold)" : "var(--parchment-deep)"}`,
                  background: selected.includes(pref.id) ? "var(--gold)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease", flexShrink: 0
                }}>
                  {selected.includes(pref.id) && <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: selected.includes(pref.id) ? "var(--ink)" : "var(--ink-light)", fontWeight: selected.includes(pref.id) ? 500 : 400 }}>{pref.label}</span>
              </button>
            ))}
          </div>
          <div style={{ marginBottom: 32 }}>
            <label style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, color: "var(--ink-light)", display: "block", marginBottom: 8 }}>Email (optional — to receive your full report)</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@team.com"
              style={{ width: "100%", padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: 14, border: "1px solid var(--parchment-deep)", background: "white", color: "var(--ink)", outline: "none" }}
              onFocus={e => e.target.style.borderColor = "var(--gold)"} onBlur={e => e.target.style.borderColor = "var(--parchment-deep)"} />
          </div>
          <Btn onClick={() => { setSubmitted(true); setTimeout(() => onComplete({ preferences: selected, email }), 1500); }}>Submit & Return to Results →</Btn>
        </div>
      </FadeIn>
    </div>
  );
}

// ─── FINAL SCREEN ─────────────────────────────────────────────────
function FinalScreen({ answers, context, scores }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const sortedTypes = [...FAILURE_TYPES].sort((a, b) => scores[b.id] - scores[a.id]);
  const topTwo = sortedTypes.slice(0, 2);
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const overallPct = Math.round((totalScore / 90) * 100);

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try { generatePDF(scores, FAILURE_TYPES, context, answers, QUESTIONS); }
    catch (err) { console.error('PDF generation failed:', err); }
    setTimeout(() => setPdfLoading(false), 1000);
  };

  const steps = [
    { num: "1", title: `Name it: "${topTwo[0].name}"`, body: `Share with your team: "I took a team communication diagnostic, and it flagged ${topTwo[0].name.toLowerCase()} as our biggest risk area." Then read this definition aloud: "${topTwo[0].definition}" Ask: "Does this resonate? Can anyone think of a recent example?"` },
    { num: "2", title: "Try one repair move this week", body: `Pick one move from the recommended set: ${topTwo[0].repairMoves.join(", ")}. ${topTwo[0].repairDetail.split(".").slice(0, 2).join(".")}. Commit to using it in one meeting or handoff this week.` },
    { num: "3", title: "Debrief in 7 days", body: `Revisit with your team: "Last week we tried [repair move]. What happened? Did it surface anything we weren't seeing before?" Document what you learn. This is the beginning of your Meaning Repair Operating System.` }
  ];

  return (
    <div style={{ minHeight: "100vh", padding: "60px 24px 80px", background: `radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.06) 0%, transparent 60%), var(--parchment)` }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <FadeIn>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--gold-muted)", marginBottom: 16 }}>Your Snapshot is Complete</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px, 5vw, 40px)", fontWeight: 500, color: "var(--ink)", lineHeight: 1.2, marginBottom: 24 }}>Your Repair Conversation Guide</h1>
            <div style={{ width: 60, height: 2, background: "var(--gold)", margin: "0 auto 24px" }} />
            <Btn variant="secondary" onClick={handleDownloadPDF} style={{ fontSize: 13, padding: "10px 24px" }}>
              {pdfLoading ? "Generating…" : "⤓  Download Full PDF Report"}
            </Btn>
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          <div style={{ background: "white", border: "1px solid var(--parchment-deep)", padding: "32px", marginBottom: 32 }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink)", marginBottom: 20 }}>Start Here: A 3-Step Repair Conversation</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.7, marginBottom: 24 }}>
              Based on your Snapshot results ({overallPct}% overall risk), here's a structured conversation you can have with your team this week. It takes 15–20 minutes.
            </p>
            {steps.map((step, i) => (
              <FadeIn key={i} delay={400 + i * 200}>
                <div style={{
                  display: "flex", gap: 16, marginBottom: 24,
                  paddingBottom: i < 2 ? 24 : 0,
                  borderBottom: i < 2 ? "1px solid var(--parchment-deep)" : "none"
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--ink)", color: "var(--parchment)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>{step.num}</div>
                  <div>
                    <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>{step.title}</h4>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-muted)", lineHeight: 1.65 }}>{step.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>

        <FadeIn delay={1200}>
          <div style={{ textAlign: "center", padding: "36px 28px", background: "var(--ink)", color: "var(--parchment)" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 500, marginBottom: 10 }}>Continue with What Time Binds</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "rgba(247,245,240,0.7)", lineHeight: 1.6, maxWidth: 420, margin: "0 auto 20px" }}>
              The Meaning Risk Snapshot is Module 1 of <em>Meaning Repair for High-Stakes Teams</em>. Modules 2–10 build your complete Meaning Repair Operating System.
            </p>
            <a href="https://www.what-time-binds.com/" target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600, background: "var(--gold)", color: "var(--ink)", padding: "12px 32px", textDecoration: "none", letterSpacing: "0.04em" }}>
              Subscribe to What Time Binds →
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={1400}>
          <p style={{ fontFamily: "var(--font-body)", fontSize: 11, color: "var(--ink-muted)", textAlign: "center", marginTop: 32, lineHeight: 1.5 }}>
            © {new Date().getFullYear()} What Time Binds · Jerry W Washington, Ed.D. · Meaning Repair for High-Stakes Teams
          </p>
        </FadeIn>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [context, setContext] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState({});

  const computeScores = (finalAnswers) => {
    const s = {};
    FAILURE_TYPES.forEach(ft => { s[ft.id] = 0; });
    finalAnswers.forEach((val, i) => {
      const q = QUESTIONS[i];
      const score = q.reverseScored ? (6 - val) : val;
      s[q.failureType] += score;
    });
    return s;
  };

  const handleAnswer = (value) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setScores(computeScores(newAnswers));
      setScreen("results");
    }
  };

  return (
    <div>
      <style>{globalStyles}</style>
      {screen === "landing" && <LandingScreen onStart={() => setScreen("context")} />}
      {screen === "context" && <ContextScreen onSubmit={(ctx) => { setContext(ctx); setScreen("questions"); }} />}
      {screen === "questions" && <QuestionScreen key={currentQ} question={QUESTIONS[currentQ]} questionIndex={currentQ} totalQuestions={QUESTIONS.length} onAnswer={handleAnswer} />}
      {screen === "results" && <ResultsScreen answers={answers} context={context} scores={scores} onPreferences={() => setScreen("preferences")} />}
      {screen === "preferences" && <PreferencesScreen onComplete={() => setScreen("final")} />}
      {screen === "final" && <FinalScreen answers={answers} context={context} scores={scores} />}
    </div>
  );
}
