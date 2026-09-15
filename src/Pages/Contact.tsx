import { useState } from "react";
import type { FormEvent } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim(),
    };
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data: { ok?: boolean; error?: string } = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error ?? "Unable to send message");
      setSent(true);
      event.currentTarget.reset();
      window.setTimeout(() => setSent(false), 3500);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <section className="contact-intro"><h1>How can we help?</h1><p>Connect with our ATM operations team for platform support and banking questions.</p></section>
      <div className="contact-grid">
        <section className="contact-details"><h2>Visit or reach us</h2><div className="contact-details-list">
          <div className="contact-item"><span className="contact-icon">📍</span><div className="contact-copy"><strong>Office</strong><span>CashReady Technologies<br />14th Floor, Meridian Business Tower<br />Sector 62, Noida, Uttar Pradesh 201309</span></div></div>
          <div className="contact-item"><span className="contact-icon">📞</span><div className="contact-copy"><strong>Phone</strong><span>+91 120 456 7890</span></div></div>
          <div className="contact-item contact-hours"><span className="contact-icon">🕒</span><div className="contact-copy"><strong>Hours</strong><span>Monday - Friday: 9:00 AM - 6:00 PM</span><span>Saturday: 10:00 AM - 2:00 PM</span></div></div>
          <div className="contact-item"><span className="contact-icon">✉️</span><div className="contact-copy"><strong>Email</strong><span>support@cashready.example<br />operations@cashready.example</span></div></div>
        </div></section>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label><span>Name</span><input name="name" required placeholder="Your name" /></label>
          <label><span>Email</span><input type="email" name="email" required placeholder="you@example.com" /></label>
          <label><span>Message</span><textarea name="message" required rows={7} placeholder="Tell us how we can help" /></label>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : sent ? "Message sent" : "Send message"}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
          {sent && <p className="form-success">Thanks. Our team will get back to you shortly.</p>}
        </form>
      </div>
      {sent && <div className="success-toast" role="status" aria-live="polite"><span className="success-toast-icon" aria-hidden="true">✓</span><span><strong>Message sent successfully</strong><small>Our team will get back to you shortly.</small></span></div>}
    </main>
  );
}
