import { FolderClosed, LayoutGrid, Lightbulb } from "lucide-react";
import illustration from "./assets/images/landing-why-familykit.jpg";
import "./LandingWhyPreview.css";

function EmergencyIcon({ size, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 19v-6a6 6 0 0 1 12 0v6M9 13a3 3 0 0 1 1.5-2.6M12 2v2M4 5l1.5 1.5M20 5l-1.5 1.5" />
      <rect x="4" y="19" width="16" height="2.5" rx="1" />
    </svg>
  );
}

function ExpiryIcon({ size, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M7.5 3v4M16.5 3v4M3 10h18M8 14l1.5-1v5M13 13h4l-2.5 5" />
    </svg>
  );
}

const problems = [
  [FolderClosed, "Documents scattered everywhere", "A drawer, a WhatsApp chat, an email, and another phone."],
  [LayoutGrid, "Too many apps,\nno single place", "The bank, the bills, the vehicle, and the policies each sit in a different app."],
  [EmergencyIcon, "No answers in an emergency", "It is night. Someone asks for a number. The person who knows cannot answer."],
  [ExpiryIcon, "Expiry dates get missed", "The date was known once. Then it passed, and nobody else was reminded."],
];

export default function LandingWhyPreview() {
  return (
    <section id="why-familykit" className="fk-preview-why" aria-labelledby="fk-preview-why-title">
      <div className="fk-preview-why-inner">
        <img className="fk-preview-why-art" src={illustration} width="1086" height="1448" loading="lazy"
          alt="Family members looking for information in a drawer, on a phone, and in a folder" />
        <div className="fk-preview-why-copy">
          <div className="fk-preview-why-intro">
            <p className="fk-preview-why-badge"><Lightbulb size={15} aria-hidden="true" /> Why FamilyKit</p>
            <h2 id="fk-preview-why-title">
              <span>Your family’s life is connected.</span>{" "}
              <span className="fk-preview-why-emphasis">Its information is scattered.</span>
            </h2>
            <p className="fk-preview-why-description">What one person knows, the others can’t find when they need it.</p>
          </div>
          <ul className="fk-preview-why-cards">
            {problems.map(([Icon, title, description]) => (
              <li key={title}>
                <span className="fk-preview-why-icon"><Icon size={20} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </div>
        <p className="fk-preview-why-callout">
          Everyone in your family knows something.{" "}<span>No one knows it all.</span>
        </p>
      </div>
    </section>
  );
}
