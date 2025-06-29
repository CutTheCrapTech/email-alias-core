/**
 * @license MIT
 * @copyright 2025 karteekiitg
 */

// We import from `index.js` because this is what Node.js's ES Module resolver expects.
// The `moduleNameMapper` in our jest.config.js will correctly map this to the source .ts file during the test run.
import { generateEmailAlias, validateEmailAlias } from "../index.js";

describe("email-alias-core", () => {
  const secretKey = "a-very-secret-key-that-is-long-enough";
  const domain = "example.com";

  describe("generateEmailAlias()", () => {
    it("should generate a correctly formatted alias with the default hash length", async () => {
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["news", "service"],
        domain,
      });
      // Example format: news-service-a1b2c3d4@example.com
      const regex = /^news-service-[a-f0-9]{8}@example\.com$/;
      expect(alias).toMatch(regex);
    });

    it("should be deterministic for the same inputs", async () => {
      const alias1 = await generateEmailAlias({
        secretKey,
        aliasParts: ["shop", "amazon"],
        domain,
      });
      const alias2 = await generateEmailAlias({
        secretKey,
        aliasParts: ["shop", "amazon"],
        domain,
      });
      expect(alias1).toEqual(alias2);
    });

    it("should generate a different alias for different aliasParts", async () => {
      const alias1 = await generateEmailAlias({
        secretKey,
        aliasParts: ["type1", "service1"],
        domain,
      });
      const alias2 = await generateEmailAlias({
        secretKey,
        aliasParts: ["type2", "service2"],
        domain,
      });
      expect(alias1).not.toEqual(alias2);
    });

    it("should handle a custom hash length", async () => {
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["social", "twitter"],
        domain,
        hashLength: 12,
      });
      const regex = /^social-twitter-[a-f0-9]{12}@example\.com$/;
      expect(alias).toMatch(regex);
    });

    it("should throw an error if aliasParts is an empty array", async () => {
      await expect(
        generateEmailAlias({ secretKey, aliasParts: [], domain }),
      ).rejects.toThrow("The `aliasParts` array cannot be empty.");
    });

    // NOTE: A test for non-string elements in aliasParts is not included because
    // the TypeScript function signature `aliasParts: string[]` prevents this at compile time.
  });

  describe("validateEmailAlias()", () => {
    it("should successfully validate a correctly generated alias", async () => {
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["finance", "chase-bank"],
        domain,
      });
      const isValid = await validateEmailAlias({ secretKey, fullAlias: alias });
      expect(isValid).toBe(true);
    });

    it("should fail validation for an alias with a tampered hash", async () => {
      const alias = "finance-chase-bank-ffffffff@example.com";
      const isValid = await validateEmailAlias({ secretKey, fullAlias: alias });
      expect(isValid).toBe(false);
    });

    it("should fail validation when using the wrong secret key", async () => {
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["work", "github"],
        domain,
      });
      const isValid = await validateEmailAlias({
        secretKey: "a-different-and-wrong-secret-key",
        fullAlias: alias,
      });
      expect(isValid).toBe(false);
    });

    it("should fail validation for an alias with tampered aliasParts", async () => {
      // Generate a known-good alias to get a valid hash
      const originalAlias = await generateEmailAlias({
        secretKey,
        aliasParts: ["original", "service"],
        domain,
      });

      // Safely extract the valid hash to prevent type errors
      const aliasLocalPart = originalAlias.split("@")[0];
      const hash = aliasLocalPart?.split("-").pop();

      // Ensure the test setup is correct before asserting the real logic
      if (!hash) {
        throw new Error(
          "Test setup failed: could not extract hash from alias.",
        );
      }

      // Construct a new, invalid alias with the valid hash but a different prefix
      const tamperedAlias = `tampered-service-${hash}@example.com`;

      const isValid = await validateEmailAlias({
        secretKey,
        fullAlias: tamperedAlias,
      });
      expect(isValid).toBe(false);
    });

    it("should correctly validate an alias with a custom hash length", async () => {
      const hashLength = 10;
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["test", "length"],
        domain,
        hashLength,
      });
      const isValid = await validateEmailAlias({
        secretKey,
        fullAlias: alias,
        hashLength,
      });
      expect(isValid).toBe(true);
    });

    it("should fail validation if hash length specified does not match alias", async () => {
      const alias = await generateEmailAlias({
        secretKey,
        aliasParts: ["test", "length-mismatch"],
        domain,
        hashLength: 10, // Generated with length 10
      });
      // But we try to validate it with the default length of 8
      const isValid = await validateEmailAlias({ secretKey, fullAlias: alias });
      expect(isValid).toBe(false);
    });

    it.each([
      ["test-service@example.com"], // missing hash
      ["test-service-12345678"], // missing @domain
      ["plainstring"], // not an email
      [""], // empty string
      [null], // null
      [undefined], // undefined
    ])(
      "should return false for malformed alias: %s",
      async (malformedAlias) => {
        // The `as any` cast is intentional here. It allows us to bypass TypeScript's
        // compile-time checks to test the runtime robustness of the validation function
        // against invalid data types like null and undefined.
        const isValid = await validateEmailAlias({
          secretKey,
          fullAlias: malformedAlias as string,
        });
        expect(isValid).toBe(false);
      },
    );
  });
});
