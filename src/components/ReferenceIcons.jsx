import home from "../assets/icons/home.png";
import categories from "../assets/icons/categories.png";
import camera from "../assets/icons/camera.png";
import facebook from "../assets/icons/facebook.png";
import instagram from "../assets/icons/instagram.png";
import linkedin from "../assets/icons/linkedin.png";

function Glyph({ asset, size = "1em", style, ...props }) {
  const mask = `url("${asset}") center / contain no-repeat`;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
    {...props} style={{ ...style, mask, WebkitMask: mask, backgroundColor: "currentColor" }} />;
}

function CompanyLogo({ asset, size = "1em", ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <image href={asset} width="24" height="24" />
  </svg>;
}

export const HomeIcon = (props) => <Glyph asset={home} {...props} />;
export const CategoriesIcon = (props) => <Glyph asset={categories} {...props} />;
export const CameraIcon = (props) => <Glyph asset={camera} {...props} />;
export const FacebookLogo = (props) => <CompanyLogo asset={facebook} {...props} />;
export const InstagramLogo = (props) => <CompanyLogo asset={instagram} {...props} />;
export const LinkedInLogo = (props) => <CompanyLogo asset={linkedin} {...props} />;
