export const atmCashDatabase: Record<string, number> = {
  "Axis Bank ATM": 82,
  "ICICI Bank ATM": 68,
  "HDFC Bank ATM": 74,
  "Kotak Mahindra ATM": 58,
  "Punjab National Bank ATM": 63,
  "Yes Bank ATM": 71,
  "State Bank of India ATM": 79,
  "Bank of Baroda ATM": 61,
  "Canara Bank ATM": 66,
  "Syndicate Bank ATM": 57,
  "Union Bank ATM": 70,
  "IDBI Bank ATM": 60,
};

export function getDummyAtmCashPercent(name: string, fallbackId = 0) {
  const normalizedName = name.trim();

  if (normalizedName && atmCashDatabase[normalizedName] !== undefined) {
    return atmCashDatabase[normalizedName];
  }

  const hash = normalizedName
    .split("")
    .reduce((total, character) => total + character.charCodeAt(0), fallbackId || 0);

  return Math.max(18, Math.min(96, (hash % 62) + 35));
}

export function getCashLevelLabel(percent: number) {
  if (percent >= 75) return "High";
  if (percent >= 50) return "Medium";
  return "Low";
}
