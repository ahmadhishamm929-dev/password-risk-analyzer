function analyzeStrength(password) {
  const length = password.length;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigits = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);

  let charsetSize = 0;
  if (hasLower) charsetSize += 26;
  if (hasUpper) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 32;

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
    score,
  };
}

function detectPatterns(password) {
  const patterns = [];
  if (/1234|abcd|qwer/i.test(password)) patterns.push("Sequential characters");
  if (/(.)\1{2,}/.test(password)) patterns.push("Repeated characters");
  if (/password|admin|welcome/i.test(password)) patterns.push("Common word");
  if (/\d{4}$/.test(password)) patterns.push("Ends with numbers (possible year)");
  return patterns;
}

// Small built-in wordlist (you can expand later)
const WORDS = [
  "password",
  "123456",
  "qwerty",
  "admin",
  "letmein",
  "welcome",
  "iloveyou",
  "monkey",
  "dragon",
  "football",
];

function variants(word) {
  const v = new Set();
  v.add(word);
  v.add(word + "1");
  v.add(word + "12");
  v.add(word + "123");
  v.add(word + "2024");
  v.add(word + "2025");
  v.add(word + "2026");
  v.add(word + "!");
  v.add(word + "!1");

  const leet = word
    .replace(/a/g, "@")
    .replace(/o/g, "0")
    .replace(/i/g, "1")
    .replace(/s/g, "$")
    .replace(/e/g, "3");

  v.add(leet);
  v.add(leet + "1");
  v.add(leet + "!");
  return [...v];
}

function dictionaryAttackSim(password) {
  const target = password.toLowerCase();
  let attempts = 0;

  for (const w of WORDS) {
    const base = w.toLowerCase();
    for (const candidate of variants(base)) {
      attempts++;
      if (candidate === target) {
        return {
          found: true,
          matchType: candidate === base ? "exact" : "common-variant",
          matchedWord: w,
          attempts,
        };
      }
    }
  }
  return { found: false, matchType: null, matchedWord: null, attempts };
}

function secondsToHuman(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "instant";

  const units = [
    ["years", 60 * 60 * 24 * 365],
    ["days", 60 * 60 * 24],
    ["hours", 60 * 60],
    ["minutes", 60],
    ["seconds", 1],
  ];

  for (const [name, size] of units) {
    const v = seconds / size;
    if (v >= 1) return `${Math.round(v)} ${name}`;
  }
  return "instant";
}

function estimateCrackTime(strength) {
  const { charsetSize, length } = strength;
  if (!charsetSize || !length) return { online: "instant", offline: "instant" };

  const log2Keyspace = length * Math.log2(charsetSize);
  const expectedGuessesLog2 = log2Keyspace - 1;

  const onlineGuessesPerSec = 0.17; // ~10/min
  const offlineGuessesPerSec = 1e8; // illustrative

  const onlineSeconds = Math.pow(2, expectedGuessesLog2) / onlineGuessesPerSec;
  const offlineSeconds = Math.pow(2, expectedGuessesLog2) / offlineGuessesPerSec;

  return {
    online: secondsToHuman(onlineSeconds),
    offline: secondsToHuman(offlineSeconds),
  };
}

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const password = (body?.password ?? "").toString();

    if (!password || password.length > 128) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
        body: JSON.stringify({ error: "Password is required (max 128 chars)." }),
      };
    }

    const strength = analyzeStrength(password);
    const dict = dictionaryAttackSim(password);
    const patterns = detectPatterns(password);
    const time = estimateCrackTime(strength);

    let score = strength.score;
    if (dict.found) score = Math.max(0, score - 35);

    const verdict =
      score >= 80 ? "Strong" : score >= 60 ? "Good" : score >= 40 ? "Weak" : "Very Weak";

    const recommendations = [];
    if (password.length < 14) recommendations.push("Increase length to 14+ characters");
    if (dict.found) recommendations.push("Avoid common words and predictable substitutions");
    if (!strength.hasSymbols) recommendations.push("Add symbols (avoid obvious patterns like ! at the end)");
    if (!strength.hasUpper || !strength.hasLower) recommendations.push("Mix upper + lower case");
    if (!strength.hasDigits) recommendations.push("Add digits (not only at the end)");

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({
        ...strength,
        score,
        verdict,
        dictionary: dict,
        estimatedCrackTime: time,
        recommendations,
        patterns,
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
        "access-control-allow-origin": "*",
      },
      body: JSON.stringify({ error: "Server error", details: err?.message }),
    };
  }
};