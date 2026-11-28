import "./IndianMobileField.css";

export default function IndianMobileField({ id, value, onChange, disabled }) {
  return <div className="fk-indian-mobile">
    <span aria-hidden="true">+91</span>
    <input id={id} type="tel" inputMode="numeric" autoComplete="tel-national"
      aria-describedby={`${id}-hint`} value={value} disabled={disabled} placeholder="10-digit mobile number"
      pattern="[0-9]{10}" onChange={(event) => {
        const entered = event.target.value;
        const digits = entered.replace(/[^0-9]/g, "");
        onChange((entered.trim().startsWith("+91") && digits.length > 10 ? digits.slice(2) : digits).slice(0, 10));
      }} />
    <small id={`${id}-hint`}>Enter 10 digits. This number is saved as an unverified profile contact.</small>
  </div>;
}
