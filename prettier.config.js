/**
 * Deterministic formatting trio: imports sorted, JSX attributes ordered,
 * Tailwind classes in canonical order.
 *
 * `prettier-plugin-organize-attributes` stands in for the foundation's
 * `@trivago/prettier-plugin-class-attributes`, which is no longer published.
 */
const config = {
  plugins: [
    "prettier-plugin-organize-imports",
    "prettier-plugin-organize-attributes",
    "prettier-plugin-tailwindcss",
  ],
  tailwindStylesheet: "./src/index.css",
};

export default config;
