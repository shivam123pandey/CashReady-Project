import { useState } from "react";
import type { FormEvent } from "react";

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setError("");
    setIsSubmitting(true);
    const formData = new FormData(form);
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
      setShowSuccessModal(true);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSent(false);
  };

  return (
    <main className="contact-page">
      <section className="contact-intro"><h1>How can we help?</h1><p>Connect with our ATM operations team for platform support and banking questions.</p></section>
      <div className="contact-grid">
        <section className="contact-details"><h2>Visit or reach us</h2><div className="contact-details-list">
          <div className="contact-item"><span className="contact-icon">📍</span><div className="contact-copy"><strong>Office</strong><a href="https://maps.google.com/?q=CashReady+Technologies+Meridian+Business+Tower+Noida+Sector+62" target="_blank" rel="noreferrer">CashReady Technologies<br />14th Floor, Meridian Business Tower<br />Sector 62, Noida, Uttar Pradesh 201309</a></div></div>
          <div className="contact-item"><span className="contact-icon">📞</span><div className="contact-copy"><strong>Phone</strong><a href="tel:+911204567890">+91 120 456 7890</a></div></div>
          <div className="contact-item contact-hours"><span className="contact-icon">🕒</span><div className="contact-copy"><strong>Hours</strong><span>Monday - Friday: 9:00 AM - 6:00 PM</span><span>Saturday: 10:00 AM - 2:00 PM</span></div></div>
          <div className="contact-item"><span className="contact-icon">✉️</span><div className="contact-copy"><strong>Email</strong><a href="https://mail.google.com/mail/?view=cm&fs=1&to=support@cashready.example" target="_blank" rel="noreferrer">support@cashready.example</a><br /><a href="https://mail.google.com/mail/?view=cm&fs=1&to=operations@cashready.example" target="_blank" rel="noreferrer">operations@cashready.example</a></div></div>
        </div></section>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label><span>Name</span><input name="name" required placeholder="Your name" /></label>
          <label><span>Email</span><input type="email" name="email" required placeholder="you@example.com" /></label>
          <label><span>Message</span><textarea name="message" required rows={7} placeholder="Tell us how we can help" /></label>
          <button type="submit" disabled={isSubmitting}>{isSubmitting ? "Sending..." : sent ? "Message sent" : "Send message"}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      </div>
      {showSuccessModal && (
        <div className="success-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="message-success-title">
          <div className="success-modal">
            <div className="success-modal-icon" aria-hidden="true">✓</div>
            <h3 id="message-success-title">Message Sent!</h3>
            <p>Our team will get back to you shortly.</p>
            <button type="button" className="success-modal-button" onClick={handleCloseSuccessModal}>OK</button>
          </div>
        </div>
      )}
    </main>
  );
}
