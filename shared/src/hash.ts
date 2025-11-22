import { keccak256, toHex, stringToBytes } from "viem";
import type { PostPayload } from "./types";

export function serializePayload(payload: PostPayload): string {
  // TODO: replace with canonical serialization (e.g. EIP-712 or RLP) for production
  // For now we rely on JSON.stringify with shallow key order.
  return JSON.stringify(payload);
}

export function hashPayload(payload: PostPayload): `0x${string}` {
  const serialized = serializePayload(payload);
  const hexData = toHex(stringToBytes(serialized));
  return keccak256(hexData);
}


