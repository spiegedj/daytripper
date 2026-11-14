import type { ReactElement } from "react";
import type { PlaceCategory } from "../../itinerary/types";

export const categoryColors: Record<PlaceCategory, string> =
{
	temple: "#E03131",
	landmark: "#D6336C",
	museum: "#AE3EC9",
	food: "#F08C00",
	shopping: "#0C8599",
	nature: "#2F9E44",
	hotel: "#6741D9",
	station: "#1971C2",
	airport: "#1971C2",
};

const strokeProps =
{
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2.2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

const categoryGlyphs: Record<PlaceCategory, ReactElement> =
{
	temple: <path {...strokeProps} d="M3 6c6-2 12-2 18 0M5 10h14M7 6.5v14M17 6.5v14M12 6v4" />,
	landmark: <path {...strokeProps} d="M12 2v3M10 5h4M9.6 5 6.5 21M14.4 5l3.1 16M8.2 13h7.6M5 21h14M10.6 9h2.8" />,
	museum: <path {...strokeProps} d="M3 9 12 4l9 5M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 20h18" />,
	food: <path {...strokeProps} d="M3 12h18M4 12a8 7.5 0 0 0 16 0M14 3l-3 7M19.5 4.5 13 10" />,
	shopping: <path {...strokeProps} d="M5 8h14l-1 13H6zM9 8V6.5a3 3 0 0 1 6 0V8" />,
	nature: <path {...strokeProps} d="M2.5 20 9.5 8.5l4 6.5 2.5-4 5.5 9z" />,
	hotel: (
		<>
			<path {...strokeProps} d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6" />
			<circle cx="7" cy="12" r="1.9" fill="currentColor" />
		</>
	),
	station: (
		<>
			<rect {...strokeProps} x="6" y="3" width="12" height="14" rx="3" />
			<path {...strokeProps} d="M6 10h12M9 17l-2 4M15 17l2 4" />
		</>
	),
	airport: <path {...strokeProps} d="M12 3v7l8 4v2l-8-2v4l3 2v1l-3-1-3 1v-1l3-2v-4l-8 2v-2l8-4V3" />,
};

export interface ICategoryIconProps
{
	category: PlaceCategory;
	size: number;
	color: string;
}

/** Draws the simple line glyph for a place category. */
export function CategoryIcon({ category, size, color }: ICategoryIconProps)
{
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" style={{ color }} aria-hidden="true">
			{categoryGlyphs[category]}
		</svg>
	);
}
