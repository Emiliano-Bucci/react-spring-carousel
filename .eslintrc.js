module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["react", "@typescript-eslint"],
  extends: [
    "prettier",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended",
    ,
  ],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
      },
    ],
    "prettier/prettier": [
      "warn",
      {
        singleQuote: true,
        semi: false,
        arrowParens: "avoid",
        printWidth: 90,
      },
    ],
    // Errors
    "@typescript-eslint/no-explicit-any": 2,
    "@typescript-eslint/no-var-requires": 2,
    "react-hooks/rules-of-hooks": 2,
    "react-hooks/exhaustive-deps": 2,
    // Allowed
    "react/jsx-uses-react": 0,
    "react/react-in-jsx-scope": 0,
    "@typescript-eslint/no-non-null-assertion": 0,
    "@typescript-eslint/explicit-function-return-type": 0,
    "@typescript-eslint/explicit-member-accessibility": 0,
    "@typescript-eslint/no-empty-function": 0,
    "@typescript-eslint/camelcase": 0,
    "@typescript-eslint/explicit-module-boundary-types": 0,
    "@typescript-eslint/ban-ts-ignore": 0,
    "@typescript-eslint/ban-ts-comment": 0,
    "react/prop-types": 0,
    "react/no-unescaped-entities": 0,
    "react/display-name": 0,
  },
};
