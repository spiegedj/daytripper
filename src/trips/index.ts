import type { ITrip } from "../itinerary/types";
import { japanTrip } from "./japan/trip";
import { ukTrip } from "./uk/trip";

/** Every trip the site can show; the first opens by default. Adding a trip means adding its data folder and listing it here. */
export const trips: ITrip[] = [japanTrip, ukTrip];
