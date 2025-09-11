// eslint.config.js — ESM flat config
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  // Don’t lint build outputs or this config file
  { ignores: ["node_modules/**", "dist/**", "build/**", "eslint.config.*"] },

  // Base JS rules
  js.configs.recommended,

  // TypeScript rules with type-checking (uses @typescript-eslint/parser)
  ...tseslint.configs.recommendedTypeChecked,

  // Project-scoped settings + React/a11y + extra TS rules for TS/TSX only
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y
    },
    rules: {
      // Keep ESM strict: prefer `import type` for types
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" }
      ],

      // React hooks hygiene
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn"
    }
  }
];
