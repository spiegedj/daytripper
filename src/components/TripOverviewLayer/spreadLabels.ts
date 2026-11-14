/** A label to place on screen: where it wants to hang from, and how big it is, in pixels. */
export interface ILabelToSpread
{
	anchorX: number;
	anchorY: number;
	width: number;
	height: number;
}

/** How far a label moved from where it wanted to be, in pixels. */
export interface ILabelOffset
{
	x: number;
	y: number;
}

const labelSpacing = 4;
const relaxationRounds = 40;
// Labels are wide and short, so moving them up or down clears an overlap with much less travel than moving sideways.
const verticalPreference = 2.2;

/**
 * Nudges labels apart so none overlap. Each label starts centered under its anchor; overlapping pairs are pushed
 * apart along the axis that needs the least movement (preferring vertical), a little each round. Starting from the
 * anchors every time keeps the result steady from one frame to the next while the map moves.
 */
export function spreadLabels(labels: ILabelToSpread[]): ILabelOffset[]
{
	const boxes = labels.map((label) => ({ x: label.anchorX - label.width / 2, y: label.anchorY, width: label.width, height: label.height }));
	for (let round = 0; round < relaxationRounds; round++)
	{
		let hasOverlap = false;
		for (let first = 0; first < boxes.length; first++)
		{
			for (let second = first + 1; second < boxes.length; second++)
			{
				const a = boxes[first];
				const b = boxes[second];
				const overlapX = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + labelSpacing;
				const overlapY = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + labelSpacing;
				if (overlapX <= 0 || overlapY <= 0)
				{
					continue;
				}
				hasOverlap = true;
				if (overlapY < overlapX * verticalPreference)
				{
					// Ties go by list order, so the same pair always separates the same way.
					const direction = a.y + a.height / 2 <= b.y + b.height / 2 ? 1 : -1;
					a.y -= (direction * overlapY) / 2;
					b.y += (direction * overlapY) / 2;
				}
				else
				{
					const direction = a.x + a.width / 2 <= b.x + b.width / 2 ? 1 : -1;
					a.x -= (direction * overlapX) / 2;
					b.x += (direction * overlapX) / 2;
				}
			}
		}
		if (!hasOverlap)
		{
			break;
		}
	}
	return boxes.map((box, index) => ({ x: box.x - (labels[index].anchorX - labels[index].width / 2), y: box.y - labels[index].anchorY }));
}
