import { useState } from "react";
import { BookOpen, FileText, Landmark, Phone, Share2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { FacebookLogo, InstagramLogo, LinkedInLogo } from "./ReferenceIcons.jsx";
import { normalizeSocialProfileUrl } from "../socialProfileLinks.js";
import { getWhatsAppUrl } from "./whatsAppUrl.js";
import "./MobileProfileDetails.css";

const birthDateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function getBirthDetails(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return null;

  const birthDate = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(birthDate.getTime()) || !birthDate.toISOString().startsWith(value)) {
    return null;
  }

  const today = new Date();
  const birthdayThisYear = (birthDate.getUTCMonth() + 1) * 100 + birthDate.getUTCDate();
  const todayMonthAndDay = (today.getMonth() + 1) * 100 + today.getDate();
  const age = today.getFullYear() - birthDate.getUTCFullYear() -
    (todayMonthAndDay < birthdayThisYear ? 1 : 0);

  return age >= 0 ? { date: birthDateFormat.format(birthDate), age } : null;
}

export default function MobileProfileDetails({ member }) {
  const birth = getBirthDetails(member.dateOfBirth);
  const rows = [
    [["DOB", birth?.date || member.dateOfBirth], ["Age", birth && `${birth.age} yrs old`]],
    [["Height", member.height && `${member.height} cm`], ["Weight", member.weight && `${member.weight} kg`]],
    [["Blood Type", member.bloodGroup]],
    [["Mobile No", member.mobile]],
  ];

  return (
    <div className="fk-mobile-profile-details">
      {rows.map((fields) => (
        <dl className="fk-mobile-profile-detail-row" key={fields[0][0]}>
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value || "–"}</dd>
            </div>
          ))}
        </dl>
      ))}
    </div>
  );
}

function SocialProfileAction({ field, label, Icon, value }) {
  const url = normalizeSocialProfileUrl(field, value);
  return url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" aria-label={label}>
      <Icon aria-hidden="true" />
    </a>
  ) : (
    <button type="button" disabled aria-label={`${label} profile link unavailable`}>
      <Icon aria-hidden="true" />
    </button>
  );
}

export function MobileProfileActions({ mobile, profile = {}, canShare = true }) {
  const whatsappUrl = getWhatsAppUrl(mobile);
  const [shareStatus, setShareStatus] = useState("");

  async function shareProfile() {
    setShareStatus("");
    const url = window.location.origin + window.location.pathname;
    try {
      if (navigator.share) {
        await navigator.share({ title: "FamilyKit profile", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShareStatus("Profile link copied.");
    } catch (error) {
      if (error.name !== "AbortError") setShareStatus("Unable to share the profile link.");
    }
  }

  return (
    <div className="fk-mobile-profile-actions">
      <div className="fk-profile-document-count" aria-label="Total documents unavailable">
        <small>Total Documents</small>
        <strong aria-hidden="true">–</strong>
      </div>
      <div className="fk-profile-social-actions" aria-label="Social actions">
        <SocialProfileAction field="instagramUrl" label="Instagram" Icon={InstagramLogo} value={profile.instagramUrl} />
        <SocialProfileAction field="facebookUrl" label="Facebook" Icon={FacebookLogo} value={profile.facebookUrl} />
        {whatsappUrl ? (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
            <FaWhatsapp />
          </a>
        ) : (
          <button type="button" disabled aria-label="WhatsApp unavailable"><FaWhatsapp /></button>
        )}
        <SocialProfileAction field="linkedinUrl" label="LinkedIn" Icon={LinkedInLogo} value={profile.linkedinUrl} />
      </div>
      <div className="fk-profile-direct-actions">
        {mobile ? (
          <a href={`tel:${mobile}`} aria-label="Call"><Phone size={16} aria-hidden="true" /></a>
        ) : (
          <button type="button" disabled aria-label="Call unavailable"><Phone size={16} aria-hidden="true" /></button>
        )}
        <button type="button" onClick={shareProfile} disabled={!canShare} aria-label="Share profile">
          <Share2 size={16} aria-hidden="true" />
        </button>
      </div>
      {shareStatus && <p className="fk-profile-share-status" role="status">{shareStatus}</p>}
    </div>
  );
}

const documentCategories = [
  ["Documents", FileText],
  ["Education", BookOpen],
  ["Finance", Landmark],
];

export function MobileConnectedDocuments() {
  const [category, setCategory] = useState("Documents");
  return (
    <section className="fk-profile-connected-docs fk-profile-mobile-only">
      <h3>Connected Documents</h3>
      <div className="fk-profile-document-filters" aria-label="Document category">
        {documentCategories.map(([label, Icon]) => (
          <button key={label} type="button" aria-pressed={category === label} onClick={() => setCategory(label)}>
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <p role="status">No connected {category.toLowerCase()} available yet.</p>
    </section>
  );
}
