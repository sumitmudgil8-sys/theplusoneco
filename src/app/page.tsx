"use client";
import { useState } from "react";
import Chatbot from "@/components/Chatbot";
import LeadForm from "@/components/LeadForm";

type Stage = "hero" | "gate" | "chat" | "form";

export default function HomePage() {
  const [stage, setStage] = useState<Stage>("hero");
  const [visible, setVisible] = useState(true);

  const handleHeroCTA = () => {
    setVisible(false);
    setTimeout(() => {
      setStage("gate");
      setVisible(true);
    }, 600);
  };

  const handleGateOpen = () => {
    setVisible(false);
    setTimeout(() => {
      setStage("chat");
      setVisible(true);
    }, 600);
  };

  const handleQualified = () => {
    setVisible(false);
    setTimeout(() => {
      setStage("form");
      setVisible(true);
    }, 600);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Raleway:wght@300;400;500&display=swap');

        /* ── TOKENS ── */
        :root {
          --bg-primary:    #F5F1EC;
          --bg-secondary:  #EEEAE4;
          --bg-panel:      #EAE5DE;

          --text-primary:  #1A1410;
          --text-secondary:#3A2E26;
          --text-muted:    #7A6858;
          --text-faint:    #A89888;

          --gold:          #8A6830;
          --gold-mid:      #A07838;
          --gold-light:    #B89058;

          --border-hard:   #C8B8A4;
          --border-soft:   #DDD0C0;
          --border-faint:  #E8DDD0;

          --accent-line:   #8A6830;

          --transition-dur: 600ms;
          --transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html, body {
          height: 100%;
          overflow: hidden;
          background: var(--bg-primary);
          font-family: 'Raleway', sans-serif;
          font-weight: 300;
          color: var(--text-secondary);
          -webkit-font-smoothing: antialiased;
        }

        /* Grain overlay */
        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.35;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23f)' opacity='0.03'/%3E%3C/svg%3E");
        }

        /* ── VIEWPORT SHELL ── */
        .viewport-shell {
          position: fixed;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 24px;
        }

        /* ── STAGE PANELS ── */
        .stage-panel {
          width: 100%;
          max-width: 480px;
          opacity: 0;
          transition: opacity var(--transition-dur) var(--transition-ease);
          will-change: opacity;
        }

        .stage-panel.is-visible {
          opacity: 1;
        }

        /* ── HERO CONTENT ── */
        .hero-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .crest {
          width: 32px;
          height: 32px;
          border: 1px solid var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 28px;
          opacity: 0.7;
        }
        .crest-inner {
          width: 14px;
          height: 14px;
          border: 1px solid var(--gold);
          transform: rotate(45deg);
        }

        .eyebrow {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 8px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 22px;
        }

        .hero-name {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 600;
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          line-height: 1.1;
          color: var(--text-primary);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .hero-descriptor {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          font-style: italic;
          font-size: clamp(1.2rem, 3vw, 1.75rem);
          line-height: 1.3;
          color: var(--gold-mid);
          letter-spacing: 0.02em;
        }

        .rule {
          width: 48px;
          height: 1px;
          background: var(--border-hard);
          margin: 24px auto;
          flex-shrink: 0;
        }
        .rule--wide { width: 80px; }
        .rule--gold { background: var(--gold); opacity: 0.5; }

        /* ── HERO BULLETS ── */
        .hero-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 380px;
          margin-bottom: 32px;
          text-align: left;
        }

        .hero-bullets li {
          font-family: 'Raleway', sans-serif;
          font-weight: 300;
          font-size: 0.67rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 14px;
          line-height: 1.6;
        }

        .hero-bullets li::before {
          content: '';
          display: block;
          width: 20px;
          height: 1px;
          background: var(--gold);
          flex-shrink: 0;
          opacity: 0.8;
        }

        /* ── GATE PANEL ── */
        .gate-panel {
          background: var(--bg-panel);
          border: 1px solid var(--border-hard);
          border-top: 2px solid var(--gold);
          padding: 48px 36px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .gate-header {
          text-align: center;
        }

        .section-eyebrow {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 8px;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 14px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 500;
          font-size: clamp(1.4rem, 3.5vw, 2rem);
          line-height: 1.2;
          color: var(--text-primary);
          letter-spacing: 0.03em;
        }

        .section-title em {
          font-style: italic;
          font-weight: 400;
          color: var(--gold-mid);
        }

        .gate-copy {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 0.75rem;
          letter-spacing: 0.12em;
          line-height: 2;
          color: var(--text-secondary);
          text-align: center;
          max-width: 320px;
        }

        .gate-points {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          max-width: 300px;
        }

        .gate-points li {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 0.68rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .gate-points li::before {
          content: '';
          display: block;
          width: 20px;
          height: 1px;
          background: var(--gold);
          flex-shrink: 0;
        }

        .cta-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 14px 36px;
          border: 1px solid var(--gold);
          background: transparent;
          color: var(--gold-mid);
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 0.68rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.3s ease, color 0.3s ease;
          margin-top: 8px;
        }

        .cta-primary:hover {
          background: var(--gold);
          color: var(--bg-primary);
        }

        .cta-arrow {
          font-size: 0.6rem;
          letter-spacing: 0;
          opacity: 0.7;
        }

        /* ── INTERACTION PANEL (chat / form) ── */
        .panel {
          background: var(--bg-panel);
          border: 1px solid var(--border-hard);
          border-top: 2px solid var(--gold);
          max-height: calc(100vh - 80px);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          padding: 16px 28px;
          border-bottom: 1px solid var(--border-soft);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }

        .panel-label {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 7px;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        .panel-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Raleway', sans-serif;
          font-weight: 300;
          font-size: 7px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        .panel-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--gold);
          opacity: 0.8;
        }

        .panel-body {
          padding: 28px;
          overflow-y: auto;
          flex: 1;
        }

        /* ── FOOTER ── */
        .page-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 24px;
          text-align: center;
          background: transparent;
        }

        .page-footer p {
          font-family: 'Raleway', sans-serif;
          font-weight: 400;
          font-size: 0.6rem;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: var(--text-faint);
        }

        /* ── RESPONSIVE ── */
        @media (min-width: 768px) {
          .gate-panel, .panel { padding: 48px; }
        }
      `}</style>

      <div className="viewport-shell">

        {/* ── HERO ── */}
        {stage === "hero" && (
          <div className={`stage-panel${visible ? " is-visible" : ""}`}>
            <div className="hero-content">
              <div className="crest">
                <div className="crest-inner" />
              </div>
              <p className="eyebrow">Delhi NCR &nbsp;&middot;&nbsp; By Private Introduction</p>
              <h1 className="hero-name">The Plus One Company</h1>
              <p className="hero-descriptor">Private Social Companionship</p>
              <div className="rule rule--gold" />
              <ul className="hero-bullets">
                <li>Curated female companionship for formal and social engagements</li>
                <li>Structured introductions through private screening</li>
                <li>Discretion and professionalism assured</li>
                <li>Limited access by direct request only</li>
              </ul>
              <button className="cta-primary" onClick={handleHeroCTA}>
                I Understand
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── GATE ── */}
        {stage === "gate" && (
          <div className={`stage-panel${visible ? " is-visible" : ""}`}>
            <div className="gate-panel">
              <div className="gate-header">
                <p className="section-eyebrow">Private Access</p>
                <h2 className="section-title"><em>Membership</em> &amp; Discretion</h2>
                <div className="rule rule--wide" style={{ margin: "18px auto 0" }} />
              </div>
              <p className="gate-copy">
                Access to this service is extended by private request only.
                A brief screening ensures mutual suitability.
              </p>
              <ul className="gate-points">
                <li>Verified client profiles</li>
                <li>Named referral or direct inquiry</li>
                <li>Full discretion, both parties</li>
                <li>Corporate and social contexts only</li>
              </ul>
              <div className="rule" />
              <button className="cta-primary" onClick={handleGateOpen}>
                Begin Private Screening
                <span className="cta-arrow">→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── CHATBOT ── */}
        {stage === "chat" && (
          <div className={`stage-panel${visible ? " is-visible" : ""}`}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-label">Screening — Confidential</span>
                <span className="panel-status">
                  <span className="panel-status-dot" />
                  Secure
                </span>
              </div>
              <div className="panel-body">
                <Chatbot onQualified={handleQualified} />
              </div>
            </div>
          </div>
        )}

        {/* ── LEAD FORM ── */}
        {stage === "form" && (
          <div className={`stage-panel${visible ? " is-visible" : ""}`}>
            <div className="panel">
              <div className="panel-header">
                <span className="panel-label">Access Request</span>
                <span className="panel-status">
                  <span className="panel-status-dot" />
                  Secure
                </span>
              </div>
              <div className="panel-body">
                <LeadForm />
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer className="page-footer">
        <p>By invitation and private request only &nbsp;&middot;&nbsp; Delhi NCR</p>
      </footer>
    </>
  );
}