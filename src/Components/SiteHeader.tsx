import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function SiteHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginOpen, setLoginOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const isBanker = localStorage.getItem("cashready_role") === "banker";
  const isLoggedIn = Boolean(localStorage.getItem("cashready_token") || sessionStorage.getItem("cashready_token"));

  const handleLogout = async () => {
    const token = localStorage.getItem("cashready_token") ?? sessionStorage.getItem("cashready_token");

    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.warn("Logout request failed", error);
    } finally {
      localStorage.removeItem("cashready_token");
      localStorage.removeItem("cashready_role");
      sessionStorage.removeItem("cashready_token");
      setLoginOpen(false);
      navigate("/");
    }
  };

  const isActive = (paths: string[]) => paths.includes(location.pathname);
  const searchOptions = [
    { label: "ATM Locator", hint: "Find nearby ATMs", path: "/map" },
    ...(isBanker ? [{ label: "Bank Analytics", hint: "Monitor ATM health", path: "/banker-dashboard" }] : []),
    { label: "Operations Center & Reports", hint: "Review banking operations", path: "/operations-reports" },
    { label: "Contact", hint: "Get in touch with CashReady", path: "/contact" },
  ];
  const matchingOptions = searchQuery.trim()
    ? searchOptions.filter((option) => `${option.label} ${option.hint}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];

  return (
    <div className="site-header-shell">
      <header className="brand-header">
        <button className="brand-lockup" type="button" onClick={() => navigate("/")}>
          <span className="brand-icon" aria-hidden="true">
            <span className="brand-machine">
              <span className="brand-screen" />
              <span className="brand-slot" />
            </span>
            <span className="brand-cash-icon">₹</span>
          </span>
          <span className="brand-wordmark"><span>Cash</span>Ready</span>
        </button>
        <div className="site-search">
          <span>⌕</span>
          <input
            aria-label="Search"
            placeholder="What are you looking for today?"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onFocus={() => setSearchQuery((query) => query)}
          />
          {matchingOptions.length > 0 && (
            <div className="search-dropdown">
              {matchingOptions.map((option) => (
                <button
                  type="button"
                  key={option.path}
                  onClick={() => { setSearchQuery(""); navigate(option.path); }}
                >
                  <strong>{option.label}</strong>
                  <small>{option.hint}</small>
                </button>
              ))}
            </div>
          )}
          {searchQuery.trim() && matchingOptions.length === 0 && (
            <div className="search-empty">No result found</div>
          )}
        </div>
        <div
          className="login-menu"
          onMouseEnter={() => setLoginOpen(true)}
          onMouseLeave={() => setLoginOpen(false)}
        >
          {isLoggedIn ? (
            <button
              className="login-button"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          ) : (
            <>
              <button
                className="login-button"
                type="button"
                aria-expanded={loginOpen}
              >
                Login
              </button>
              {loginOpen && (
                <div className="login-dropdown">
                  <button type="button" onClick={() => { setLoginOpen(false); navigate("/login/customer"); }}>
                    Login as Customer
                  </button>
                  <button type="button" onClick={() => { setLoginOpen(false); navigate("/login/banker"); }}>
                    Login as Banker
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </header>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={isActive(["/", "/home"]) ? "active" : ""} type="button" onClick={() => navigate("/home")}>Dashboard</button>
        <button className={isActive(["/map"]) ? "active" : ""} type="button" onClick={() => navigate("/map")}>ATM Locator</button>
        {isBanker && <button className={isActive(["/banker-dashboard"]) ? "active" : ""} type="button" onClick={() => navigate("/banker-dashboard")}>Bank Analytics</button>}
        <button className={isActive(["/operations", "/reports", "/operations-reports"]) ? "active" : ""} type="button" onClick={() => navigate("/operations-reports")}>Operations Center &amp; Reports</button>
        <button className={isActive(["/contact"]) ? "active" : ""} type="button" onClick={() => navigate("/contact")}>Contact</button>
      </nav>
    </div>
  );
}