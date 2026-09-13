import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// En production, l'app est déployée dans le sous-dossier /mairie/.
// En développement, on reste à la racine (http://localhost:5173/).
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/mairie/" : "/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
  },
}));
