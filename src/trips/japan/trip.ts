import type { ILegSegment, IPlaceDetails, ITrip } from "../../itinerary/types";
import { japanCities } from "./cities";
import { japanDays } from "./days";
import placeDetails from "./placeDetails.generated.json";
import { japanPlaces } from "./places";
import legPaths from "./transitRoutes.generated.json";

export const japanTrip: ITrip =
{
	id: "japan",
	name: "Japan",
	cities: japanCities,
	places: japanPlaces,
	placeDetails: placeDetails as Record<string, IPlaceDetails>,
	// JSON imports widen tuples to number[][], so the generated file is trusted to match ILegSegment.
	legPaths: legPaths as unknown as Record<string, ILegSegment[]>,
	days: japanDays,
};
