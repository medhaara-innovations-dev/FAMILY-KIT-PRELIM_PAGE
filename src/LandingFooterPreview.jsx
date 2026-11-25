import { FaXTwitter } from "react-icons/fa6";
import familyKitLogo from "./assets/images/6be23a39-2441-4cce-a9c9-073707f549ff.png";
import { FacebookLogo, InstagramLogo, LinkedInLogo } from "./components/ReferenceIcons.jsx";
import "./LandingFooterPreview.css";

const linkGroups = [
  ["Product", [
    ["Become a Founding Family", "#early-access"],
    ["Why FamilyKit", "#why-familykit"],
    ["How it Works", "#how"],
    ["Privacy & Security", "#security"],
    ["Pricing", "#pricing"],
    ["FAQ", "#faq"],
  ]],
  ["Company", [["About"], ["Our Story"], ["Partners"]]],
  ["Support", [["Contact Us"], ["Help Center", "#faq"], ["Refund Policy"]]],
];

const socialIcons = [
  ["X", FaXTwitter],
  ["Instagram", InstagramLogo],
  ["Facebook", FacebookLogo],
  ["LinkedIn", LinkedInLogo],
];

export default function LandingFooterPreview() {
  return (
    <footer className="fk-preview-footer">
      <div className="fk-preview-footer-inner">
        <div className="fk-preview-footer-main">
          <div className="fk-preview-footer-identity">
            <a href="#landing-top" className="fk-preview-brand" aria-label="FamilyKit, back to top">
              <img src={familyKitLogo} alt="" />
              <span>FamilyKit</span>
            </a>
            <p>Everything important to your family, securely organized in one place.</p>
            <ul className="fk-preview-footer-socials" aria-label="FamilyKit social channels">
              {socialIcons.map(([label, Icon]) => (
                <li key={label} title={`${label} link coming soon`}>
                  <Icon size={20} color="currentColor" aria-hidden="true" />
                  <span className="fk-preview-footer-sr-only">{label} link coming soon</span>
                </li>
              ))}
            </ul>
          </div>
          <nav className="fk-preview-footer-nav" aria-label="Footer navigation">
            {linkGroups.map(([heading, links]) => (
              <div key={heading}>
                <h2>{heading}</h2>
                <ul>
                  {links.map(([label, href]) => (
                    <li key={label}>
                      {href ? <a href={href}>{label}</a> : <span title="Coming soon">{label}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="fk-preview-footer-bottom">
          <p>© 2026 Medhaara Innovations. All rights reserved.<br />Made in India.</p>
          <ul aria-label="Policies and settings">
            {["Privacy Policy", "Terms of Service", "Refund Policy", "Cookie Settings"].map((label) => (
              <li key={label}><span title="Coming soon">{label}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
