import fs from "fs/promises";
import path from "path";

let cachedWords = null;

async function loadWordlist() {
  if (cachedWords) return cachedWords;
  const filePath = path.resolve("src/data/wordlist.txt");
  const raw = await fs.readFile(filePath, "utf-8");
  cachedWords = raw
    .split("\n")
    .map(w => w.trim())
    .filter(Boolean)
    .slice(0, 5000);
  return cachedWords;
}

function normalize(s) {
  return s.toLowerCase();
}

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

export async function dictionaryAttackSim(password) {
  const words = await loadWordlist();
  const target = normalize(password);

  let attempts = 0;

  for (const w of words) {
    for (const candidate of variants(normalize(w))) {
      attempts++;
      if (candidate === target) {
        return {
          found: true,
          matchType: candidate === normalize(w) ? "exact" : "common-variant",
          matchedWord: w,
          attempts
        };
      }
    }
  }

  return { found: false, matchType: null, matchedWord: null, attempts };
}