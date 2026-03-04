function secondsToHuman(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return "instant";
  const units = [
    ["years", 60 * 60 * 24 * 365],
    ["days", 60 * 60 * 24],
    ["hours", 60 * 60],
    ["minutes", 60],
    ["seconds", 1]
  ];
  for (const [name, size] of units) {
    const v = seconds / size;
    if (v >= 1) return `${Math.round(v)} ${name}`;
  }
  return "instant";
}

export function estimateCrackTime(strength) {
  const { charsetSize, length } = strength;
  if (charsetSize === 0 || length === 0) {
    return { online: "instant", offline: "instant" };
  }

  const log2Keyspace = length * Math.log2(charsetSize);
  const expectedGuessesLog2 = log2Keyspace - 1;

  const onlineGuessesPerSec = 0.17; // ~10/min
  const offlineGuessesPerSec = 1e8; // demo assumption

  const onlineSeconds = Math.pow(2, expectedGuessesLog2) / onlineGuessesPerSec;
  const offlineSeconds = Math.pow(2, expectedGuessesLog2) / offlineGuessesPerSec;

  return {
    online: secondsToHuman(onlineSeconds),
    offline: secondsToHuman(offlineSeconds)
  };
}