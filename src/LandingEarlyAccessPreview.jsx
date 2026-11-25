import { useState } from "react";
import { BadgeCheck, Bell, ChevronRight, FileText, HandHeart, HeartPulse, Landmark, ReceiptText } from "lucide-react";
import familyImage from "./assets/images/Smiling Family with Purple Tablet.png";
import "./LandingEarlyAccessPreview.css";

const illustrationIcons = [BadgeCheck, ReceiptText, HandHeart, FileText, Bell, Landmark, HeartPulse];

export default function LandingEarlyAccessPreview() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section id="early-access" className="fk-preview-early" aria-labelledby="fk-preview-early-title">
      <div className="fk-preview-early-inner">
        <div className="fk-preview-early-copy">
          <div className="fk-preview-early-intro">
            <p className="fk-preview-early-label">Early Access</p>
            <h2 id="fk-preview-early-title">Ready to put <span>everything in place?</span></h2>
            <p>Join Indian families organizing documents, dates, and responsibilities in one calm, private space.</p>
          </div>
          <form className="fk-preview-early-form" onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }} onChange={() => setSubmitted(false)}>
            <div className="fk-preview-early-fields">
              <label>
                WhatsApp number <small>(required)</small>
                <span className="fk-preview-early-phone">
                  <span aria-hidden="true">+91</span>
                  <input type="tel" inputMode="numeric" autoComplete="tel-national" required
                    pattern="[6-9][0-9]{4} ?[0-9]{5}" maxLength={11} placeholder="98765 43210"
                    title="Enter a 10-digit Indian WhatsApp number" />
                </span>
              </label>
              <label>
                Email <small>(optional)</small>
                <input type="email" autoComplete="email" placeholder="Email address" />
              </label>
            </div>
            <button type="submit" className="fk-preview-join">
              Become a Founding Family <ChevronRight size={18} aria-hidden="true" />
            </button>
            {submitted && <p role="status">Early-access registration is still in preview. Your details weren’t sent.</p>}
          </form>
          <p className="fk-preview-early-offer"><strong>Free for 1 year</strong> for the first 100 families · <strong>87 spots left</strong></p>
          <p className="fk-preview-early-consent">When registration opens, FamilyKit may message you on WhatsApp about your founding spot. See <a href="#security">Privacy &amp; Security</a>.</p>
        </div>
        <div className="fk-preview-early-art" aria-hidden="true">
          {illustrationIcons.map((Icon, index) => <span key={index}><Icon size={19} /></span>)}
          <img src={familyImage} width="1501" height="1047" loading="lazy" alt="" />
        </div>
      </div>
    </section>
  );
}
