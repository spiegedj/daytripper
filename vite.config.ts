import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import sharp from "sharp";

const landmarkBoundsQuery = "landmarkBounds";
// Pixels fainter than this are the illustration's soft edge or empty canvas, not part of the drawing.
const drawnAlphaThreshold = 24;

/**
 * Measures where each landmark illustration is actually drawn inside its image, from its transparency, whenever an
 * image is imported with ?landmarkBounds. New illustrations are measured automatically, so they size themselves.
 */
function landmarkBoundsPlugin(): Plugin
{
	return {
		name: "landmark-bounds",
		// Ahead of Vite's own asset handling, which would otherwise turn the image import into a URL.
		enforce: "pre",
		async load(id)
		{
			const [filePath, query] = id.split("?");
			if (query !== landmarkBoundsQuery)
			{
				return undefined;
			}
			this.addWatchFile(filePath);
			const { data, info } = await sharp(filePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
			let left = info.width;
			let right = -1;
			let top = info.height;
			let bottom = -1;
			for (let y = 0; y < info.height; y++)
			{
				for (let x = 0; x < info.width; x++)
				{
					if (data[(y * info.width + x) * 4 + 3] > drawnAlphaThreshold)
					{
						left = Math.min(left, x);
						right = Math.max(right, x);
						top = Math.min(top, y);
						bottom = Math.max(bottom, y);
					}
				}
			}
			const toShare = (value: number, size: number) => Math.round(value / size * 1000) / 1000;
			// An image with nothing drawn falls back to the whole canvas.
			const bounds = right < 0
				? { left: 0, top: 0, right: 1, bottom: 1 }
				: { left: toShare(left, info.width), top: toShare(top, info.height), right: toShare(right + 1, info.width), bottom: toShare(bottom + 1, info.height) };
			return `export default ${JSON.stringify(bounds)};`;
		},
	};
}

// GitHub Pages serves the site from /<repo-name>/.
export default defineConfig(
{
	base: "/daytripper/",
	plugins: [react(), landmarkBoundsPlugin()],
	worker: { format: "es" },
});
