export type PlaceCategory =
	| "temple"
	| "landmark"
	| "museum"
	| "food"
	| "shopping"
	| "nature"
	| "hotel"
	| "station"
	| "airport";

export type TravelMode =
	| "walk"
	| "subway"
	| "train"
	| "shinkansen"
	| "bus"
	| "ferry"
	| "boat"
	| "flight"
	| "taxi";

/** A point on the map in WGS84 degrees. */
export interface ICoordinates
{
	longitude: number;
	latitude: number;
}

/** A place that can appear in any day's itinerary. Defined once per trip and referenced by id. */
export interface IPlace
{
	id: string;
	name: string;
	localName?: string;
	category: PlaceCategory;
	coordinates: ICoordinates;
	/** URL of a custom illustration. When present the place renders as a freestanding landmark instead of a pin. */
	landmarkIconUrl?: string;
	/** Enlarges slender landmark illustrations so they carry the same visual weight as wide ones. Defaults to 1. */
	landmarkIconScale?: number;
}

/** How the traveler gets to a stop from the previous one. */
export interface ITravelLeg
{
	mode: TravelMode;
	lineName?: string;
	minutes?: number;
	/** True while the route is an estimate rather than a decided plan. */
	isGuess?: boolean;
}

/** One stop within a day. */
export interface IStop
{
	placeId: string;
	time?: string;
	arrival?: ITravelLeg;
}

/** One day of the trip. Days are numbered rather than dated so the public site shows no calendar dates. */
export interface IDay
{
	dayNumber: number;
	title: string;
	baseCity: string;
	color: string;
	stops: IStop[];
}

/** A complete trip: its places and its ordered days. */
export interface ITrip
{
	id: string;
	name: string;
	places: Record<string, IPlace>;
	days: IDay[];
}
