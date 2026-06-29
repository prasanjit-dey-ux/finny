import { useEffect, useRef, useState, type ReactNode } from "react";

const APK_URL = "/api/download";

/* ── Scroll reveal component ───────────────────── */
function Reveal({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Download icon SVG ─────────────────────────── */
const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.5V10.5M8 10.5L4.5 7M8 10.5L11.5 7M2.5 13H13.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Shared gradient button ─────────────────────── */
const gradientBtnStyle: React.CSSProperties = {
  display: "flex",
  height: "3rem",
  padding: "1rem 1.5rem",
  justifyContent: "center",
  alignItems: "center",
  gap: "0.5rem",
  borderRadius: "3.125rem",
  border: "1px solid #90E9FF",
  background: "linear-gradient(180deg, #8DDBFF 0%, #268FFF 100%)",
  boxShadow:
    "0 4px 14px 0 rgba(0,0,0,0.05), 0 2px 0 0 rgba(255,255,255,0.50) inset, 0 1px 0 0 rgba(0,0,0,0.10)",
  color: "#fff",
  fontFamily: "'Instrument Sans', sans-serif",
  fontWeight: 600,
  fontSize: 14,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

/* ── Features data ──────────────────────────────── */
const features = [
  {
    img: "/feature1.png",
    title: "See exactly where your money goes",
    desc: "Track income, expenses, and budgets at a glance. Nothing slips through the cracks.",
  },
  {
    img: "/feature2.png",
    title: "Ask Finny anything about your money",
    desc: "\"Can I afford this?\" \"Where did my salary go?\" Just ask — Finny gives honest, clear answers.",
  },
  {
    img: "/feature3.png",
    title: "Dream it. Plan it. Own it.",
    desc: "Add anything you want to buy. Finny tells you exactly when you can afford it.",
  },
];

export default function Index() {
  const [downloading, setDownloading] = useState(false);
  const [navLight, setNavLight] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => setDownloading(false), 2000);
    const a = document.createElement("a");
    a.href = APK_URL;
    a.download = "Finny.apk";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    videoRef.current?.play().catch(() => {});

    const handleScroll = () => {
      const hiwSection = document.getElementById("how-it-works");
      if (!hiwSection) return;
      const rect = hiwSection.getBoundingClientRect();
      setNavLight(rect.top <= 64);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      style={{
        fontFamily: "'Instrument Sans', sans-serif",
        background: "#1B1B1B",
        color: "#fff",
        minHeight: "100vh",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* ── Nav ──────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: navLight ? "rgba(255,255,255,0.9)" : "rgba(27,27,27,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: navLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid rgba(255,255,255,0.06)",
          transition: "background 0.3s, border-bottom 0.3s",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 clamp(20px, 5vw, 60px)",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left — Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img
              src="/logo.png"
              alt="Finny"
              style={{ width: 32, height: 32, borderRadius: 8 }}
            />
            <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5, color: navLight ? "#1B1B1B" : "#fff", transition: "color 0.3s" }}>
              finny
            </span>
          </div>

          {/* Center — Links */}
          <div
            className="nav-links-center"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 28,
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            {[
              { href: "#how-it-works", label: "How it works" },
              { href: "#features", label: "Features" },
              { href: "https://x.com/Prasanjit_ui", label: "X/Twitter", external: true },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                className="nav-link"
                style={{
                  color: navLight ? "rgba(27,27,27,0.5)" : "rgba(255,255,255,0.5)",
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = navLight ? "#1B1B1B" : "#fff")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = navLight ? "rgba(27,27,27,0.5)" : "rgba(255,255,255,0.5)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right — Download (desktop) + Burger (mobile) */}
          <div className="nav-right-download" style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button onClick={handleDownload} style={gradientBtnStyle}>
              <DownloadIcon /> Download
            </button>
          </div>

          {/* Burger button (mobile only) */}
          <button
            className="nav-burger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
            style={{
              display: "none",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              zIndex: 110,
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              {menuOpen ? (
                <path d="M6 6L18 18M6 18L18 6" stroke={navLight ? "#1B1B1B" : "#fff"} strokeWidth="2" strokeLinecap="round"/>
              ) : (
                <>
                  <path d="M4 7H20" stroke={navLight ? "#1B1B1B" : "#fff"} strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 12H20" stroke={navLight ? "#1B1B1B" : "#fff"} strokeWidth="2" strokeLinecap="round"/>
                  <path d="M4 17H20" stroke={navLight ? "#1B1B1B" : "#fff"} strokeWidth="2" strokeLinecap="round"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu overlay ────────────────────── */}
      {menuOpen && (
        <div
          className="mobile-menu-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99,
            background: navLight ? "rgba(255,255,255,0.97)" : "rgba(27,27,27,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            paddingTop: 64,
          }}
        >
          {[
            { href: "#how-it-works", label: "How it works" },
            { href: "#features", label: "Features" },
            { href: "https://x.com/Prasanjit_ui", label: "X/Twitter", external: true },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => setMenuOpen(false)}
              style={{
                color: navLight ? "#1B1B1B" : "#fff",
                textDecoration: "none",
                fontSize: 20,
                fontWeight: 500,
                fontFamily: "'Instrument Sans', sans-serif",
              }}
            >
              {link.label}
            </a>
          ))}
          <button onClick={() => { handleDownload(); setMenuOpen(false); }} style={{ ...gradientBtnStyle, marginTop: 8 }}>
            <DownloadIcon /> Download For Android
          </button>
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────── */}
      <section
        style={{
          paddingTop: 140,
          paddingLeft: "clamp(20px, 5vw, 60px)",
          paddingRight: "clamp(20px, 5vw, 60px)",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {/* Top row */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 48,
            flexWrap: "wrap",
            marginBottom: 48,
          }}
        >
          {/* Heading — left */}
          <Reveal style={{ flex: "1 1 360px" }}>
            <h1
              className="hero-heading"
              style={{
                color: "#FFF",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "3rem",
                fontStyle: "normal",
                fontWeight: 500,
                lineHeight: "3.5rem",
                margin: 0,
              }}
            >
              Finally know where
              <br />
              your money went.
            </h1>
          </Reveal>

          {/* Right — Para + CTA, top-aligned with heading */}
          <Reveal delay={0.15} style={{ flex: "0 1 420px", display: "flex", flexDirection: "column", justifyContent: "flex-start", paddingTop: 4 }}>
            <p
              className="hero-para"
              style={{
                color: "#FFF",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "1.125rem",
                fontStyle: "normal",
                fontWeight: 400,
                lineHeight: "1.625rem",
                margin: "0 0 24px 0",
                opacity: 0.55,
              }}
            >
              Spend less. Save more. Stress never. Finny tracks your money,
              plans your goals, and gives you an AI advisor all in one clean
              app.
            </p>
            <div>
              <button onClick={handleDownload} style={gradientBtnStyle}>
                <DownloadIcon /> {downloading ? "Downloading..." : "Download For Android"}
              </button>
            </div>
          </Reveal>
        </div>

        {/* Full-width video */}
        <Reveal delay={0.3}>
          <div
            style={{
              width: "100%",
              borderRadius: 16,
              overflow: "hidden",
              background: "#000",
            }}
          >
            <video
              ref={videoRef}
              src="/demo.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{
                width: "100%",
                display: "block",
              }}
            />
          </div>
        </Reveal>
      </section>

      {/* ── How It Works ──────────────────────────── */}
      <section
        id="how-it-works"
        style={{
          background: "#FFFFFF",
          marginTop: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "100px clamp(20px, 5vw, 60px)",
          }}
        >
        {/* Section header */}
        <Reveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span
              style={{
                color: "#008DFF",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              HOW IT WORKS
            </span>
            <h2
              className="section-heading"
              style={{
                color: "#1B1B1B",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "2.5rem",
                fontWeight: 500,
                lineHeight: "3rem",
                margin: "16px 0 0 0",
              }}
            >
              Up and running in 2 minutes.
            </h2>
            <p
              style={{
                color: "rgba(27,27,27,0.5)",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "1.125rem",
                fontWeight: 400,
                lineHeight: "1.625rem",
                margin: "16px auto 0",
                maxWidth: 480,
              }}
            >
              No bank connection. No complicated setup. Just three steps and you
              are good to go.
            </p>
          </div>
        </Reveal>

        {/* Cards grid */}
        <div
          className="hiw-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
          }}
        >
          {[
            {
              img: "/card1.png",
              title: "Download and open",
              desc: "Install Finny in seconds. No sign-up. No bank connection. Just open and you are ready.",
            },
            {
              img: "/card2.png",
              title: "Ask Finny anything",
              desc: "Where did my salary go? Can I afford this? Honest answers based on your real numbers.",
            },
            {
              img: "/card3.png",
              title: "Add your wishes",
              desc: "Add anything you want to buy. Finny tells you when you can afford it.",
            },
          ].map((card, i) => (
            <Reveal key={i} delay={i * 0.1}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "1rem",
                alignSelf: "stretch",
              }}
            >
              {/* Card image */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "linear-gradient(180deg, #D6EEFF 0%, #EAF4FF 100%)",
                }}
              >
                <img
                  src={card.img}
                  alt={card.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              {/* Card text */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  alignSelf: "stretch",
                }}
              >
                <h3
                  style={{
                    color: "#1B1B1B",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    lineHeight: "1.75rem",
                    margin: 0,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    color: "rgba(27,27,27,0.5)",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "1rem",
                    fontWeight: 400,
                    lineHeight: "1.5rem",
                    margin: 0,
                  }}
                >
                  {card.desc}
                </p>
              </div>
            </div>
            </Reveal>
          ))}
        </div>
        </div>
      </section>

      {/* ── Features (zigzag) ─────────────────────────── */}
      <section
        id="features"
        style={{
          background: "#FFFFFF",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "100px clamp(20px, 5vw, 60px)",
          }}
        >
          {/* Section header */}
          <Reveal>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <span
                style={{
                  color: "#008DFF",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                FEATURES
              </span>
              <h2
                className="section-heading"
                style={{
                  color: "#1B1B1B",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "2.5rem",
                  fontWeight: 500,
                  lineHeight: "3rem",
                  margin: "16px 0 0 0",
                }}
              >
                Simple tools. Real results.
              </h2>
              <p
                style={{
                  color: "rgba(27,27,27,0.5)",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "1.125rem",
                  fontWeight: 400,
                  lineHeight: "1.625rem",
                  margin: "16px auto 0",
                  maxWidth: 520,
                }}
              >
                No complicated setup. No bank connection needed.{"\n"}Just open Finny and start making sense of your money.
              </p>
            </div>
          </Reveal>

          {/* Zigzag rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
            {features.map((feat, i) => {
              const imgLeft = i % 2 === 0;
              return (
                <div
                  key={i}
                  className="feature-row"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 64,
                    flexDirection: imgLeft ? "row" : "row-reverse",
                  }}
                >
                  {/* Image */}
                  <Reveal style={{ flex: "1 1 50%" }}>
                    <img
                      src={feat.img}
                      alt={feat.title}
                      style={{
                        width: "100%",
                        borderRadius: 16,
                        display: "block",
                      }}
                    />
                  </Reveal>

                  {/* Text */}
                  <Reveal delay={0.15} style={{ flex: "1 1 50%" }}>
                    <h3
                      style={{
                        color: "#1B1B1B",
                        fontFamily: "'Instrument Sans', sans-serif",
                        fontSize: "2rem",
                        fontWeight: 500,
                        lineHeight: "2.5rem",
                        margin: "0 0 16px 0",
                      }}
                    >
                      {feat.title}
                    </h3>
                    <p
                      style={{
                        color: "rgba(27,27,27,0.5)",
                        fontFamily: "'Instrument Sans', sans-serif",
                        fontSize: "1.125rem",
                        fontWeight: 400,
                        lineHeight: "1.75rem",
                        margin: 0,
                        maxWidth: 420,
                      }}
                    >
                      {feat.desc}
                    </p>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Section ─────────────────────────────── */}
      <section
        style={{
          background: "#FFFFFF",
          padding: "120px clamp(20px, 5vw, 60px)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Reveal>
            <h2
              className="section-heading"
              style={{
                color: "#1B1B1B",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "3rem",
                fontWeight: 500,
                lineHeight: "3.5rem",
                margin: "0 0 32px 0",
              }}
            >
              Try Finny now.
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <button onClick={handleDownload} style={gradientBtnStyle}>
              <DownloadIcon /> Download For Android
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer
        style={{
          background: "#1B1B1B",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "48px clamp(20px, 5vw, 60px)",
          }}
        >
          {/* Top row */}
          <div
            className="footer-top"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 40,
              marginBottom: 48,
              flexWrap: "wrap",
            }}
          >
            {/* Left — Logo + tagline */}
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <img src="/logo.png" alt="Finny" style={{ width: 32, height: 32, borderRadius: 8 }} />
                <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: -0.5, color: "#fff" }}>
                  finny
                </span>
              </div>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: "0.875rem",
                  lineHeight: "1.375rem",
                  margin: 0,
                }}
              >
                Your personal finance companion.{"\n"}Track, plan, and save — all in one app.
              </p>
            </div>

            {/* Right — Links */}
            <div
              className="footer-links"
              style={{
                display: "flex",
                gap: 56,
              }}
            >
              <div>
                <h4
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 16px 0",
                  }}
                >
                  Product
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "How it works", href: "#how-it-works" },
                    { label: "Features", href: "#features" },
                    { label: "Download", href: APK_URL },
                  ].map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      style={{
                        color: "rgba(255,255,255,0.5)",
                        textDecoration: "none",
                        fontFamily: "'Instrument Sans', sans-serif",
                        fontSize: "0.875rem",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4
                  style={{
                    color: "rgba(255,255,255,0.3)",
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    margin: "0 0 16px 0",
                  }}
                >
                  Connect
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <a
                    href="https://x.com/Prasanjit_ui"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "rgba(255,255,255,0.5)",
                      textDecoration: "none",
                      fontFamily: "'Instrument Sans', sans-serif",
                      fontSize: "0.875rem",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
                  >
                    X/Twitter
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 24 }} />

          {/* Bottom row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "0.8125rem",
                margin: 0,
              }}
            >
              &copy; {new Date().getFullYear()} Finny. All rights reserved.
            </p>
            <p
              style={{
                color: "rgba(255,255,255,0.3)",
                fontFamily: "'Instrument Sans', sans-serif",
                fontSize: "0.8125rem",
                margin: 0,
              }}
            >
              Made with care in India
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { scroll-behavior: smooth; background: #1B1B1B; }
        html { scroll-behavior: smooth; }
        @media (max-width: 900px) {
          .hiw-grid { grid-template-columns: 1fr !important; max-width: 400px; margin: 0 auto; }
          .feature-row { flex-direction: column !important; gap: 32px !important; }
        }
        @media (max-width: 680px) {
          .nav-links-center { display: none !important; }
          .nav-right-download { display: none !important; }
          .nav-burger { display: flex !important; }
          .hero-heading { font-size: 2rem !important; line-height: 2.5rem !important; }
          .hero-para { font-size: 1rem !important; line-height: 1.5rem !important; }
          .section-heading { font-size: 1.75rem !important; line-height: 2.25rem !important; }
          .footer-top { flex-direction: column !important; gap: 32px !important; }
          .footer-links { flex-direction: column !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
