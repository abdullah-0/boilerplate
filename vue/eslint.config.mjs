import vuePlugin from "eslint-plugin-vue";
import ts from "typescript-eslint";
import prettierConfig from "@vue/eslint-config-prettier";

export default [
  {
    ignores: ["dist", "node_modules"],
  },
  ...vuePlugin.configs["flat/recommended"],
  ...ts.config({
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    extends: ["plugin:@typescript-eslint/recommended"],
  }),
  prettierConfig,
];
