export function maskVin(vin: string): string {
  if (!vin || vin.length < 4) return "****";
  return "*".repeat(vin.length - 4) + vin.slice(-4);
}

export function maskBankAccount(account: string): string {
  const digits = account.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return "*".repeat(digits.length - 4) + digits.slice(-4);
}

export function maskPii(value: string, type: "vin" | "bank"): string {
  if (type === "vin") return maskVin(value);
  if (type === "bank") return maskBankAccount(value);
  return value;
}
