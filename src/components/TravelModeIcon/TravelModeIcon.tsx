import type { ReactElement } from "react";
import type { TravelMode } from "../../itinerary/types";

const strokeProps =
{
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 2.2,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
};

const trainGlyph = (
	<>
		<rect {...strokeProps} x="6" y="3" width="12" height="14" rx="3" />
		<path {...strokeProps} d="M6 10h12M9 17l-2 4M15 17l2 4" />
	</>
);

const travelModeGlyphs: Record<TravelMode, ReactElement> =
{
	walk: (
		<>
			<circle cx="13" cy="4" r="2" fill="currentColor" />
			<path {...strokeProps} d="m10 21 2.5-6.5 3 3V21M8 13l2.5-5 3.5 1 2 3.5M10.5 8 9 13" />
		</>
	),
	subway: trainGlyph,
	train: trainGlyph,
	tram: trainGlyph,
	shinkansen: <path {...strokeProps} d="M3 16c0-5 4-9 10-9h3l5 5v4zM3 16h18M8 20h8M13 7v5h8" />,
	bus: (
		<>
			<rect {...strokeProps} x="5" y="3" width="14" height="15" rx="3" />
			<path {...strokeProps} d="M5 11h14M8 18v3M16 18v3" />
		</>
	),
	ferry: <path {...strokeProps} d="M3 17l2-5h14l2 5M7 12V8h10v4M12 8V4M2 20c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0" />,
	boat: <path {...strokeProps} d="M3 15h18l-3 5H6zM12 3v12M12 4l6 8h-6M2 21c2 1 4 1 6 0" />,
	ropeway: (
		<>
			<path {...strokeProps} d="M3 4 21 8M12 6v4" />
			<rect {...strokeProps} x="6" y="10" width="12" height="10" rx="2" />
			<path {...strokeProps} d="M6 15h12" />
		</>
	),
	flight: <path {...strokeProps} d="M12 3v7l8 4v2l-8-2v4l3 2v1l-3-1-3 1v-1l3-2v-4l-8 2v-2l8-4V3" />,
	taxi: (
		<>
			<path {...strokeProps} d="M4 16v-4l2-5h12l2 5v4zM4 16v3M20 16v3M9 4h6v3" />
			<circle cx="8" cy="13" r="1" fill="currentColor" />
			<circle cx="16" cy="13" r="1" fill="currentColor" />
		</>
	),
};

export interface ITravelModeIconProps
{
	mode: TravelMode;
	size: number;
}

/** Small line glyph for how a leg is traveled (walk, train, ferry and so on). */
export function TravelModeIcon({ mode, size }: ITravelModeIconProps)
{
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
			{travelModeGlyphs[mode]}
		</svg>
	);
}

/** Formats a duration in minutes as "20 min" or "2 h 15 m". */
export function formatMinutes(minutes: number): string
{
	if (minutes < 60)
	{
		return `${minutes} min`;
	}
	const remainingMinutes = minutes % 60;
	return remainingMinutes === 0 ? `${Math.floor(minutes / 60)} h` : `${Math.floor(minutes / 60)} h ${remainingMinutes} m`;
}
