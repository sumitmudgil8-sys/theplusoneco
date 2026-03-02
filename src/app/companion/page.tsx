"use client";
import { useState, useRef } from "react";

type Stage = "hero" | "gate" | "chat" | "form";

/* ─────────────────────────────────────────────
   SCREENING CHATBOT — RULE-BASED + AI EVALUATION
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   SCREENING CHATBOT — RULE-BASED + AI EVALUATION
───────────────────────────────────────────── */
function ScreeningChat({ onQualified }: { onQualified: (aiScore: number) => void }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Welcome. This is a brief private screening for our one-on-one professional companionship network. All meetings are platonic and conducted in public venues. Everything shared here is strictly confidential.\n\nBefore we proceed — are you 21 years of age or older? (Yes / No)",
    },
  ]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [awaitingEssay, setAwaitingEssay] = useState(false);
  const [wordCountError, setWordCountError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const answers = useRef<{
    age: string;
    city: string;
    openness: string;
    compensation: string;
  }>({ age: "", city: "", openness: "", compensation: "" });

  const VALID_CITIES = ["delhi", "gurgaon", "noida", "ghaziabad", "faridabad"];

  const questions: { key: keyof typeof answers.current; text: string }[] = [
    {
      key: "city",
      text: "Which city are you currently based in?",
    },
    {
      key: "openness",
      text: "This is a social companionship service where you may meet verified individuals on a one-on-one basis in public places such as cafés, restaurants, or lounges. Are you comfortable with this type of arrangement? (Yes / No)",
    },
    {
      key: "compensation",
      text: "Engagements are compensated at ₹2,000 for 2 hours and ₹3,000 for 3 hours. Are you comfortable with this structure? (Yes / No)",
    },
  ];

  const scrollDown = () =>
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

  const pushAssistant = (text: string, cb?: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "assistant", text }]);
      setIsTyping(false);
      scrollDown();
      cb?.();
    }, 400);
  };

  const reject = (reason: string) => {
    pushAssistant(reason);
    setInputDisabled(true);
  };

  const countWords = (text: string) =>
    text.trim().split(/\s+/).filter(Boolean).length;

  const send = async () => {
    if (!input.trim() || isTyping || inputDisabled) return;
    const userText = input.trim();
    setInput("");
    setWordCountError("");

    // Append user message immediately
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    scrollDown();

    /* ── ESSAY STAGE ── */
    if (awaitingEssay) {
      const wc = countWords(userText);
      if (wc < 50) {
        setWordCountError(
          `Your response is ${wc} word${wc === 1 ? "" : "s"}. Please write at least 50 words.`
        );
        setInput(userText);
        // Remove the optimistic user message we just added
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      setIsTyping(true);
      try {
        const res = await fetch("/api/evaluate-companion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ essay: userText, answers: answers.current }),
        });
        const data = await res.json();
        const score: number = data.score ?? 0;

        setIsTyping(false);
        if (score >= 7) {
          pushAssistant(
            "Thank you — your responses suggest strong suitability. We would like to invite you to complete a formal application. Please proceed to the next step.",
            () => setTimeout(() => onQualified(score), 2000)
          );
        } else {
          pushAssistant(
            "Thank you for your thoughtful response. After careful consideration, we feel this opportunity may not be the right fit at this time. We wish you well."
          );
          setInputDisabled(true);
        }
      } catch {
        setIsTyping(false);
        pushAssistant("We encountered a technical issue. Please try again shortly.");
      }
      return;
    }

    /* ── STEP 0: AGE CHECK ── */
    if (step === 0) {
      answers.current.age = userText;
      if (!userText.toLowerCase().includes("yes")) {
        reject(
          "Thank you for your honesty. We require applicants to be 21 years of age or older. We wish you well."
        );
        return;
      }
      setStep(1);
      pushAssistant(questions[0].text);
      return;
    }

    /* ── STEPS 1–3: STRUCTURED QUESTIONS ── */
    const qIndex = step - 1; // maps step → questions array index
    const key = questions[qIndex].key;
    answers.current[key] = userText;

    // Validate city
    if (key === "city") {
      const cityLower = userText.toLowerCase();
      const valid = VALID_CITIES.some((c) => cityLower.includes(c));
      if (!valid) {
        reject(
          "Thank you for responding. We currently only operate within Delhi, Gurgaon, Noida, Ghaziabad, and Faridabad. We are unable to proceed at this time."
        );
        return;
      }
    }

    // Validate yes/no fields
    if (key === "openness" || key === "compensation") {
      if (!userText.toLowerCase().includes("yes")) {
        reject(
          "Thank you for your honesty. Based on your response, this opportunity may not be the right fit at this time. We wish you well."
        );
        return;
      }
    }

    const nextIndex = qIndex + 1;
    if (nextIndex < questions.length) {
      setStep(step + 1);
      pushAssistant(questions[nextIndex].text);
    } else {
      // All structured questions passed — ask essay
      setStep(step + 1);
      setAwaitingEssay(true);
      pushAssistant(
        "Before proceeding, please answer the following in 50–120 words:\n\nImagine you are meeting a client for the first time at a public café for a two-hour platonic companionship engagement. Your role is to provide emotional presence and engaging conversation. How would you ensure the interaction feels safe, comfortable, and meaningful for both of you?"
      );
    }
  };

  const currentWordCount = countWords(input);

  return (
    <div className="chat-wrap">
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${m.role}`}>
            <p style={{ whiteSpace: "pre-line" }}>{m.text}</p>
          </div>
        ))}
        {isTyping && (
          <div className="chat-bubble chat-bubble--assistant">
            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {!inputDisabled && !isTyping && (
        <>
          {wordCountError && (
            <p className="inline-error">{wordCountError}</p>
          )}
          {awaitingEssay && (
            <p className="word-hint">
              {currentWordCount > 0
                ? `${currentWordCount} / 50 words minimum`
                : "Minimum 50 words required"}
            </p>
          )}
          <div className="chat-input-row">
            <textarea
              className="chat-input chat-input--textarea"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setWordCountError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !awaitingEssay) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={
                awaitingEssay
                  ? "Write your response here (50–120 words)…"
                  : "Your response…"
              }
              rows={awaitingEssay ? 4 : 1}
            />
            <button className="chat-send" onClick={send}>
              →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   APPLICATION FORM
───────────────────────────────────────────── */
function ApplicationForm({ aiScore }: { aiScore: number }) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    fullName: "", age: "", city: "", height: "",
    languages: "", education: "", occupation: "",
    experience: "", availability: "", instagram: "",
    phone: "", whyFit: "",
  });
  const [photos, setPhotos] = useState<FileList | null>(null);

  const set = (k: string, v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setFieldErrors(prev => { const n = { ...prev }; delete n[k]; return n; });
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!form.fullName.trim()) errors.fullName = "Full name is required.";
    if (!form.age) errors.age = "Age is required.";
    if (!form.city.trim()) errors.city = "City is required.";
    if (!form.languages.trim()) errors.languages = "Languages are required.";
    if (!form.whyFit.trim()) errors.whyFit = "This field is required.";
    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(form.phone.trim())) {
      errors.phone = "Please enter a valid 10-digit phone number.";
    }
    if (!form.education) errors.education = "Please select your education level.";
    return errors;
  };

  const handleSubmit = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/submit-companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, aiScore }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert("Submission failed. Please try again.");
      }
    } catch {
      alert("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="form-success">
        <div className="success-crest"><div className="success-crest-inner" /></div>
        <p className="success-eyebrow">Application Received</p>
        <h3 className="success-title">Thank You</h3>
        <div className="rule rule--gold" style={{ margin: "18px auto" }} />
        <p className="success-copy">
          Your application is under review. We assess each submission individually and reach out only to candidates who meet our current requirements. You will hear from us within five business days if there is a mutual fit.
        </p>
      </div>
    );
  }

  return (
    <div className="app-form">
      <p className="form-intro">All information is treated with absolute confidentiality and is visible only to our internal team.</p>
      <div className="rule rule--gold" style={{ margin: "16px 0 28px" }} />

      <div className="form-grid">
        <div className="form-field">
          <label>Full Name <span className="req">*</span></label>
          <input value={form.fullName} onChange={e => set("fullName", e.target.value)} placeholder="As it appears on ID" />
          {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
        </div>
        <div className="form-field">
          <label>Age <span className="req">*</span></label>
          <input type="number" value={form.age} onChange={e => set("age", e.target.value)} placeholder="e.g. 26" />
          {fieldErrors.age && <span className="field-error">{fieldErrors.age}</span>}
        </div>
        <div className="form-field">
          <label>City <span className="req">*</span></label>
          <input value={form.city} onChange={e => set("city", e.target.value)} placeholder="Delhi, Gurugram, Noida…" />
          {fieldErrors.city && <span className="field-error">{fieldErrors.city}</span>}
        </div>
        <div className="form-field">
          <label>Phone Number <span className="req">*</span></label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
            maxLength={10}
          />
          {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
        </div>
        <div className="form-field">
          <label>Height</label>
          <input value={form.height} onChange={e => set("height", e.target.value)} placeholder="e.g. 5′7″" />
        </div>
        <div className="form-field form-field--full">
          <label>Languages Spoken <span className="req">*</span></label>
          <input value={form.languages} onChange={e => set("languages", e.target.value)} placeholder="e.g. English, Hindi, French" />
          {fieldErrors.languages && <span className="field-error">{fieldErrors.languages}</span>}
        </div>
        <div className="form-field">
          <label>Education Level <span className="req">*</span></label>
          <select value={form.education} onChange={e => set("education", e.target.value)}>
            <option value="">Select…</option>
            <option>High School</option>
            <option>Undergraduate — In Progress</option>
            <option>Undergraduate — Completed</option>
            <option>Postgraduate</option>
            <option>Professional Degree</option>
            <option>Prefer not to say</option>
          </select>
          {fieldErrors.education && <span className="field-error">{fieldErrors.education}</span>}
        </div>
        <div className="form-field">
          <label>Occupation</label>
          <input value={form.occupation} onChange={e => set("occupation", e.target.value)} placeholder="Current or most recent role" />
        </div>
        <div className="form-field form-field--full">
          <label>Relevant Experience <span className="optional">(Optional)</span></label>
          <textarea
            rows={3}
            value={form.experience}
            onChange={e => set("experience", e.target.value)}
            placeholder="Hospitality, PR, modelling, client relations, event hosting, etc."
          />
        </div>
        <div className="form-field form-field--full">
          <label>Availability <span className="req">*</span></label>
          <div className="avail-grid">
            {["Weekday evenings","Weekend evenings","Weekend days","Flexible / as needed"].map(opt => (
              <label key={opt} className="avail-option">
                <input
                  type="checkbox"
                  checked={form.availability.includes(opt)}
                  onChange={e => {
                    const arr = form.availability ? form.availability.split("|").filter(Boolean) : [];
                    if (e.target.checked) arr.push(opt);
                    else arr.splice(arr.indexOf(opt), 1);
                    set("availability", arr.join("|"));
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="form-field">
          <label>Instagram Handle <span className="optional">(Optional)</span></label>
          <input value={form.instagram} onChange={e => set("instagram", e.target.value)} placeholder="@handle" />
        </div>
        <div className="form-field form-field--full">
          <label>Why would you be a good fit? <span className="req">*</span></label>
          <textarea
            rows={4}
            value={form.whyFit}
            onChange={e => set("whyFit", e.target.value)}
            placeholder="Tell us about your personality, social confidence, and what you bring to a structured professional engagement."
          />
          {fieldErrors.whyFit && <span className="field-error">{fieldErrors.whyFit}</span>}
        </div>
      </div>

      <div className="rule" style={{ margin: "28px 0 24px" }} />

      <button
        className={`cta-primary cta-primary--full${isSubmitting ? " cta-primary--loading" : ""}`}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Submitting…" : "Submit Application for Consideration"}
        {!isSubmitting && <span className="cta-arrow">→</span>}
      </button>
      <p className="form-disclaimer">Submitting this form does not guarantee acceptance. All applications are reviewed individually.</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function CompanionPage() {
  const [stage, setStage] = useState<Stage>("hero");
  const [visible, setVisible] = useState(true);
  const [aiScore, setAiScore] = useState(0);

  const transition = (next: Stage) => {
    setVisible(false);
    setTimeout(() => { setStage(next); setVisible(true); }, 600);
  };

  const handleQualified = (score: number) => {
    setAiScore(score);
    transition("form");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Raleway:wght@300;400;500&display=swap');

        :root {
          --bg:           #F6F2EE;
          --bg-panel:     #EEEAE3;
          --bg-deep:      #E8E3DA;
          --text-primary: #14100C;
          --text-sec:     #2E2318;
          --text-muted:   #5C4C3C;
          --text-faint:   #8A7868;
          --gold:         #8A6830;
          --gold-mid:     #A07838;
          --gold-light:   #C0A060;
          --border-hard:  #C8B8A4;
          --border-soft:  #DDD0C0;
          --border-faint: #E8DDD0;
          --rose:         #9E7868;
          --error:        #8B2020;
          --dur: 600ms;
          --ease: cubic-bezier(0.4,0,0.2,1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          min-height: 100%;
          background: var(--bg);
          font-family: 'Raleway', sans-serif;
          font-weight: 300;
          color: var(--text-sec);
          -webkit-font-smoothing: antialiased;
        }

        body::before {
          content: '';
          position: fixed; inset: 0;
          pointer-events: none;
          z-index: 9999; opacity: 0.3;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f)' opacity='0.03'/%3E%3C/svg%3E");
        }

        /* ── SHELL ── */
        .shell {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          padding: 40px 24px 80px;
        }

        .stage-panel {
          width: 100%; max-width: 520px;
          opacity: 0;
          transition: opacity var(--dur) var(--ease);
          margin-top: auto; margin-bottom: auto;
        }
        .stage-panel.vis { opacity: 1; }

        /* ── SHARED UTILS ── */
        .eyebrow {
          font-family: 'Raleway', sans-serif;
          font-weight: 400; font-size: 8px;
          letter-spacing: 0.32em; text-transform: uppercase;
          color: var(--text-muted); margin-bottom: 14px;
        }
        .rule {
          width: 48px; height: 1px;
          background: var(--border-hard);
          flex-shrink: 0;
        }
        .rule--wide { width: 80px; }
        .rule--gold { background: var(--gold); opacity: 0.5; }
        .rule--rose { background: var(--rose); opacity: 0.4; }
        .rule--center { margin-left: auto; margin-right: auto; }

        .cta-primary {
          display: inline-flex; align-items: center;
          justify-content: center; gap: 14px;
          padding: 14px 36px;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--gold-mid);
          font-family: 'Raleway', sans-serif;
          font-weight: 400; font-size: 0.68rem;
          letter-spacing: 0.3em; text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s ease, color 0.3s ease;
        }
        .cta-primary:hover:not(:disabled) { background: var(--gold); color: var(--bg); }
        .cta-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .cta-primary--full { width: 100%; }
        .cta-primary--loading { opacity: 0.7; }
        .cta-arrow { font-size: 0.6rem; letter-spacing: 0; opacity: 0.7; }

        /* ── HERO ── */
        .hero { display: flex; flex-direction: column; align-items: center; text-align: center; }

        .monogram {
          width: 48px; height: 48px;
          border: 1px solid var(--gold);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 32px; opacity: 0.75;
          position: relative;
        }
        .monogram::before, .monogram::after {
          content: ''; position: absolute;
          width: 8px; height: 8px;
          border: 1px solid var(--gold-light);
          opacity: 0.5;
        }
        .monogram::before { top: -5px; left: -5px; }
        .monogram::after  { bottom: -5px; right: -5px; }
        .monogram-inner {
          width: 20px; height: 20px;
          border: 1px solid var(--gold);
          transform: rotate(45deg);
        }

        .hero-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600; font-size: clamp(1.7rem, 4.5vw, 2.6rem);
          line-height: 1.1; color: var(--text-primary);
          letter-spacing: 0.07em; text-transform: uppercase;
          margin-bottom: 6px;
        }
        .hero-sub {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-style: italic;
          font-size: clamp(1.1rem, 2.8vw, 1.55rem);
          color: var(--gold-mid); letter-spacing: 0.03em;
          margin-bottom: 28px;
        }

        .hero-kicker {
          font-family: 'Raleway', sans-serif;
          font-weight: 300; font-size: 0.78rem;
          letter-spacing: 0.14em; line-height: 2.2;
          color: var(--text-muted); max-width: 340px;
          margin: 0 auto 32px;
          border-top: 1px solid var(--border-faint);
          border-bottom: 1px solid var(--border-faint);
          padding: 22px 0;
        }

        .stat-row {
          display: flex; gap: 0;
          width: 100%; max-width: 420px;
          border: 1px solid var(--border-hard);
          margin-bottom: 36px;
        }
        .stat-cell {
          flex: 1; padding: 18px 14px;
          text-align: center;
          border-right: 1px solid var(--border-hard);
        }
        .stat-cell:last-child { border-right: none; }
        .stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500; font-size: 1.4rem;
          color: var(--gold-mid); letter-spacing: 0.04em;
          display: block; margin-bottom: 4px;
        }
        .stat-label {
          font-size: 0.58rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--text-faint);
        }

        /* ── GATE ── */
        .gate-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-hard);
          border-top: 2px solid var(--rose);
          padding: 44px 36px;
          display: flex; flex-direction: column;
          align-items: center; gap: 20px;
        }
        .gate-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500; font-size: clamp(1.4rem, 3.5vw, 2rem);
          color: var(--text-primary); letter-spacing: 0.04em;
          text-align: center;
        }
        .gate-title em {
          font-style: italic; font-weight: 400;
          color: var(--rose);
        }
        .gate-copy {
          font-size: 0.75rem; letter-spacing: 0.12em;
          line-height: 2.1; color: var(--text-muted);
          text-align: center; max-width: 340px;
        }

        .pillars {
          width: 100%; display: flex;
          flex-direction: column; gap: 0;
          border: 1px solid var(--border-soft);
        }
        .pillar {
          padding: 18px 22px;
          border-bottom: 1px solid var(--border-faint);
          display: flex; gap: 18px; align-items: flex-start;
        }
        .pillar:last-child { border-bottom: none; }
        .pillar-num {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400; font-size: 1.1rem;
          color: var(--gold); opacity: 0.6;
          flex-shrink: 0; width: 22px; padding-top: 1px;
        }
        .pillar-text h4 {
          font-family: 'Raleway', sans-serif;
          font-weight: 500; font-size: 0.68rem;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: var(--text-primary); margin-bottom: 4px;
        }
        .pillar-text p {
          font-size: 0.69rem; letter-spacing: 0.1em;
          line-height: 1.9; color: var(--text-muted);
        }

        /* ── CHAT ── */
        .panel {
          background: var(--bg-panel);
          border: 1px solid var(--border-hard);
          border-top: 2px solid var(--rose);
          display: flex; flex-direction: column;
          overflow: hidden;
        }
        .panel-header {
          padding: 14px 26px;
          border-bottom: 1px solid var(--border-soft);
          display: flex; align-items: center;
          justify-content: space-between; flex-shrink: 0;
        }
        .panel-label {
          font-size: 7px; letter-spacing: 0.35em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .panel-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 7px; letter-spacing: 0.2em;
          text-transform: uppercase; color: var(--text-faint);
        }
        .status-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--rose); opacity: 0.8;
        }
        .panel-body { padding: 24px; overflow-y: auto; flex: 1; }

        /* Chat */
       /* Chat */
.chat-wrap { display: flex; flex-direction: column; gap: 16px; }
.chat-messages {
  display: flex; flex-direction: column; gap: 14px;
  max-height: 380px; overflow-y: auto;
  padding-right: 4px;
}
.chat-bubble {
  max-width: 88%;
  padding: 12px 16px;
  font-size: 0.79rem;
  letter-spacing: 0.05em;
  line-height: 1.8;
}
.chat-bubble--assistant {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  color: #000000;
  align-self: flex-start;
}
.chat-bubble--user {
  background: #ffffff;
  border: 1px solid #dddddd;
  color: #000000;
  align-self: flex-end;
}
.chat-input-row {
  display: flex; gap: 0;
  border: 1px solid #d8d8d8;
  align-items: flex-end;
}
.chat-input {
  flex: 1; padding: 13px 16px;
  background: #ffffff; border: none; outline: none;
  font-family: 'Raleway', sans-serif;
  font-size: 0.78rem; letter-spacing: 0.06em;
  color: #000000;
  resize: none;
  line-height: 1.7;
}
.chat-input--textarea { min-height: 44px; }
.chat-input::placeholder { color: #aaaaaa; }
.chat-send {
  padding: 13px 20px;
  border: none; border-left: 1px solid #d8d8d8;
  background: transparent; cursor: pointer;
  color: #555555; font-size: 0.9rem;
  transition: background 0.2s, color 0.2s;
  align-self: stretch;
  display: flex; align-items: center; justify-content: center;
}
.chat-send:hover { background: #000000; color: #ffffff; }

.inline-error {
  font-size: 0.65rem; letter-spacing: 0.14em;
  color: var(--error); padding: 8px 12px;
  border-left: 2px solid var(--error);
  background: rgba(139,32,32,0.04);
}
.word-hint {
  font-size: 0.62rem; letter-spacing: 0.18em;
  color: #999999; text-align: right;
}

/* Loading dots */
.loading-dots {
  display: flex; gap: 6px; align-items: center;
  padding: 4px 2px;
}
.loading-dots span {
  width: 5px; height: 5px; border-radius: 50%;
  background: #bbbbbb;
  animation: dot-pulse 1.6s infinite ease-in-out;
}
.loading-dots span:nth-child(2) { animation-delay: 0.25s; }
.loading-dots span:nth-child(3) { animation-delay: 0.5s; }
@keyframes dot-pulse {
  0%, 80%, 100% { transform: scale(0.65); opacity: 0.25; }
  40% { transform: scale(1); opacity: 0.7; }
}

        /* ── FORM ── */
        .app-form { display: flex; flex-direction: column; gap: 0; }
        .form-intro {
          font-size: 0.73rem; letter-spacing: 0.13em;
          line-height: 2.1; color: var(--text-muted);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .form-field { display: flex; flex-direction: column; gap: 6px; }
        .form-field--full { grid-column: 1 / -1; }
        .form-field label {
          font-size: 0.63rem; letter-spacing: 0.24em;
          text-transform: uppercase; color: var(--text-muted);
        }
        .req { color: var(--rose); }
        .optional { color: var(--text-faint); font-size: 0.58rem; }
        .form-field input,
        .form-field select,
        .form-field textarea {
          padding: 11px 14px;
          background: var(--bg); border: 1px solid var(--border-hard);
          font-family: 'Raleway', sans-serif;
          font-size: 0.76rem; letter-spacing: 0.08em;
          color: var(--text-sec); outline: none;
          transition: border-color 0.2s;
          resize: none;
        }
        .form-field input:focus,
        .form-field select:focus,
        .form-field textarea:focus { border-color: var(--gold); }
        .form-field input::placeholder,
        .form-field textarea::placeholder { color: var(--text-faint); }
        .form-field select { appearance: none; cursor: pointer; }

        .field-error {
          font-size: 0.62rem; letter-spacing: 0.14em;
          color: var(--error); margin-top: 2px;
        }

        .avail-grid {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .avail-option {
          display: flex; align-items: center; gap: 10px;
          font-size: 0.70rem; letter-spacing: 0.12em;
          color: var(--text-sec); cursor: pointer;
          text-transform: none; padding: 6px 0;
        }
        .avail-option input[type="checkbox"] {
          accent-color: var(--gold);
          width: 16px; height: 16px;
          flex-shrink: 0;
        }

        .file-upload-label {
          display: block; padding: 11px 14px;
          border: 1px dashed var(--border-hard);
          font-size: 0.7rem; letter-spacing: 0.14em;
          color: var(--text-muted); cursor: pointer;
          text-align: center;
          transition: border-color 0.2s, color 0.2s;
        }
        .file-upload-label:hover { border-color: var(--gold); color: var(--gold-mid); }
        .file-note {
          font-size: 0.58rem; letter-spacing: 0.12em;
          color: var(--text-faint); margin-top: 5px;
        }

        .form-disclaimer {
          font-size: 0.6rem; letter-spacing: 0.16em;
          color: var(--text-faint); text-align: center;
          margin-top: 14px; line-height: 1.9;
        }

        /* Success */
        .form-success {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 8px 0;
        }
        .success-crest {
          width: 40px; height: 40px;
          border: 1px solid var(--gold);
          display: flex; align-items: center;
          justify-content: center; margin-bottom: 28px;
        }
        .success-crest-inner {
          width: 16px; height: 16px;
          border: 1px solid var(--gold);
          transform: rotate(45deg);
        }
        .success-eyebrow { font-size: 8px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px; }
        .success-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500; font-size: 2rem;
          color: var(--text-primary); letter-spacing: 0.06em;
        }
        .success-copy {
          font-size: 0.75rem; letter-spacing: 0.12em;
          line-height: 2.1; color: var(--text-muted);
          max-width: 340px; margin: 0 auto;
        }

        /* ── FOOTER ── */
        .page-footer {
          position: fixed; bottom: 0; left: 0; right: 0;
          padding: 14px 24px; text-align: center;
          background: var(--bg);
          border-top: 1px solid var(--border-faint);
        }
        .page-footer p {
          font-size: 0.6rem; letter-spacing: 0.3em;
          text-transform: uppercase; color: var(--text-faint);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 480px) {
          .shell { padding: 24px 16px 80px; }

          .form-grid { grid-template-columns: 1fr; }
          .form-field--full { grid-column: 1; }
          .avail-grid { grid-template-columns: 1fr; }
          .avail-option { padding: 8px 0; font-size: 0.73rem; }

          .stat-row { flex-direction: column; }
          .stat-cell { border-right: none; border-bottom: 1px solid var(--border-hard); }
          .stat-cell:last-child { border-bottom: none; }

          .gate-card { padding: 32px 20px; }

          .hero-kicker { font-size: 0.80rem; line-height: 2.2; }

          .chat-messages { max-height: none; }
          .chat-bubble { font-size: 0.82rem; padding: 14px 16px; }
          .chat-input { font-size: 0.82rem; padding: 14px 14px; }
          .chat-send { padding: 14px 18px; }

          .cta-primary { width: 100%; }

          .form-field input,
          .form-field select,
          .form-field textarea { font-size: 0.82rem; padding: 13px 14px; }
        }
      `}</style>

      <div className="shell">

        {/* ── STAGE 1: HERO ── */}
        {stage === "hero" && (
          <div className={`stage-panel${visible ? " vis" : ""}`}>
            <div className="hero">
              <div className="monogram"><div className="monogram-inner" /></div>
              <p className="eyebrow">Delhi NCR &nbsp;·&nbsp; Selective Intake &nbsp;·&nbsp; Private Network</p>
              <h1 className="hero-title">Social Companionship</h1>
              <p className="hero-sub">A selective network for emotionally intelligent women</p>

              <p className="hero-kicker">
               We curate a small, carefully selected group of women for structured one-on-one companionship engagements. These are platonic, in-person meetings held in public venues such as cafés, restaurants, and lounges. Your role is to offer presence, conversation, and emotional composure in a safe and respectful environment. Discretion and professionalism are essential.
              </p>

              <div className="stat-row">
                <div className="stat-cell">
                  <span className="stat-value">₹2k-3K</span>
                  <span className="stat-label">Per 2–3 hour meeting</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-value">Flexible</span>
                  <span className="stat-label">Your schedule</span>
                </div>
                <div className="stat-cell">
                  <span className="stat-value">Verified</span>
                  <span className="stat-label">Client vetting</span>
                </div>
              </div>

              <button className="cta-primary" onClick={() => transition("gate")}>
                Learn More
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 2: STANDARDS GATE ── */}
        {stage === "gate" && (
          <div className={`stage-panel${visible ? " vis" : ""}`}>
            <div className="gate-card">
              <p className="eyebrow">What we offer &amp; what we expect</p>
              <h2 className="gate-title">Standards &amp; <em>Structure</em></h2>
              <div className="rule rule--wide rule--center" />

              <p className="gate-copy">
                 Every engagement is a structured, one-on-one platonic meeting conducted in public venues. The purpose is meaningful conversation and social presence. We guarantee payment, client verification, and your right to decline any engagement.
              </p>

              <div className="pillars">
                <div className="pillar">
                  <span className="pillar-num">I</span>
                  <div className="pillar-text">
                    <h4>Guaranteed Payment</h4>
                    <p>Compensation is confirmed before each meeting. No ambiguity, no delays. Direct transfer within 24 hours of completion.</p>
                  </div>
                </div>
                <div className="pillar">
                  <span className="pillar-num">II</span>
                  <div className="pillar-text">
                    <h4>Client Verification</h4>
                    <p>Every client is ID-verified and screened before any introduction. You receive a full brief — name, background, and venue — in advance.</p>
                  </div>
                </div>
                <div className="pillar">
                  <span className="pillar-num">III</span>
                  <div className="pillar-text">
                    <h4>Right of Refusal</h4>
                    <p>You may decline any meeting at any time without explanation. Your comfort, safety, and boundaries are always respected.</p>
                  </div>
                </div>
                <div className="pillar">
                  <span className="pillar-num">IV</span>
                  <div className="pillar-text">
                    <h4>Absolute Discretion</h4>
                    <p>Your identity and participation remain confidential. All meetings are expected to remain private and professional.</p>
                  </div>
                </div>
              </div>

              <button className="cta-primary" onClick={() => transition("chat")}>
                Proceed to Screening
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: SCREENING CHAT ── */}
        {stage === "chat" && (
          <div className={`stage-panel${visible ? " vis" : ""}`}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-label">Preliminary Screening — Confidential</span>
                <span className="panel-status">
                  <span className="status-dot" />
                  Secure
                </span>
              </div>
              <div className="panel-body">
                <ScreeningChat onQualified={handleQualified} />
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 4: APPLICATION FORM ── */}
        {stage === "form" && (
          <div className={`stage-panel${visible ? " vis" : ""}`}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-label">Application for Consideration</span>
                <span className="panel-status">
                  <span className="status-dot" />
                  Secure
                </span>
              </div>
              <div className="panel-body">
                <ApplicationForm aiScore={aiScore} />
              </div>
            </div>
          </div>
        )}

      </div>

      <footer className="page-footer">
        <p>Private network &nbsp;·&nbsp; Delhi NCR &nbsp;·&nbsp; Selective intake only</p>
      </footer>
    </>
  );
}