export function shortenAddress(
  address: string | null | undefined,
  n: number = 3,
): string {
  return address
    ? `${address?.slice(0, n + 2)}...${address?.slice(-n - 1)}`
    : "";
}

export function colorToString(color: number) {
  return `#${color.toString(16).padStart(6, "0")}`;
}

export function stringToColor(color: string) {
  return parseInt(color.replace("#", "0x"));
}
