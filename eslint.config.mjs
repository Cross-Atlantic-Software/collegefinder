import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Flat config: plugins must be declared on the same object as rules that use them.
  {
    plugins: {
      react,
      "react-hooks": reactHooks,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      "react-hooks/preserve-manual-memoization": "off",
      // Compiler-style rules: too noisy for current patterns (searchParams/localStorage/matchMedia sync).
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node/CommonJS backends (use require, different rules)
    "backend/**",
    "stagehand-backend/**",
    "python-backend/**",
    // Node CJS one-off scripts (require() is intentional)
    "scripts/**",
  ]),
]);

export default eslintConfig;
