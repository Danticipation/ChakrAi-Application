import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import unusedImports from "eslint-plugin-unused-imports";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "eslint.config.*",
      "vite.config.*",
      "postcss.config.*",
      "tailwind.config.*",
      "**/*.d.ts"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { project: ["./tsconfig.json"], tsconfigRootDir: import.meta.dirname }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "unused-imports": unusedImports
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports", fixStyle: "separate-type-imports" }],
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": ["error", { args: "after-used", argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-misused-promises": ["error", { checksVoidReturn: { attributes: false } }]
    }
  }
];
