export function capitalize(str: string) {
  if (!str || typeof str !== "string") {
    return "";
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function isAlphanumeric(str: string) {
  return /^[a-z0-9]+$/.test(str.toLowerCase());
}

export function stringModulus(str: string, modValue: number) {
  const hash = Array.from(str).reduce(
    (hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0,
    0
  );
  return Math.abs(hash) % modValue;
}
