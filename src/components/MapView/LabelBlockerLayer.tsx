import type { Feature, FeatureCollection, Point } from "geojson";
import { useMemo } from "react";
import { Layer, Source } from "react-map-gl/maplibre";
import type { IPlace } from "../../itinerary/types";
import { getMarkerFootprint, type ILandmarkSizing } from "./markerFootprint";

export interface ILabelBlockerLayerProps
{
	places: IPlace[];
	compactStopIndexes: Set<number>;
	currentStopIndex: number;
	/** The landmark sizing when the camera last settled; the blockers follow it rather than every frame. */
	landmarkSizing: ILandmarkSizing;
}

const blockerImagePrefix = "label-blocker-";

/** Builds the transparent rectangle for a blocker image id such as "label-blocker-104x46", or returns undefined for other ids. */
export function createBlockerImage(imageId: string): { width: number; height: number; data: Uint8Array } | undefined
{
	if (!imageId.startsWith(blockerImagePrefix))
	{
		return undefined;
	}
	const [width, height] = imageId.slice(blockerImagePrefix.length).split("x").map(Number);
	return { width, height, data: new Uint8Array(width * height * 4) };
}

/**
 * Invisible, marker-sized symbols that take part in MapLibre's label collision.
 * Because they sit above the base map's label layers, any map label that would end up under a stop marker is hidden.
 */
export function LabelBlockerLayer({ places, compactStopIndexes, currentStopIndex, landmarkSizing }: ILabelBlockerLayerProps)
{
	const blockers = useMemo<FeatureCollection<Point>>(() =>
	{
		// Each marker becomes two anchored rectangles: one above its point (illustration) and one below (label).
		const features: Feature<Point>[] = [];
		places.forEach((place, stopIndex) =>
		{
			// The current stop's name always shows.
			const sizing = stopIndex === currentStopIndex ? { ...landmarkSizing, areLabelsShown: true } : landmarkSizing;
			const footprint = getMarkerFootprint(place, compactStopIndexes.has(stopIndex), sizing);
			const coordinates = [place.coordinates.longitude, place.coordinates.latitude];
			const width = Math.max(1, Math.ceil(footprint.width));
			const heightAbove = Math.max(1, Math.ceil(-footprint.top));
			const heightBelow = Math.max(1, Math.ceil(footprint.top + footprint.height));
			features.push({ type: "Feature", geometry: { type: "Point", coordinates }, properties: { imageId: `${blockerImagePrefix}${width}x${heightAbove}`, anchor: "bottom" } });
			features.push({ type: "Feature", geometry: { type: "Point", coordinates }, properties: { imageId: `${blockerImagePrefix}${width}x${heightBelow}`, anchor: "top" } });
		});
		return { type: "FeatureCollection", features };
	}, [places, compactStopIndexes, currentStopIndex, landmarkSizing]);

	return (
		<Source id="label-blockers" type="geojson" data={blockers}>
			<Layer
				id="label-blockers"
				type="symbol"
				layout={{
					"icon-image": ["get", "imageId"],
					"icon-anchor": ["get", "anchor"],
					"icon-allow-overlap": true,
					"icon-ignore-placement": false,
				}}
				paint={{ "icon-opacity": 0 }}
			/>
		</Source>
	);
}
