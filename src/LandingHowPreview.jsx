import { ArrowLeft, ArrowRight, Camera, CircleCheck, LayoutGrid, Sparkles } from "lucide-react";
import illustration from "./assets/images/landing-how-it-works.jpg";
import "./LandingHowPreview.css";

const steps = [
  [Camera, "Scan or Upload", "Upload documents, bills, policies, certificates and other family information.", "Scan"],
  [Sparkles, "AI Understands", "AI reads it, identifies the type, extracts the details and links it to the right family member.", "AI Organizes"],
  [CircleCheck, "Review & Verify", "Check the extracted details against the original, and correct anything that needs attention.", "Verify"],
  [LayoutGrid, "Organized & Ready", "Confirmed information is organised for authorised family members, with reminders where they apply.", "Confirm"],
];

export default function LandingHowPreview() {
  return (
    <section id="how" className="fk-preview-how" aria-labelledby="fk-preview-how-title">
      <div className="fk-preview-how-inner">
        <div className="fk-preview-how-copy">
          <div className="fk-preview-how-intro">
            <p className="fk-preview-how-badge"><Sparkles size={15} aria-hidden="true" /> How it Works</p>
            <h2 id="fk-preview-how-title">
              <span>You add the paper.</span>{" "}
              <span>FamilyKit sorts it.</span>{" "}
              <span className="fk-preview-how-emphasis">You confirm.</span>
            </h2>
            <p className="fk-preview-how-description">Four simple steps, from a photo to a reminder.</p>
          </div>
          <ol className="fk-preview-how-cards">
            {steps.map(([Icon, title, description], index) => (
              <li key={title}>
                <div className="fk-preview-how-step">
                  <span className="fk-preview-how-icon"><Icon size={20} aria-hidden="true" /></span>
                  <span>Step {String(index + 1).padStart(2, "0")}</span>
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
        <img className="fk-preview-how-art" src={illustration} width="1448" height="1086" loading="lazy"
          alt="A family scanning a document with a phone" />
        <div className="fk-preview-how-flow">
          <div className="fk-preview-how-flow-labels" aria-hidden="true">
            {steps.map(([Icon, title, , label], index) => (
              <span key={title} className={`fk-preview-how-flow-node fk-preview-how-flow-node-${index + 1}`}><Icon size={14} />{label}</span>
            ))}
            <ArrowRight className="fk-preview-how-flow-first" size={14} />
            <svg className="fk-preview-how-flow-wide" width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 10Q10 1 18 7m-5-1 5 1-1-5" />
            </svg>
            <ArrowRight className="fk-preview-how-flow-last" size={14} />
            <ArrowLeft className="fk-preview-how-flow-back" size={14} />
            <svg className="fk-preview-how-flow-turn" width="48" height="100%" viewBox="0 0 48 56" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M26 12h7c17 0 17 32 0 32H4" />
              <path d="m8 40-4 4 4 4" />
            </svg>
          </div>
          <p>You scan it. FamilyKit helps organize the rest.</p>
        </div>
      </div>
    </section>
  );
}
