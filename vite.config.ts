import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      rollupTypes: true,
      tsconfigPath: "./tsconfig.app.json",
    }),
  ],
  build: {
    lib: {
      entry: ["lib/index.tsx"],
      name: "react-spring-carousel",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "react/jsx-runtime",
          "@react-spring/web": "@react-spring/web",
        },
      },
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@react-spring/web",
      ],
    },
  },
});
