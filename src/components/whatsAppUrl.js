export function getWhatsAppUrl(mobile) {
  const value = String(mobile ?? "").trim();
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  const number = !value.startsWith("+") && digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${number}`;
}
