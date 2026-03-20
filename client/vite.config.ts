import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@api": path.resolve(__dirname, "./src/api"),
			"@assets": path.resolve(__dirname, "./src/assets"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@common": path.resolve(__dirname, "./src/components/common"),
			"@layout": path.resolve(__dirname, "./src/components/layout"),
			"@context": path.resolve(__dirname, "./src/context"),
			"@features": path.resolve(__dirname, "./src/features"),
			"@pages": path.resolve(__dirname, "./src/pages"),
			"@theme": path.resolve(__dirname, "./src/theme"),
			"@shared": path.resolve(__dirname, "../shared/src"),
		},
	},
});
