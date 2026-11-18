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
	// Dublin
	dublinAirport: { name: "Dublin Airport", category: "airport", latitude: 53.42829, longitude: -6.24727 },
	templeBarHotel: { name: "Temple Bar Hotel", category: "hotel", latitude: 53.34588, longitude: -6.26031 },
	theOldMill: { name: "The Old Mill", category: "food", latitude: 53.34566, longitude: -6.26302 },
	dublinCastle: { name: "Dublin Castle", category: "landmark", latitude: 53.34266, longitude: -6.26700 },
	twoPups: { name: "Two Pups Coffee", category: "food", latitude: 53.33939, longitude: -6.27349 },
	stPatricksCathedral: { name: "St Patrick's Cathedral", category: "cathedral", latitude: 53.33956, longitude: -6.27148, landmarkIconScale: 1.2 },
	// The old Roe's Distillery windmill on Thomas Street, passed on the walk to Guinness (15:02 photo, taken from Watling Street).
	stPatricksTower: { name: "St Patrick's Tower", category: "landmark", latitude: 53.34405, longitude: -6.28407 },
	guinnessStorehouse: { name: "Guinness Storehouse", category: "landmark", latitude: 53.34193, longitude: -6.28673 },
	kilkennyCafe: { name: "Kilkenny Café, Nassau Street", category: "food", latitude: 53.34222, longitude: -6.25543 },
	cityQuay: { name: "City Quay & the Liffey", category: "landmark", latitude: 53.34688, longitude: -6.24769 },
	// The 16:18 photo is inside the Museum Building, at the photo's position on the campus.
	trinityCollege: { name: "Trinity College", category: "landmark", latitude: 53.3438, longitude: -6.25521 },
	bookOfKells: { name: "Book of Kells, Trinity College", category: "museum", latitude: 53.34379, longitude: -6.25640 },
	longRoom: { name: "The Long Room, Old Library", category: "museum", latitude: 53.3439, longitude: -6.25682 },
	theQuays: { name: "The Quays", category: "food", latitude: 53.34566, longitude: -6.26332 },
	theOval: { name: "The Oval", category: "food", latitude: 53.34845, longitude: -6.26034 },
	claytonDublinAirport: { name: "Clayton Hotel Dublin Airport", category: "hotel", latitude: 53.41142, longitude: -6.21788 },

	// Wicklow
	powerscourt: { name: "Powerscourt Estate & Gardens", category: "nature", latitude: 53.18300, longitude: -6.18570 },
	avocaPowerscourt: { name: "Avoca café, Powerscourt House", category: "food", latitude: 53.18438, longitude: -6.18754 },
	glendalough: { name: "Glendalough", category: "landmark", latitude: 53.01082, longitude: -6.32634 },
	glendaloughUpperLake: { name: "Upper Lake, Glendalough", category: "nature", latitude: 53.00498, longitude: -6.34641 },

	// Kilkenny
	kilkennyOrmonde: { name: "Kilkenny Ormonde Hotel", category: "hotel", latitude: 52.64961, longitude: -7.25317 },
	blackAbbey: { name: "Black Abbey", category: "cathedral", latitude: 52.65402, longitude: -7.25778 },
	kilkennyCastle: { name: "Kilkenny Castle", category: "landmark", latitude: 52.65029, longitude: -7.24953, landmarkIconScale: 1.2 },
	stCanicesCathedral: { name: "St Canice's Cathedral", category: "cathedral", latitude: 52.65667, longitude: -7.25743 },
	leftBank: { name: "Left Bank", category: "food", latitude: 52.65047, longitude: -7.25158 },

	// Tipperary
	rockOfCashel: { name: "Rock of Cashel", category: "landmark", latitude: 52.52018, longitude: -7.89064, landmarkIconScale: 1.25 },
	horeAbbey: { name: "Hore Abbey", category: "landmark", latitude: 52.51870, longitude: -7.89790 },
	grogans: { name: "Grogan's, Cashel", category: "food", latitude: 52.51615, longitude: -7.89113 },
	cahirCastle: { name: "Cahir Castle", category: "landmark", latitude: 52.37439, longitude: -7.92713 },

	// Cork
	claytonCork: { name: "Clayton Hotel Cork City", category: "hotel", latitude: 51.89876, longitude: -8.46512 },
	corkAndFork: { name: "Cork & Fork", category: "food", latitude: 51.89880, longitude: -8.46841 },
	blarneyCastle: { name: "Blarney Castle", category: "landmark", latitude: 51.92910, longitude: -8.57089 },
	charlesFort: { name: "Charles Fort, Kinsale", category: "landmark", latitude: 51.69636, longitude: -8.49891 },
	stFinBarres: { name: "St Fin Barre's Cathedral", category: "cathedral", latitude: 51.89436, longitude: -8.48050 },
	thomondBar: { name: "Thomond Bar", category: "food", latitude: 51.89790, longitude: -8.47271 },

	// Kerry
	internationalKillarney: { name: "The International Hotel Killarney", category: "hotel", latitude: 52.05801, longitude: -9.50743 },
	theShire: { name: "The Shire", category: "food", latitude: 52.06017, longitude: -9.50641 },
	robsRanchHouse: { name: "Rob's Ranch House", category: "food", latitude: 52.05866, longitude: -9.50828 },
	killarneyBrewing: { name: "Killarney Brewing", category: "food", latitude: 52.05431, longitude: -9.50706 },
	fahanBeehiveHuts: { name: "Fahan beehive huts", category: "landmark", latitude: 52.10072, longitude: -10.42485 },
	sleaHead: { name: "Slea Head", category: "nature", latitude: 52.09809, longitude: -10.45530 },
	dunmoreHead: { name: "Dunmore Head", category: "nature", latitude: 52.10900, longitude: -10.47400 },
	blasketCentre: { name: "Blasket Centre", category: "museum", latitude: 52.13222, longitude: -10.46321 },
	rossCastle: { name: "Ross Castle", category: "landmark", latitude: 52.04117, longitude: -9.53149 },
	muckrossHouse: { name: "Muckross House", category: "landmark", latitude: 52.01825, longitude: -9.50398 },
	ladiesView: { name: "Ladies View", category: "nature", latitude: 51.96715, longitude: -9.59290 },
	staigueFort: { name: "Staigue Fort", category: "landmark", latitude: 51.80501, longitude: -10.01544 },
	coomakistaPass: { name: "Coomakista Pass", category: "nature", latitude: 51.77348, longitude: -10.14534 },
	skelligRing: { name: "Skellig Michael view, Skellig Ring", category: "nature", latitude: 51.83039, longitude: -10.32292 },
	kerryCliffs: { name: "Kerry Cliffs", category: "nature", latitude: 51.86836, longitude: -10.38696 },

	// Limerick
	kingJohnsCastle: { name: "King John's Castle", category: "landmark", latitude: 52.66969, longitude: -8.62507 },

	// Galway, Clare and the Aran Islands
	eyreSquareHotel: { name: "Eyre Square Hotel", category: "hotel", latitude: 53.27428, longitude: -9.04745 },
	anPucan: { name: "An Púcán", category: "food", latitude: 53.27451, longitude: -9.04745 },
	mcGettigans: { name: "McGettigan's", category: "food", latitude: 53.27564, longitude: -9.04911 },
	cliffsOfMoher: { name: "Cliffs of Moher", category: "nature", latitude: 52.97192, longitude: -9.42582, landmarkIconScale: 1.2 },
	hagsHeadTrail: { name: "Cliff path towards Hag's Head", category: "nature", latitude: 52.94816, longitude: -9.46774 },
	rossaveal: { name: "Rossaveal ferry port", category: "station", latitude: 53.26690, longitude: -9.56110 },
	kilronan: { name: "Kilronan, Inis Mór", category: "station", latitude: 53.12060, longitude: -9.66530 },
	sevenChurches: { name: "Na Seacht dTeampaill (Seven Churches)", category: "landmark", latitude: 53.14590, longitude: -9.77765 },
	dunAonghasa: { name: "Dún Aonghasa", category: "landmark", latitude: 53.12546, longitude: -9.76658 },
	cliffsFromTheSea: { name: "Cliffs of Moher from the sea", category: "nature", latitude: 52.97450, longitude: -9.45599 },
	doolinPier: { name: "Doolin Pier", category: "station", latitude: 53.01541, longitude: -9.40485 },
	kylemoreAbbey: { name: "Kylemore Abbey", category: "landmark", latitude: 53.56174, longitude: -9.88941, landmarkIconScale: 1.2 },
};

export const irelandPlaces: Record<string, IPlace> = Object.fromEntries(
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
