import { Link } from "react-router-dom";
import familyKitLogo from "../assets/images/6be23a39-2441-4cce-a9c9-073707f549ff.png";

export default function AuthBrandLink({ className = "" }) {
  return (
    <Link to="/" className={`fk-auth-brand ${className}`} aria-label="FamilyKit home">
      <img src={familyKitLogo} alt="" />
      FamilyKit
    </Link>
  );
}
