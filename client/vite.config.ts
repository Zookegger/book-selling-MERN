import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			"@api": path.resolve(__dirname, "./src/api"),
			"@services": path.resolve(__dirname, "./src/services"),
			"@assets": path.resolve(__dirname, "./src/assets"),
			"@components": path.resolve(__dirname, "./src/components"),
			"@hooks": path.resolve(__dirname, "./src/hooks"),
			"@contexts": path.resolve(__dirname, "./src/contexts"),
			"@common": path.resolve(__dirname, "./src/components/common"),
			"@constants": path.resolve(__dirname, "./src/constants"),
			"@layout": path.resolve(__dirname, "./src/components/layout"),
			"@context": path.resolve(__dirname, "./src/contexts"),
			"@features": path.resolve(__dirname, "./src/features"),
			"@pages": path.resolve(__dirname, "./src/pages"),
			"@theme": path.resolve(__dirname, "./src/theme"),
			"@my-types": path.resolve(__dirname, "./src/types"),
			"@shared": path.resolve(__dirname, "../shared"),
		},
	},
});
