"use client";
import { useEffect, useRef, useState } from "react";
type Message = {
  role: "assistant" | "user";
  content: string;
};
type IntakeData = {
  city?: string;
  timeframe?: string;
  eventType?: string;
  description?: string;
};
type Props = {
  onQualified: () => void;
};
const BLOCKED_WORDS = [
  "sex",
  "escort",
  "nude",
  "bed",
  "night rate",
  "explicit",
  "sexual",
];
const ROMANTIC_KEYWORDS = [
  "chemistry",
  "intimate",
  "physical",
  "private place",
  "hotel",
  "overnight",
  "romantic",
  "relationship",
  "girlfriend",
  "date night",
];
const CONTEXTUAL_SIGNALS = [
  "coffee",
  "dinner",
  "meeting",
  "network",
  "discussion",
  "event",
  "conference",
  "public",
  "cafe",
  "restaurant",
  "social",
];
const ENGAGEMENT_OPTIONS = [
  "Coffee meeting",
  "Dinner engagement",
  "Social / cultural outing",
  "Corporate function",
];
const TIMEFRAME_OPTIONS = [
  "Tomorrow",
  "Within 3 days",
  "Within 1 week",
  "Just exploring",
];
export default function Chatbot({ onQualified }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [intake, setIntake] = useState<IntakeData>({});
  const [step, setStep] = useState(0);
  const [chatLocked, setChatLocked] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content:
          "The Plus One Co. is a private social companionship service offering curated company for coffee meetings, dinners, and select public engagements. Our arrangements are structured, time-bound, and strictly platonic. I'll ask a few brief questions to understand what you're looking for.",
      },
      {
        role: "assistant",
        content: "What type of engagement are you looking for?",
      },
    ]);
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);
  function isAmbiguous(description: string): boolean {
    const lower = description.toLowerCase();
    return ROMANTIC_KEYWORDS.some((kw) => lower.includes(kw));
  }
  function hasContextualSignal(description: string): boolean {
    const lower = description.toLowerCase();
    return CONTEXTUAL_SIGNALS.some((kw) => lower.includes(kw));
  }
  function isSoftApproved(data: IntakeData): boolean {
    if (!data.eventType || !ENGAGEMENT_OPTIONS.includes(data.eventType)) return false;
    if (!data.timeframe) return false;
    if (!data.description || data.description.trim().length < 10) return false;
    const lower = data.description.toLowerCase();
    const hasBlockedWord = BLOCKED_WORDS.some((w) => lower.includes(w));
    if (hasBlockedWord) return false;
    const hasRomanticKw = ROMANTIC_KEYWORDS.some((kw) => lower.includes(kw));
    if (hasRomanticKw) return false;
    if (!hasContextualSignal(data.description)) return false;
    return true;
  }
  async function evaluateRequest(data: IntakeData) {
    setLoading(true);
    const summary = `Event Type: ${data.eventType}\nTimeframe: ${data.timeframe}\nDescription: ${data.description}`;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: summary }],
        }),
      });
      const result = await res.json();
      if (result.qualified === true) {
        const reply = result.reply ?? "";
        if (reply) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: reply },
          ]);
        }
        setChatLocked(true);
        setTimeout(() => {
          onQualified();
        }, 500);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Thank you for your time. Based on the details provided, we are unable to proceed with this request. We wish you well.",
          },
        ]);
        setChatLocked(true);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "There appears to be a technical issue. Please try again shortly.",
        },
      ]);
      setChatLocked(true);
    }
    setLoading(false);
  }
  function handleEngagementSelect(option: string) {
    if (loading || chatLocked) return;
    const updated: IntakeData = { ...intake, eventType: option };
    setIntake(updated);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: option },
      { role: "assistant", content: "When would this take place?" },
    ]);
    setStep(1);
  }
  function handleTimeframeSelect(option: string) {
    if (loading || chatLocked) return;
    const updated: IntakeData = { ...intake, timeframe: option };
    setIntake(updated);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: option },
      {
        role: "assistant",
        content:
          "For clarity, all engagements are strictly platonic and take place in public settings. Does this align with your expectations?",
      },
    ]);
    setStep(2);
  }
  function handleConfirmationSelect(confirmed: boolean) {
    if (loading || chatLocked) return;
    if (!confirmed) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "I am looking for something else" },
        {
          role: "assistant",
          content:
            "Understood. Our service is designed around structured, platonic companionship in public settings. We wish you well in finding what you need.",
        },
      ]);
      setChatLocked(true);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { role: "user", content: "Yes, that aligns" },
      {
        role: "assistant",
        content:
          "Please share a brief note on the setting or nature of the engagement (for example, a social coffee, networking discussion, or event attendance).",
      },
    ]);
    setStep(3);
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading || chatLocked) return;
    if (input.length > 500) return;
    const lowerInput = input.toLowerCase();
    if (BLOCKED_WORDS.some((word) => lowerInput.includes(word))) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: input },
        {
          role: "assistant",
          content: "That is not within the scope of our service.",
        },
      ]);
      setChatLocked(true);
      setInput("");
      return;
    }
    const userMessage: Message = { role: "user", content: input };
    setInput("");
    // Step 3 — Context Description
    if (step === 3) {
      const updated: IntakeData = { ...intake, description: input };
      setIntake(updated);
      setMessages((prev) => [...prev, userMessage]);
      setStep(4);
      if (isSoftApproved(updated) && !isAmbiguous(input)) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Your request appears aligned with our standards for structured, public, platonic engagement.",
          },
        ]);
        setChatLocked(true);
        setTimeout(() => {
          onQualified();
        }, 500);
      } else {
        await evaluateRequest(updated);
      }
      return;
    }
  }
  const showEngagementButtons = step === 0 && !chatLocked;
  const showTimeframeButtons = step === 1 && !chatLocked;
  const showConfirmationButtons = step === 2 && !chatLocked;
  const showTextInput = step === 3 && !chatLocked;
  return (
    <>
      <style>{`
        .chat-wrapper {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-width: 640px;
          margin: 0 auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 14px;
          color: #1a1a1a;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bubble {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 12px;
          line-height: 1.5;
          word-break: break-word;
        }
        .bubble.assistant {
          align-self: flex-start;
          background: #f0f0f0;
          color: #1a1a1a;
          border-bottom-left-radius: 4px;
        }
        .bubble.user {
          align-self: flex-end;
          background: #1a1a1a;
          color: #ffffff;
          border-bottom-right-radius: 4px;
        }
        .chat-input-area {
          display: flex;
          flex-wrap: wrap;
          border-top: 1px solid #e0e0e0;
          padding: 12px 16px;
          gap: 10px;
          background: #ffffff;
        }
        .chat-input-area input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          background: #fafafa;
          color: #1a1a1a;
        }
        .chat-input-area input:focus {
          border-color: #888;
          background: #ffffff;
        }
        .chat-input-area button {
          padding: 10px 18px;
          background: #1a1a1a;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .chat-input-area button:hover:not(:disabled) {
          background: #333;
        }
        .chat-input-area button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .char-counter {
          font-size: 12px;
          color: #888;
          margin-top: 4px;
          text-align: right;
          width: 100%;
        }
        .button-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid #e0e0e0;
          background: #ffffff;
        }
        .option-btn {
          padding: 10px 14px;
          background: #fafafa;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          text-align: left;
          color: #1a1a1a;
          transition: background 0.15s, border-color 0.15s;
        }
        .option-btn:hover:not(:disabled) {
          background: #f0f0f0;
          border-color: #888;
        }
        .option-btn:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .confirmation-buttons {
          display: flex;
          gap: 10px;
          padding: 12px 16px;
          border-top: 1px solid #e0e0e0;
          background: #ffffff;
        }
        .confirm-btn {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #d0d0d0;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .confirm-btn.accept {
          background: #1a1a1a;
          color: #ffffff;
          border-color: #1a1a1a;
        }
        .confirm-btn.accept:hover {
          background: #333;
        }
        .confirm-btn.decline {
          background: #fafafa;
          color: #1a1a1a;
        }
        .confirm-btn.decline:hover {
          background: #f0f0f0;
        }
      `}</style>
      <div className="chat-wrapper">
        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`bubble ${msg.role === "user" ? "user" : "assistant"}`}
            >
              {msg.content}
            </div>
          ))}
          {loading && (
            <div className="bubble assistant">Reviewing…</div>
          )}
          <div ref={bottomRef} />
        </div>
        {showEngagementButtons && (
          <div className="button-options">
            {ENGAGEMENT_OPTIONS.map((option) => (
              <button
                key={option}
                className="option-btn"
                onClick={() => handleEngagementSelect(option)}
                disabled={loading}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {showTimeframeButtons && (
          <div className="button-options">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option}
                className="option-btn"
                onClick={() => handleTimeframeSelect(option)}
                disabled={loading}
              >
                {option}
              </button>
            ))}
          </div>
        )}
        {showConfirmationButtons && (
          <div className="confirmation-buttons">
            <button
              className="confirm-btn accept"
              onClick={() => handleConfirmationSelect(true)}
              disabled={loading}
            >
              Yes, that aligns
            </button>
            <button
              className="confirm-btn decline"
              onClick={() => handleConfirmationSelect(false)}
              disabled={loading}
            >
              I am looking for something else
            </button>
          </div>
        )}
        {showTextInput && (
          <form onSubmit={handleSubmit} className="chat-input-area">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Please provide a brief description (minimum 30 characters)"
              autoComplete="off"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={
                loading ||
                !input.trim() ||
                (step === 3 && input.trim().length < 30)
              }
            >
              Send
            </button>
            {step === 3 && (
              <div className="char-counter">
                ({input.trim().length} / 30 characters)
              </div>
            )}
          </form>
        )}
      </div>
    </>
  );
}