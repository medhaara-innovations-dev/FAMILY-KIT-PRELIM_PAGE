import { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import howItWorksIcon from "./assets/images/ai-brain-02.png";
import familyTasksImage from "./assets/images/to do task icon.png";
import aiOrganizesIcon from "./assets/images/3ca7fdb8-353a-4640-a705-6fc448310ed1.png";
import {
  Menu,
  X,
  ArrowRight,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
  FileText,
  HeartPulse,
  Heart,
  HeartHandshake,
  GraduationCap,
  Landmark,
  House,
  ClipboardList,
  WalletCards,
  Building2,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  BrainCircuit,
  CalendarDays,
  ReceiptText,
  Eye,
  FolderOpen,
  Share2,
  BadgeCheck,
  HandCoins,
  School,
  BookOpen,
  NotebookPen,
  CircleHelp,
  ListChecks,
  Smartphone,
  Siren,
  Layers,
  Camera,
  MapPin,
  CloudUpload,
  MessageCircleMore,
  Megaphone,
  Tags,
  Crown,
} from "lucide-react";
import earlyAccessPhone from "./assets/images/iPhone 16 Pro.png";

import familyKitLogo from "./assets/images/6be23a39-2441-4cce-a9c9-073707f549ff.png";
import familyImage from "./assets/images/Smiling Family with Purple Tablet.png";
import problemImage from "./assets/images/Problem.png";
import whyDocumentsImage from "./assets/images/why-documents.png";
import whyDatesImage from "./assets/images/why-dates.png";
import whyWhereImage from "./assets/images/why-where.png";
import whyResponsibilitiesImage from "./assets/images/why-responsibilities.png";
import whyAppsImage from "./assets/images/why-apps.png";
import whyEmergencyImage from "./assets/images/why-emergency.png";
import howScanUploadImage from "./assets/images/Aadharr.png";
import howAiUnderstandsImage from "./assets/images/LAP.png";
import howReviewVerifyImage from "./assets/images/HC.png";
import howOrganizedReadyImage from "./assets/images/FAM.png";

// Features wheel image assets — added without removing existing imports
import educationImage from "./assets/images/Education.png";
import fileImage from "./assets/images/File.png";
import healthImage from "./assets/images/health.png";
import householdImage from "./assets/images/Household & Bills.png";
import housingImage from "./assets/images/Housing.png";
import insuranceImage from "./assets/images/Insurance.png";
import todoImage from "./assets/images/To do Lists.png";
import financeImage from "./assets/images/Vector.png";
import diaryImage from "./assets/images/Diary.png";
import notesImage from "./assets/images/Notes.png";
import centerFamilyImage from "./assets/images/Family Gathered Around Purple Folder.png";
import featuresTreeImage from "./assets/images/Tree1.png";
import featuresAiBanner from "./assets/images/AI.png";
import mobileIcon from "./assets/images/MobileICON.png";
import notificationsMockup from "./assets/images/Transparent Notifications App Mockup.png";
import heroShieldImage from "./assets/images/4db75485-c10a-4574-b017-11775affeb6e.png";


import aiTrackerCircle from "./assets/images/233a1305-6008-4e8a-b596-64f2d85afd80.png";
import noAiTrainingIcon from "./assets/images/Frame 760.png";
import stepThreePurpleIcon from "./assets/images/Purple icon circle.png";

import alertIcon from "./assets/images/Alert.png";
import ideaIcon from "./assets/images/idea.png";

import "./App.css";



const whyFamilyKitProblems = [
  {
    title: "Documents scattered everywhere",
    description: "Important certificates, policies, property papers and bills are stored in different places.",
    image: whyDocumentsImage,
    imageAlt: "Family reviewing paper documents and files",
    icon: FileText,
  },
  {
    title: "Important dates are easily forgotten",
    description: "Insurance renewals, EMIs, bills, warranties and other deadlines can slip through the cracks.",
    image: whyDatesImage,
    imageAlt: "Calendar showing important dates and reminders",
    icon: CalendarDays,
  },
  {
    title: "Nobody knows where everything is",
    description: "One person may know where documents are kept, while other family members struggle to find them.",
    image: whyWhereImage,
    imageAlt: "Family members trying to locate important information",
    icon: Users,
  },
  {
    title: "Family responsibilities become difficult to manage",
    description: "Managing parents' needs, children's requirements, household expenses and family commitments becomes overwhelming.",
    image: whyResponsibilitiesImage,
    imageAlt: "Parent managing household and family responsibilities",
    icon: ListChecks,
  },
  {
    title: "Too many apps, no single picture",
    description: "Family information and everyday activities are spread across multiple applications and services.",
    image: whyAppsImage,
    imageAlt: "Phone showing multiple family and household applications",
    icon: Smartphone,
  },
  {
    title: "What happens during an emergency?",
    description: "When something unexpected happens, family members may not know where important information, documents or contacts are available.",
    image: whyEmergencyImage,
    imageAlt: "Adult child assisting an elderly parent during a stressful situation",
    icon: Siren,
  },
];

function WhyFamilyKitSection({ mobile = false }) {
  return (
    <section
      className={`why-familykit-section${mobile ? " why-familykit-section-mobile" : ""}`}
      id={mobile ? "m-why-familykit" : "why-familykit"}
    >
      <div className="why-familykit-inner">
        <div className="why-familykit-pill">
          <CircleHelp aria-hidden="true" />
          <span>Why FamilyKit</span>
        </div>

        <h2 className="why-familykit-heading">
          Your family&apos;s life is connected.
          <br />
          But its <span>information is scattered.</span>
        </h2>

        <p className="why-familykit-intro">
          Important family information is spread across phones, WhatsApp messages, emails,
          paper files, different apps and people&apos;s memories. Finding the right information
          at the right time becomes difficult.
        </p>

        <div className="why-familykit-grid">
          {whyFamilyKitProblems.map((problem) => {
            const Icon = problem.icon;
            return (
              <article className="why-problem-card" key={problem.title}>
                <img
                  className="why-problem-photo"
                  src={problem.image}
                  alt={problem.imageAlt}
                  loading="lazy"
                />
                <div className="why-problem-copy">
                  <div className="why-problem-title-row">
                    <span className="why-problem-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <h3>{problem.title}</h3>
                  </div>
                  <p>{problem.description}</p>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="why-familykit-closing">
          <span className="why-familykit-closing-icon" aria-hidden="true">
            <Users />
          </span>
          <div>
            <h3>Your family shouldn&apos;t have to search everywhere for what matters.</h3>
            <p>
              It&apos;s time to bring your family&apos;s scattered information and everyday
              responsibilities together.
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}


const howItWorksSteps = [
  {
    number: "01",
    title: "Scan or Upload",
    description: "Upload documents, bills, policies, certificates and other family information.",
    image: howScanUploadImage,
    imageAlt: "Person scanning a paper document using a smartphone",
    icon: Camera,
  },
  {
    number: "02",
    title: "AI Understands",
    description: "AI reads the information, identifies its type, extracts details and links it to the relevant family member.",
    image: howAiUnderstandsImage,
    imageAlt: "Laptop showing AI document processing and extracted information",
    icon: aiOrganizesIcon,
    customIcon: true,
  },
  {
    number: "03",
    title: "Review & Verify",
    description: "Review extracted information against the original document and correct anything that needs attention.",
    image: howReviewVerifyImage,
    imageAlt: "Smartphone showing extracted document details for review",
    icon: BadgeCheck,
  },
  {
    number: "04",
    title: "Organized & Ready",
    description: "Your confirmed information is organized and available to authorized family members, with reminders where applicable.",
    image: howOrganizedReadyImage,
    imageAlt: "Family reviewing organized information together",
    icon: Layers,
  },
];

function FamilyKitHowItWorks({ mobile = false }) {
  return (
    <section
      className={`fk-how-workflow${mobile ? " fk-how-workflow-mobile" : ""}`}
      id={mobile ? "m-how" : "how"}
    >
      <div className="fk-how-workflow-inner">
        <div className="fk-how-label">
          <img src={howItWorksIcon} alt="" aria-hidden="true" />
          <span>How It Works</span>
        </div>

        <h2>Simple for Your Family. <span>Smart with AI.</span></h2>
        <p className="fk-how-subtitle">
          Getting your family&apos;s information organized is easier than you think.
        </p>

        <div className="fk-how-step-grid">
          {howItWorksSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="fk-how-step-card" key={step.number}>
                <img className="fk-how-step-photo" src={step.image} alt={step.imageAlt} loading="lazy" />
                <div className="fk-how-step-content">
                  <div className="fk-how-step-meta">
                    <span className="fk-how-step-icon">
                      {step.customIcon ? (
                        <img
                          src={step.icon}
                          alt=""
                          aria-hidden="true"
                          className="fk-how-step-custom-icon"
                        />
                      ) : (
                        <Icon aria-hidden="true" />
                      )}
                    </span>
                    <span className="fk-how-step-number">Step {step.number}</span>
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              
              </article>
            );
          })}
        </div>

        <div className="fk-how-summary" aria-label="FamilyKit workflow summary">
          <div className="fk-how-summary-step">
            <Camera />
            <strong>Scan</strong>
          </div>

          <span className="fk-how-flow-arrow" aria-hidden="true">→</span>

          <div className="fk-how-summary-step">
            <img
              src={aiOrganizesIcon}
              alt=""
              aria-hidden="true"
              className="fk-how-ai-organizes-icon"
            />
            <strong>AI Organizes</strong>
          </div>

          <span className="fk-how-flow-arrow" aria-hidden="true">→</span>

          <div className="fk-how-summary-step">
            <BadgeCheck />
            <strong>Verify</strong>
          </div>

          <span className="fk-how-flow-arrow" aria-hidden="true">→</span>

          <div className="fk-how-summary-step">
            <Layers />
            <strong>Confirm</strong>
          </div>

          <p>Your family does not have to organize everything manually. FamilyKit helps do the work.</p>
        </div>

        <div className="fk-how-ai-demo">
          <div className="fk-how-ai-intro">
            <span className="fk-how-ai-mark"><Sparkles /></span>
            <div>
              <h3>Ask FamilyKit AI</h3>
              <p>Get instant answers from your own family information.</p>
            </div>
          </div>

          <div className="fk-how-conversation">
            <div className="fk-how-question">
              <Users />
              <span>When does my father&apos;s health insurance expire?</span>
            </div>
            <div className="fk-how-answer">
              <span className="fk-how-answer-logo"><img src={familyKitLogo} alt="" /></span>
              <div>
                <strong>FamilyKit AI</strong>
                <p>Your father&apos;s policy is recorded as expiring on 18 March 2027.</p>
                <small>Source: Uploaded policy document</small>
              </div>
            </div>
            <p className="fk-how-example-note">
              Illustrative example. Actual answers come from your uploaded and verified information.
            </p>
          </div>
        </div>

        <h3 className="fk-how-closing">That&apos;s how simple managing family life can be.</h3>
      </div>
    </section>
  );
}

const mobileFeatureItems = [
  { title: "Documents", detail: "IDs, certificates, policies and records", icon: FileText, tone: "documents" },
  { title: "Insurance", detail: "Policies, renewals and claims", icon: ShieldCheck, tone: "insurance" },
  { title: "Finance", detail: "Bank accounts, investments, EMIs and due dates", icon: HandCoins, tone: "finance" },
  { title: "Property", detail: "Home, land and other valuable assets", icon: House, tone: "property" },
  { title: "Health", detail: "Medical records, reports and prescriptions", icon: HeartPulse, tone: "health" },
  { title: "Household", detail: "Bills, groceries, warranties and maintenance", icon: House, tone: "household" },
  { title: "Education", detail: "School, college and other education records", icon: GraduationCap, tone: "education" },
  { title: "To-do Lists", detail: "Family tasks, responsibilities and follow-ups", icon: ClipboardList, tone: "todo" },
];


// Security commitments must be verified against the deployed infrastructure and
// AI-provider agreements before this section is published.
function FamilyKitSecurity({ mobile = false }) {
  const commitments = [
    { Icon: LockKeyhole, title: "Bank-Grade AES-256 Encryption", detail: "Your family's personal information and important documents are protected using AES-256 encryption.", tone: "purple" },
    { Icon: BrainCircuit, title: "Your Data Is Never Used to Train AI Models", detail: "Your family information is processed by AI only to provide the services you request. It is not used by our AI providers to train or improve their general AI models.", tone: "green" },
    { Icon: MapPin, title: "Your Data Stays in India", detail: "Your family's information is stored on secure servers located in India and is not stored outside India.", tone: "gold" },
  ];
  const extras = [
    { Icon: Users, title: "You Control Access", detail: "You decide who can view or share your family information." },
    { Icon: Share2, title: "Secure Family Sharing", detail: "Share selected documents and information only with authorized family members." },
    { Icon: CloudUpload, title: "Safe & Reliable Backup", detail: "Protect important family information against accidental data loss." },
    { Icon: ShieldCheck, title: "Account Recovery", detail: "Regain access to your account through secure recovery options." },
  ];
  return (
    <section className={`fk-privacy-section${mobile ? " fk-privacy-mobile" : ""}`} id={mobile ? "m-security" : "security"} aria-labelledby={mobile ? "fk-privacy-heading-mobile" : "fk-privacy-heading"}>
      <div className="fk-privacy-inner">
        <div className="fk-privacy-hero">
          <div className="fk-privacy-intro">
            <span className="fk-privacy-pill"><ShieldCheck aria-hidden="true" /> Security &amp; Privacy</span>
            <h2 id={mobile ? "fk-privacy-heading-mobile" : "fk-privacy-heading"}>Your Family&apos;s Information.<br />Your Control. Your Trust.</h2>
            <p>Your family&apos;s personal information deserves the highest level of care. FamilyKit is designed with security, privacy and control in mind.</p>
          </div>
          <div className="fk-privacy-hero-art" aria-label="FamilyKit family security illustration">
            <img src={familyImage} alt="Family using FamilyKit together" loading="lazy" />
            <span className="fk-privacy-shield" aria-hidden="true"><ShieldCheck /></span>
          </div>
        </div>
        <div className="fk-privacy-divider"><span /> <h3>Our Key Security Guarantees</h3> <span /></div>
        <div className="fk-privacy-commitments">
          {commitments.map(({ Icon, title, detail, tone }) => (
            <article className={`fk-privacy-commitment fk-privacy-${tone}`} key={title}>
              <div className="fk-privacy-commitment-head"><span className="fk-privacy-main-icon"><Icon aria-hidden="true" /></span><h4>{title}</h4></div>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <div className="fk-privacy-extras">
          {extras.map(({ Icon, title, detail }) => (
            <article className="fk-privacy-extra" key={title}><Icon aria-hidden="true" /><h4>{title}</h4><p>{detail}</p></article>
          ))}
        </div>
        <div className="fk-privacy-banner">
          <span className="fk-privacy-banner-icon" aria-hidden="true"><ShieldCheck /></span>
          <div><h3>Your Privacy Is Our Commitment</h3><p>FamilyKit is designed to keep your family&apos;s information secure, private and under your control.</p></div>
          {/* TODO: Replace with a real privacy policy link once the policy route exists. */}
          <button type="button" disabled title="Privacy policy coming soon">Read Our Privacy Policy <ChevronRight aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}


// Testimonials and Pricing are shared between desktop and mobile.
function FamilyKitTestimonials({ mobile = false }) {
  return (
    <section className="fk-social-section" id={mobile ? "m-testimonials" : "testimonials"}>
      <div className="fk-social-inner">
        <div className="fk-social-copy">
          <span className="fk-social-pill"><MessageCircleMore aria-hidden="true" /> Testimonials</span>
          <h2>Real Families. Real Experiences.</h2>
          <h3>We are just getting started.</h3>
          <p>Be among the first families to experience FamilyKit.<br className="fk-social-desktop-break" /> Your experience could inspire thousands of families.</p>
          <span className="fk-social-coming"><Megaphone aria-hidden="true" /> Testimonials Coming Soon</span>
        </div>
        <img className="fk-social-family" src={familyImage} alt="Smiling family together" loading="lazy" />
      </div>
    </section>
  );
}

function FamilyKitPricing({ mobile = false }) {
  const benefits = [
    { Icon: FolderOpen, title: "Organize Family Documents", detail: "Keep all important records in one place." },
    { Icon: Sparkles, title: "AI-Powered Assistance", detail: "Find, understand and manage your information easily." },
    { Icon: Bell, title: "Important Reminders", detail: "Never miss policy dates, renewals or family events." },
    { Icon: ShieldCheck, title: "Secure & Private", detail: "Your family's data is protected and under your control." },
  ];
  return (
    <section className="fk-price-section" id={mobile ? "m-pricing" : "pricing"}>
      <div className="fk-price-inner">
        <span className="fk-price-pill"><Tags aria-hidden="true" /> Pricing</span>
        <h2>Simple &amp; Affordable for Every Family</h2>
        <p className="fk-price-subtitle">Choose a plan that keeps your family’s important information organized, secure and always accessible.</p>
        <div className="fk-price-layout">
          <div className="fk-price-device" aria-label="FamilyKit on laptop and mobile">
            <div className="fk-price-laptop"><div className="fk-price-screen"><img src={familyKitLogo} alt="FamilyKit" /><strong>FamilyKit</strong><small>Everything in Place.</small></div></div>
            <div className="fk-price-phone"><img src={familyKitLogo} alt="" /></div>
          </div>
          <article className="fk-price-plan">
            <div className="fk-price-offer"><Crown aria-hidden="true" /> Early Access Offer</div>
            <h3>Family Plan</h3>
            <p className="fk-price-amount"><strong>₹999</strong><span>/ year</span></p>
            <div className="fk-price-family"><Users aria-hidden="true" /><div><strong>For Your Family</strong><span>Up to 2 Adults + 2 Children</span></div></div>
            <button type="button" className="fk-price-join" disabled title="Early access registration is not yet connected">Join Early Access <ChevronRight aria-hidden="true" /></button>
          </article>
          <div className="fk-price-benefits">
            {benefits.map(({ Icon, title, detail }) => (
              <div className="fk-price-benefit" key={title}><span><Icon aria-hidden="true" /></span><div><h3>{title}</h3><p>{detail}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// FAQ wording follows the supplied FamilyKit FAQ draft.
const familyKitFaqItems = [
  { question: "What is FamilyKit?", answer: "FamilyKit is an AI-powered family life management platform that helps organize important family information, documents and everyday responsibilities in one place." },
  { question: "What kind of information can I store in FamilyKit?", answer: "You can organize family documents and records related to identity, insurance, finance, property, health, education and household matters. Available categories will depend on the features released in your plan." },
  { question: "How does FamilyKit AI work?", answer: "FamilyKit AI helps understand and organize information you provide. It can answer questions based on records available in your FamilyKit account and that you are authorized to access. Answers should reference the relevant source record where supported." },
  { question: "Can my family members access the information?", answer: "You can add family members and manage access to shared information. Each member should only be able to view information permitted by the account's sharing and access settings." },
  { question: "Is my information secure and private?", answer: "FamilyKit is being designed with data protection, encryption and access controls in mind. Specific security measures and data-location commitments will be described once they are implemented and verified." },
  { question: "What happens if I forget my password?", answer: "FamilyKit will provide a secure account-recovery process. The available recovery options will be confirmed when account access features are finalized." },
  { question: "Can I access FamilyKit on my mobile phone?", answer: "FamilyKit is being designed for convenient use across supported devices, including mobile phones. Device and browser support will be confirmed at launch." },
  { question: "How much does FamilyKit cost?", answer: "The proposed Early Access Family Plan is ₹999 per year for up to 2 adults and 2 children. This is a proposed introductory price and is subject to final confirmation before launch." },
];

function FamilyKitFaq({ mobile = false }) {
  const [expanded, setExpanded] = useState(null);
  const sectionId = mobile ? "m-faq" : "faq";
  return (
    <section className="fk-new-faq" id={sectionId} aria-labelledby={`${sectionId}-title`}>
      <div className="fk-new-faq-inner">
        <span className="fk-new-faq-pill"><CircleHelp aria-hidden="true" /> Frequently Asked Questions</span>
        <h2 id={`${sectionId}-title`}>Everything you need to know about FamilyKit</h2>
        <p className="fk-new-faq-subtitle">Find answers to common questions about your family information, privacy and early access.</p>
        <div className="fk-new-faq-list">
          {familyKitFaqItems.map((item, index) => {
            const isOpen = expanded === index;
            const answerId = `${sectionId}-answer-${index}`;
            return (
              <article className={`fk-new-faq-item${isOpen ? " is-open" : ""}`} key={item.question}>
                <h3>
                  <button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setExpanded(isOpen ? null : index)}>
                    <span>{mobile && index === 1 ? <>What kind of information can I store in<br className="fk-faq-mobile-break" />FamilyKit?</> : mobile && index === 3 ? <>Can my family members access the<br className="fk-faq-mobile-break" />information?</> : item.question}</span><ChevronDown aria-hidden="true" />
                  </button>
                </h3>
                <div id={answerId} className="fk-new-faq-answer" hidden={!isOpen}><p>{item.answer}</p></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}


// Shared end-of-page design. Connect the CTA and legal destinations when available.
const fkFooterGroups = [
  { title: "Explore", links: [["Home", "home"], ["Why FamilyKit", "why-familykit"], ["How It Works", "how"], ["Features", "features"], ["Pricing", "pricing"]] },
  { title: "Company", links: [["About Us", null], ["Contact Us", null], ["Testimonials", "testimonials"]] },
  { title: "Support", links: [["FAQ", "faq"], ["Contact Support", null]] },
  { title: "Legal", links: [["Privacy Policy", null], ["Terms & Conditions", null], ["Data Security", "security"], ["Refund Policy", null]] },
];

function FamilyKitEarlyAccess({ mobile = false }) {
  return (
    <section className={`fk-end-cta${mobile ? " fk-end-cta-mobile" : ""}`} aria-labelledby={mobile ? "fk-end-cta-m-title" : "fk-end-cta-title"}>
      <div className="fk-end-cta-photo"><img src={familyImage} alt="Family smiling together" loading="lazy" /></div>
      <div className="fk-end-cta-content">
        <h2 id={mobile ? "fk-end-cta-m-title" : "fk-end-cta-title"}>Bring Your Family’s <span>Life Together.</span></h2>
        <p>One place for everything that matters to your family.<br />Start your FamilyKit journey today.</p>
        <button className="fk-end-cta-button" type="button" disabled title="Early access registration coming soon">Get Early Access <ArrowRight aria-hidden="true" /></button>
        <div className="fk-end-cta-benefits">
          <div><FileText aria-hidden="true" /><span>Organize<br />Documents</span></div>
          <div><CalendarDays aria-hidden="true" /><span>Never Miss<br />Important Dates</span></div>
          <div><ShieldCheck aria-hidden="true" /><span>Secure &amp;<br />Private</span></div>
        </div>
      </div>
    </section>
  );
}

function FamilyKitContactForm({ onClose }) {
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const submitContact = (event) => {
    event.preventDefault();
    if (!name.trim() || !/^[0-9]{10}$/.test(mobileNumber)) {
      setError("Enter your name and a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setStatus("success");
  };

  return (
    <div className="fk-contact-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="fk-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="fk-contact-title">
        <button className="fk-contact-close" type="button" onClick={onClose} aria-label="Close contact form"><X size={22} /></button>
        {status === "success" ? (
          <div className="fk-contact-success" role="status">
            <span className="fk-contact-success-icon"><Check size={28} /></span>
            <h2 id="fk-contact-title">Form completed</h2>
            <p>Your details were entered successfully. This demo does not send or save submissions.</p>
            <button type="button" className="fk-contact-submit" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <span className="fk-contact-eyebrow">We’re here to help</span>
            <h2 id="fk-contact-title">Contact Us</h2>
            <p className="fk-contact-intro">Enter your details below.</p>
            <form className="fk-contact-form" name="familykit-contact" onSubmit={submitContact}>
              <label htmlFor="fk-contact-name">Name <span>*</span></label>
              <input id="fk-contact-name" name="name" type="text" autoComplete="name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter your full name" />
              <label htmlFor="fk-contact-mobile">Mobile Number <span>*</span></label>
              <input id="fk-contact-mobile" name="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" required pattern="[0-9]{10}" maxLength={10} value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value.replace(/[^0-9]/g, "").slice(0, 10))} placeholder="Enter 10-digit mobile number" />
              <label htmlFor="fk-contact-email">Email ID <small>(Optional)</small></label>
              <input id="fk-contact-email" name="email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" />
              <label htmlFor="fk-contact-message">Message <small>(Optional)</small></label>
              <textarea id="fk-contact-message" name="message" rows={4} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Write your message here..." />
              {error && <p className="fk-contact-error" role="alert">{error}</p>}
              <button className="fk-contact-submit" type="submit" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Submit"} <ArrowRight size={18} /></button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function FamilyKitFooter({ mobile = false }) {
  const [opened, setOpened] = useState(null);
  const [contactOpen, setContactOpen] = useState(false);
  const prefix = mobile ? "m-" : "";
  return (
    <>
    <footer className={`fk-end-footer${mobile ? " fk-end-footer-mobile" : ""}`}>
      <div className="fk-end-footer-main">
        <div className="fk-end-footer-about">
          <a className="fk-end-footer-logo" href={`#${prefix}home`}><img src={familyKitLogo} alt="" /><span><strong>FamilyKit<sup>®</sup></strong><small>Everything in Place.</small></span></a>
          <p>One intelligent platform to organize your family’s information, important documents and everyday life.</p>
          <div className="fk-end-footer-socials" aria-label="Social media (links coming soon)">
            <span title="LinkedIn coming soon"><FaLinkedinIn /></span><span title="YouTube coming soon"><Play /></span><span title="Instagram coming soon"><FaInstagram /></span><span title="Facebook coming soon"><FaFacebookF /></span>
          </div>
        </div>
        <nav className="fk-end-footer-nav" aria-label="Footer navigation">
          {fkFooterGroups.map((group, index) => (
            <div className="fk-end-footer-group" key={group.title}>
              {mobile ? <button type="button" className="fk-end-footer-group-toggle" onClick={() => setOpened(opened === index ? null : index)} aria-expanded={opened === index} aria-controls={`fk-end-links-${index}`}><span>{group.title}</span><ChevronDown aria-hidden="true" /></button> : <h3>{group.title}</h3>}
              <div className={`fk-end-footer-group-links${mobile && opened !== index ? " is-collapsed" : ""}`} id={mobile ? `fk-end-links-${index}` : undefined}>
                {group.links.map(([label, target]) => label === "Contact Us" ? <button type="button" className="fk-end-footer-contact-link" key={label} onClick={() => setContactOpen(true)}>{label}</button> : target ? <a href={`#${prefix}${target}`} key={label}>{label}</a> : <span className="fk-end-footer-pending" title="Page coming soon" key={label}>{label}</span>)}
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="fk-end-footer-bottom"><span>© 2026 FamilyKit. All rights reserved.</span><span>Powered by <strong>Medhaara Innovations Private Limited</strong></span></div>
    </footer>
    {contactOpen && <FamilyKitContactForm onClose={() => setContactOpen(false)} />}
    </>
  );
}

function MobileLanding({ menuOpen, setMenuOpen, openFaq, toggleFaq, featureWheelImages, faqs, onExploreFeatures }) {
  const mobileSteps = [
    [<Users />, "01", "Create your family account", "Set up your family space securely."],
    [<FileText />, "02", "Add your documents", "Upload or capture documents easily."],
    [<Sparkles />, "03", "AI organizes & understands", "We read, extract and organize key details."],
    [<Bell />, "04", "Stay notified & in control", "Get reminders, insights and quick actions."],
  ];

  return (
    <div className="fk-mobile-app">
      <header className="fk-mobile-header fk-responsive-mobile-header">
        <a className="fk-mobile-brand" href="#m-home" onClick={() => setMenuOpen(false)}>
          <img src={familyKitLogo} alt="FamilyKit" />
          <strong>FamilyKit</strong>
        </a>
        <div className="fk-responsive-mobile-actions">
          <a className="fk-responsive-login" href="#m-home" onClick={() => setMenuOpen(false)}>Login</a>
          <button className="fk-mobile-menu" onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <nav className="fk-mobile-nav fk-responsive-mobile-nav" aria-label="Mobile navigation">
            <a href="#m-home" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#m-why-familykit" onClick={() => setMenuOpen(false)}>Why FamilyKit</a>
            
            <a href="#m-how" onClick={() => setMenuOpen(false)}>How It Works</a>
            <a href="#m-features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#m-security" onClick={() => setMenuOpen(false)}>Security &amp; Privacy</a>
            <a href="#m-testimonials" onClick={() => setMenuOpen(false)}>Testimonials</a>
            <a href="#m-pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#m-faq" onClick={() => setMenuOpen(false)}>FAQs</a>
            <button className="fk-responsive-mobile-signup" type="button" onClick={() => setMenuOpen(false)}>Sign Up</button>
          </nav>
        )}
      </header>

      <main>
        <section className="fk-mobile-hero" id="m-home">
          <div className="fk-mobile-pill"><Sparkles /> Your family, well organized</div>
          <h1>The Smart Family Life Management App</h1>
          <p>Bring your family’s important documents, finances, assets, reminders and everyday tasks into one secure, easy-to-use space.</p>
          <div className="fk-mobile-hero-actions">
            <button>Get Started <ChevronRight className="cta-chevron-icon" /></button>
            <button><Play /> See How it Works</button>
          </div>
          <div className="fk-mobile-trust">
            <div><span><ShieldCheck /></span><b>Secure &amp; Private</b></div>
            <div><span><Users /></span><b>For every family</b></div>
            <div><span><Sparkles /></span><b>AI-powered</b></div>
          </div>

          <div className="fk-mobile-family">
            <div className="mf-icon mf1"><img src={insuranceImage} alt="" /></div>
            <div className="mf-icon mf2"><img src={fileImage} alt="" /></div>
            <div className="mf-icon mf3"><Bell /></div>
            <div className="mf-icon mf4"><img src={householdImage} alt="" /></div>
            <div className="mf-icon mf5"><img src={financeImage} alt="" /></div>
            <div className="mf-icon mf6"><img src={heroShieldImage} alt="" className="mf-hero-replacement-icon" /></div>
            <div className="mf-icon mf7"><HeartPulse /></div>
            <img className="fk-mobile-family-img" src={familyImage} alt="Family using FamilyKit" />
          </div>
        </section>

        <WhyFamilyKitSection mobile />
        <FamilyKitHowItWorks mobile />

        <section className="fk-mobile-features" id="m-features">
          <div className="fk-features-heading-badge">
            <Layers aria-hidden="true" />
            <span>FamilyKit Features</span>
          </div>

          <div className="fk-features-heading-row">
            <h2>Your Entire Family. One Connected Ecosystem.</h2>
            <span className="fk-features-heading-accent" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
          </div>

          <p className="fk-features-heading-subtitle">
            From important documents to everyday needs, bring your entire family life together.
          </p>

          <div className="fk-features-tree-wrap fk-features-tree-wrap-mobile">
            <img
              className="fk-features-tree-image"
              src={featuresTreeImage}
              alt="FamilyKit family information tree"
              loading="lazy"
            />
          </div>
          <div className="fk-mobile-ai-banner" aria-label="Powered by FamilyKit AI">
            <img
              src={featuresAiBanner}
              alt="Powered by FamilyKit AI — find information instantly, get reminders and updates, and see source documents"
              loading="lazy"
            />
          </div>
          <div className="fk-mobile-features-tagline" aria-label="One family. One platform. Endless possibilities.">
            <span className="fk-mobile-features-tagline-line" aria-hidden="true" />
            <span className="fk-mobile-features-tagline-leaf" aria-hidden="true">🌿</span>
            <strong>One family. One platform. Endless possibilities.</strong>
            <span className="fk-mobile-features-tagline-leaf" aria-hidden="true">🌿</span>
            <span className="fk-mobile-features-tagline-line" aria-hidden="true" />
          </div>
        </section>

        <section className="fk-mobile-reminders">
          <div className="fk-mobile-reminder-head">
            <div className="fk-mobile-bell"><Bell/><span>1</span></div>
            <div><h2>Smart reminders</h2><p>Never miss what matters.</p></div>
          </div>
          <div className="fk-mobile-reminder-stage">
            <div className="fk-mobile-purple-base"></div>
            <div className="fk-mchip mc1"><img className="fk-mchip-image" src={insuranceImage} alt="" /><span>Insurance Renewals</span><Check/></div>
            <div className="fk-mchip mc2"><img className="fk-mchip-image" src={householdImage} alt="" /><span>EMI’s and bill Payments</span><Check/></div>
            <div className="fk-mchip mc3"><Users/><span>Active updates for Nominees</span><Check/></div>
            <div className="fk-mchip mc4"><img className="fk-mchip-image" src={heroShieldImage} alt="" /><span>Warranties and Service Reminders</span><Check/></div>
            <div className="fk-mchip mc5"><img className="fk-mchip-image" src={fileImage} alt="" /><span>Find Documents Easily</span><Check/></div>
            <img className="fk-mobile-reminder-phone" src={notificationsMockup} alt="FamilyKit notifications" />

            <div className="fk-mobile-notice fk-passport">
              <small>! Update details Today · 08 Nov 2026</small>
              <div><b>Documents · Self</b><Share2/></div>
              <strong>Passport</strong><em>Passport No: Z1234567</em>
              <div className="fk-mobile-notice-actions"><button>Mark as Done</button><button>View File</button></div>
            </div>
            <div className="fk-mobile-notice fk-bill">
              <small>! Bill due Today · 3 Nov 2026</small>
              <div><b>Bills &amp; Renewals · Self</b><Share2/></div>
              <strong>AP Southern Electricity Bill</strong><em>Consumer No: 123456789</em>
              <div className="fk-mobile-notice-actions"><button>Mark as Done</button><button>View Bill</button></div>
            </div>
          </div>
        </section>

        <section className="fk-mobile-tracker">
          <div className="fk-mobile-tracker-head"><span><Sparkles/></span><div><h2>AI-Powered Tracker</h2><p>We update you every time</p></div></div>
          <div className="fk-mobile-tracker-list">
            {["Renewal and expiry tracker","Documents Organisation","Finance and EMI Trackers","AI Summarised Notes & Reminders"].map(x=><span key={x}><Check/>{x}</span>)}
          </div>
          <div className="fk-mobile-orb"><img src={aiTrackerCircle} alt="" /></div>
        </section>

        <FamilyKitSecurity mobile />

        <FamilyKitTestimonials mobile />
        <FamilyKitPricing mobile />
        <FamilyKitFaq mobile />
        <FamilyKitEarlyAccess mobile />
      </main>

      <FamilyKitFooter mobile />
    </div>
  );
}


function AllFeaturesPage({ onBack }) {
  const featureCards = [
    { icon: <img src={fileImage} alt="" className="fk-all-feature-custom-icon" />, title: "Documents", items: ["Identity", "Birth & Family", "Government certificates", "Legal", "Tax", "Medical"] },
    { icon: <img src={insuranceImage} alt="" className="fk-all-feature-custom-icon" />, title: "Insurance", items: ["Life", "Health", "Motor", "Property", "Travel", "Personal accident"] },
    { icon: <img src={financeImage} alt="" className="fk-all-feature-custom-icon" />, title: "Finances", items: ["Bank accounts", "FD & RD", "Mutual funds & stocks", "PPF, EPF, NPS", "Loans & credit cards"] },
    { icon: <img src={housingImage} alt="" className="fk-all-feature-custom-icon" />, title: "Property", items: ["House", "Flat / Apartment", "Land / Plot", "Commercial", "Agricultural land"] },
    { icon: <img src={heroShieldImage} alt="" className="fk-all-feature-custom-icon" />, title: "Warranties", items: ["TV & AC", "Refrigerator", "Washing machine", "Laptop & mobile", "Other appliances"] },
    { icon: <img src={householdImage} alt="" className="fk-all-feature-custom-icon" />, title: "Bills & Renewals", items: ["Electricity & water", "Internet & mobile", "Property tax", "Subscriptions"] },
    { icon: <img src={educationImage} alt="" className="fk-all-feature-custom-icon" />, title: "Education", items: ["School", "College / University", "Degrees & diplomas", "Marksheets", "Transfer certificates"] },
    {
  icon: (
    <img
      src={familyTasksImage}
      alt=""
      className="fk-all-feature-custom-icon"
    />
  ),
  title: "Family tasks",
  items: ["Family members", "Family Tree", "Member profiles", "Connected information"]
},
    { icon: <img src={diaryImage} alt="" className="fk-all-feature-custom-icon" />, title: "Diary", intro: "A completely private personal space.", items: ["Thoughts", "Feelings", "Experiences", "Memories"] },
    { icon: <img src={notesImage} alt="" className="fk-all-feature-custom-icon" />, title: "Notes", intro: "Shared to-dos and responsibilities", items: ["Money owed", "Follow-ups", "Tasks", "Things to remember"] },
  ];

  return (
    <div className="fk-all-features-page">
      <header className="fk-all-features-header">
        <button className="fk-all-features-brand" type="button" onClick={onBack} aria-label="Back to FamilyKit home">
          <img src={familyKitLogo} alt="FamilyKit" />
          <strong>FamilyKit</strong>
        </button>
        <nav className="fk-all-features-desktop-nav" aria-label="All Features navigation">
          <button type="button" onClick={onBack}>Home</button>
          <button type="button" onClick={onBack}>Features</button>
          <button type="button" onClick={onBack}>How it works</button>
          <button type="button" onClick={onBack}>Security</button>
          <button type="button" onClick={onBack}>FAQs</button>
        </nav>
        <button className="fk-all-features-desktop-cta" type="button">
          <span>Get Early Access</span><ChevronRight />
        </button>
        <button className="fk-all-features-menu" type="button" onClick={onBack} aria-label="Back to home">
          <Menu />
        </button>
      </header>

      <main className="fk-all-features-main">
        <section className="fk-all-features-intro">
          <div className="fk-all-features-pill"><Sparkles /><span>Features</span></div>
          <h1>Everything your family<br />needs, organized</h1>
          <p>Bring you not just a vault, finance app or reminder<br className="fk-features-wide-break" /> app. It’s a family information &amp; memory platform.</p>
        </section>

        <section className="fk-all-features-grid" aria-label="FamilyKit features">
          {featureCards.map((feature) => (
            <article className="fk-all-feature-card" key={feature.title}>
              <div className="fk-all-feature-icon" aria-hidden="true">{feature.icon}</div>
              <h2>{feature.title}</h2>
              {feature.intro && <p className="fk-all-feature-intro">{feature.intro}</p>}
              <ul>{feature.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </section>

        <section className="fk-all-features-cta">
          <div className="fk-all-features-cta-copy">
            <h2>Be Among the First<br />Families to experience<br />FamilyKit</h2>
            <p>Join our early access program and<br />help shape the future of family life<br />management.</p>
            <button type="button"><span>Get Early Access</span><ChevronRight /></button>
          </div>
          <img src={earlyAccessPhone} alt="FamilyKit mobile app" />
        </section>
      </main>

      <footer className="fk-all-features-footer">
        <div className="fk-all-features-footer-brand"><img src={familyKitLogo} alt="FamilyKit" /><strong>FamilyKit</strong></div>
        <p>A Medhaara Innovations product</p>
        <p className="fk-all-features-address">Office Address:<br />Street address, City, District, State, Pincode</p>

        <div className="fk-all-features-footer-socials">
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
          <a href="#" aria-label="X"><FaXTwitter /></a>
        </div>

        <nav className="fk-all-features-footer-links" aria-label="Footer links">
          <div className="fk-all-features-footer-column">
            <button type="button" onClick={onBack}>About</button>
            <button type="button" onClick={onBack}>Privacy</button>
            <button type="button" onClick={onBack}>Terms</button>
            <button type="button" onClick={onBack}>Contact</button>
          </div>

          <div className="fk-all-features-footer-column">
            <button type="button" onClick={onBack}>About</button>
            <button type="button" onClick={onBack}>Privacy</button>
            <button type="button" onClick={onBack}>Terms</button>
            <button type="button" onClick={onBack}>Contact</button>
          </div>

          <div className="fk-all-features-footer-column">
            <button type="button" onClick={onBack}>About</button>
            <button type="button" onClick={onBack}>Privacy</button>
            <button type="button" onClick={onBack}>Terms</button>
            <button type="button" onClick={onBack}>Contact</button>
          </div>
        </nav>
      </footer>
    </div>
  );
}


function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);

  const openAllFeatures = () => {
    setMenuOpen(false);
    setShowAllFeatures(true);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const closeAllFeatures = () => {
    setShowAllFeatures(false);
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const features = [
    {
      icon: <FileText />,
      title: "Documents",
      className: "documents",
    },
    {
      icon: <ShieldCheck />,
      title: "Insurance",
      className: "insurance",
    },
    {
      icon: <WalletCards />,
      title: "Finance",
      className: "finance",
    },
    {
      icon: <Building2 />,
      title: "Property",
      className: "property",
    },
    {
      icon: <HeartPulse />,
      title: "Health",
      className: "health",
    },
    {
      icon: <House />,
      title: "Household",
      className: "household",
    },
    {
      icon: <GraduationCap />,
      title: "Education",
      className: "education",
    },
    {
      icon: <ClipboardList />,
      title: "To do Lists",
      className: "todo",
    },
  ];

  // New image-based Features wheel. The original `features` array above is preserved.
  const featureWheelImages = [
    { title: "Documents", desc: "IDs, certificates and records", image: fileImage, tone: "documents" },
    { title: "Insurance", desc: "Policies, renewals and claims", image: insuranceImage, tone: "insurance" },
    { title: "Finance", desc: "Loans, EMIs & Investments", image: financeImage, tone: "finance" },
    { title: "Property", desc: "Home, Vehicles & Valuables", image: housingImage, tone: "property" },
    { title: "Health", desc: "Records & Prescriptions", image: healthImage, tone: "health" },
    { title: "Household", desc: "Bills & Service Contracts", image: householdImage, tone: "household" },
    { title: "Education", desc: "School & Learning records", image: educationImage, tone: "education" },
    { title: "To do Lists", desc: "Shared to-do's and responsibilities", image: todoImage, tone: "todo" },
  ];

  const faqs = [
    {
      question: "What is FamilyKit?",
      answer:
        "FamilyKit brings your family's important documents, finances, assets, reminders and everyday tasks into one secure, easy-to-use space.",
    },
    {
      question: "Is my data safe and private?",
      answer:
        "FamilyKit is designed to keep your family's information private and secure.",
    },
    {
      question: "Where is my data stored?",
      answer:
        "Your data is stored using secure cloud infrastructure.",
    },
    {
      question: "Do you use my data to train AI models?",
      answer:
        "Your personal family data is not used to train public AI models.",
    },
  ];

  if (showAllFeatures) {
    return <AllFeaturesPage onBack={closeAllFeatures} />;
  }

  return (
    <>
      <MobileLanding
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        openFaq={openFaq}
        toggleFaq={toggleFaq}
        featureWheelImages={featureWheelImages}
        faqs={faqs}
        onExploreFeatures={openAllFeatures}
      />

    <div className="familykit-app">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="header fk-responsive-desktop-header">
        <div className="header-inner fk-responsive-desktop-inner">
          <a className="brand" href="#home">
            <span className="brand-mark"><img className="brand-icon-image" src={familyKitLogo} alt="" /></span>
            <span className="brand-name">FamilyKit</span>
          </a>
          <nav className="desktop-nav fk-responsive-desktop-nav" aria-label="Primary navigation">
            <a href="#home">Home</a>
            <a href="#why-familykit">Why FamilyKit</a>
            
            <a href="#how">How It Works</a>
            <a href="#features">Features</a>
            
            <a href="#security">Security &amp; Privacy</a>
            <a href="#testimonials">Testimonials</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQs</a>
          </nav>
          <div className="fk-responsive-account-actions">
            <a className="fk-responsive-login" href="#home">Login</a>
            <button className="fk-responsive-signup" type="button">Sign Up</button>
          </div>
        </div>
      </header>


      <main>

        {/* ======================================================
            HERO
        ====================================================== */}

        <section className="hero" id="home">

          <div className="hero-content">

            {/* HERO BADGE */}

            <div className="hero-badge">

              <Sparkles size={18} />

              <span>
                Your family, well organized
              </span>

            </div>


            {/* HERO HEADING */}

            <h1>
              The Smart Family Life Management App
            </h1>


            {/* HERO DESCRIPTION */}

            <p className="hero-description">

              Bring your family’s important documents, finances,
              assets, reminders and everyday tasks into one secure,
              easy-to-use space.

            </p>


            {/* HERO BUTTONS */}

            <div className="hero-actions">

              <button className="primary-btn">

                <span>
                  Get Started
                </span>

               <ChevronRight className="hero-chevron" />


              </button>


              <button className="secondary-btn">

                <span className="play-circle">
                  <Play size={15} />
                </span>

                <span>
                  See How it Works
                </span>

              </button>

            </div>


            {/* HERO TRUST ITEMS */}

            <div className="hero-trust">

              <div className="trust-item">

                <span className="trust-icon trust-secure">
                  <ShieldCheck />
                </span>

                <span>
                  Secure & Private
                </span>

              </div>


              <div className="trust-item">

                <span className="trust-icon trust-family">
                  <Users />
                </span>

                <span>
                  For every family
                </span>

              </div>


              <div className="trust-item">

                <span className="trust-icon trust-ai">
                  <Sparkles />
                </span>

                <span>
                  AI-powered
                </span>

              </div>

            </div>


            {/* ==================================================
                FAMILY HERO VISUAL
                Existing family.png in the center +
                7 floating icon cards around it.
            ================================================== */}

            <div className="hero-family-visual">

              <div className="hero-float-icon hero-float-1" aria-hidden="true">
                <img src={insuranceImage} alt="" className="hero-float-image" />
              </div>

              <div className="hero-float-icon hero-float-2" aria-hidden="true">
                <img src={fileImage} alt="" className="hero-float-image" />
              </div>

              <div className="hero-float-icon hero-float-3" aria-hidden="true">
                <Bell />
              </div>

              <div className="hero-float-icon hero-float-4" aria-hidden="true">
                <img src={householdImage} alt="" className="hero-float-image" />
              </div>

              <div className="hero-float-icon hero-float-5" aria-hidden="true">
                <img src={financeImage} alt="" className="hero-float-image" />
              </div>

              <div className="hero-float-icon hero-float-6" aria-hidden="true">
                <img src={heroShieldImage} alt="" className="hero-float-image hero-shield-replacement-image" />
              </div>

              <div className="hero-float-icon hero-float-7" aria-hidden="true">
                <HeartPulse />
              </div>

              <img
                src={familyImage}
                alt="Family using FamilyKit"
                className="family-hero-image"
              />

            </div>

          </div>

        </section>


        {/* ======================================================
            WHY FAMILYKIT — PROBLEM STORYTELLING
        ====================================================== */}

        <WhyFamilyKitSection />

        {/* ======================================================
            SOLUTION SECTION
        ====================================================== */}
        {/* ======================================================
            HOW IT WORKS
        ====================================================== */}

        <FamilyKitHowItWorks />

        {/* ======================================================
            FEATURES
        ====================================================== */}

        <section
          className="features-section"
          id="features"
        >

          <div className="fk-features-heading-badge">
            <Layers aria-hidden="true" />
            <span>FamilyKit Features</span>
          </div>

          <div className="fk-features-heading-row">
            <h2>Your Entire Family. One Connected Ecosystem.</h2>
            <span className="fk-features-heading-accent" aria-hidden="true">
              <i></i><i></i><i></i>
            </span>
          </div>

          <p className="section-intro fk-features-heading-subtitle">
            From important documents to everyday needs, bring your entire family life together.
          </p>



          <div className="fk-features-tree-wrap fk-features-tree-wrap-desktop">
            <img
              className="fk-features-tree-image"
              src={featuresTreeImage}
              alt="FamilyKit family information tree"
              loading="lazy"
            />
          </div>

          <div className="fk-features-ai-banner-desktop">
            <img src={featuresAiBanner} alt="Powered by FamilyKit AI — find information instantly, get reminders and updates, and see source documents" loading="lazy" />
          </div>

          <div className="fk-features-ai-tagline-desktop" aria-label="One family. One platform. Endless possibilities.">
            <span className="fk-features-tagline-line" aria-hidden="true" />
            <span className="fk-features-tagline-leaf" aria-hidden="true">🌿</span>
            <strong>One family. One platform. Endless possibilities.</strong>
            <span className="fk-features-tagline-leaf" aria-hidden="true">🌿</span>
            <span className="fk-features-tagline-line" aria-hidden="true" />
          </div>

          {/* FEATURE WHEEL — original code preserved */}

          <div className="feature-wheel">


            {/* CENTER */}

            <div className="wheel-center">

              <div className="center-ring">

                <div className="center-circle">

                  <Users />

                  <strong>
                    FamilyKit
                  </strong>

                </div>

              </div>

            </div>


            {/* SURROUNDING CIRCLES */}

            {features.map((feature, index) => (

              <div
                key={feature.title}
                className={
                  `feature-bubble bubble-${index + 1} ${feature.className}`
                }
              >

                <div className="bubble-icon">
                  {feature.icon}
                </div>

                <strong>
                  {feature.title}
                </strong>

              </div>

            ))}

          </div>

        </section>


        {/* ======================================================
            REMINDERS
        ====================================================== */}

        <section className="reminders-section">


          {/* ======================================================
              NEW ANIMATED SMART REMINDERS PRESENTATION
              Existing reminder-grid and bill-card remain below.
          ====================================================== */}

          <div className="smart-reminders-showcase">

            <div className="smart-reminders-heading">
              <div className="smart-reminders-bell" aria-hidden="true">
                <Bell />
                <span>1</span>
              </div>

              <div className="smart-reminders-heading-copy">
                <h2>Smart reminders</h2>
                <p>Never miss what matters.</p>
              </div>
            </div>


            <div className="smart-reminders-stage">

              <div className="smart-reminders-purple-base" aria-hidden="true"></div>

              <div className="smart-reminder-chip smart-chip-insurance">
                <img className="smart-reminder-chip-image" src={insuranceImage} alt="" />
                <span>Insurance Renewals</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-emi">
                <img className="smart-reminder-chip-image" src={householdImage} alt="" />
                <span>EMI’s and bill Payments</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-nominee">
                <Users />
                <span>Active updates for<br />Nominees</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-warranty">
                <img className="smart-reminder-chip-image" src={heroShieldImage} alt="" />
                <span>Warranties and<br />Service Reminders</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-find">
                <img className="smart-reminder-chip-image" src={fileImage} alt="" />
                <span>Find Documents Easily</span>
                <Check className="smart-chip-check" />
              </div>


              <img
                src={notificationsMockup}
                alt="FamilyKit smart notifications"
                className="smart-reminders-phone"
              />


              <div className="smart-mini-notice smart-mini-left">
                <small>Update details Today · 08 Nov 2026</small>
                <div className="smart-mini-category-row">
                  <strong>Documents · Self</strong>
                  <button
                    className="smart-mini-share"
                    type="button"
                    aria-label="Share Passport"
                  >
                    <Share2 />
                  </button>
                </div>
                <span className="smart-mini-title">Passport</span>
                <span className="smart-mini-number">Passport No: Z1234567</span>
                <div className="smart-mini-actions">
                  <button>Mark as Done</button>
                  <button>View File</button>
                </div>
              </div>

              <div className="smart-mini-notice smart-mini-right">
                <small>Bill due Today · 3 Nov 2026</small>
                <div className="smart-mini-category-row">
                  <strong>Bills &amp; Renewals · Self</strong>
                  <button
                    className="smart-mini-share"
                    type="button"
                    aria-label="Share Electricity Bill"
                  >
                    <Share2 />
                  </button>
                </div>
                <span className="smart-mini-title">AP Southern Electricity Bill</span>
                <span className="smart-mini-number">Consumer No: 123456789</span>
                <div className="smart-mini-actions">
                  <button>Mark as Done</button>
                  <button>View Bill</button>
                </div>
              </div>

            </div>

          </div>


          <div className="reminder-number">
            1
          </div>


          <h2>
            Smart Reminders
          </h2>


          <p className="section-intro">
            Never miss what matters.
          </p>


          <div className="reminder-grid">

            <div className="reminder-chip">
              <ShieldCheck />
              Insurance Renewals
            </div>

            <div className="reminder-chip">
              <House />
              Warranties and Service Reminders
            </div>

            <div className="reminder-chip">
              <ReceiptText />
              EMIs and Bill Payments
            </div>

            <div className="reminder-chip">
              <FileText />
              Find Documents Easily
            </div>

            <div className="reminder-chip">
              <Users />
              Active Nominee Updates
            </div>

          </div>


          <div className="bill-card">

            <div className="bill-heading">

              <div>

                <small>
                  Bill due Today
                </small>

                <strong>
                  Electricity Bill
                </strong>

              </div>

              <ReceiptText />

            </div>


            <p>
              Consumer No : 123456789
            </p>


            <div className="bill-actions">

              <button>
                <Check size={15} />
                Mark as Done
              </button>

              <button>
                <Eye size={15} />
                View Bill
              </button>

            </div>

          </div>

        </section>


        {/* ======================================================
            AI TRACKER
        ====================================================== */}

        <section className="tracker-section">

          <div className="tracker-header">

            <div className="tracker-icon">
              <Sparkles />
            </div>

            <div className="tracker-heading-copy">

              <h2>
                AI-Powered Tracker
              </h2>

              <p>
                We update you every time
              </p>

            </div>

          </div>


          <div className="tracker-list">

            <div>
              <span className="tracker-check"><Check /></span>
              <span>Renewal and expiry tracker</span>
            </div>

            <div>
              <span className="tracker-check"><Check /></span>
              <span>Documents Organisation</span>
            </div>

            <div>
              <span className="tracker-check"><Check /></span>
              <span>Finance and EMI Trackers</span>
            </div>

            <div>
              <span className="tracker-check"><Check /></span>
              <span>AI Summarised Notes &amp; Reminders</span>
            </div>

          </div>


          <div className="tracker-ai-orb" aria-hidden="true">
            <div className="fk-ai-orb-animation-layer">
              <img
                src={aiTrackerCircle}
                alt=""
                className="tracker-ai-orb-image"
              />
            </div>
          </div>

        </section>


        {/* ======================================================
            SECURITY
        ====================================================== */}

        <FamilyKitSecurity />


        {/* ======================================================
            FAQ
        ====================================================== */}

        <FamilyKitTestimonials />
        <FamilyKitPricing />
        <FamilyKitFaq />
        <FamilyKitEarlyAccess />

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <FamilyKitFooter />

    </div>
    </>
  );
}

export default App;
