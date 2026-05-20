import { useEffect, useRef, useState } from "react";

const APK_URL = "https://expo.dev/artifacts/eas/qXLZ3XuaV4dFSXdTfY6ReT.apk";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, visible } = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  {
    icon: "💸",
    title: "Track Every Rupee",
    desc: "Log income and expenses in seconds. See exactly where your money goes — no spreadsheets needed.",
  },
  {
    icon: "🎯",
    title: "Turn Wishes Into Plans",
    desc: "Add a goal — phone, trip, gadget. Finny tells you when you can afford it based on your real savings.",
  },
  {
    icon: "🤖",
    title: "Ask Your AI Advisor",
    desc: "Ask anything — 'Can I afford this?', 'How much did I spend on food?'. Get instant, honest answers.",
  },
];

const screenshots = [
  { src: "/onboarding1.png", caption: "Know your money" },
  { src: "/onboarding2.png", caption: "Plan your goals" },
  { src: "/onboarding3.png", caption: "AI-powered advice" },
];

export default function Index() {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
    window.open(APK_URL, "_blank");
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: "#fff", color: "#0a0a0a", overflowX: "hidden" }}>
      {/* Google Font */}
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 5vw", height: 64,
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #f0f4f8",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Finny" style={{ width: 32, height: 32, borderRadius: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 20, letterSpacing: -0.5 }}>finny</span>
        </div>
        <button
          onClick={handleDownload}
          style={{
            background: "linear-gradient(135deg, #63B0F2, #268FFF)",
            color: "#fff",
            border: "none",
            borderRadius: 100,
            padding: "9px 22px",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(38,143,255,0.3)",
          }}
        >
          {downloading ? "Downloading..." : "Get the App"}
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        padding: "100px 5vw 60px",
        background: "linear-gradient(160deg, #f0f8ff 0%, #ffffff 60%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* BG orb */}
        <div style={{
          position: "absolute", top: -120, right: -120,
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, #cce8ff55 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: -100, left: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, #e0f2ff44 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 640, position: "relative" }}>
          <div style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #e6f3ff, #cce4ff)",
            color: "#268FFF",
            borderRadius: 100,
            padding: "5px 16px",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 24,
            letterSpacing: 0.3,
          }}>
            Your Personal Finance Buddy
          </div>

          <h1 style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(36px, 6vw, 64px)",
            lineHeight: 1.1,
            letterSpacing: -2,
            color: "#0a0a0a",
            marginBottom: 20,
          }}>
            Spend less.<br />
            <span style={{
              background: "linear-gradient(90deg, #63B0F2, #268FFF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>Save more.</span>{" "}
            Stress never.
          </h1>

          <p style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(15px, 2vw, 18px)",
            color: "#5a6070",
            lineHeight: 1.7,
            marginBottom: 36,
            maxWidth: 480,
            margin: "0 auto 36px",
          }}>
            Finny tracks your money, plans your goals, and gives you an AI advisor — all in one clean app.
          </p>

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleDownload}
              style={{
                background: "linear-gradient(135deg, #63B0F2, #268FFF)",
                color: "#fff",
                border: "none",
                borderRadius: 100,
                padding: "15px 36px",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(38,143,255,0.35)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16L7 11M12 16L17 11M12 16V4M20 20H4" />
              </svg>
              {downloading ? "Downloading..." : "Download APK"}
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              fontSize: 13, color: "#8a8a8a", fontFamily: "Inter, sans-serif",
              padding: "15px 20px",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#268FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              Android • Free forever
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 28, flexWrap: "wrap" }}>
            {["No ads", "No subscription", "Offline ready"].map((t) => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5a6070", fontFamily: "Inter, sans-serif" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#268FFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          color: "#b0b8c8", fontSize: 12, fontFamily: "Inter, sans-serif",
          animation: "bounce 2s infinite",
        }}>
          <span>scroll</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── Screenshots ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 5vw", background: "#fafcff" }}>
        <FadeUp className="" delay={0}>
          <h2 style={{
            textAlign: "center",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(24px, 4vw, 40px)",
            letterSpacing: -1,
            marginBottom: 8,
          }}>
            Simple by design
          </h2>
          <p style={{
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            color: "#8a8a8a",
            fontSize: 15,
            marginBottom: 52,
          }}>
            Every screen built to keep you in control, not overwhelmed.
          </p>
        </FadeUp>

        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "clamp(16px, 3vw, 32px)",
          flexWrap: "wrap",
        }}>
          {screenshots.map((s, i) => (
            <FadeUp key={i} delay={i * 120}>
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
              }}>
                <div style={{
                  borderRadius: 24,
                  overflow: "hidden",
                  boxShadow: "0 16px 48px rgba(38,143,255,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                  width: "clamp(140px, 22vw, 200px)",
                  border: "4px solid #fff",
                }}>
                  <img src={s.src} alt={s.caption} style={{ width: "100%", display: "block" }} />
                </div>
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#8a8a8a" }}>{s.caption}</span>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 5vw", maxWidth: 1000, margin: "0 auto" }}>
        <FadeUp>
          <h2 style={{
            textAlign: "center",
            fontFamily: "Poppins, sans-serif",
            fontWeight: 700,
            fontSize: "clamp(24px, 4vw, 40px)",
            letterSpacing: -1,
            marginBottom: 8,
          }}>
            Everything you need
          </h2>
          <p style={{
            textAlign: "center",
            fontFamily: "Inter, sans-serif",
            color: "#8a8a8a",
            fontSize: 15,
            marginBottom: 52,
          }}>
            No bloat. Just the tools that actually move the needle.
          </p>
        </FadeUp>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
        }}>
          {features.map((f, i) => (
            <FadeUp key={i} delay={i * 100}>
              <div style={{
                background: "#fff",
                border: "1px solid #eef2f8",
                borderRadius: 20,
                padding: "28px 24px",
                boxShadow: "0 2px 16px rgba(38,143,255,0.06)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(38,143,255,0.12)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 16px rgba(38,143,255,0.06)";
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{
                  fontFamily: "Poppins, sans-serif",
                  fontWeight: 600,
                  fontSize: 17,
                  marginBottom: 8,
                  letterSpacing: -0.3,
                }}>{f.title}</h3>
                <p style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  color: "#6b7280",
                  lineHeight: 1.7,
                  margin: 0,
                }}>{f.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 5vw" }}>
        <FadeUp>
          <div style={{
            background: "linear-gradient(135deg, #e6f3ff 0%, #cce4ff 100%)",
            borderRadius: 28,
            padding: "60px 40px",
            textAlign: "center",
            maxWidth: 680,
            margin: "0 auto",
          }}>
            <h2 style={{
              fontFamily: "Poppins, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(26px, 4vw, 40px)",
              letterSpacing: -1.5,
              marginBottom: 12,
            }}>
              Start for free today.
            </h2>
            <p style={{
              fontFamily: "Inter, sans-serif",
              color: "#4a5568",
              fontSize: 15,
              marginBottom: 32,
              lineHeight: 1.6,
            }}>
              No sign-up. No credit card. Just download and go.
            </p>
            <button
              onClick={handleDownload}
              style={{
                background: "linear-gradient(135deg, #63B0F2, #268FFF)",
                color: "#fff",
                border: "none",
                borderRadius: 100,
                padding: "15px 40px",
                fontFamily: "Poppins, sans-serif",
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 8px 28px rgba(38,143,255,0.35)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16L7 11M12 16L17 11M12 16V4M20 20H4" />
              </svg>
              {downloading ? "Downloading..." : "Download APK — It's Free"}
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid #f0f4f8",
        padding: "28px 5vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img src="/logo.png" alt="Finny" style={{ width: 24, height: 24, borderRadius: 6 }} />
          <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: -0.3 }}>finny</span>
        </div>
        <span style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#b0b8c8" }}>
          Made with ❤️ for your financial peace of mind
        </span>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(6px); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
