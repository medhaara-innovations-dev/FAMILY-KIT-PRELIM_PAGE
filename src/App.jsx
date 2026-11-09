import { useState } from "react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import howItWorksIcon from "./assets/images/ai-brain-02.png";
import dashboardIcon from "./assets/images/analytics-01.png";
import familyTasksImage from "./assets/images/to do task icon.png";

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
} from "lucide-react";
import earlyAccessPhone from "./assets/images/iPhone 16 Pro.png";

import familyKitLogo from "./assets/images/Family kit Logo.png";
import familyImage from "./assets/images/Smiling Family with Purple Tablet.png";
import problemImage from "./assets/images/Problem.png";

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
import mobileIcon from "./assets/images/MobileICON.png";
import notificationsMockup from "./assets/images/Transparent Notifications App Mockup.png";
import heroShieldImage from "./assets/images/4db75485-c10a-4574-b017-11775affeb6e.png";


import aiTrackerCircle from "./assets/images/233a1305-6008-4e8a-b596-64f2d85afd80.png";
import noAiTrainingIcon from "./assets/images/Frame 760.png";
import stepThreePurpleIcon from "./assets/images/Purple icon circle.png";

import alertIcon from "./assets/images/Alert.png";
import ideaIcon from "./assets/images/idea.png";

import "./App.css";


function MobileLanding({ menuOpen, setMenuOpen, openFaq, toggleFaq, featureWheelImages, faqs, onExploreFeatures }) {
  const mobileSteps = [
    [<Users />, "01", "Create your family account", "Set up your family space securely."],
    [<FileText />, "02", "Add your documents", "Upload or capture documents easily."],
    [<Sparkles />, "03", "AI organizes & understands", "We read, extract and organize key details."],
    [<Bell />, "04", "Stay notified & in control", "Get reminders, insights and quick actions."],
  ];

  return (
    <div className="fk-mobile-app">
      <header className="fk-mobile-header">
        <a className="fk-mobile-brand" href="#m-home">
          <img src={familyKitLogo} alt="FamilyKit" />
          <strong>FamilyKit</strong>
        </a>
        <button className="fk-mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <X /> : <Menu />}
        </button>
        {menuOpen && (
          <nav className="fk-mobile-nav">
            <a href="#m-problem" onClick={() => setMenuOpen(false)}>Why FamilyKit</a>
            <a href="#m-features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#m-how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#m-security" onClick={() => setMenuOpen(false)}>Security</a>
          </nav>
        )}
      </header>

      <main>
        <section className="fk-mobile-hero" id="m-home">
          <div className="fk-mobile-pill"><Sparkles /> Your family, Well organized</div>
          <h1>The Smart Family<br/>Life Management<br/>App</h1>
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

        <section className="fk-mobile-problem" id="m-problem">
          <div className="fk-mobile-section-pill">
            <img src={alertIcon} alt="" className="fk-mobile-section-pill-icon" aria-hidden="true" />
            <span>The Problem</span>
          </div>
          <h2>Your family’s information is<br/>scattered everywhere.</h2>
          <p>Keeping track of family documents, renewals, bills and<br/>tasks can feel overwhelming.</p>
          <div className="fk-problem-canvas fk-problem-canvas-mobile">
            <img className="fk-problem-base-image" src={problemImage} alt="Family information challenges" />
            <div className="fk-problem-card fk-problem-card-finance">
              <img src={financeImage} alt="" aria-hidden="true" />
              <span>Unable to track finances</span>
              <b aria-hidden="true">×</b>
            </div>
            <div className="fk-problem-card fk-problem-card-documents">
              <img src={fileImage} alt="" aria-hidden="true" />
              <span>Documents are in different places</span>
              <b aria-hidden="true">×</b>
            </div>
            <div className="fk-problem-card fk-problem-card-insurance">
              <img src={insuranceImage} alt="" aria-hidden="true" />
              <span>Insurance Renewals pending</span>
              <b aria-hidden="true">×</b>
            </div>
            <div className="fk-problem-card fk-problem-card-bills">
              <img src={householdImage} alt="" aria-hidden="true" />
              <span>EMI's and bill Payments pending</span>
              <b aria-hidden="true">×</b>
            </div>
            <div className="fk-problem-card fk-problem-card-warranty">
              <img src={heroShieldImage} alt="" aria-hidden="true" />
              <span>Warranties and services are missing</span>
              <b aria-hidden="true">×</b>
            </div>
          </div>
        </section>

        <section className="fk-mobile-solution">
          <div className="fk-mobile-section-pill">
            <img src={ideaIcon} alt="" className="fk-mobile-section-pill-icon" aria-hidden="true" />
            <span>The Solution</span>
          </div>
          <h2>Meet FamilyKit</h2>
          <p>Keep everything that matters to your family organized, secure, and effortlessly managed with AI.</p>
          <div className="fk-mobile-solution-cards">
            <article className="fk-mobile-solution-card fk-mobile-solution-organize">
              <FolderOpen />
              <div><h3>Organize</h3><p>Keep all family information in one place.</p></div>
              <div className="fk-mobile-organize-art" aria-hidden="true">
                <span className="fk-mobile-insurance-sheet fk-mobile-insurance-sheet-back"></span>
                <span className="fk-mobile-insurance-sheet fk-mobile-insurance-sheet-middle"></span>
                <span className="fk-mobile-insurance-sheet fk-mobile-insurance-sheet-front">
                  <Heart />
                  <small>Life Insurance</small>
                </span>
              </div>
            </article>
            <article className="fk-mobile-insights-card">
              <Sparkles />
              <div>
                <h3>Get insights</h3>
                <p>Let AI read, understand and summarize your documents.</p>
              </div>
              <div className="fk-mobile-insights-orb" aria-hidden="true">
                <img src={aiTrackerCircle} alt="" />
              </div>
            </article>
            <article className="fk-mobile-solution-card fk-mobile-solution-track">
              <CalendarDays />
              <div><h3>Stay on Track</h3><p>Never miss renewals, bills and important dates.</p></div>
              <div className="fk-mobile-mini-calendar" aria-hidden="true">
                <div className="fk-mobile-mini-calendar-head">
                  <span>‹</span><strong>October 2026</strong><span>›</span>
                </div>
                <div className="fk-mobile-mini-calendar-weekdays">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
                <div className="fk-mobile-mini-calendar-days">
                  <b className="fk-mobile-cal-empty"></b><b className="fk-mobile-cal-empty"></b><b className="fk-mobile-cal-empty"></b>
                  <b className="fk-mobile-cal-blue">1</b><b>2</b><b>3</b><b>4</b>
                  <b>5</b><b>6</b><b>7</b><b>8</b><b>9</b><b>10</b><b>11</b>
                  <b>12</b><b>13</b><b className="fk-mobile-cal-multi">14</b><b>15</b><b>16</b><b>17</b><b>18</b>
                  <b>19</b><b>20</b><b>21</b><b>22</b><b>23</b><b>24</b><b>25</b>
                  <b>26</b><b>27</b><b>28</b><b>29</b><b>30</b><b>31</b>
                </div>
              </div>
            </article>
            <article className="fk-mobile-solution-card fk-mobile-solution-prepared">
              <ShieldCheck />
              <div><h3>Be Prepared</h3><p>Find what your family needs, when you need it.</p></div>
              <div className="fk-mobile-solution-handshake" aria-hidden="true">
                <HeartHandshake />
              </div>
            </article>
          </div>
        </section>

        <section className="fk-mobile-features" id="m-features">
          
          <h2>Everything your family<br/>needs, organized</h2>
          <p>Keep your family's important information, documents and responsibilities together.</p>
          <button className="fk-mobile-text-link" type="button" onClick={onExploreFeatures}>Explore all Features <ArrowRight /></button>
          <div className="fk-mobile-feature-wheel">
            <svg className="fk-mobile-wheel-spokes" viewBox="0 0 350 430" aria-hidden="true">
              <line x1="175" y1="215" x2="175" y2="41" />
              <line x1="175" y1="215" x2="299" y2="111" />
              <line x1="175" y1="215" x2="309" y2="221" />
              <line x1="175" y1="215" x2="276" y2="341" />
              <line x1="175" y1="215" x2="175" y2="386" />
              <line x1="175" y1="215" x2="71" y2="341" />
              <line x1="175" y1="215" x2="41" y2="221" />
              <line x1="175" y1="215" x2="51" y2="111" />
            </svg>
            <div className="fk-mobile-wheel-center"><img src={centerFamilyImage} alt="FamilyKit family" /></div>
            {featureWheelImages.map((f,i)=>(
              <article className={`fk-mobile-feature mf-feature-${i+1} fk-tone-${f.tone}`} key={f.title}>
                <img src={f.image} alt="" />
                <strong>{f.title}</strong>
                <small>{f.desc}</small>
              </article>
            ))}
          </div>
        </section>

        <section className="fk-mobile-how" id="m-how">
          <div className="fk-mobile-section-pill">
  <img
    src={howItWorksIcon}
    alt=""
    className="fk-mobile-section-pill-icon"
    aria-hidden="true"
  />
  <span>How it Works</span>
</div>
          <h2>Minimum Input and<br/>Maximum Organization</h2>
          <p>Get started in minutes and let AI do the heavy lifting.</p>
          <img className="fk-mobile-how-art" src={mobileIcon} alt="FamilyKit mobile organization" />
          <div className="fk-mobile-steps">
            {mobileSteps.map(([icon,num,title,desc])=>(
              <article key={num}>
                <span className="fk-mobile-step-icon">{icon}</span>
                <div><small>Step - {num}</small><h3>{title}</h3><p>{desc}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="fk-mobile-dashboard">
          <div className="fk-mobile-section-pill">
            <img
              src={dashboardIcon}
              alt=""
              className="fk-mobile-section-pill-icon"
              aria-hidden="true"
            />
            <span>Your Family Dashboard</span>
          </div>
          <h2>A clear view of your family life</h2>
          <p>Your family’s documents, reminders and essentials in one place. Always know what’s next.</p>
          <div className="fk-mobile-dashboard-preview" aria-label="Family dashboard preview">
            <span className="fk-mobile-dashboard-avatar">F</span>
          </div>
          <div className="fk-mobile-benefits">
            <span><Check/>Quick access to everything</span>
            <span><Check/>Upcoming renewals and payments</span>
            <span><Check/>Family-wide visibility (with your permission)</span>
            <span><Check/>Works across mobile and web</span>
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
            <div className="fk-mchip mc3"><Users/><span>Active updates for Nominee’s</span><Check/></div>
            <div className="fk-mchip mc4"><img className="fk-mchip-image" src={heroShieldImage} alt="" /><span>Warranties and Service Reminders</span><Check/></div>
            <div className="fk-mchip mc5"><img className="fk-mchip-image" src={fileImage} alt="" /><span>Find Documents easy</span><Check/></div>
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
          <div className="fk-mobile-tracker-head"><span><Sparkles/></span><div><h2>AI Powered Tracker</h2><p>We update you everytime</p></div></div>
          <div className="fk-mobile-tracker-list">
            {["Renewal and expiry tracker","Documents Organisation","Finance and EMI Trackers","AI Summarised Notes & Reminders"].map(x=><span key={x}><Check/>{x}</span>)}
          </div>
          <div className="fk-mobile-orb"><img src={aiTrackerCircle} alt="" /></div>
        </section>

        <section className="fk-mobile-security" id="m-security">
          <div className="fk-mobile-section-pill">♡&nbsp; Private By Design</div>
          <h2>Your family’s data stays<br/>private and secure</h2>
          <div className="fk-mobile-security-grid">
            <article><LockKeyhole/><b>AES-256 encryption</b><p>Strong protection for your data.</p></article>
            <article><ShieldCheck/><b>India data residency</b><p>Your data is stored in AWS India regions.</p></article>
            <article><Sparkles/><b>No AI training</b><p>Your personal data is never used to train public AI models.</p></article>
            <article><Users/><b>Your control</b><p>Only you and the people you authorize can access your family information.</p></article>
          </div>
        </section>

        <section className="fk-mobile-faq">
          <h2>Frequently asked questions</h2>
          <p className="fk-mobile-faq-intro">Have questions? We have answers.</p>
          {faqs.map((faq,index)=>(
            <div className="fk-mobile-faq-item" key={faq.question}>
              <button onClick={()=>toggleFaq(index)}><span>{faq.question}</span><ChevronDown/></button>
              {openFaq===index && <p>{faq.answer}</p>}
            </div>
          ))}
        </section>

        <section className="fk-mobile-cta">
          <h2>Be Among the First<br/>Families to experience<br/><strong>FamilyKit</strong></h2>
          <p>Join our early access program and help shape the future of family life management.</p>
          <button>Get Early Access <ChevronRight className="cta-chevron-icon" /></button>
          <img src={earlyAccessPhone} alt="FamilyKit mobile app" />
        </section>
      </main>

      <footer className="fk-mobile-footer">
        <div className="fk-mobile-footer-brand"><img src={familyKitLogo} alt="FamilyKit"/><strong>FamilyKit</strong></div>
        <p>A Medhaara Innovations product</p>
        <p>Office Address:<br/>Street address, City, District, State, Pincode</p>

   


        
        <div className="fk-mobile-footer-socials">
          <a href="#" aria-label="Facebook"><FaFacebookF /></a>
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
          <a href="#" aria-label="X"><FaXTwitter /></a>
        </div>

        <div className="fk-mobile-footer-links"><a href="#m-home">About</a><a href="#m-security">Privacy</a><a href="#m-home">Terms</a><a href="#m-home">Contact</a></div>
        
        <small>© 2026 FamilyKit. All rights reserved.</small>
      </footer>
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

      <header className="header">

        <div className="header-inner">

          <a className="brand" href="#home">

            <div className="brand-mark">
              <img
                src={familyKitLogo}
                alt="FamilyKit"
                className="brand-icon-image"
              />
            </div>

            <span className="brand-name">
              FamilyKit
            </span>

          </a>


          {/* DESKTOP NAVIGATION */}

          <nav className="desktop-nav">
            <a href="#problem">Why FamilyKit</a>
            <a href="#features">Features</a>
            <a href="#how">How it works</a>
            <a href="#security">Security</a>
          </nav>


          <button className="desktop-cta">
            Get Early Access
           
          </button>


          {/* MOBILE MENU */}

          <div className="mobile-header-actions">

            <button
              className="menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X /> : <Menu />}
            </button>

          </div>

        </div>


        {/* MOBILE DROPDOWN */}

        {menuOpen && (

          <nav className="mobile-nav">

            <a
              href="#problem"
              onClick={() => setMenuOpen(false)}
            >
              Why FamilyKit
            </a>

            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>

            <a
              href="#how"
              onClick={() => setMenuOpen(false)}
            >
              How it works
            </a>

            <a
              href="#security"
              onClick={() => setMenuOpen(false)}
            >
              Security
            </a>

          </nav>

        )}

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
                Your family, Well organized
              </span>

            </div>


            {/* HERO HEADING */}

            <h1>
              The Smart Family
              <br />
              Life Management
              <br />
              App
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
            PROBLEM SECTION
        ====================================================== */}

        <section
          className="problem-section"
          id="problem"
        >

          <div className="section-label fk-desktop-section-label">
            <img src={alertIcon} alt="" aria-hidden="true" />
            <span>The Problem</span>
          </div>


          <h2>
            Your family’s information is
            <span> scattered everywhere.</span>
          </h2>


          <p className="section-intro">

            Keeping track of family documents, renewals,
            bills and tasks can feel overwhelming.

          </p>

          <div className="problem-image-wrapper">
  <div className="fk-problem-canvas">
    <img
      src={problemImage}
      alt="Family information challenges"
      className="problem-image fk-problem-base-image"
    />
    <div className="fk-problem-card fk-problem-card-finance">
      <img src={financeImage} alt="" aria-hidden="true" />
      <span>Unable to track finances</span>
      <b aria-hidden="true">×</b>
    </div>
    <div className="fk-problem-card fk-problem-card-documents">
      <img src={fileImage} alt="" aria-hidden="true" />
      <span>Documents are in different places</span>
      <b aria-hidden="true">×</b>
    </div>
    <div className="fk-problem-card fk-problem-card-insurance">
      <img src={insuranceImage} alt="" aria-hidden="true" />
      <span>Insurance Renewals pending</span>
      <b aria-hidden="true">×</b>
    </div>
    <div className="fk-problem-card fk-problem-card-bills">
      <img src={householdImage} alt="" aria-hidden="true" />
      <span>EMI's and bill Payments pending</span>
      <b aria-hidden="true">×</b>
    </div>
    <div className="fk-problem-card fk-problem-card-warranty">
      <img src={heroShieldImage} alt="" aria-hidden="true" />
      <span>Warranties and services are missing</span>
      <b aria-hidden="true">×</b>
    </div>
  </div>
</div>
        </section>


        {/* ======================================================
            SOLUTION SECTION
        ====================================================== */}

        <section className="solution-section">

          <div className="section-label solution-label fk-desktop-section-label">
            <img src={ideaIcon} alt="" aria-hidden="true" />
            <span>The Solution</span>
          </div>

          <h2>
            Meet <span>FamilyKit</span>
          </h2>

          <p className="section-intro">
            Keep everything that matters to your family organized,
            secure, and effortlessly managed with AI
          </p>

          <div className="solution-cards">

            <article className="solution-card solution-organize">
              <div className="solution-card-copy">
                <FolderOpen className="solution-line-icon" />
                <h3>Organize</h3>
                <p>Keep all family information in<br />one place.</p>
              </div>

              <div className="solution-organize-art" aria-hidden="true">
                <span className="insurance-sheet insurance-sheet-back"></span>
                <span className="insurance-sheet insurance-sheet-middle"></span>
                <span className="insurance-sheet insurance-sheet-front">
                  <Heart />
                  <small>Life Insurance</small>
                </span>
              </div>
            </article>

            <article className="solution-card solution-insights">
              <div className="solution-card-copy">
                <Sparkles className="solution-line-icon" />
                <h3>Get insights</h3>
                <p>Let AI read, understand and<br />summarize your documents.</p>
              </div>

              <div className="solution-ai-orb" aria-hidden="true">
                <img
                  src={aiTrackerCircle}
                  alt=""
                  className="solution-ai-orb-image"
                />
              </div>
            </article>

            <article className="solution-card solution-track">
              <div className="solution-card-copy">
                <CalendarDays className="solution-line-icon" />
                <h3>Stay on track</h3>
                <p>Never miss renewals, payments<br />or important dates.</p>
              </div>

              <div className="solution-mini-calendar" aria-hidden="true">
                <div className="mini-calendar-head">
                  <span className="mini-calendar-arrow">‹</span>
                  <strong>October 2026</strong>
                  <span className="mini-calendar-arrow">›</span>
                </div>

                <div className="mini-calendar-weekdays">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span>
                  <span>Thu</span><span>Fri</span><span>Sat</span>
                </div>

                <div className="mini-calendar-days">
                  <b className="mini-calendar-empty"></b>
                  <b className="mini-calendar-empty"></b>
                  <b className="mini-calendar-empty"></b>
                  <b className="mini-calendar-date mini-calendar-event-blue">1</b>
                  <b className="mini-calendar-date">2</b>
                  <b className="mini-calendar-date">3</b>
                  <b className="mini-calendar-date">4</b>

                  <b className="mini-calendar-date">5</b>
                  <b className="mini-calendar-date">6</b>
                  <b className="mini-calendar-date">7</b>
                  <b className="mini-calendar-date">8</b>
                  <b className="mini-calendar-date">9</b>
                  <b className="mini-calendar-date">10</b>
                  <b className="mini-calendar-date">11</b>

                  <b className="mini-calendar-date">12</b>
                  <b className="mini-calendar-date">13</b>
                  <b className="mini-calendar-date mini-calendar-event-multi">14</b>
                  <b className="mini-calendar-date">15</b>
                  <b className="mini-calendar-date">16</b>
                  <b className="mini-calendar-date">17</b>
                  <b className="mini-calendar-date">18</b>

                  <b className="mini-calendar-date">19</b>
                  <b className="mini-calendar-date">20</b>
                  <b className="mini-calendar-date">21</b>
                  <b className="mini-calendar-date">22</b>
                  <b className="mini-calendar-date">23</b>
                  <b className="mini-calendar-date">24</b>
                  <b className="mini-calendar-date">25</b>

                  <b className="mini-calendar-date">26</b>
                  <b className="mini-calendar-date">27</b>
                  <b className="mini-calendar-date">28</b>
                  <b className="mini-calendar-date">29</b>
                  <b className="mini-calendar-date">30</b>
                  <b className="mini-calendar-date">31</b>
                  <b className="mini-calendar-empty"></b>
                </div>
              </div>
            </article>

            <article className="solution-card solution-prepared">
              <div className="solution-card-copy">
                <ShieldCheck className="solution-line-icon" />
                <h3>Be prepared</h3>
                <p>Access what you need, when your<br />family needs it most.</p>
              </div>

              <div className="solution-handshake" aria-hidden="true">
                <HeartHandshake />
              </div>
            </article>

          </div>

        </section>


        {/* ======================================================
            FEATURES
        ====================================================== */}

        <section
          className="features-section"
          id="features"
        >

          <h2>
            Everything your family needs,
            <span> organized</span>
          </h2>


          <p className="section-intro">

            Keep your family's important information,
            documents and responsibilities together.

          </p>


          <button className="text-link" type="button" onClick={openAllFeatures}>

            Explore all Features

            <ArrowRight size={17} />

          </button>


          {/* ======================================================
              NEW IMAGE-BASED FEATURE WHEEL
              Existing feature-wheel code is preserved below.
          ====================================================== */}

          <div className="fk-image-feature-wheel">
            <svg
              className="fk-wheel-connectors-svg"
              viewBox="0 0 620 610"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {/* center -> Documents */}
              <line x1="310" y1="200" x2="310" y2="126" />

              {/* center -> Insurance */}
              <line x1="388" y1="228" x2="445" y2="171" />

              {/* center -> Finance */}
              <line x1="420" y1="305" x2="489" y2="305" />

              {/* center -> Property */}
              <line x1="388" y1="382" x2="443" y2="438" />

              {/* center -> Health */}
              <line x1="310" y1="410" x2="310" y2="484" />

              {/* center -> Household */}
              <line x1="232" y1="382" x2="177" y2="438" />

              {/* center -> Education */}
              <line x1="200" y1="305" x2="131" y2="305" />

              {/* center -> To do Lists */}
              <line x1="232" y1="228" x2="175" y2="171" />
            </svg>

            <div className="fk-wheel-center">
              <div className="fk-wheel-center-glow" aria-hidden="true" />
              <div className="fk-wheel-center-image-wrap">
                <img src={centerFamilyImage} alt="FamilyKit family" />
              </div>
            </div>

            {featureWheelImages.map((feature, index) => (
              <article
                key={`image-wheel-${feature.title}`}
                className={`fk-feature-circle fk-feature-circle-${index + 1} fk-tone-${feature.tone}`}
              >
                <img
                  src={feature.image}
                  alt=""
                  aria-hidden="true"
                  className="fk-feature-circle-image"
                />

                <h3 className="fk-feature-circle-title">
                  {feature.title}
                </h3>

                <p className="fk-feature-circle-desc">
                  {feature.desc}
                </p>
              </article>
            ))}
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
            HOW IT WORKS
        ====================================================== */}

        <section
          className="how-section"
          id="how"
        >

          <div className="section-label fk-desktop-section-label">
            <img src={howItWorksIcon} alt="" aria-hidden="true" />
            <span>How it Works</span>
          </div>


          <h2>
            Minimum Input and
            <span> Maximum Organization</span>
          </h2>


          <p className="section-intro">

            Get started in minutes and let AI
            do the heavy lifting.

          </p>



          <div className="how-it-works-visual">
            <img
              src={mobileIcon}
              alt="FamilyKit mobile organization"
              className="how-it-works-mobile-icon"
            />
          </div>


          <div className="steps">


            {/* STEP 1 */}

            <div className="step-card">

              <span className="step-number">
                Step - 01
              </span>

              <div className="step-icon">
                <Users />
              </div>

              <div>

                <h3>
                  Create your family account
                </h3>

                <p>
                  Set up your family space securely.
                </p>

              </div>

            </div>


            {/* STEP 2 */}

            <div className="step-card">

              <span className="step-number">
                Step - 02
              </span>

              <div className="step-icon">
                <FileText />
              </div>

              <div>

                <h3>
                  Add your documents
                </h3>

                <p>
                  Upload or capture documents easily.
                </p>

              </div>

            </div>


            {/* STEP 3 */}

            <div className="step-card">

              <span className="step-number">
                Step - 03
              </span>

              <div className="step-icon step-icon-image">
                <img
                  src={stepThreePurpleIcon}
                  alt=""
                  className="step-three-purple-icon"
                />
              </div>

              <div>

                <h3>
                  AI organizes & understands
                </h3>

                <p>
                  We read, extract and organize key details.
                </p>

              </div>

            </div>


            {/* STEP 4 */}

            <div className="step-card">

              <span className="step-number">
                Step - 04
              </span>

              <div className="step-icon">
                <Bell />
              </div>

              <div>

                <h3>
                  Stay notified & in control
                </h3>

                <p>
                  Get reminders, insights and quick actions.
                </p>

              </div>

            </div>

          </div>



          {/* ======================================================
              NEW MOBILE HOW-IT-WORKS TIMELINE
              Added without removing the original steps above.
              Desktop/tablet keeps the original cards.
          ====================================================== */}

          <div className="mobile-how-timeline" aria-label="How FamilyKit works">

            <article className="mobile-how-step">
              <div className="mobile-how-marker">
                <Users />
              </div>

              <div className="mobile-how-card">
                <span className="mobile-how-number">Step -01</span>
                <h3>Create your family account</h3>
                <p>Set up your family space securely.</p>
              </div>
            </article>


            <article className="mobile-how-step">
              <div className="mobile-how-marker">
                <FileText />
              </div>

              <div className="mobile-how-card">
                <span className="mobile-how-number">Step -02</span>
                <h3>Add your documents</h3>
                <p>Upload or capture documents easily.</p>
              </div>
            </article>


            <article className="mobile-how-step">
              <div className="mobile-how-marker">
                <Sparkles />
              </div>

              <div className="mobile-how-card">
                <span className="mobile-how-number">Step -03</span>
                <h3>AI organizes &amp; understands</h3>
                <p>We read, extract and organize key details.</p>
              </div>
            </article>


            <article className="mobile-how-step">
              <div className="mobile-how-marker">
                <Bell />
              </div>

              <div className="mobile-how-card">
                <span className="mobile-how-number">Step -04</span>
                <h3>Stay notified &amp; in control</h3>
                <p>Get reminders, insights and quick actions.</p>
              </div>
            </article>

          </div>

        </section>


        {/* ======================================================
            DASHBOARD
        ====================================================== */}

        <section className="dashboard-section">

          <div className="section-label fk-desktop-section-label">
            <img src={dashboardIcon} alt="" aria-hidden="true" />
            <span>Your Family Dashboard</span>
          </div>


          <h2>
            A clear view of your
            <span> family life</span>
          </h2>


          <p className="section-intro">

            Your family’s documents, reminders and essentials
            in one place.

          </p>




          {/* ======================================================
              NEW MOBILE FAMILY DASHBOARD PRESENTATION
              Existing dashboard-points and phone-dashboard below
              are preserved unchanged.
          ====================================================== */}

          <div className="mobile-family-dashboard">

            <div className="mobile-dashboard-preview" aria-hidden="true">
              <div className="mobile-dashboard-preview-inner"></div>
            </div>

            <div className="mobile-dashboard-benefits">

              <div className="mobile-dashboard-benefit">
                <span className="mobile-dashboard-check">
                  <Check />
                </span>
                <span>Quick access to everything</span>
              </div>

              <div className="mobile-dashboard-benefit">
                <span className="mobile-dashboard-check">
                  <Check />
                </span>
                <span>Upcoming renewals and payments</span>
              </div>

              <div className="mobile-dashboard-benefit">
                <span className="mobile-dashboard-check">
                  <Check />
                </span>
                <span>Family-wide visibility (with your permission)</span>
              </div>

              <div className="mobile-dashboard-benefit">
                <span className="mobile-dashboard-check">
                  <Check />
                </span>
                <span>Works across mobile and web</span>
              </div>

            </div>

          </div>


          <div className="dashboard-points">

            <div>
              <Check />
              Quick access to everything
            </div>

            <div>
              <Check />
              Upcoming renewals and payments
            </div>

            <div>
              <Check />
              Family-wide visibility
            </div>

            <div>
              <Check />
              Works across mobile and web
            </div>

          </div>


          {/* PHONE UI */}

          <div className="phone-dashboard">

            <div className="phone-top">

              <div>

                <small>
                  Hello
                </small>

                <strong>
                  My Family
                </strong>

              </div>


              <div className="profile-circle">
                F
              </div>

            </div>


            <div className="dashboard-summary">

              <div>

                <FileText />

                <strong>
                  12
                </strong>

                <small>
                  Documents
                </small>

              </div>


              <div>

                <Bell />

                <strong>
                  04
                </strong>

                <small>
                  Reminders
                </small>

              </div>


              <div>

                <Users />

                <strong>
                  05
                </strong>

                <small>
                  Members
                </small>

              </div>

            </div>


            <h4>
              Upcoming
            </h4>


            <div className="mini-card">

              <div className="mini-icon">
                <ReceiptText />
              </div>

              <div>

                <strong>
                  Electricity Bill
                </strong>

                <small>
                  Due today
                </small>

              </div>

              <ArrowRight size={17} />

            </div>


            <div className="mini-card">

              <div className="mini-icon">
                <FileText />
              </div>

              <div>

                <strong>
                  Passport
                </strong>

                <small>
                  Document update
                </small>

              </div>

              <ArrowRight size={17} />

            </div>

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
                <span>Active updates for<br />Nominee’s</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-warranty">
                <img className="smart-reminder-chip-image" src={heroShieldImage} alt="" />
                <span>Warranties and<br />Service Reminders</span>
                <Check className="smart-chip-check" />
              </div>

              <div className="smart-reminder-chip smart-chip-find">
                <img className="smart-reminder-chip-image" src={fileImage} alt="" />
                <span>Find Documents easy</span>
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
              EMI's and Bill Payments
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
                AI Powered Tracker
              </h2>

              <p>
                We update you everytime
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

        <section
          className="security-section"
          id="security"
        >

          <div className="section-label">
            Security
          </div>


          <h2>
            Your family’s data stays
            <span> private and secure</span>
          </h2>


          <div className="security-grid">

            <div className="security-card">

              <div className="security-icon">
                <LockKeyhole />
              </div>

              <h3>
                AES-256 Encryption
              </h3>

              <p>
                Strong protection for your family data.
              </p>

            </div>


            <div className="security-card">

              <div className="security-icon security-reference-icon" aria-hidden="true">
                <svg className="security-location-svg" viewBox="0 0 48 48">
                  <path d="M24 42s13-12.1 13-24A13 13 0 0 0 11 18c0 11.9 13 24 13 24Z" />
                  <circle cx="24" cy="18" r="5.2" />
                </svg>
              </div>

              <h3>
                India data residency
              </h3>

              <p>
                Your data is stored in AWS India regions.
              </p>

            </div>


            <div className="security-card">

              <div className="security-icon security-reference-icon" aria-hidden="true">
                <img
                  src={noAiTrainingIcon}
                  alt=""
                  className="security-no-ai-training-icon"
                />
              </div>

              <h3>
                No AI Training
              </h3>

              <p>
                Your personal data is never used to train public AI models.
              </p>

            </div>


            <div className="security-card">

              <div className="security-icon">
                <Users />
              </div>

              <h3>
                Your control
              </h3>

              <p>
                Only you and the people you authorize can access your family information.
              </p>

            </div>

          </div>

        </section>


        {/* ======================================================
            FAQ
        ====================================================== */}

        <section className="faq-section">

          <div className="section-label">
            Frequently Asked Questions
          </div>


          <h2>
            Have questions?
            <span> We have answers.</span>
          </h2>


          <div className="faq-list">

            {faqs.map((faq, index) => (

              <div
                className={
                  `faq-item ${
                    openFaq === index ? "faq-open" : ""
                  }`
                }
                key={faq.question}
              >

                <button
                  className="faq-question"
                  onClick={() => toggleFaq(index)}
                >

                  <span>
                    {faq.question}
                  </span>

                  <ChevronDown />

                </button>


                {openFaq === index && (

                  <div className="faq-answer">
                    {faq.answer}
                  </div>

                )}

              </div>

            ))}

          </div>

        </section>


        {/* ======================================================
            GET STARTED
        ====================================================== */}

        <section className="early-access">

          <div className="cta-decoration cta-decoration-one" />
          <div className="cta-decoration cta-decoration-two" />


          <span className="cta-small">
            Be Among the First
          </span>


          <h2>
            Be Among the First to Experience 
            <strong> FamilyKit</strong>
          </h2>


          <p>

            Join our early access program and help shape
            the future of family life management.

          </p>


          <button>

            Get Early Access

            <ChevronRight className="cta-chevron" />

          </button>

          <img
            src={earlyAccessPhone}
            alt="FamilyKit mobile app"
            className="early-access-phone"
          />

        </section>

      </main>


      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="footer">

        <div className="footer-brand">

          <div className="brand">

            <div className="brand-mark">

              <img
                src={familyKitLogo}
                alt="FamilyKit"
                className="brand-icon-image"
              />

            </div>

            <span className="footer-brand-name">
              FamilyKit
            </span>

          </div>


          <p>
            A Medhaara Innovations product
          </p>

          <div className="footer-address">
            <span>Office Address:</span>
            <span>Street address, City, District, State, Pincode</span>
          </div>

                  <div className="footer-socials">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="LinkedIn"><FaLinkedinIn /></a>
            <a href="#" aria-label="X"><FaXTwitter /></a>
          </div>

</div>


        <div className="footer-links">

          <div className="footer-link-column">
            <a href="#home">About</a>
            <a href="#security">Privacy</a>
            <a href="#home">Terms</a>
            <a href="#home">Contact</a>
          </div>

          <div className="footer-link-column">
            <a href="#home">About</a>
            <a href="#security">Privacy</a>
            <a href="#home">Terms</a>
            <a href="#home">Contact</a>
          </div>

          <div className="footer-link-column">
            <a href="#home">About</a>
            <a href="#security">Privacy</a>
            <a href="#home">Terms</a>
            <a href="#home">Contact</a>
          </div>

        </div>


        <div className="footer-bottom">
          © 2026 FamilyKit. All rights reserved.
        </div>

      </footer>

    </div>
    </>
  );
}

export default App;
