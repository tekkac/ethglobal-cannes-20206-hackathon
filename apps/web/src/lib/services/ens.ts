import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet } from "viem/chains";
import { normalize } from "viem/ens";

type EnsProfile = {
  name: string | null;
  avatar: string | null;
};

let _client: PublicClient | null = null;
function getClient() {
  if (!_client) {
    _client = createPublicClient({ chain: mainnet, transport: http() });
  }
  return _client;
}

// In-memory cache to avoid repeated RPC calls for the same address
const cache = new Map<string, { profile: EnsProfile; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function shorten(address: string) {
  const value = address.trim();
  if (value.length <= 10) return value;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function hashSeed(value: string) {
  let hash = 0;
  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) % 3600;
  }
  return hash;
}

function buildAvatarDataUrl(address: string) {
  const trimmed = address.trim().toLowerCase();
  const hue = hashSeed(trimmed) % 360;
  const accentHue = (hue + 42) % 360;
  const initials = trimmed.slice(2, 4).toUpperCase() || "AD";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" fill="none">
      <defs>
        <linearGradient id="bg" x1="14" y1="8" x2="82" y2="88" gradientUnits="userSpaceOnUse">
          <stop stop-color="hsl(${hue} 72% 56%)" />
          <stop offset="1" stop-color="hsl(${accentHue} 78% 42%)" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="28" fill="url(#bg)" />
      <circle cx="72" cy="24" r="12" fill="rgba(255,255,255,0.18)" />
      <circle cx="28" cy="74" r="20" fill="rgba(8,12,18,0.18)" />
      <text
        x="48"
        y="56"
        text-anchor="middle"
        font-family="ui-sans-serif, system-ui, sans-serif"
        font-size="28"
        font-weight="700"
        fill="rgba(255,255,255,0.94)"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function resolveEnsProfile(address: string): Promise<EnsProfile> {
  const trimmed = address.trim().toLowerCase() as `0x${string}`;

  if (!trimmed) {
    return { name: null, avatar: null };
  }

  const cached = cache.get(trimmed);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.profile;
  }

  try {
    const ensName = await getClient().getEnsName({ address: trimmed });

    if (!ensName) {
      // No ENS name — use generated fallback
      const profile: EnsProfile = {
        name: `arena-${shorten(trimmed)}`,
        avatar: buildAvatarDataUrl(trimmed),
      };
      cache.set(trimmed, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
      return profile;
    }

    let avatar: string | null = null;
    try {
      avatar = await getClient().getEnsAvatar({ name: normalize(ensName) });
    } catch {
      // Avatar resolution can fail — fall back to generated
    }

    const profile: EnsProfile = {
      name: ensName,
      avatar: avatar ?? buildAvatarDataUrl(trimmed),
    };
    cache.set(trimmed, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    return profile;
  } catch {
    // RPC failure — use generated fallback so the app doesn't break
    const profile: EnsProfile = {
      name: `arena-${shorten(trimmed)}`,
      avatar: buildAvatarDataUrl(trimmed),
    };
    cache.set(trimmed, { profile, expiresAt: Date.now() + CACHE_TTL_MS });
    return profile;
  }
}
