export interface PasswordStrengthResult {
  score: number;
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  percent: number;
  checks: {
    length: boolean;
    lowercase: boolean;
    uppercase: boolean;
    number: boolean;
    special: boolean;
  };
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const score = [
    checks.length,
    checks.lowercase,
    checks.uppercase,
    checks.number,
    checks.special,
  ].filter(Boolean).length;

  const labels: PasswordStrengthResult["label"][] = [
    "Too weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  return {
    score,
    label: password.length === 0 ? "Too weak" : labels[Math.max(0, score - 1)]!,
    percent: password.length === 0 ? 0 : (score / 5) * 100,
    checks,
  };
}
