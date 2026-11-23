import type { IPlace, PlaceCategory } from "../../itinerary/types";
import { landmarkIcons } from "./landmarks";

interface IPlaceEntry
{
	name: string;
	category: PlaceCategory;
	latitude: number;
	longitude: number;
	landmarkIconScale?: number;
}

// Coordinates come from OpenStreetMap, or from the trip photos' GPS where the spot has no single map entry.
const placeEntries: Record<string, IPlaceEntry> =
{
	// London
	heathrowAirport: { name: "Heathrow Airport", category: "airport", latitude: 51.4677, longitude: -0.4588 },
	marlinWaterloo: { name: "Marlin Waterloo", category: "hotel", latitude: 51.4991, longitude: -0.1136 },
	bigBen: { name: "Big Ben", category: "landmark", latitude: 51.5007, longitude: -0.1246, landmarkIconScale: 1.6 },
	westminsterAbbey: { name: "Westminster Abbey", category: "cathedral", latitude: 51.4994, longitude: -0.1274, landmarkIconScale: 1.55 },
	trafalgarSquare: { name: "Trafalgar Square", category: "landmark", latitude: 51.5080, longitude: -0.1281, landmarkIconScale: 1.5 },
	nationalGallery: { name: "National Gallery", category: "museum", latitude: 51.5089, longitude: -0.1283 },
	nationalPortraitGallery: { name: "National Portrait Gallery", category: "museum", latitude: 51.5093, longitude: -0.1283 },
	goldenJubileeBridge: { name: "Golden Jubilee Bridges", category: "landmark", latitude: 51.5065, longitude: -0.1221 },
	britishMuseum: { name: "British Museum", category: "museum", latitude: 51.5193, longitude: -0.1267, landmarkIconScale: 1.4 },
	abbeyRoadCrossing: { name: "Abbey Road crossing", category: "landmark", latitude: 51.5320, longitude: -0.1773, landmarkIconScale: 1.35 },
	beatlesRooftop: { name: "3 Savile Row", category: "landmark", latitude: 51.5105, longitude: -0.1396 },
	buckinghamPalace: { name: "Buckingham Palace", category: "landmark", latitude: 51.5008, longitude: -0.1430, landmarkIconScale: 1.45 },
	towerOfLondon: { name: "Tower of London", category: "landmark", latitude: 51.5082, longitude: -0.0762, landmarkIconScale: 1.45 },
	// Underground stations: the trip didn't record which ones we used, so these are the natural stations for each hop.
	waterlooStation: { name: "Waterloo Station", category: "station", latitude: 51.5032, longitude: -0.1133 },
	leicesterSquareStation: { name: "Leicester Square Station", category: "station", latitude: 51.5113, longitude: -0.1282 },
	tottenhamCourtRoadStation: { name: "Tottenham Court Road Station", category: "station", latitude: 51.5165, longitude: -0.1309 },
	stJohnsWoodStation: { name: "St John's Wood Station", category: "station", latitude: 51.5347, longitude: -0.1740 },
	piccadillyCircusStation: { name: "Piccadilly Circus Station", category: "station", latitude: 51.5098, longitude: -0.1343 },
	stJamesParkStation: { name: "St James's Park Station", category: "station", latitude: 51.4994, longitude: -0.1335 },
	towerHillStation: { name: "Tower Hill Station", category: "station", latitude: 51.5100, longitude: -0.0765 },
	westminsterStation: { name: "Westminster Station", category: "station", latitude: 51.5010, longitude: -0.1250 },
	stJamesPark: { name: "St James's Park", category: "nature", latitude: 51.5025, longitude: -0.1338 },
	kingsCross: { name: "King's Cross", category: "station", latitude: 51.5317, longitude: -0.1238, landmarkIconScale: 1.4 },
	windsorCastle: { name: "Windsor Castle", category: "landmark", latitude: 51.4838, longitude: -0.6040, landmarkIconScale: 1.5 },
	longWalk: { name: "The Long Walk", category: "nature", latitude: 51.4717, longitude: -0.6048 },

	// Oxford
	oxfordStation: { name: "Oxford Station", category: "station", latitude: 51.7535, longitude: -1.2700 },
	ashmoleanMuseum: { name: "Ashmolean Museum", category: "museum", latitude: 51.7555, longitude: -1.2603 },
	bodleianLibrary: { name: "Bodleian Library", category: "landmark", latitude: 51.7541, longitude: -1.2547 },
	radcliffeCamera: { name: "Radcliffe Camera", category: "landmark", latitude: 51.7535, longitude: -1.2540, landmarkIconScale: 1.45 },
	oxfordBotanicGarden: { name: "Oxford Botanic Garden", category: "nature", latitude: 51.7507, longitude: -1.2475 },
	tolkienGrave: { name: "Tolkien's grave, Wolvercote Cemetery", category: "landmark", latitude: 51.7914, longitude: -1.2749 },

	// Salisbury
	peartreeApartments: { name: "Peartree Serviced Apartments", category: "hotel", latitude: 51.0699, longitude: -1.8050 },
	stonehenge: { name: "Stonehenge", category: "landmark", latitude: 51.1788, longitude: -1.8262, landmarkIconScale: 1.4 },
	oldSarum: { name: "Old Sarum", category: "landmark", latitude: 51.0936, longitude: -1.8050 },
	salisburyCathedral: { name: "Salisbury Cathedral", category: "cathedral", latitude: 51.0650, longitude: -1.7973, landmarkIconScale: 1.6 },
	salisburyMuseum: { name: "The Salisbury Museum", category: "museum", latitude: 51.0645, longitude: -1.8001 },

	// Bath
	pulteneyBridge: { name: "Pulteney Bridge", category: "landmark", latitude: 51.3830, longitude: -2.3579, landmarkIconScale: 1.45 },
	bathAbbey: { name: "Bath Abbey", category: "cathedral", latitude: 51.3815, longitude: -2.3589 },
	romanBaths: { name: "Roman Baths", category: "landmark", latitude: 51.3810, longitude: -2.3597, landmarkIconScale: 1.45 },
	theCircus: { name: "The Circus", category: "landmark", latitude: 51.3857, longitude: -2.3639 },

	// York
	yorkMinster: { name: "York Minster", category: "cathedral", latitude: 53.9624, longitude: -1.0821, landmarkIconScale: 1.55 },
	shambles: { name: "The Shambles", category: "shopping", latitude: 53.9593, longitude: -1.0800 },
	// Placed at Bootham Bar, where the walk round the walls started and finished.
	yorkCityWalls: { name: "York City Walls", category: "landmark", latitude: 53.9621, longitude: -1.0855 },
	nationalRailwayMuseum: { name: "National Railway Museum", category: "museum", latitude: 53.9595, longitude: -1.0948 },
	yorkStation: { name: "York Station", category: "station", latitude: 53.9580, longitude: -1.0931 },
	deanCourtYork: { name: "Dean Court York", category: "hotel", latitude: 53.9620, longitude: -1.0841 },

	// Newcastle and Hadrian's Wall
	maldronNewcastle: { name: "Maldron Hotel Newcastle", category: "hotel", latitude: 54.9716, longitude: -1.6163 },
	hexhamStation: { name: "Hexham Station", category: "station", latitude: 54.9733, longitude: -2.0946 },
	housesteadsFort: { name: "Housesteads Roman Fort", category: "landmark", latitude: 55.0132, longitude: -2.3302, landmarkIconScale: 1.2 },
	sycamoreGap: { name: "Sycamore Gap", category: "nature", latitude: 55.0037, longitude: -2.3740 },
	steelRigg: { name: "Steel Rigg", category: "nature", latitude: 55.0018, longitude: -2.3864 },
	theSill: { name: "The Sill", category: "museum", latitude: 54.9956, longitude: -2.3884 },

	// Edinburgh
	apexGrassmarket: { name: "Apex Grassmarket Hotel", category: "hotel", latitude: 55.9476, longitude: -3.1956 },
	edinburghCastle: { name: "Edinburgh Castle", category: "landmark", latitude: 55.9487, longitude: -3.2004, landmarkIconScale: 1.5 },
	nationalMuseumOfScotland: { name: "National Museum of Scotland", category: "museum", latitude: 55.9471, longitude: -3.1893 },
	arthursSeat: { name: "Arthur's Seat", category: "nature", latitude: 55.9441, longitude: -3.1616 },
	stAnthonysChapel: { name: "St Anthony's Chapel ruins", category: "landmark", latitude: 55.95095, longitude: -3.16143 },
	scottishNationalGallery: { name: "Scottish National Gallery", category: "museum", latitude: 55.9509, longitude: -3.1956 },
	edinburghWaverley: { name: "Edinburgh Waverley", category: "station", latitude: 55.9519, longitude: -3.1904 },
	edinburghAirport: { name: "Edinburgh Airport", category: "airport", latitude: 55.9503, longitude: -3.3594 },

	// The Highlands tour
	lochLomondShores: { name: "Loch Lomond Shores, Balloch", category: "nature", latitude: 56.0059, longitude: -4.5922 },
	lochLomondCruise: { name: "Loch Lomond cruise", category: "nature", latitude: 56.0400, longitude: -4.6219 },
	threeLochsForestDrive: { name: "Three Lochs Forest Drive", category: "nature", latitude: 56.2028, longitude: -4.3846 },
	lochVenachar: { name: "Loch Venachar", category: "nature", latitude: 56.2266, longitude: -4.3233 },
	douneCastle: { name: "Doune Castle", category: "landmark", latitude: 56.1853, longitude: -4.0504 },
	stirlingCastle: { name: "Stirling Castle", category: "landmark", latitude: 56.1240, longitude: -3.9480, landmarkIconScale: 1.5 },
	theKelpies: { name: "The Kelpies", category: "landmark", latitude: 56.0191, longitude: -3.7555, landmarkIconScale: 1.45 },
};

export const ukPlaces: Record<string, IPlace> = Object.fromEntries(
	Object.entries(placeEntries).map(([id, entry]) =>
	{
		const place: IPlace =
		{
			id,
			name: entry.name,
			category: entry.category,
			coordinates: { latitude: entry.latitude, longitude: entry.longitude },
			landmarkIconUrl: landmarkIcons[id],
			landmarkIconScale: entry.landmarkIconScale,
		};
		return [id, place];
	}),
);
