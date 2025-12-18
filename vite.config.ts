import tailwindcss from "@tailwindcss/vite";
import vikeSolid from "vike-solid/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import vike from "vike/plugin";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { telefunc } from "telefunc/vite";
export default defineConfig({
  ssr: {
    // Add problematic npm package here:
    noExternal: ["@kobalte/core", "pg-boss"],
  },
  plugins: [
    vike(),
    sentryVitePlugin({
      sourcemaps: {
        disable: false,
      },
    }),
    vikeSolid(),
    tailwindcss(),
    telefunc(),
  ],
  resolve: {
    alias: {
      "@/registry": fileURLToPath(
        new URL("./components/registry", import.meta.url),
      ),
      "@/": fileURLToPath(
        new URL("./", import.meta.url),
      ),
      "@/lib": fileURLToPath(new URL("./lib", import.meta.url)),
    },
  },

  build: {
    sourcemap: false,
  },
});
