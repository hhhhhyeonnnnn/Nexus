/** Preserve browser preferences and voting identity across the service rename. */
export function readBrandStorage(key: "preview_role" | "voter_id" | "my_votes"): string | null {
  const storageKey = `all-in_${key}`;
  const current = localStorage.getItem(storageKey);
  if (current !== null) return current;

  const legacyKey = `nexus_${key}`;
  const legacy = localStorage.getItem(legacyKey);
  if (legacy !== null) {
    localStorage.setItem(storageKey, legacy);
    localStorage.removeItem(legacyKey);
  }
  return legacy;
}
