---
to: <%= h.changeCase.param(name) %>/tsconfig.json
---

{
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "node",
    "lib": ["esnext", "dom"],
    "strict": true,
    "allowJs": true,
    "checkJs": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "inlineSourceMap": true
  },

  // this is needed for writing `webpack.config.ts` in TypeScript:
  // https://webpack.js.org/configuration/configuration-languages/#typescript
  "ts-node": {
    "compilerOptions": {
      "target": "es5",
      "module": "commonjs",
      "esModuleInterop": true
    }
  },

  "include": ["src", "webpack.config.ts"]
}
