import { Link } from "react-router-dom";
import { BadgePercent, CalendarCheck, ChevronRight, Database, Heart, Mail, ShieldCheck, Tag, UsersRound } from "lucide-react";
import familyIllustration from "./assets/images/landing-founding-family.jpg";
import "./LandingPricingPreview.css";

const joining = [
  [Mail, "No charge to join", "Join the Founding Families Program for free."],
  [Tag, "Price shown at launch", "Know the regular annual price before you pay."],
];

const benefits = [
  [UsersRound, "12 Months Free for Both Spouses", "You and your spouse each get a FamilyKit account, connected through one family subscription."],
  [BadgePercent, "50% Off Every Year After", "As a Founding Family, you’ll receive 50% off the regular annual subscription every year."],
  [ShieldCheck, "Your Family, Your Privacy", "Keep personal records private and share selected information with your spouse."],
  [CalendarCheck, "No Automatic Charges", "We’ll remind you before your free year ends. You decide whether to renew."],
];

function PricingCards({ items, className }) {
  return (
    <ul className={className}>
      {items.map(([Icon, title, description]) => (
        <li className="fk-preview-pricing-card" key={title}>
          <span className="fk-preview-pricing-icon"><Icon size={25} aria-hidden="true" /></span>
          <div><h3>{title}</h3><p>{description}</p></div>
        </li>
      ))}
    </ul>
  );
}

export default function LandingPricingPreview() {
  return (
    <section id="pricing" className="fk-preview-pricing" aria-labelledby="fk-preview-pricing-title">
      <div className="fk-preview-pricing-inner">
        <header className="fk-preview-pricing-intro">
          <p className="fk-preview-how-badge">Pricing</p>
          <h2 id="fk-preview-pricing-title">
            The first 100 families <br />
            <span>pay nothing for a year.</span>
          </h2>
          <p>Your free year begins when FamilyKit launches for your family, not when you join.</p>
        </header>
        <PricingCards className="fk-preview-pricing-grid fk-preview-pricing-joining" items={joining} />
        <div className="fk-preview-pricing-panel">
          <img src={familyIllustration} width="1024" height="1536" loading="lazy" alt="A couple showing FamilyKit on a phone beneath the Founding 100 Families benefits" />
          <div className="fk-preview-pricing-benefits">
            <h3>Your Founding Family Benefits</h3>
            <PricingCards className="fk-preview-pricing-grid" items={benefits} />
          </div>
          <div className="fk-preview-pricing-retention">
            <span className="fk-preview-pricing-icon"><Database size={25} aria-hidden="true" /></span>
            <div><h3>Your Information Stays Yours</h3>
              <p>Even if you don’t renew, you’ll have access to your existing family information under our data access and retention policy.</p>
            </div>
          </div>
        </div>
        <div className="fk-preview-pricing-close">
          <h3><Heart size={20} aria-hidden="true" /> <span>The First 100 Families Will Always Be Special To Us.</span> <Heart size={20} aria-hidden="true" /></h3>
          <p>You’re not just early users. You’re helping shape the future of FamilyKit.</p>
          <Link className="fk-preview-join" to="/signup">Become a Founding Family <ChevronRight size={18} aria-hidden="true" /></Link>
          <p className="fk-preview-pricing-offer"><UsersRound size={18} aria-hidden="true" />
            <span><strong>Free for 1 year</strong> for the first 100 families · <strong>87 spots left</strong></span>
          </p>
        </div>
      </div>
    </section>
  );
}
