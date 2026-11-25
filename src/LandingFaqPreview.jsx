import { ChevronDown } from "lucide-react";
import "./LandingFaqPreview.css";

const questions = [
  ["What is FamilyKit?",
    "FamilyKit is your family's intelligent digital organizer. Keep important documents, family profiles, health records, contacts, finances, insurance, events and reminders together in one secure place. Find what you need in seconds and share selected information with the family members you choose."],
  ["Who can see my documents and personal information?",
    "Your information stays private unless you choose to share it. You decide which family members can access specific records and can remove their access whenever you wish. Each registered user has their own secure account, and sharing selected information does not mean sharing your entire account."],
  ["Does FamilyKit AI decide what is correct?",
    "No. FamilyKit AI helps you understand, organize and find information. It can suggest details extracted from documents, but you review and confirm them. You always remain in control of your family's information."],
  ["Where is my family's information stored?",
    "Your family's records and documents are stored securely using Amazon Web Services (AWS), with data storage located in India. Your information is protected through encryption and access controls. We never sell your personal information, and your private records are not used to train general-purpose AI models.",
    "Read more in our Privacy Policy."],
  ["Will FamilyKit remind me before important dates?",
    "Yes. FamilyKit helps you remember insurance renewals, bill payments, document expiries, appointments and important family events. You can review and confirm dates before reminders are created. Authorized family members can also receive reminders for information shared with them."],
  ["I joined the Founding Families Program through WhatsApp. How do I sign in?",
    "Joining the Founding Families Program reserves your place for early access. We'll notify you through WhatsApp when FamilyKit launches. You can then register using your email address, verify it with a one-time password (OTP), and create your secure four-digit PIN for future sign-ins."],
  ["What does FamilyKit cost for the first 100 families?",
    <>The first 100 Founding Families receive <strong>12 months of free FamilyKit access for both spouses</strong>, starting when FamilyKit becomes available to their family.</>,
    <>After the free year, Founding Families enjoy an <strong>exclusive 50% discount on the regular annual subscription, every year</strong>.</>,
    "We'll inform you of the subscription price before your free period ends. Renewal is entirely your choice, with no automatic charges.",
    "If you don't renew, your FamilyKit access will be suspended until you renew your subscription."],
  ["Can I delete my FamilyKit account and personal information?",
    "Yes. You can request deletion of your FamilyKit account and associated personal information. Access you've granted to others will be revoked, while copies they previously downloaded may remain with them.",
    "Applicable backup retention periods and any legally required retention will be explained in our Privacy Policy."],
  ["Can I download my records? What happens if I don't renew?",
    "Yes. While your subscription is active, you can download your documents and obtain copies of the records you've added.",
    "If your subscription expires, access to your family records will be suspended. Your stored information will be retained according to our data retention policy.",
    "Once you successfully renew your subscription, access to your retained records will be restored."],
  ["What happens to someone's FamilyKit records if they pass away?",
    "Records that a person previously shared remain available to authorized family members, subject to applicable access permissions and subscription status.",
    "Private records are not automatically opened to others. Any additional access must follow the account holder's authorized arrangements or a valid legal process.",
    "FamilyKit is designed to help families preserve important information while respecting each person's privacy and wishes."],
];

export default function LandingFaqPreview() {
  return (
    <section id="faq" className="fk-preview-faq" aria-labelledby="fk-preview-faq-title">
      <p className="fk-preview-how-badge">FAQ</p>
      <h2 id="fk-preview-faq-title">Questions families ask</h2>
      <div className="fk-preview-faq-list">
        {questions.map(([question, ...paragraphs], index) => (
          <details key={question} name="fk-preview-faq" open={index === 0}>
            <summary>{question}<ChevronDown size={20} aria-hidden="true" /></summary>
            {paragraphs.map((paragraph, position) => <p key={position}>{paragraph}</p>)}
          </details>
        ))}
      </div>
    </section>
  );
}
