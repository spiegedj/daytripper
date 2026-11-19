import type { ILegSegment, IPlaceDetails, ITrip } from "../../itinerary/types";
import { irelandCities } from "./cities";
import { irelandDays } from "./days";
import placeDetails from "./placeDetails.generated.json";
import { irelandPlaces } from "./places";
import legPaths from "./transitRoutes.generated.json";
import tripPhotos from "./tripPhotos.generated.json";

export const irelandTrip: ITrip =
{
	id: "ireland",
	name: "Ireland",
	tagline: "Spring 2023",
	cities: irelandCities,
	places: irelandPlaces,
	placeDetails: placeDetails as Record<string, IPlaceDetails>,
	// JSON imports widen tuples to number[][], so the generated file is trusted to match ILegSegment.
	legPaths: legPaths as unknown as Record<string, ILegSegment[]>,
	days: irelandDays,
	tripPhotos,
};
