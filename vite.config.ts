import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ["lib"],
      rollupTypes: true,
      tsconfigPath: resolve(__dirname, "tsconfig.app.json"),
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "lib/index.tsx"),
      formats: ["es"],
      name: "React Spring Carousel",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@react-spring/web",
      ],
    },
  },
});
