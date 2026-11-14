import type { Feature, FeatureCollection, Polygon } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { IExploredArea } from "../../itinerary/tripOverview";

export interface IExploredAreaLayerProps
{
	/** Prefix for the map source and layer ids, so several instances can exist on one map. */
	id: string;
	areas: IExploredArea[];
	highlightedDayNumber?: number;
	/** When false the outlines fade away, which reads better than popping off between camera moves. */
	isVisible?: boolean;
	/** Zoom range over which the areas fade in. Without it they show at every zoom. */
	fadeInZoomRange?: [number, number];
}

const fillOpacity = 0.16;
const highlightedFillOpacity = 0.3;
const dimmedFillOpacity = 0.06;
const outlineOpacity = 0.75;
const dimmedOutlineOpacity = 0.3;

/** Soft, dashed outlines around the neighborhoods explored on a day, filled in that day's color. */
export function ExploredAreaLayer({ id, areas, highlightedDayNumber, isVisible = true, fadeInZoomRange }: IExploredAreaLayerProps)
{
	const shapes = useMemo<FeatureCollection<Polygon>>(() => (
	{
		type: "FeatureCollection",
		features: areas.map((area): Feature<Polygon> => (
		{
			type: "Feature",
			geometry: { type: "Polygon", coordinates: [area.outline] },
			properties: { dayNumber: area.dayNumber, color: area.color },
		})),
	}), [areas]);

	const isAnyDayHighlighted = highlightedDayNumber !== undefined;
	const highlightExpression = ["==", ["get", "dayNumber"], highlightedDayNumber ?? -1];
	const applyVisibility = (visibleValue: unknown) =>
	{
		if (!isVisible)
		{
			return 0;
		}
		return (fadeInZoomRange
			? ["interpolate", ["linear"], ["zoom"], fadeInZoomRange[0], 0, fadeInZoomRange[1], visibleValue]
			: visibleValue) as never;
	};

	return (
		<Source id={`${id}-areas`} type="geojson" data={shapes}>
			<Layer
				id={`${id}-areas-fill`}
				type="fill"
				paint={{
					"fill-color": ["get", "color"],
					"fill-opacity": applyVisibility(["case", highlightExpression, highlightedFillOpacity, isAnyDayHighlighted ? dimmedFillOpacity : fillOpacity]),
					"fill-opacity-transition": { duration: 400 },
				}}
			/>
			<Layer
				id={`${id}-areas-outline`}
				type="line"
				layout={{ "line-join": "round" }}
				paint={{
					"line-color": ["get", "color"],
					"line-width": ["case", highlightExpression, 2.5, 1.5] as never,
					"line-dasharray": [2, 1.5],
					"line-opacity": applyVisibility(["case", highlightExpression, 1, isAnyDayHighlighted ? dimmedOutlineOpacity : outlineOpacity]),
					"line-opacity-transition": { duration: 400 },
				}}
			/>
		</Source>
	);
}
