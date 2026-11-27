import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStoredAccessToken, getStoredRefreshToken, isAccessTokenExpired } from "./auth/sessionManager.js";
import { connectionsEnabled, foundingStatus } from "./api/familyConnectionsApi.js";
import familyArt from "./assets/images/Family Gathered Around Purple Folder.png";
import scanArt from "./assets/images/onboarding-scan.png";
import reminderArt from "./assets/images/onboarding-reminders.png";
import "./InstalledAppLaunch.css";

const tourKey = "familykit_pwa_onboarding_seen";
const slides = [
  {
    image: familyArt,
    title: ["Your family's essentials,", "in one place"],
    description: "Keep documents, health details and important family information together.",
  },
  {
    image: scanArt,
    title: ["Scan it.", "Let AI organize it."],
    description: "Scan or upload documents. AI extracts the details and helps you keep them organized.",
  },
  {
    image: reminderArt,
    title: ["A little reminder.", "And less worry."],
    description: "Stay on top of renewals, appointments and important family dates.",
  },
];

export function isInstalledFamilyKit() {
  return window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

function completedTour() {
  try {
    return localStorage.getItem(tourKey) === "1";
  } catch {
    return false;
  }
}

function rememberTour() {
  try {
    localStorage.setItem(tourKey, "1");
  } catch {
    // The access screen is still available when storage is disabled.
  }
}

function SplashLogo() {
  return (
    <svg className="fk-pwa-splash-logo" width="76" height="76" viewBox="0 0 192 192" aria-hidden="true">
      <circle className="fk-pwa-logo-backdrop" cx="96" cy="96" r="89" fill="#fff" />
      <g className="fk-pwa-logo-case" fill="#160879">
        <path d="M65 50v-4a16 16 0 0 1 16-16h30a16 16 0 0 1 16 16v4h-8v-4a8 8 0 0 0-8-8H81a8 8 0 0 0-8 8v4z" />
        <path d="M40 68c3-10 10-16 20-16h72c10 0 17 6 20 16zM42 72h108a11 11 0 0 1 11 11v45a31 31 0 0 1-31 31H62a31 31 0 0 1-31-31V83a11 11 0 0 1 11-11z" />
      </g>
      <g className="fk-pwa-logo-person fk-pwa-logo-left" fill="#fff">
        <circle cx="72" cy="96" r="10" />
        <path d="M88 152H65c-10-5-18-16-18-27 0-10 8-18 18-18 9 0 15 5 19 13-5 3-7 8-8 13l-9-6c-1 4 3 10 10 15z" />
      </g>
      <g className="fk-pwa-logo-person fk-pwa-logo-right" fill="#fff">
        <circle cx="120" cy="96" r="10" />
        <path d="M104 152h23c10-5 16-16 16-27 0-10-6-18-16-18-9 0-15 5-19 13 5 3 7 8 8 13l9-6c1 4-3 10-10 15z" />
      </g>
      <g className="fk-pwa-logo-person fk-pwa-logo-middle" fill="#fff">
        <circle cx="96" cy="113" r="8.5" />
        <path d="M80 137c2-9 8-14 16-14s14 5 16 14l-16 11z" />
      </g>
    </svg>
  );
}

export default function InstalledAppLaunch({ fromSignOut = false }) {
  const access = getStoredAccessToken();
  const signedIn = Boolean(getStoredRefreshToken() || (access && !isAccessTokenExpired(access, 0)));
  const [screen, setScreen] = useState(() => fromSignOut || completedTour() ? "access" : "splash");
  const [slide, setSlide] = useState(0);
  const [signupOpen, setSignupOpen] = useState(!connectionsEnabled);

  useEffect(() => {
    if (signedIn) {
      rememberTour();
      return;
    }
    if (screen !== "splash") return;
    const timer = window.setTimeout(() => setScreen("tour"),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1650);
    return () => window.clearTimeout(timer);
  }, [screen, signedIn]);

  useEffect(() => {
    if (signedIn || screen !== "access" || !connectionsEnabled) return;
    let active = true;
    foundingStatus().then((status) => {
      if (active) setSignupOpen(status.newFamiliesOpen);
    }).catch(() => {
      if (active) setSignupOpen(false);
    });
    return () => { active = false; };
  }, [screen, signedIn]);

  function finish() {
    rememberTour();
    setScreen("access");
  }

  if (signedIn) return <Navigate to="/my-family" replace />;

  if (screen === "splash") {
    return <main className="fk-pwa-launch fk-pwa-splash" aria-label="FamilyKit">
      <SplashLogo />
      <strong>FamilyKit</strong>
    </main>;
  }

  if (screen === "access") {
    return <main className="fk-pwa-launch">
      <section className="fk-pwa-access">
        <img src="/icons/familykit-192.png" alt="" width="64" height="64" />
        <h1>FamilyKit</h1>
        <Link className="fk-pwa-primary" to="/login">Log In</Link>
        {signupOpen && <Link className="fk-pwa-secondary" to="/signup">Sign Up</Link>}
      </section>
    </main>;
  }

  const current = slides[slide];
  const last = slide === slides.length - 1;
  return <main className="fk-pwa-launch">
    <section className="fk-pwa-tour" aria-label="FamilyKit onboarding">
      <header className="fk-pwa-tour-header">
        {slide > 0 && <button type="button" className="fk-pwa-back" aria-label="Previous screen" onClick={() => setSlide(slide - 1)}>
          <ChevronLeft size={19} aria-hidden="true" />
        </button>}
        <strong>FamilyKit</strong>
        <button type="button" className="fk-pwa-skip" onClick={finish}>Skip</button>
      </header>
      <img key={current.image} className="fk-pwa-illustration" src={current.image} alt="" />
      <div className="fk-pwa-slide-copy" aria-live="polite">
        <h1 key={current.title[0]}>{current.title[0]}<br />{current.title[1]}</h1>
        <p key={current.description}>{current.description}</p>
      </div>
      <footer className="fk-pwa-tour-footer">
        <div className="fk-pwa-progress" role="img" aria-label={`Page ${slide + 1} of ${slides.length}`}>
          {slides.map(({ image }, index) => <span key={image} data-active={index === slide} />)}
        </div>
        <button type="button" className="fk-pwa-primary" onClick={last ? finish : () => setSlide(slide + 1)}>
          {last ? "Get Started" : "Next"} <ChevronRight size={16} aria-hidden="true" />
        </button>
      </footer>
    </section>
  </main>;
}
