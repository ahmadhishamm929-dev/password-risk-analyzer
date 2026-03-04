export function analyzeStrength(password) {
  const length = password.length;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 32; // rough bucket

  const entropyBits = charsetSize > 0 ? length * Math.log2(charsetSize) : 0;

  let score = 0;
  score += Math.min(60, length * 4);
  score += hasLower ? 8 : 0;
  score += hasUpper ? 8 : 0;
  score += hasDigits ? 8 : 0;
  score += hasSymbols ? 8 : 0;

  if (/^[a-zA-Z]+$/.test(password)) score -= 10;
  if (/^[0-9]+$/.test(password)) score -= 20;
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/1234|abcd|qwer/i.test(password)) score -= 10;

  score = Math.max(0, Math.min(100, score));

  return {
    length,
    charsetSize,
    entropyBits: Number(entropyBits.toFixed(1)),
    hasLower,
    hasUpper,
    hasDigits,
    hasSymbols,
    score
  };
}