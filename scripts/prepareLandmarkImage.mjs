// Turns an illustration drawn on a plain white background into a landmark image: the white around the drawing becomes
// transparent (keeping soft watercolor edges), and the result is scaled to the 320 px square the map uses.
// Run: node scripts/prepareLandmarkImage.mjs <input.png> <src/trips/<trip>/landmarks/<placeId>.png>
import sharp from "sharp";

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath)
{
	console.error("Usage: node scripts/prepareLandmarkImage.mjs <input image> <output .png>");
	process.exit(1);
}

const outputSize = 320;
// Near-white, nearly grey pixels connected to the image's edge are background.
const backgroundLightness = 232;
const backgroundGreyness = 16;
// Pixels this close to the background fade out by how light they are, so washes and soft edges don't get a hard cut.
const featherDistance = 3;
const opaqueLightness = 205;

const { data, info } = await sharp(inputPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;
const pixelCount = width * height;
const lightness = new Uint8Array(pixelCount);
const isBackgroundColor = new Uint8Array(pixelCount);
for (let index = 0; index < pixelCount; index++)
{
	const red = data[index * 3];
	const green = data[index * 3 + 1];
	const blue = data[index * 3 + 2];
	lightness[index] = Math.min(red, green, blue);
	isBackgroundColor[index] = Number(lightness[index] >= backgroundLightness && Math.max(red, green, blue) - lightness[index] <= backgroundGreyness);
}

// Flood-fills the background inward from the border, so white inside the drawing (windows, highlights) stays.
const isBackground = new Uint8Array(pixelCount);
const queue = new Int32Array(pixelCount);
let queueEnd = 0;
const visit = (index) =>
{
	if (!isBackground[index] && isBackgroundColor[index])
	{
		isBackground[index] = 1;
		queue[queueEnd++] = index;
	}
};
for (let x = 0; x < width; x++)
{
	visit(x);
	visit((height - 1) * width + x);
}
for (let y = 0; y < height; y++)
{
	visit(y * width);
	visit(y * width + width - 1);
}
for (let queueStart = 0; queueStart < queueEnd; queueStart++)
{
	const index = queue[queueStart];
	const x = index % width;
	if (x > 0) visit(index - 1);
	if (x < width - 1) visit(index + 1);
	if (index >= width) visit(index - width);
	if (index < pixelCount - width) visit(index + width);
}

// Distance (in pixels, up to featherDistance) from each drawing pixel to the background.
const distance = new Uint8Array(pixelCount).fill(featherDistance + 1);
for (let index = 0; index < pixelCount; index++)
{
	if (isBackground[index])
	{
		distance[index] = 0;
	}
}
for (let step = 1; step <= featherDistance; step++)
{
	for (let index = 0; index < pixelCount; index++)
	{
		if (distance[index] !== step - 1)
		{
			continue;
		}
		const x = index % width;
		const neighbors = [x > 0 ? index - 1 : -1, x < width - 1 ? index + 1 : -1, index - width, index + width];
		for (const neighbor of neighbors)
		{
			if (neighbor >= 0 && neighbor < pixelCount && distance[neighbor] > step)
			{
				distance[neighbor] = step;
			}
		}
	}
}

const output = Buffer.alloc(pixelCount * 4);
for (let index = 0; index < pixelCount; index++)
{
	let alpha = 1;
	if (isBackground[index])
	{
		alpha = 0;
	}
	else if (distance[index] <= featherDistance)
	{
		alpha = Math.min(1, Math.max(0, (255 - lightness[index]) / (255 - opaqueLightness)));
	}
	for (let channel = 0; channel < 3; channel++)
	{
		const value = data[index * 3 + channel];
		// Removes the white the edge was blended with, so faded edges don't leave a pale halo.
		output[index * 4 + channel] = alpha > 0 && alpha < 1 ? Math.max(0, Math.min(255, Math.round((value - 255 * (1 - alpha)) / alpha))) : value;
	}
	output[index * 4 + 3] = Math.round(alpha * 255);
}

await sharp(output, { raw: { width, height, channels: 4 } })
	.resize(outputSize, outputSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: "lanczos3" })
	.png({ compressionLevel: 9, palette: false })
	.toFile(outputPath);
console.log(`Wrote ${outputPath}`);
