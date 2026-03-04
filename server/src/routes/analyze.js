import { detectPatterns } from "../lib/patterns.js";
import { Router } from "express";
import { analyzeStrength } from "../lib/strength.js";
import { dictionaryAttackSim } from "../lib/dictionary.js";
import { estimateCrackTime } from "../lib/estimates.js";

const router = Router();

router.post("/", async (req, res) => {
  const password = (req.body?.password ?? "").toString();

  if (!password || password.length > 128) {
    return res.status(400).json({ error: "Password is required (max 128 chars)." });
  }

  const strength = analyzeStrength(password);
  const dict = await dictionaryAttackSim(password);
  const time = estimateCrackTime(strength);
  const patterns = detectPatterns(password);

  // Score adjustments
  let score = strength.score;
  if (dict.found) score = Math.max(0, score - 35);

  const verdict =
    score >= 80 ? "Strong" :
    score >= 60 ? "Good" :
    score >= 40 ? "Weak" : "Very Weak";

  const recommendations = [];
  if (password.length < 14) recommendations.push("Increase length to 14+ characters");
  if (dict.found) recommendations.push("Avoid common words and predictable substitutions");
  if (!strength.hasSymbols) recommendations.push("Add symbols (avoid obvious patterns like ! at the end)");
  if (!strength.hasUpper || !strength.hasLower) recommendations.push("Mix upper + lower case");
  if (!strength.hasDigits) recommendations.push("Add digits (not only at the end)");

  res.json({
    ...strength,
    score,
    verdict,
    dictionary: dict,
    estimatedCrackTime: time,
    recommendations,
    patterns
  });
});

export default router;