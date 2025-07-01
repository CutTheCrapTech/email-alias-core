/**
 * @license MIT
 * @copyright 2025 karteekiitg
 */

import { jest } from "@jest/globals";

describe("crypto.ts", () => {
  const originalGlobalThisCrypto = globalThis.crypto;
  const originalWindowCrypto = globalThis.window?.crypto;
  const originalSelfCrypto = globalThis.self?.crypto;
  const originalGlobalRequire = global.require;

  // Mock SubtleCrypto for testing
  const createMockSubtleCrypto = () => ({
    importKey: jest.fn(),
    sign: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn(),
    generateKey: jest.fn(),
    deriveKey: jest.fn(),
    deriveBits: jest.fn(),
    exportKey: jest.fn(),
    wrapKey: jest.fn(),
    unwrapKey: jest.fn(),
    verify: jest.fn(),
  });

  // Mock getRandomValues for testing
  const createMockGetRandomValues = () =>
    jest.fn().mockImplementation((...args: unknown[]) => {
      const array = args[0] as Uint8Array;
      // Fill with predictable values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = i % 256;
      }
      return array;
    });

  // Create mock crypto with both subtle and getRandomValues
  const createMockCrypto = () => ({
    subtle: createMockSubtleCrypto(),
    getRandomValues: createMockGetRandomValues(),
  });

  beforeEach(() => {
    // Clear module cache for crypto.ts to ensure fresh import in each test
    jest.resetModules();

    // Reset global crypto objects to their original state before each test
    Object.defineProperty(globalThis, "crypto", {
      value: originalGlobalThisCrypto,
      writable: true,
      configurable: true,
    });

    if (globalThis.window) {
      Object.defineProperty(globalThis.window, "crypto", {
        value: originalWindowCrypto,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }

    if (globalThis.self) {
      Object.defineProperty(globalThis.self, "crypto", {
        value: originalSelfCrypto,
        writable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    }

    // Restore original global.require
    global.require = originalGlobalRequire;
  });

  afterAll(() => {
    // Restore original global objects after all tests are done
    Object.defineProperty(globalThis, "crypto", {
      value: originalGlobalThisCrypto,
      writable: true,
      configurable: true,
    });
    if (globalThis.window) {
      Object.defineProperty(globalThis.window, "crypto", {
        value: originalWindowCrypto,
        writable: true,
        configurable: true,
      });
    }
    if (globalThis.self) {
      Object.defineProperty(globalThis.self, "crypto", {
        value: originalSelfCrypto,
        writable: true,
        configurable: true,
      });
    }
    global.require = originalGlobalRequire;
  });

  it("should use globalThis.crypto if available (modern browser/worker environment)", async () => {
    const mockCrypto = createMockCrypto();

    Object.defineProperty(globalThis, "crypto", {
      value: mockCrypto,
      writable: true,
      configurable: true,
    });

    // Ensure other crypto sources are undefined
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "self", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { crypto: importedCrypto } = await import("../crypto.js");
    expect(importedCrypto).toStrictEqual(mockCrypto);
    expect(importedCrypto.subtle).toStrictEqual(mockCrypto.subtle);
    expect(importedCrypto.getRandomValues).toStrictEqual(
      mockCrypto.getRandomValues,
    );
  });

  it("should use window.crypto if globalThis.crypto is not available (older browser)", async () => {
    const mockCrypto = createMockCrypto();

    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { crypto: mockCrypto },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "self", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const { crypto: importedCrypto } = await import("../crypto.js");
    expect(importedCrypto).toStrictEqual(mockCrypto);
    expect(importedCrypto.subtle).toStrictEqual(mockCrypto.subtle);
    expect(importedCrypto.getRandomValues).toStrictEqual(
      mockCrypto.getRandomValues,
    );
  });

  it("should use self.crypto if globalThis.crypto and window.crypto are not available (web worker)", async () => {
    const mockCrypto = createMockCrypto();

    Object.defineProperty(globalThis, "crypto", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(globalThis, "self", {
      value: { crypto: mockCrypto },
      writable: true,
      configurable: true,
    });

    const { crypto: importedCrypto } = await import("../crypto.js");
    expect(importedCrypto).toStrictEqual(mockCrypto);
    expect(importedCrypto.subtle).toStrictEqual(mockCrypto.subtle);
    expect(importedCrypto.getRandomValues).toStrictEqual(
      mockCrypto.getRandomValues,
    );
  });

  it("should use node:crypto.webcrypto in Node.js environment", async () => {
    await jest.isolateModulesAsync(async () => {
      const mockWebCrypto = createMockCrypto();

      // Clear browser/worker crypto APIs
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require function to return node:crypto with webcrypto
      global.require = jest.fn().mockImplementation((module: unknown) => {
        if (module === "node:crypto") {
          return { webcrypto: mockWebCrypto };
        }
        throw new Error(`Module ${module} not found`);
      }) as unknown as NodeJS.Require;

      const { crypto: importedCrypto } = await import("../crypto.js");
      expect(importedCrypto).toStrictEqual(mockWebCrypto);
      expect(global.require).toHaveBeenCalledWith("node:crypto");
    });
  });

  it("should fallback to crypto.webcrypto if node:crypto fails (older Node.js)", async () => {
    await jest.isolateModulesAsync(async () => {
      const mockWebCrypto = createMockCrypto();

      // Clear browser/worker crypto APIs
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require function - node:crypto fails, crypto succeeds
      global.require = jest.fn().mockImplementation((module: unknown) => {
        if (module === "node:crypto") {
          throw new Error("node:crypto not found");
        }
        if (module === "crypto") {
          return { webcrypto: mockWebCrypto };
        }
        throw new Error(`Module ${module} not found`);
      }) as unknown as NodeJS.Require;

      const { crypto: importedCrypto } = await import("../crypto.js");
      expect(importedCrypto).toStrictEqual(mockWebCrypto);
      expect(global.require).toHaveBeenCalledWith("node:crypto");
      expect(global.require).toHaveBeenCalledWith("crypto");
    });
  });

  it("should throw error if Web Crypto API is not available in Node.js (older Node.js without webcrypto)", async () => {
    await jest.isolateModulesAsync(async () => {
      // Clear browser/worker crypto APIs
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require function - both modules exist but don't have webcrypto
      global.require = jest.fn().mockImplementation((module: unknown) => {
        if (module === "node:crypto") {
          throw new Error("node:crypto not found");
        }
        if (module === "crypto") {
          return {}; // Simulate crypto module without webcrypto
        }
        throw new Error(`Module ${module} not found`);
      }) as unknown as NodeJS.Require;

      await expect(import("../crypto.js")).rejects.toThrow(
        "Web Crypto API not available. Node.js 16+ required.",
      );
    });
  });

  it("should throw error if require fails entirely in Node.js environment", async () => {
    await jest.isolateModulesAsync(async () => {
      // Clear browser/worker crypto APIs
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require function to always throw
      global.require = jest.fn().mockImplementation((module: unknown) => {
        throw new Error(`Cannot require module ${module}`);
      }) as unknown as NodeJS.Require;

      await expect(import("../crypto.js")).rejects.toThrow(
        "Crypto API not available in this environment",
      );
    });
  });

  it("should throw error if no crypto API is available in any environment", async () => {
    await jest.isolateModulesAsync(async () => {
      // Clear all crypto APIs
      Object.defineProperty(globalThis, "crypto", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require to fail to simulate non-Node.js environment
      global.require = jest.fn().mockImplementation(() => {
        throw new Error("require is not defined");
      }) as unknown as NodeJS.Require;

      await expect(import("../crypto.js")).rejects.toThrow(
        "Crypto API not available in this environment",
      );
    });
  });

  it("should reject crypto objects without subtle property", async () => {
    await jest.isolateModulesAsync(async () => {
      // Set globalThis.crypto without subtle
      Object.defineProperty(globalThis, "crypto", {
        value: {}, // No subtle property
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require to fail
      global.require = jest.fn().mockImplementation(() => {
        throw new Error("No crypto module");
      }) as unknown as NodeJS.Require;

      await expect(import("../crypto.js")).rejects.toThrow(
        "Crypto API not available in this environment",
      );
    });
  });

  it("should reject crypto objects without getRandomValues property", async () => {
    await jest.isolateModulesAsync(async () => {
      // Set globalThis.crypto with subtle but without getRandomValues
      Object.defineProperty(globalThis, "crypto", {
        value: { subtle: createMockSubtleCrypto() }, // No getRandomValues property
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      Object.defineProperty(globalThis, "self", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Mock require to fail
      global.require = jest.fn().mockImplementation(() => {
        throw new Error("No crypto module");
      }) as unknown as NodeJS.Require;

      await expect(import("../crypto.js")).rejects.toThrow(
        "Crypto API not available in this environment",
      );
    });
  });
});
