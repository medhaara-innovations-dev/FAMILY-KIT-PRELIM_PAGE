import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, HeartHandshake, Pause, Play, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import phonePreview from "./assets/images/landing-hero-phone.png";
import "./LandingHeroPreview.css";

const phoneExamples = [
  { question: "Papa's PAN card", result: "PAN card · Papa", upcoming: "Car insurance renews in 12 days." },
  { question: "My bike RC", result: "RC book · You", upcoming: "Passport expires in 7 months." },
  { question: "Show me my parents' policy bond", result: "Policy bond · Papa and Amma", upcoming: "Electricity bill due Thursday." },
];

export default function LandingHeroPreview({ howItWorksHref }) {
  const [examplesPaused, setExamplesPaused] = useState(false);

  return (
    <section className="fk-preview-hero" aria-labelledby="fk-preview-hero-title">
      <div className="fk-preview-hero-copy">
        <div className="fk-preview-hero-intro">
          <p className="fk-preview-hero-badge">
            <UsersRound size={17} aria-hidden="true" /> For the Whole Family
          </p>
          <h1 id="fk-preview-hero-title">
            <span className="fk-preview-hero-line">Everything important,</span>{" "}
            <span className="fk-preview-hero-line">in one place.</span>{" "}
            <span className="fk-preview-hero-line fk-preview-hero-emphasis">Ready when your family needs it.</span>
          </h1>
          <p className="fk-preview-hero-description">
            FamilyKit helps you organize your family’s important documents, securely share access with the people you choose, and get timely reminders—all without uploading the same documents again.
          </p>
        </div>
        <div className="fk-preview-hero-actions">
          <Link className="fk-preview-join" to="/signup">
            Become a Founding Family <ChevronRight size={18} aria-hidden="true" />
          </Link>
          <a className="fk-preview-hero-secondary" href={howItWorksHref}>
            See How it Works <ChevronDown size={16} aria-hidden="true" />
          </a>
        </div>
        <p className="fk-preview-hero-offer">
          <Sparkles size={16} aria-hidden="true" />
          <span><strong>Free for 1 year</strong> for the first 100 families · <strong>87 spots left</strong></span>
        </p>
        <ul className="fk-preview-hero-features">
          <li><HeartHandshake size={18} aria-hidden="true" /> Family sharing</li>
          <li><ShieldCheck size={18} aria-hidden="true" /> Secure &amp; Private</li>
          <li><Sparkles size={18} aria-hidden="true" /> AI-powered</li>
        </ul>
      </div>
      <div className="fk-preview-hero-art" data-examples-paused={examplesPaused}>
        <div className="fk-preview-hero-phone">
          <img src={phonePreview} width="410" height="772" fetchPriority="high"
            alt="FamilyKit preview with document search results found in three seconds, six category tiles, and upcoming reminders" />
          <div className="fk-preview-phone-content fk-preview-phone-question" aria-hidden="true">
            {phoneExamples.map(({ question }) => <span key={question}>{question}</span>)}
          </div>
          <div className="fk-preview-phone-content fk-preview-phone-result" aria-hidden="true">
            {phoneExamples.map(({ result }) => <span key={result}>{result}</span>)}
          </div>
          <div className="fk-preview-phone-content fk-preview-phone-upcoming" aria-hidden="true">
            {phoneExamples.map(({ upcoming }) => <span key={upcoming}>{upcoming}</span>)}
          </div>
        </div>
        <button type="button" className="fk-preview-phone-pause"
          aria-label={examplesPaused ? "Play phone examples" : "Pause phone examples"}
          onClick={() => setExamplesPaused((paused) => !paused)}>
          {examplesPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
        </button>
      </div>
    </section>
  );
}
