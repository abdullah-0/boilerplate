import nextPlugin from "eslint-plugin-next";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const compat = new FlatCompat();

export default [
  ...compat.config({
    extends: ["next", "next/core-web-vitals"],
  }),
  js.configs.recommended,
  {
    ignores: [".next", "out", "node_modules"],
  },
];
