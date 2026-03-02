"use client";

import { FormEvent, useState } from "react";

type FormData = {
  fullName: string;
  whatsappNumber: string;
  city: string;
  occasionType: string;
  referralSource: string;
};

type FormErrors = Partial<Record<keyof FormData, string>> & {
  submit?: string;
};

const initialData: FormData = {
  fullName: "",
  whatsappNumber: "",
  city: "",
  occasionType: "",
  referralSource: "",
};

const successMessage =
  "Your request has been received. If aligned, a member of The Plus One Co. will reach out discreetly.";

export default function LeadForm() {
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(values: FormData): FormErrors {
    const nextErrors: FormErrors = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Full Name is required.";
    if (!values.whatsappNumber.trim()) {
      nextErrors.whatsappNumber = "WhatsApp Number is required.";
    } else if (!/^[0-9+\-\s()]{8,20}$/.test(values.whatsappNumber.trim())) {
      nextErrors.whatsappNumber = "Enter a valid WhatsApp Number.";
    }
    if (!values.city.trim()) nextErrors.city = "City is required.";
    if (!values.occasionType) nextErrors.occasionType = "Occasion Type is required.";

    return nextErrors;
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined, submit: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(false);

    const nextErrors = validate(formData);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("We could not submit your request right now. Please try again.");
      }

      setSubmitted(true);
      setFormData(initialData);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not submit your request right now. Please try again.";
      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: 16,
        background: "#f7f8fa",
        borderRadius: 16,
        border: "1px solid #e5e7eb",
      }}
    >
      <form onSubmit={handleSubmit} noValidate style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6, color: "#111827", fontSize: 14 }}>
          Full Name
          <input
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          {errors.fullName ? <span style={errorStyle}>{errors.fullName}</span> : null}
        </label>

        <label style={{ display: "grid", gap: 6, color: "#111827", fontSize: 14 }}>
          WhatsApp Number
          <input
            value={formData.whatsappNumber}
            onChange={(e) => handleChange("whatsappNumber", e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          {errors.whatsappNumber ? (
            <span style={errorStyle}>{errors.whatsappNumber}</span>
          ) : null}
        </label>

        <label style={{ display: "grid", gap: 6, color: "#111827", fontSize: 14 }}>
          City
          <input
            value={formData.city}
            onChange={(e) => handleChange("city", e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
          {errors.city ? <span style={errorStyle}>{errors.city}</span> : null}
        </label>

        <label style={{ display: "grid", gap: 6, color: "#111827", fontSize: 14 }}>
          Occasion Type
          <select
            value={formData.occasionType}
            onChange={(e) => handleChange("occasionType", e.target.value)}
            disabled={loading}
            style={inputStyle}
          >
            <option value="">Select an occasion</option>
            <option value="social">Social Event</option>
            <option value="business">Business Event</option>
            <option value="family">Family Function</option>
            <option value="formal">Formal Engagement</option>
            <option value="other">Other</option>
          </select>
          {errors.occasionType ? <span style={errorStyle}>{errors.occasionType}</span> : null}
        </label>

        <label style={{ display: "grid", gap: 6, color: "#111827", fontSize: 14 }}>
          How did you hear about us (optional)
          <input
            value={formData.referralSource}
            onChange={(e) => handleChange("referralSource", e.target.value)}
            disabled={loading}
            style={inputStyle}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            borderRadius: 12,
            border: "1px solid #d1d5db",
            padding: "10px 16px",
            background: "#ffffff",
            color: "#111827",
            cursor: loading ? "not-allowed" : "pointer",
            width: "fit-content",
          }}
        >
          {loading ? "Submitting..." : "Submit"}
        </button>

        {errors.submit ? <p style={errorStyle}>{errors.submit}</p> : null}
        {submitted ? (
          <p style={{ color: "#1f2937", fontSize: 14, margin: 0 }}>{successMessage}</p>
        ) : null}
      </form>
    </div>
  );
}

const inputStyle = {
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  background: "#ffffff",
  color: "#111827",
};

const errorStyle = {
  color: "#b91c1c",
  fontSize: 12,
  margin: 0,
};
