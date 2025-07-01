/**
 * Universal crypto setup for browser extensions, Cloudflare Workers, and Node.js
 * @internal
 */

// Type definition for crypto interface
interface CryptoInterface {
  subtle: SubtleCrypto;
  getRandomValues: (array: Uint8Array) => Uint8Array;
}

/**
 * Gets the appropriate crypto implementation based on the environment
 * @internal
 */
function getCrypto(): CryptoInterface {
  // Browser extensions, modern browsers, and Cloudflare Workers
  if (
    typeof globalThis !== "undefined" &&
    globalThis.crypto?.subtle &&
    typeof globalThis.crypto?.getRandomValues === "function"
  ) {
    return globalThis.crypto as CryptoInterface;
  }

  // Older browsers fallback
  if (
    typeof window !== "undefined" &&
    window.crypto?.subtle &&
    typeof window.crypto?.getRandomValues === "function"
  ) {
    return window.crypto as CryptoInterface;
  }

  // Web Workers fallback
  if (
    typeof self !== "undefined" &&
    self.crypto?.subtle &&
    typeof self.crypto?.getRandomValues === "function"
  ) {
    return self.crypto as CryptoInterface;
  }

  // Node.js environment detection
  if (typeof global !== "undefined" && typeof require !== "undefined") {
    try {
      // Try modern Node.js (16+) with node:crypto
      const nodeCrypto = require("node:crypto");
      if (
        nodeCrypto.webcrypto?.subtle &&
        typeof nodeCrypto.webcrypto?.getRandomValues === "function"
      ) {
        return nodeCrypto.webcrypto as CryptoInterface;
      }
    } catch {
      // Fallback for older Node.js versions or when node:crypto is not available
      try {
        // biome-ignore lint/style/useNodejsImportProtocol: Intentional fallback for older Node.js versions
        const crypto = require("crypto");
        if (
          crypto.webcrypto?.subtle &&
          typeof crypto.webcrypto?.getRandomValues === "function"
        ) {
          return crypto.webcrypto as CryptoInterface;
        }
        // If webcrypto is not available in the crypto module
        throw new Error("Web Crypto API not available. Node.js 16+ required.");
      } catch (fallbackError) {
        // If require("crypto") fails entirely
        if (
          fallbackError instanceof Error &&
          fallbackError.message.includes("Web Crypto API not available")
        ) {
          throw fallbackError;
        }
        throw new Error("Crypto API not available in this environment");
      }
    }
  }

  throw new Error("Crypto API not available in this environment");
}

// Export the crypto instance
export const crypto = getCrypto();
