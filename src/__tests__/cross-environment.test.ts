/**
 * @license MIT
 * @copyright 2025 karteekiitg
 */

import { generateEmailAlias, validateEmailAlias } from "../index.js";

/**
 * Cross-environment consistency tests for email alias generation and validation.
 * These tests ensure that the same inputs produce the same outputs regardless
 * of whether the code runs in Node.js, Cloudflare Workers, or browser extensions.
 */
describe("Cross-Environment Consistency", () => {
  const secretKey = "test-secret-key-for-consistency-testing";
  const domain = "test.example.com";
  const testCases = [
    { aliasParts: ["service", "provider"], hashLength: 8 },
    { aliasParts: ["shop", "amazon", "electronics"], hashLength: 12 },
    { aliasParts: ["news", "newsletter", "tech"], hashLength: 6 },
    { aliasParts: ["social", "twitter"], hashLength: 16 },
    { aliasParts: ["work", "github", "notifications"], hashLength: 10 },
  ];

  describe("generateEmailAlias consistency", () => {
    it.each(testCases)(
      "should generate consistent results for aliasParts: %j",
      async ({ aliasParts, hashLength }) => {
        // Generate the same alias multiple times to ensure deterministic behavior
        const alias1 = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        const alias2 = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        const alias3 = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        // All should be identical
        expect(alias1).toBe(alias2);
        expect(alias2).toBe(alias3);

        // Verify the format
        const expectedPrefix = aliasParts.join("-");
        const expectedRegex = new RegExp(
          `^${expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-[a-f0-9]{${hashLength}}@${domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        );
        expect(alias1).toMatch(expectedRegex);
      },
    );
  });

  describe("validateEmailAlias consistency", () => {
    it.each(testCases)(
      "should validate generated aliases consistently for aliasParts: %j",
      async ({ aliasParts, hashLength }) => {
        // Generate an alias
        const alias = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        // Validate it multiple times
        const isValid1 = await validateEmailAlias({
          secretKey,
          fullAlias: alias,
          hashLength,
        });

        const isValid2 = await validateEmailAlias({
          secretKey,
          fullAlias: alias,
          hashLength,
        });

        const isValid3 = await validateEmailAlias({
          secretKey,
          fullAlias: alias,
          hashLength,
        });

        // All should be true
        expect(isValid1).toBe(true);
        expect(isValid2).toBe(true);
        expect(isValid3).toBe(true);
      },
    );

    it.each(testCases)(
      "should consistently reject invalid aliases for aliasParts: %j",
      async ({ aliasParts, hashLength }) => {
        // Generate a valid alias
        const validAlias = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        // Create invalid variants
        const invalidAliases = [
          // Wrong secret key
          {
            alias: validAlias,
            secretKey: "wrong-secret-key",
            hashLength,
          },
          // Tampered hash
          {
            alias: validAlias.replace(/[a-f0-9]+@/, "ffffffff@"),
            secretKey,
            hashLength,
          },
          // Wrong hash length expectation
          {
            alias: validAlias,
            secretKey,
            hashLength: hashLength === 8 ? 10 : 8,
          },
        ];

        for (const {
          alias,
          secretKey: testSecretKey,
          hashLength: testHashLength,
        } of invalidAliases) {
          const isValid1 = await validateEmailAlias({
            secretKey: testSecretKey,
            fullAlias: alias,
            hashLength: testHashLength,
          });

          const isValid2 = await validateEmailAlias({
            secretKey: testSecretKey,
            fullAlias: alias,
            hashLength: testHashLength,
          });

          // Both should consistently be false
          expect(isValid1).toBe(false);
          expect(isValid2).toBe(false);
        }
      },
    );
  });

  describe("Known test vectors for reproducibility", () => {
    // These are known good test vectors that should always produce the same result
    const knownVectors = [
      {
        secretKey: "consistent-test-key",
        aliasParts: ["service", "provider"],
        domain: "example.com",
        hashLength: 8,
      },
      {
        secretKey: "another-test-key",
        aliasParts: ["shop", "store"],
        domain: "test.com",
        hashLength: 12,
      },
    ];

    it.each(knownVectors)(
      "should produce consistent alias for known vector: %j",
      async ({ secretKey, aliasParts, domain, hashLength }) => {
        const alias = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        // Generate again to ensure consistency
        const alias2 = await generateEmailAlias({
          secretKey,
          aliasParts,
          domain,
          hashLength,
        });

        expect(alias).toBe(alias2);

        // Validate that the generated alias is valid
        const isValid = await validateEmailAlias({
          secretKey,
          fullAlias: alias,
          hashLength,
        });

        expect(isValid).toBe(true);
      },
    );
  });

  describe("Edge cases consistency", () => {
    it("should handle special characters in alias parts consistently", async () => {
      const aliasParts = ["test", "with-dash", "under_score"];

      const alias1 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      const alias2 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      expect(alias1).toBe(alias2);

      const isValid = await validateEmailAlias({
        secretKey,
        fullAlias: alias1,
      });

      expect(isValid).toBe(true);
    });

    it("should handle long alias parts consistently", async () => {
      const aliasParts = [
        "very-long-service-name-that-might-cause-issues",
        "another-extremely-long-provider-name-for-testing",
      ];

      const alias1 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      const alias2 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      expect(alias1).toBe(alias2);

      const isValid = await validateEmailAlias({
        secretKey,
        fullAlias: alias1,
      });

      expect(isValid).toBe(true);
    });

    it("should handle Unicode characters consistently", async () => {
      const aliasParts = ["tëst", "ñame", "émoji"];

      const alias1 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      const alias2 = await generateEmailAlias({
        secretKey,
        aliasParts,
        domain,
      });

      expect(alias1).toBe(alias2);

      const isValid = await validateEmailAlias({
        secretKey,
        fullAlias: alias1,
      });

      expect(isValid).toBe(true);
    });
  });

  describe("Performance and stability", () => {
    it("should maintain consistent performance across multiple operations", async () => {
      const iterations = 50;
      const aliases: string[] = [];

      const startTime = Date.now();

      for (let i = 0; i < iterations; i++) {
        const alias = await generateEmailAlias({
          secretKey,
          aliasParts: ["perf", "test", i.toString()],
          domain,
        });
        aliases.push(alias);
      }

      const generateTime = Date.now() - startTime;

      // Validate all generated aliases
      const validateStartTime = Date.now();

      for (const alias of aliases) {
        const isValid = await validateEmailAlias({
          secretKey,
          fullAlias: alias,
        });
        expect(isValid).toBe(true);
      }

      const validateTime = Date.now() - validateStartTime;

      // Performance checks - should be reasonable
      expect(generateTime).toBeLessThan(5000); // 5 seconds for 50 generations
      expect(validateTime).toBeLessThan(5000); // 5 seconds for 50 validations

      // Ensure all aliases are unique (they should be due to different alias parts)
      const uniqueAliases = new Set(aliases);
      expect(uniqueAliases.size).toBe(iterations);
    });

    it("should produce different aliases for different secret keys", async () => {
      const aliasParts = ["test", "different-keys"];
      const secretKey1 = "secret-key-one";
      const secretKey2 = "secret-key-two";

      const alias1 = await generateEmailAlias({
        secretKey: secretKey1,
        aliasParts,
        domain,
      });

      const alias2 = await generateEmailAlias({
        secretKey: secretKey2,
        aliasParts,
        domain,
      });

      // Different secret keys should produce different aliases
      expect(alias1).not.toBe(alias2);

      // Each alias should validate with its respective secret key
      const isValid1 = await validateEmailAlias({
        secretKey: secretKey1,
        fullAlias: alias1,
      });
      expect(isValid1).toBe(true);

      const isValid2 = await validateEmailAlias({
        secretKey: secretKey2,
        fullAlias: alias2,
      });
      expect(isValid2).toBe(true);

      // Cross-validation should fail
      const crossValid1 = await validateEmailAlias({
        secretKey: secretKey1,
        fullAlias: alias2, // Using alias generated with secretKey2
      });
      expect(crossValid1).toBe(false);

      const crossValid2 = await validateEmailAlias({
        secretKey: secretKey2,
        fullAlias: alias1, // Using alias generated with secretKey1
      });
      expect(crossValid2).toBe(false);
    });
  });

  describe("Crypto implementation consistency", () => {
    it("should use the same crypto implementation across test runs", async () => {
      // This test ensures that the crypto module is being imported consistently
      const { crypto } = await import("../crypto.js");

      expect(crypto).toBeDefined();
      expect(crypto.subtle).toBeDefined();
      expect(typeof crypto.subtle.importKey).toBe("function");
      expect(typeof crypto.subtle.sign).toBe("function");
    });

    it("should produce identical HMAC results for identical inputs", async () => {
      const { crypto } = await import("../crypto.js");

      const encoder = new TextEncoder();
      const testData = "test-data-for-hmac-consistency";
      const testKey = "test-hmac-key";

      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(testKey),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );

      // Generate the same HMAC signature multiple times
      const signatures: number[][] = [];
      for (let i = 0; i < 5; i++) {
        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(testData),
        );
        signatures.push(Array.from(new Uint8Array(signature)));
      }

      // All signatures should be identical
      expect(
        signatures.every(
          (sig) => JSON.stringify(sig) === JSON.stringify(signatures[0]),
        ),
      ).toBe(true);
    });
  });
});
