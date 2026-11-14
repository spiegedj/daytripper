import type { IPlaceDetails, ITrip } from "../../itinerary/types";
import { japanCities } from "./cities";
import { japanDays } from "./days";
import placeDetails from "./placeDetails.generated.json";
import { japanPlaces } from "./places";

export const japanTrip: ITrip =
{
	id: "japan",
	name: "Japan",
	cities: japanCities,
	places: japanPlaces,
	placeDetails: placeDetails as Record<string, IPlaceDetails>,
	days: japanDays,
};
