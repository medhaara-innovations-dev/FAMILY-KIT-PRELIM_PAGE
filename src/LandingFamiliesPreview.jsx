import { ChevronRight, GraduationCap, HeartHandshake, HeartPulse, House, Plane, UsersRound } from "lucide-react";
import illustration from "./assets/images/landing-useful-for-families.jpg";
import "./LandingFamiliesPreview.css";

const useCases = [
  [GraduationCap, "Parents & Kids", "School records, birth certificates, vaccinations, and IDs."],
  [HeartPulse, "Senior Parents", "Medical reports, prescriptions, pensions, and health policies."],
  [House, "Home & Vehicles", "Property papers, utility bills, RC books, and insurance renewals."],
  [Plane, "Trips & Milestones", "Passports, visas, bookings, and private family memories."],
];

export default function LandingFamiliesPreview({ privacyHref }) {
  return (
    <section id="useful-for-families" className="fk-preview-why" aria-labelledby="fk-preview-families-title">
      <div className="fk-preview-why-inner">
        <img className="fk-preview-why-art" src={illustration} width="1086" height="1448" loading="lazy"
          alt="Three generations of a family beneath a timeline from childhood to adulthood and beyond" />
        <div className="fk-preview-why-copy">
          <div className="fk-preview-why-intro">
            <p className="fk-preview-why-badge"><UsersRound size={15} aria-hidden="true" /> Useful for Families</p>
            <h2 id="fk-preview-families-title">
              <span>Made for every family.</span>{" "}
              <span className="fk-preview-why-emphasis">Ready for everyday life.</span>
            </h2>
          </div>
          <ul className="fk-preview-why-cards fk-preview-families-cards">
            {useCases.map(([Icon, title, description]) => (
              <li key={title}>
                <span className="fk-preview-why-icon"><Icon size={20} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="fk-preview-families-callout">
          <span className="fk-preview-families-heart"><HeartHandshake size={26} aria-hidden="true" /></span>
          <div>
            <h3>One shared space for every generation.</h3>
            <p>From school records to senior care, everything stays ready for the family members who need it.</p>
          </div>
          <a className="fk-preview-hero-secondary" href={privacyHref}>
            See How It’s Protected <ChevronRight size={18} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
