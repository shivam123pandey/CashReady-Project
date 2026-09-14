import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    window.setTimeout(() => setSent(false), 3500);
  };

  return (
    <main className="contact-page">
      <section className="contact-intro">
        <h1>How can we help?</h1>
        <p>Connect with our ATM operations team for platform support and banking questions.</p>
      </section>
      <div className="contact-grid">
        <section className="contact-details">
          <h2>Visit or reach us</h2>
          <div className="contact-details-list">
            <div className="contact-item">
              <span className="contact-icon">📍</span>
              <div className="contact-copy">
                <strong>Office</strong>
                <span>CashReady Technologies<br />14th Floor, Meridian Business Tower<br />Sector 62, Noida, Uttar Pradesh 201309</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">📞</span>
              <div className="contact-copy">
                <strong>Phone</strong>
                <span>+91 120 456 7890</span>
              </div>
            </div>
            <div className="contact-item contact-hours">
              <span className="contact-icon">🕒</span>
              <div className="contact-copy">
                <strong>Hours</strong>
                <span>Monday - Friday: 9:00 AM - 6:00 PM</span>
                <span>Saturday: 10:00 AM - 2:00 PM</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="contact-icon">✉️</span>
              <div className="contact-copy">
                <strong>Email</strong>
                <span>support@cashready.example<br />operations@cashready.example</span>
              </div>
            </div>
          </div>
        </section>
        <form className="contact-form" onSubmit={handleSubmit}>
          <label>Name<input name="name" required placeholder="Your name" /></label>
          <label>Email<input type="email" name="email" required placeholder="you@example.com" /></label>
          <label>Message<textarea name="message" required rows={4} placeholder="Tell us how we can help" /></label>
          <button type="submit">{sent ? "Message sent" : "Send message"}</button>
          {sent && <p className="form-success">Thanks. Our team will get back to you shortly.</p>}
        </form>
      </div>
      {sent && (
        <div className="success-toast" role="status" aria-live="polite">
          <span className="success-toast-icon" aria-hidden="true">✓</span>
          <span>
            <strong>Message sent successfully</strong>
            <small>Our team will get back to you shortly.</small>
          </span>
        </div>
      )}
    </main>
  );
}