import type { ITrip } from "../../itinerary/types";
import { japanDays } from "./days";
import { japanPlaces } from "./places";

export const japanTrip: ITrip =
{
	id: "japan",
	name: "Japan",
	places: japanPlaces,
	days: japanDays,
};
