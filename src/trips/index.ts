import type { ITrip } from "../itinerary/types";
import { japanTrip } from "./japan/trip";

/** Every trip the site can show. Adding a trip means adding its data folder and listing it here. */
export const trips: ITrip[] = [japanTrip];
