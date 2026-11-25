import type { ILegSegment, IPlaceDetails, ITrip } from "../../itinerary/types";
import { arizonaCities } from "./cities";
import { arizonaDays } from "./days";
import placeDetails from "./placeDetails.generated.json";
import { arizonaPlaces } from "./places";
import legPaths from "./transitRoutes.generated.json";

export const arizonaTrip: ITrip =
{
	id: "arizona",
	name: "Arizona",
	tagline: "May 2025",
	cities: arizonaCities,
	places: arizonaPlaces,
	placeDetails: placeDetails as Record<string, IPlaceDetails>,
	// JSON imports widen tuples to number[][], so the generated file is trusted to match ILegSegment.
	legPaths: legPaths as unknown as Record<string, ILegSegment[]>,
	days: arizonaDays,
};
