import type { ILegSegment, IPlaceDetails, ITrip } from "../../itinerary/types";
import { ukCities } from "./cities";
import { ukDays } from "./days";
import placeDetails from "./placeDetails.generated.json";
import { ukPlaces } from "./places";
import legPaths from "./transitRoutes.generated.json";

export const ukTrip: ITrip =
{
	id: "uk",
	name: "England & Scotland",
	tagline: "October 2024",
	cities: ukCities,
	places: ukPlaces,
	placeDetails: placeDetails as Record<string, IPlaceDetails>,
	// JSON imports widen tuples to number[][], so the generated file is trusted to match ILegSegment.
	legPaths: legPaths as unknown as Record<string, ILegSegment[]>,
	days: ukDays,
};
