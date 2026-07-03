// Flat-config ESLint with typescript-eslint (type-checked rules), react-hooks, react-refresh,
// import hygiene. `npm run lint` is a CI gate with ZERO errors (CLAUDE.md §6.4).
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "playwright-report", "test-results", "public/catalog"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}", "*.config.ts", "tests/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Node scripts + configs are plain ESM run under Node, not the browser.
    files: ["scripts/**/*.mjs", "*.config.{js,ts}", "tests/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Playwright specs + config files are tooling, not app modules: the react-refresh rule and
    // the src-oriented component-export rule do not apply there.
    files: ["tests/**/*.ts", "*.config.ts"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
);
