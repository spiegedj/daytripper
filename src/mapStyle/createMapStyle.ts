import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";
import type { IMapPalette } from "./palette";
import { wavePatternImageId } from "./wavePattern";

const tileSourceId = "openmaptiles";
const regularFont = ["Noto Sans Regular"];
const boldFont = ["Noto Sans Bold"];
const italicFont = ["Noto Sans Italic"];

const englishName: ExpressionSpecification = ["coalesce", ["get", "name:en"], ["get", "name_en"], ["get", "name"]];
const notTunnel: ExpressionSpecification = ["!=", ["get", "brunnel"], "tunnel"];

function roadClassFilter(classes: string[]): ExpressionSpecification
{
	return ["all", notTunnel, ["in", ["get", "class"], ["literal", classes]]];
}

function zoomWidth(stops: [number, number][]): ExpressionSpecification
{
	return ["interpolate", ["exponential", 1.5], ["zoom"], ...stops.flat()] as ExpressionSpecification;
}

/**
 * Builds the stylized pastel MapLibre style on top of the free OpenFreeMap vector tiles. Town and city names are in
 * English; with a local language (an OpenStreetMap code such as "ja") they also show the local name underneath.
 */
export function createMapStyle(palette: IMapPalette, localLanguage?: string): StyleSpecification
{
	const cityName: ExpressionSpecification = localLanguage
		? ["format", englishName, {}, "\n", {}, ["coalesce", ["get", `name:${localLanguage}`], ""], { "font-scale": 0.8 }]
		: englishName;
	return {
		version: 8,
		glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
		sources:
		{
			[tileSourceId]: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
		},
		layers:
		[
			{ id: "land", type: "background", paint: { "background-color": palette.land } },
			{
				id: "residential", type: "fill", source: tileSourceId, "source-layer": "landuse",
				filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood", "commercial", "retail"]]],
				paint: { "fill-color": palette.residential },
			},
			{
				id: "forest", type: "fill", source: tileSourceId, "source-layer": "landcover",
				filter: ["in", ["get", "class"], ["literal", ["wood", "forest"]]],
				paint: { "fill-color": palette.forest },
			},
			{
				id: "grass", type: "fill", source: tileSourceId, "source-layer": "landcover",
				filter: ["in", ["get", "class"], ["literal", ["grass", "farmland"]]],
				paint: { "fill-color": palette.park, "fill-opacity": 0.7 },
			},
			{ id: "park", type: "fill", source: tileSourceId, "source-layer": "park", paint: { "fill-color": palette.park } },
			{
				id: "green-landuse", type: "fill", source: tileSourceId, "source-layer": "landuse",
				filter: ["in", ["get", "class"], ["literal", ["cemetery", "pitch", "garden", "playground", "stadium"]]],
				paint: { "fill-color": palette.park, "fill-opacity": 0.75 },
			},
			{ id: "water", type: "fill", source: tileSourceId, "source-layer": "water", paint: { "fill-color": palette.water } },
			{
				id: "water-waves", type: "fill", source: tileSourceId, "source-layer": "water",
				paint: { "fill-pattern": wavePatternImageId, "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.25, 10, 0.7, 16, 0.5] },
			},
			{
				id: "waterway", type: "line", source: tileSourceId, "source-layer": "waterway",
				paint: { "line-color": palette.water, "line-width": zoomWidth([[10, 1], [16, 6]]) },
			},
			{
				id: "building", type: "fill", source: tileSourceId, "source-layer": "building", minzoom: 14,
				paint:
				{
					"fill-color": palette.building,
					"fill-outline-color": palette.buildingOutline,
					"fill-opacity": ["interpolate", ["linear"], ["zoom"], 14, 0, 15, 1],
				},
			},
			{
				id: "rail", type: "line", source: tileSourceId, "source-layer": "transportation",
				filter: roadClassFilter(["rail", "transit"]),
				paint: { "line-color": palette.rail, "line-width": zoomWidth([[10, 0.8], [16, 2.5]]) },
			},
			{
				id: "rail-ties", type: "line", source: tileSourceId, "source-layer": "transportation", minzoom: 13,
				filter: roadClassFilter(["rail", "transit"]),
				paint: { "line-color": palette.land, "line-width": zoomWidth([[13, 0.6], [16, 1.4]]), "line-dasharray": [2, 3] },
			},
			{
				id: "footpath", type: "line", source: tileSourceId, "source-layer": "transportation", minzoom: 14,
				filter: roadClassFilter(["track", "path"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.minorRoad, "line-opacity": 0.85, "line-width": zoomWidth([[14, 0.6], [17, 2]]), "line-dasharray": [2, 1.5] },
			},
			{
				id: "road-minor", type: "line", source: tileSourceId, "source-layer": "transportation", minzoom: 12,
				filter: roadClassFilter(["tertiary", "minor", "service"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.minorRoad, "line-width": zoomWidth([[12, 0.5], [16, 6], [18, 14]]) },
			},
			{
				id: "road-major-casing", type: "line", source: tileSourceId, "source-layer": "transportation",
				filter: roadClassFilter(["primary", "secondary"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.majorRoadCasing, "line-width": zoomWidth([[8, 0.8], [12, 3], [16, 12], [18, 24]]) },
			},
			{
				id: "road-major", type: "line", source: tileSourceId, "source-layer": "transportation",
				filter: roadClassFilter(["primary", "secondary"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.majorRoad, "line-width": zoomWidth([[8, 0.4], [12, 2], [16, 10], [18, 21]]) },
			},
			{
				id: "highway-casing", type: "line", source: tileSourceId, "source-layer": "transportation",
				filter: roadClassFilter(["motorway", "trunk"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.highwayCasing, "line-width": zoomWidth([[6, 1], [12, 4], [16, 14]]) },
			},
			{
				id: "highway", type: "line", source: tileSourceId, "source-layer": "transportation",
				filter: roadClassFilter(["motorway", "trunk"]),
				layout: { "line-cap": "round", "line-join": "round" },
				paint: { "line-color": palette.highway, "line-width": zoomWidth([[6, 0.6], [12, 2.6], [16, 11]]) },
			},
			{
				id: "water-label", type: "symbol", source: tileSourceId, "source-layer": "water_name",
				layout: { "text-field": englishName, "text-font": italicFont, "text-size": 13, "text-letter-spacing": 0.1 },
				paint: { "text-color": palette.waterLabel, "text-halo-color": palette.water, "text-halo-width": 1 },
			},
			{
				id: "road-label", type: "symbol", source: tileSourceId, "source-layer": "transportation_name", minzoom: 15,
				layout: { "symbol-placement": "line", "text-field": englishName, "text-font": regularFont, "text-size": 11 },
				paint: { "text-color": "#8A8F80", "text-halo-color": palette.labelHalo, "text-halo-width": 1.5 },
			},
			{
				id: "neighborhood-label", type: "symbol", source: tileSourceId, "source-layer": "place",
				filter: ["in", ["get", "class"], ["literal", ["suburb", "quarter"]]],
				minzoom: 11,
				layout:
				{
					"text-field": ["upcase", englishName],
					"text-font": boldFont,
					"text-size": ["interpolate", ["linear"], ["zoom"], 11, 10, 15, 13],
					"text-letter-spacing": 0.18,
					"text-max-width": 8,
				},
				paint: { "text-color": palette.placeLabel, "text-opacity": 0.75, "text-halo-color": palette.labelHalo, "text-halo-width": 1.5 },
			},
			{
				id: "city-label", type: "symbol", source: tileSourceId, "source-layer": "place",
				filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
				layout:
				{
					"text-field": cityName,
					"text-font": boldFont,
					"text-size": ["interpolate", ["linear"], ["zoom"], 5, 12, 10, 18],
				},
				paint: { "text-color": "#4A5340", "text-halo-color": palette.labelHalo, "text-halo-width": 2 },
			},
		],
	};
}
