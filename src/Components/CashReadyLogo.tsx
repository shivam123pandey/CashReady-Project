import { useNavigate } from "react-router-dom";

type CashReadyLogoProps = {
  className?: string;
};

export default function CashReadyLogo({ className = "brand-lockup" }: CashReadyLogoProps) {
  const navigate = useNavigate();

  return (
    <button
      className={className}
      type="button"
      aria-label="CashReady home"
      onClick={() => navigate("/")}
    >
      <span className="brand-icon" aria-hidden="true">
        <span className="brand-machine">
          <span className="brand-screen" />
          <span className="brand-slot" />
        </span>
        <span className="brand-cash-icon">₹</span>
      </span>
      <span className="brand-wordmark"><span>Cash</span>Ready</span>
    </button>
  );
}
