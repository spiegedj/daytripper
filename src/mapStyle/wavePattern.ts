export const wavePatternImageId = "seigaiha-waves";

/** Draws the seigaiha wave tile used to texture water. */
export function createWavePatternImage(): ImageData
{
	const tileWidth = 28;
	const tileHeight = 14;
	const pixelRatio = 2;
	const canvas = document.createElement("canvas");
	canvas.width = tileWidth * pixelRatio;
	canvas.height = tileHeight * pixelRatio;
	const context = canvas.getContext("2d")!;
	context.scale(pixelRatio, pixelRatio);
	context.strokeStyle = "rgba(255, 255, 255, 0.45)";
	context.lineWidth = 1;

	const radius = tileWidth / 2;
	const arcCenters = [[0, tileHeight / 2], [tileWidth, tileHeight / 2], [radius, tileHeight]];
	for (const [centerX, centerY] of arcCenters)
	{
		for (const ringRadius of [radius - 1, radius - 5, radius - 9])
		{
			context.beginPath();
			context.arc(centerX, centerY, ringRadius, Math.PI, 2 * Math.PI);
			context.stroke();
		}
	}
	return context.getImageData(0, 0, canvas.width, canvas.height);
}
