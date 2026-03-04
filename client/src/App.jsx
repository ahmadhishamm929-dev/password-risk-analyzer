import { useMemo, useState } from "react";
import "./App.css";

function prettyTime(s) {
  if (!s) return "—";
  const str = String(s);

  // If it contains scientific notation like 3.4e+24
  if (/e\+?\d+/i.test(str)) return "Very long";

  // If it’s too long, shorten it
  if (str.length > 18) return "Very long";

  return str;
}

export default function App() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);

  function generateStrongPassword(length = 16) {
    // Avoid ambiguous chars (optional): O/0, l/1
    const lower = "abcdefghijkmnopqrstuvwxyz";
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const digits = "23456789";
    const symbols = "!@#$%^&*()-_=+[]{};:,.?";

    const all = lower + upper + digits + symbols;

    // Ensure at least 1 of each category
    const pick = (s) => s[Math.floor(Math.random() * s.length)];
    const chars = [pick(lower), pick(upper), pick(digits), pick(symbols)];

    for (let i = chars.length; i < length; i++) chars.push(pick(all));

    // Shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join("");
  }

  async function copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  async function analyze(e) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!password) {
      setError("Enter a password first.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");

      setResult(data);
    } catch (err) {
      setError(err?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const ui = useMemo(() => {
    if (!result) {
      return { band: "neutral", color: "var(--neutral-500)", label: "—", emoji: "" };
    }
    const s = result.score ?? 0;
    if (s >= 80) return { band: "good", color: "var(--good)", label: "Strong", emoji: "🟢" };
    if (s >= 60) return { band: "ok", color: "var(--ok)", label: "Good", emoji: "🟡" };
    if (s >= 40) return { band: "warn", color: "var(--warn)", label: "Weak", emoji: "🟠" };
    return { band: "bad", color: "var(--bad)", label: "Very Weak", emoji: "🔴" };
  }, [result]);

  const score = result?.score ?? 0;

  return (
    <div className="bg">
      <div className="grid">
        {/* Left */}
        <section className="hero">
          <div className="badge">Cybersecurity • Web</div>

          <h1 className="title">
            Password <span className="titleAccent">Risk</span> Analyzer
          </h1>

          <p className="subtitle">
            Educational simulator that highlights weak-password patterns, estimates crack time, and suggests fixes.
            Passwords are analyzed in memory and are not stored.
          </p>

          <div className="heroCard">
            <form onSubmit={analyze} className="form">
              <div className="field">
                <label className="label">Password</label>

                <div className="inputRow">
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Type a password to analyze…"
                    autoComplete="off"
                    spellCheck={false}
                  />

                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => {
                      const p = generateStrongPassword(16);
                      setPassword(p);
                      setResult(null);
                      setError("");
                    }}
                    title="Generate a strong password"
                  >
                    Generate
                  </button>

                  <button
                    type="button"
                    className="btnGhost"
                    onClick={() => password && copyToClipboard(password)}
                    disabled={!password}
                    title="Copy current password"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>

                  <button type="submit" className="btn" disabled={loading}>
                    {loading ? <span className="spinner" /> : null}
                    {loading ? "Analyzing" : "Analyze"}
                  </button>
                </div>

                <div className="hintRow">
                  <span className="hint">Try “password123”, then click Generate.</span>
                  <span className="pill">{result ? `${score}/100` : "Ready"}</span>
                </div>
              </div>

              {error ? <div className="alert">{error}</div> : null}
            </form>
          </div>

          <div className="heroStats">
            <MiniStat label="Checks" value="Entropy • Dictionary • Patterns" />
            <MiniStat label="Output" value="Risk • Time • Recommendations" />
            <MiniStat label="Bonus" value="Generate + Copy" />
          </div>
        </section>

        {/* Right */}
        <section className="panel">
          <div className="panelHeader">
            <div>
              <div className="panelKicker">Results</div>
              <div className="panelTitle">
                {result ? (
                  <>
                    {result.verdict} <span className="emoji">{ui.emoji}</span>{" "}
                    <span className="muted">(Score {score}/100)</span>
                  </>
                ) : (
                  "No analysis yet"
                )}
              </div>
            </div>

            <div className="chipRow">
              <Chip tone={ui.band} text={ui.label} />
              <Chip
                tone={result?.dictionary?.found ? "bad" : "good"}
                text={result ? (result.dictionary?.found ? "Dictionary hit" : "No dict hit") : "—"}
              />
              <Chip
                tone={result?.hasSymbols ? "good" : "warn"}
                text={result ? (result.hasSymbols ? "Has symbols" : "No symbols") : "—"}
              />
            </div>
          </div>

          <div className="meter">
            <div className="meterTop">
              <span className="meterLabel">Risk meter</span>
              <span className="meterValue" style={{ color: ui.color }}>
                {ui.label}
              </span>
            </div>
            <div className="meterBar">
              <div
                className="meterFill"
                style={{
                  width: `${Math.max(0, Math.min(100, score))}%`,
                  background: ui.color,
                }}
              />
            </div>
            <div className="meterLegend">
              <span>Very Weak</span>
              <span>Weak</span>
              <span>Good</span>
              <span>Strong</span>
            </div>
          </div>

          <div className="cards">
            <Card title="Password stats" subtitle="Core metrics used to estimate risk">
              <div className="kvGrid">
                <KV label="Length" value={result?.length ?? "—"} />
                <KV label="Charset size" value={result?.charsetSize ?? "—"} />
                <KV label="Entropy (bits)" value={result?.entropyBits ?? "—"} />
                <KV label="Symbols" value={result ? (result.hasSymbols ? "Yes" : "No") : "—"} />
                <KV label="Uppercase" value={result ? (result.hasUpper ? "Yes" : "No") : "—"} />
                <KV label="Digits" value={result ? (result.hasDigits ? "Yes" : "No") : "—"} />
              </div>
            </Card>

            <Card title="Crack-time estimate" subtitle="Online vs offline guessing models">
              <div className="twoCol">
                <TimeCard
  label="Online"
  desc="Rate-limited login attempts"
  value={prettyTime(result?.estimatedCrackTime?.online)}
/>

<TimeCard
  label="Offline"
  desc="Leaked hash guessing"
  value={prettyTime(result?.estimatedCrackTime?.offline)}
/>
              </div>
              <div className="note">
                Educational estimates. Real cracking speed depends on hashing algorithm, hardware, and rate limits.
              </div>
            </Card>

            <Card title="Dictionary simulation" subtitle="Common wordlist + predictable variants">
              {!result ? (
                <Muted>Run an analysis to see dictionary results.</Muted>
              ) : result.dictionary?.found ? (
                <div className="dictHit">
                  <div className="dictIcon">⚠️</div>
                  <div>
                    <div className="dictTitle">
                      Match: <b>{result.dictionary.matchType}</b>
                    </div>
                    <div className="dictText">
                      Base word: <b>{result.dictionary.matchedWord}</b> • Attempts: ~{result.dictionary.attempts}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="dictOk">
                  <div className="dictIcon ok">✅</div>
                  <div>
                    <div className="dictTitle">Not found in wordlist</div>
                    <div className="dictText">Still consider length + randomness to resist brute force.</div>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Detected patterns" subtitle="Patterns that reduce password security">
              {!result ? (
                <Muted>Run an analysis to see detected patterns.</Muted>
              ) : result.patterns?.length ? (
                <div className="tags">
                  {result.patterns.map((p, i) => (
                    <span className="tag" key={i}>{p}</span>
                  ))}
                </div>
              ) : (
                <div className="tags">
                  <span className="tag good">No obvious patterns detected</span>
                </div>
              )}
            </Card>

            <Card title="Recommendations" subtitle="Practical upgrades to improve security">
              {!result ? (
                <Muted>Run an analysis to get recommendations.</Muted>
              ) : (
                <ul className="list">
                  {result.recommendations?.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <footer className="footer">
            <span>Built for portfolio • React + Express</span>
            <span className="sep">•</span>
            <span>Educational use only</span>
          </footer>
        </section>
      </div>
    </div>
  );
}

function Chip({ tone = "neutral", text }) {
  return <span className={`chip ${tone}`}>{text}</span>;
}
function MiniStat({ label, value }) {
  return (
    <div className="miniStat">
      <div className="miniLabel">{label}</div>
      <div className="miniValue">{value}</div>
    </div>
  );
}
function Card({ title, subtitle, children }) {
  return (
    <div className="card">
      <div className="cardTop">
        <div className="cardTitle">{title}</div>
        <div className="cardSub">{subtitle}</div>
      </div>
      <div className="cardBody">{children}</div>
    </div>
  );
}
function KV({ label, value }) {
  return (
    <div className="kv">
      <div className="kvLabel">{label}</div>
      <div className="kvValue">{value}</div>
    </div>
  );
}
function TimeCard({ label, desc, value }) {
  return (
    <div className="timeCard">
      <div className="timeTop">
        <span className="timeLabel">{label}</span>
        <span className="timeValue">{value}</span>
      </div>
      <div className="timeDesc">{desc}</div>
    </div>
  );
}
function Muted({ children }) {
  return <div className="mutedBlock">{children}</div>;
}