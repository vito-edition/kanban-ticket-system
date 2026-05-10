module.exports = {
  ...require("../../.eslintrc.base.js"),
  plugins: [...(require("../../.eslintrc.base.js").plugins ?? []), "react-hooks", "react-refresh"],
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: "detect" },
  },
  rules: {
    ...require("../../.eslintrc.base.js").rules,
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
  },
  ignorePatterns: ["dist/", "node_modules/"],
};
