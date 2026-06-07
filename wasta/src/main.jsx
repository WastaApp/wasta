import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import WastaApp from "../wasta_mvp.jsx";
import WastaAdmin from "../wasta_admin.jsx";
import ProviderOnboarding from "../wasta_provider_onboarding.jsx";

const C = {
  gold:"#C9A84C", ink:"#1A1612", muted:"#7A7166",
  sand:"#EDE8DF", sandDark:"#D4CCBC", cream:"#FAF7F2",
};

function LandingPage({ navigate }) {
  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: C.ink, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <div style={{ padding: "18px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2a2520" }}>
        <div style={{ color: C.gold, fontSize: 22, fontWeight: 700, letterSpacing: "0.06em" }}>WASTA <span style={{ color: "#444", fontSize: 14 }}>واسطة</span></div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("join")} style={{ background: "none", border: `1px solid ${C.gold}`, color: C.gold, borderRadius: 8, padding: "8px 18px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>Join as Pro</button>
          <button onClick={() => navigate("admin")} style={{ background: "none", border: "1px solid #333", color: C.muted, borderRadius: 8, padding: "8px 18px", fontFamily: "sans-serif", fontSize: 13, cursor: "pointer" }}>Admin</button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ color: C.gold, fontFamily: "sans-serif", fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16 }}>Dubai's trusted service marketplace</div>
        <h1 style={{ color: "#fff", fontSize: 48, fontWeight: 700, margin: "0 0 16px", lineHeight: 1.15, maxWidth: 600 }}>Verified home services, booked in minutes</h1>
        <p style={{ color: C.muted, fontFamily: "sans-serif", fontSize: 16, maxWidth: 480, lineHeight: 1.7, marginBottom: 36 }}>AC service, plumbing, electrical, cleaning and more — all providers are Emirates ID verified and trade licensed.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <button onClick={() => navigate("app")} style={{ background: C.gold, color: C.ink, border: "none", borderRadius: 10, padding: "15px 36px", fontFamily: "sans-serif", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Book a service →</button>
          <button onClick={() => navigate("join")} style={{ background: "none", color: C.gold, border: `1.5px solid ${C.gold}`, borderRadius: 10, padding: "15px 36px", fontFamily: "sans-serif", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Join as a pro</button>
        </div>
      </div>

      {/* Services strip */}
      <div style={{ padding: "32px 40px", borderTop: "1px solid #2a2520" }}>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {[["❄","AC service"],["🔧","Plumbing"],["⚡","Electrical"],["✨","Deep cleaning"],["📦","Moving"],["🖌","Painting"],["🪚","Carpentry"],["🛡","Pest control"]].map(([icon, label]) => (
            <div key={label} onClick={() => navigate("app")} style={{ display: "flex", alignItems: "center", gap: 8, background: "#1a1612", border: "1px solid #2a2520", borderRadius: 8, padding: "10px 16px", cursor: "pointer", transition: "border-color 0.2s" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontFamily: "sans-serif", fontSize: 13, color: C.muted }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: "16px 40px", borderTop: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "#333", fontFamily: "sans-serif", fontSize: 12 }}>© 2026 Wasta · Dubai, UAE</div>
        <div style={{ display: "flex", gap: 20 }}>
          <button onClick={() => navigate("join")} style={{ background: "none", border: "none", color: "#444", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>Become a provider</button>
          <button onClick={() => navigate("admin")} style={{ background: "none", border: "none", color: "#444", fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>Admin login</button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const getRoute = () => {
    const path = window.location.pathname;
    if (path === "/admin") return "admin";
    if (path === "/join") return "join";
    if (path === "/app") return "app";
    return "landing";
  };

  const [route, setRoute] = useState(getRoute());

  const navigate = (r) => {
    const paths = { landing: "/", app: "/app", admin: "/admin", join: "/join" };
    window.history.pushState({}, "", paths[r] || "/");
    setRoute(r);
  };

  useEffect(() => {
    const handler = () => setRoute(getRoute());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (route === "admin") return (
    <div>
      <div style={{ background: C.ink, padding: "8px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("landing")} style={{ background: "none", border: "none", color: C.gold, fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>← Back to Wasta</button>
      </div>
      <WastaAdmin />
    </div>
  );

  if (route === "join") return (
    <div>
      <div style={{ background: C.ink, padding: "8px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={() => navigate("landing")} style={{ background: "none", border: "none", color: C.gold, fontFamily: "sans-serif", fontSize: 12, cursor: "pointer" }}>← Back to Wasta</button>
      </div>
      <ProviderOnboarding />
    </div>
  );

  if (route === "app") return <WastaApp />;

  return <LandingPage navigate={navigate} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
