import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/spotify-playlist-manager/" : "/",
  server: {
    host: "127.0.0.1",
  },
}));
