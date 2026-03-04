export function detectPatterns(password) {
  const patterns = [];

  if (/1234|abcd|qwer/i.test(password)) {
    patterns.push("Sequential characters");
  }

  if (/(.)\1{2,}/.test(password)) {
    patterns.push("Repeated characters");
  }

  if (/password|admin|welcome/i.test(password)) {
    patterns.push("Common word");
  }

  if (/\d{4}$/.test(password)) {
    patterns.push("Ends with numbers (possible year)");
  }

  return patterns;
}