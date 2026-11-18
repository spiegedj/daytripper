import type { IPlace } from "./types";

/** A Google Maps search for the place by name and position, so it opens on the right spot even for ambiguous names. */
export function buildGoogleMapsUrl(place: IPlace): string
{
	const query = `${place.name} ${place.coordinates.latitude},${place.coordinates.longitude}`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
