import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Menu, Sparkles, X } from "lucide-react";
import familyKitLogo from "./assets/images/6be23a39-2441-4cce-a9c9-073707f549ff.png";
import LandingHeroPreview from "./LandingHeroPreview.jsx";
import LandingWhyPreview from "./LandingWhyPreview.jsx";
import LandingHowPreview from "./LandingHowPreview.jsx";
import LandingFamiliesPreview from "./LandingFamiliesPreview.jsx";
import LandingPrivacyPreview from "./LandingPrivacyPreview.jsx";
import LandingPricingPreview from "./LandingPricingPreview.jsx";
import LandingFaqPreview from "./LandingFaqPreview.jsx";
import LandingEarlyAccessPreview from "./LandingEarlyAccessPreview.jsx";
import LandingFooterPreview from "./LandingFooterPreview.jsx";
import "./LandingNavPreview.css";

const sections = [
  ["Why FamilyKit", "why-familykit"],
  ["How it works", "how"],
  ["Privacy & Security", "security"],
  ["Pricing", "pricing"],
  ["FAQ", "faq"],
];

const compactNavigation = window.matchMedia("(width < 960px)");
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");

const revealTargets = [
  "main section h2", ".fk-preview-why-intro > p", ".fk-preview-how-intro > p",
  ".fk-preview-pricing-intro > p", ".fk-preview-early-intro > p",
  ".fk-preview-why-cards > li", ".fk-preview-how-cards > li",
  ".fk-preview-privacy-protections > li", ".fk-preview-pricing-card",
  ".fk-preview-faq-list > details", ".fk-preview-why-art", ".fk-preview-how-art",
  ".fk-preview-pricing-panel img", ".fk-preview-early-art", ".fk-preview-early-form",
  ".fk-preview-why-callout", ".fk-preview-families-callout", ".fk-preview-privacy-callout",
  ".fk-preview-how-flow", ".fk-preview-pricing-retention", ".fk-preview-pricing-close",
].join(", ");

function subscribeToNavigationLayout(listener) {
  compactNavigation.addEventListener("change", listener);
  return () => compactNavigation.removeEventListener("change", listener);
}

export default function LandingNavPreview() {
  const compact = useSyncExternalStore(subscribeToNavigationLayout, () => compactNavigation.matches);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef(null);
  const firstLink = useRef(null);
  const preview = useRef(null);
  const [activeSection, setActiveSection] = useState(null);

  useEffect(() => {
    const root = document.documentElement;
    const page = preview.current;
    const targets = [...page.querySelectorAll(revealTargets)];
    const destinations = sections.map(([, id]) => page.querySelector(`#${id}`));
    let revealObserver;
    let frame = 0;

    function updateActiveSection() {
      const marker = window.innerHeight * 0.28;
      const current = destinations.findLast((section) => section.getBoundingClientRect().top <= marker);
      setActiveSection(current?.id ?? null);
    }

    function scheduleActiveSection() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        updateActiveSection();
      });
    }

    function stopMotion() {
      revealObserver?.disconnect();
      window.removeEventListener("scroll", scheduleActiveSection);
      window.removeEventListener("resize", scheduleActiveSection);
      window.cancelAnimationFrame(frame);
      frame = 0;
      root.removeAttribute("data-motion");
    }

    function syncMotion() {
      stopMotion();
      targets.forEach((element) => element.removeAttribute("data-revealed"));
      setActiveSection(null);
      if (motionPreference.matches || typeof IntersectionObserver !== "function") return;

      root.setAttribute("data-motion", "");
      revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (!isIntersecting) return;
          target.setAttribute("data-revealed", "");
          observer.unobserve(target);
        });
      }, { threshold: 0.12 });
      targets.forEach((target) => revealObserver.observe(target));

      window.addEventListener("scroll", scheduleActiveSection, { passive: true });
      window.addEventListener("resize", scheduleActiveSection);
      updateActiveSection();
    }

    syncMotion();
    motionPreference.addEventListener("change", syncMotion);
    return () => {
      motionPreference.removeEventListener("change", syncMotion);
      stopMotion();
    };
  }, []);

  useEffect(() => {
    if (compact && menuOpen) firstLink.current?.focus();
  }, [compact, menuOpen]);

  return (
    <div id="landing-top" className="fk-landing-nav-preview" ref={preview}>
      <div className="fk-preview-top">
        <div className="fk-preview-announcement">
          <span className="fk-preview-announcement-label">Free for 1 year for the first 100 families · 87 spots left</span>
          <div className="fk-preview-announcement-track" aria-hidden="true">
            {[0, 1].map((group) => (
              <div className="fk-preview-announcement-group" key={group}>
                {[0, 1, 2, 3].map((item) => (
                  <span key={item}><Sparkles size={16} /> <strong>Free for 1 year</strong> for the first 100 families · <strong>87 spots left</strong></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      <header className="fk-preview-header"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}>
        <Link to="/" className="fk-preview-brand" aria-label="FamilyKit home">
          <img src={familyKitLogo} alt="" />
          <span>FamilyKit</span>
        </Link>
        <nav className="fk-preview-links" id="fk-preview-nav" aria-label="Landing page navigation"
          data-open={menuOpen} inert={compact && !menuOpen}>
          {sections.map(([label, section], index) => (
            <a key={section} ref={index === 0 ? firstLink : undefined}
              href={`#${section}`}
              aria-current={activeSection === section ? "location" : undefined}
              onClick={() => setMenuOpen(false)}>{label}</a>
          ))}
          <Link className="fk-preview-join fk-preview-menu-join" to="/signup">
            Become a Founding Family <ChevronRight size={18} aria-hidden="true" />
          </Link>
        </nav>
        <div className="fk-preview-actions">
          <Link className="fk-preview-login" to="/login">Login</Link>
          <Link className="fk-preview-join fk-preview-desktop-join" to="/signup">
            Become a Founding Family <ChevronRight size={18} aria-hidden="true" />
          </Link>
          <button type="button" className="fk-preview-menu-button" aria-controls="fk-preview-nav"
            aria-expanded={menuOpen} aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            onClick={() => setMenuOpen((open) => !open)} ref={menuButton}>
            {menuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </header>
      </div>
      <main>
        <LandingHeroPreview howItWorksHref="#how" />
        <LandingWhyPreview />
        <LandingHowPreview />
        <LandingFamiliesPreview privacyHref="#security" />
        <LandingPrivacyPreview />
        <LandingPricingPreview />
        <LandingFaqPreview />
        <LandingEarlyAccessPreview />
      </main>
      <LandingFooterPreview />
    </div>
  );
}
