import { Ban, LockKeyhole, MapPin, ShieldCheck, WandSparkles } from "lucide-react";
import illustration from "./assets/images/landing-privacy-security.jpg";
import "./LandingPrivacyPreview.css";

const protections = [
  [LockKeyhole, "Protected by AES-256, the same encryption banks use", "Your family’s documents and records are encrypted at rest and in transit."],
  [MapPin, "Your data stays in India", "Your family’s data stays in India."],
  [Ban, "We never sell your data", "We never sell or share your family’s information."],
  [WandSparkles, "Your data is never used to train AI", "AI processes your files only to assist you, never to train general models."],
];

export default function LandingPrivacyPreview() {
  return (
    <section id="security" className="fk-preview-how fk-preview-privacy" aria-labelledby="fk-preview-privacy-title">
      <div className="fk-preview-how-inner">
        <div className="fk-preview-how-copy">
          <div className="fk-preview-how-intro">
            <p className="fk-preview-how-badge"><ShieldCheck size={15} aria-hidden="true" /> Security &amp; Privacy</p>
            <h2 id="fk-preview-privacy-title">
              <span>Your family’s data stays safe.</span>{" "}
              <span className="fk-preview-how-emphasis">And stays yours.</span>
            </h2>
          </div>
          <ul className="fk-preview-privacy-protections">
            {protections.map(([Icon, title, description]) => (
              <li key={title}>
                <span className="fk-preview-how-icon"><Icon size={20} aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <img className="fk-preview-how-art" src={illustration} width="586" height="776" loading="lazy"
          alt="A family standing beside a shield and lock protecting their records" />
        <div className="fk-preview-privacy-callout">
          <span className="fk-preview-privacy-shield"><ShieldCheck size={26} aria-hidden="true" /></span>
          <div><h3>Your privacy is our commitment</h3>
            <p>FamilyKit is built to keep your family’s information safe and private.</p>
          </div>
          <button type="button" className="fk-preview-hero-secondary" disabled title="Privacy policy coming soon">
            Read our privacy policy
          </button>
        </div>
      </div>
    </section>
  );
}
