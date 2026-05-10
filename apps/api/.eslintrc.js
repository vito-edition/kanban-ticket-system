module.exports = {
  ...require("../../.eslintrc.base.js"),
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  ignorePatterns: ["dist/", "node_modules/"],
};
