import type { IPlace, PlaceCategory } from "../../itinerary/types";
import { landmarkBounds, landmarkIcons } from "./landmarks";

interface IPlaceEntry
{
	name: string;
	category: PlaceCategory;
	latitude: number;
	longitude: number;
	landmarkIconScale?: number;
}

// Coordinates come from the traveler's Google Maps Timeline visits for this trip, named through OpenStreetMap.
const placeEntries: Record<string, IPlaceEntry> =
{
	// Phoenix
	phoenixSkyHarbor: { name: "Phoenix Sky Harbor Airport, Terminal 3", category: "airport", latitude: 33.43525, longitude: -112.01012 },
	phoenixRentalCarCenter: { name: "Sky Harbor Rental Car Center", category: "landmark", latitude: 33.43042, longitude: -112.04484 },
	walmartTempe: { name: "Walmart Supercenter, Tempe", category: "shopping", latitude: 33.35075, longitude: -111.95985 },
	raisingCanesBellRoad: { name: "Raising Cane's, Bell Road", category: "food", latitude: 33.64024, longitude: -112.11977 },

	// Tucson
	comfortSuitesTucson: { name: "Comfort Suites at Tucson Mall", category: "hotel", latitude: 32.28944, longitude: -110.98120 },
	saguaroVisitorCenter: { name: "Saguaro National Park, Rincon Mountain Visitor Center", category: "nature", latitude: 32.18022, longitude: -110.73630 },
	// The far side of the one-way Cactus Forest Loop Drive, where the timeline's loop turned back towards the visitor center.
	cactusForestLoop: { name: "Cactus Forest Loop Drive", category: "nature", latitude: 32.17412, longitude: -110.71817 },
	guadalajaraFiesta: { name: "Guadalajara Fiesta Mexican Grill", category: "food", latitude: 32.23056, longitude: -110.84044 },
	mcDonaldsOracleRoad: { name: "McDonald's, Oracle Road", category: "food", latitude: 32.28789, longitude: -110.97876 },
	// The traveler's name for it. Where the timeline's 25-minute walk (09:04–09:29) started, off South Azure Sky Trail.
	tucsonLot: { name: "Tucson Lot", category: "nature", latitude: 31.93756, longitude: -110.79011 },

	// Cochise County
	// A short stop at the Circle K on Bruce Street, on the way through town.
	tombstone: { name: "Tombstone", category: "landmark", latitude: 31.71696, longitude: -110.07076 },
	carlsJrDouglas: { name: "Carl's Jr., Douglas", category: "food", latitude: 31.33890, longitude: -109.55977 },

	// The drive north
	jackInTheBoxSurprise: { name: "Jack in the Box, Surprise", category: "food", latitude: 33.63935, longitude: -112.41923 },

	// Kingman and Mohave County
	clarionKingman: { name: "Clarion Kingman", category: "hotel", latitude: 35.21558, longitude: -114.01310 },
	// The traveler's name for them. The two places the timeline path paused: 10:13–10:49 and 11:26–11:56.
	yuccaLotsNorth: { name: "Yucca Lots (north)", category: "nature", latitude: 34.81225, longitude: -114.07824 },
	yuccaLotsSouth: { name: "Yucca Lots (south)", category: "nature", latitude: 34.78054, longitude: -114.09768 },
	wendysKingman: { name: "Wendy's, Kingman", category: "food", latitude: 35.19088, longitude: -114.06885 },
	// Where the drive towards Grand Canyon West turned back, at the foot of the Grand Wash Cliffs (the timeline's furthest point).
	diamondBarRoad: { name: "Diamond Bar Road, below the Grand Wash Cliffs", category: "nature", latitude: 35.95080, longitude: -113.84900 },

	// Route 66
	seligman: { name: "Seligman, Route 66", category: "landmark", latitude: 35.32830, longitude: -112.88535 },
	holidayInnWilliams: { name: "Holiday Inn Express & Suites Williams", category: "hotel", latitude: 35.25127, longitude: -112.19840 },
	cruisersCafe: { name: "Cruiser's Route 66 Café", category: "food", latitude: 35.24995, longitude: -112.18915 },
	mcDonaldsWilliams: { name: "McDonald's, Williams", category: "food", latitude: 35.25710, longitude: -112.19243 },

	// Grand Canyon South Rim
	grandCanyonVisitorCenter: { name: "Grand Canyon Visitor Center", category: "museum", latitude: 36.05912, longitude: -112.10919 },
	matherPoint: { name: "Mather Point", category: "nature", latitude: 36.06160, longitude: -112.10860 },
	yavapaiPoint: { name: "Yavapai Point", category: "nature", latitude: 36.06590, longitude: -112.11720 },
	brightAngelFountain: { name: "Bright Angel Fountain, Bright Angel Lodge", category: "food", latitude: 36.05693, longitude: -112.14064 },
	pimaPoint: { name: "Pima Point", category: "nature", latitude: 36.07179, longitude: -112.20008 },
	southKaibabTrailhead: { name: "South Kaibab Trailhead", category: "nature", latitude: 36.05300, longitude: -112.08360 },
	yakiPoint: { name: "Yaki Point", category: "nature", latitude: 36.05856, longitude: -112.08288 },
	bestWesternBellemont: { name: "Best Western Bellemont Shadow Mountain Inn", category: "hotel", latitude: 35.23840, longitude: -111.82086 },

	// Sedona and the Verde Valley
	redRockLoopRoad: { name: "Red Rock Loop Road", category: "nature", latitude: 34.82827, longitude: -111.81326 },
	brokenArrowTrailhead: { name: "Broken Arrow Trailhead", category: "nature", latitude: 34.84555, longitude: -111.75689 },
	montezumaCastle: { name: "Montezuma Castle", category: "landmark", latitude: 34.61158, longitude: -111.83499 },
};

export const arizonaPlaces: Record<string, IPlace> = Object.fromEntries(
	Object.entries(placeEntries).map(([id, entry]) =>
	{
		const place: IPlace =
		{
			id,
			name: entry.name,
			category: entry.category,
			coordinates: { latitude: entry.latitude, longitude: entry.longitude },
			landmarkIconUrl: landmarkIcons[id],
			landmarkBounds: landmarkBounds[id],
			landmarkIconScale: entry.landmarkIconScale,
		};
		return [id, place];
	}),
);
