import type { IDay, ITravelLeg, IVisitTime, TravelMode } from "../../itinerary/types";

// This trip already happened: legs record how we actually got around (a rental car from Dublin Airport), and visit times
// come from photo timestamps (Irish Summer Time). Meals come from the trip's spending sheet, which lists lunch before dinner.
function traveled(mode: TravelMode, lineName?: string): ITravelLeg
{
	return { mode, lineName };
}

function at(start: string, end?: string): IVisitTime
{
	return { start, end };
}

const drive = "Drive";
const dayColors = ["#2F9E44", "#E8590C", "#1C7ED6", "#C2255C", "#0CA678", "#7950F2", "#F59F00", "#1098AD", "#D6336C", "#5C940D", "#4C6EF5", "#E64980", "#12B886", "#9C36B5"];

export const irelandDays: IDay[] =
[
	{
		dayNumber: 1,
		date: "2023-03-30",
		title: "Arrival in Dublin",
		baseCity: "Dublin",
		color: dayColors[0],
		stops:
		[
			{ placeId: "dublinAirport" },
			{ placeId: "templeBarHotel", arrival: traveled("car", drive) },
			{ placeId: "theOldMill", arrival: traveled("walk"), visit: at("20:29", "20:30") },
			{ placeId: "templeBarHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 2,
		date: "2023-03-31",
		title: "Dublin Castle, St Patrick's & Guinness",
		baseCity: "Dublin",
		color: dayColors[1],
		stops:
		[
			{ placeId: "templeBarHotel" },
			{ placeId: "dublinCastle", arrival: traveled("walk"), visit: at("10:48", "12:13") },
			{ placeId: "twoPups", arrival: traveled("walk") },
			{ placeId: "stPatricksCathedral", arrival: traveled("walk"), visit: at("13:31", "14:30") },
			{ placeId: "stPatricksTower", arrival: traveled("walk"), visit: at("15:02") },
			{ placeId: "guinnessStorehouse", arrival: traveled("walk"), visit: at("15:09", "17:05") },
			{ placeId: "templeBarHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 3,
		date: "2023-04-01",
		title: "The Liffey & the Book of Kells",
		baseCity: "Dublin",
		color: dayColors[2],
		stops:
		[
			{ placeId: "templeBarHotel" },
			{ placeId: "kilkennyCafe", arrival: traveled("walk") },
			{ placeId: "cityQuay", arrival: traveled("walk"), visit: at("15:27") },
			{ placeId: "trinityCollege", arrival: traveled("walk"), visit: at("16:18") },
			// No photos at the Book of Kells itself; the exhibition comes before the Long Room upstairs.
			{ placeId: "bookOfKells", arrival: traveled("walk") },
			{ placeId: "longRoom", arrival: traveled("walk"), visit: at("17:01", "17:09") },
			{ placeId: "theQuays", arrival: traveled("walk") },
			{ placeId: "templeBarHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 4,
		date: "2023-04-02",
		title: "Powerscourt & Glendalough",
		baseCity: "Dublin",
		color: dayColors[3],
		stops:
		[
			{ placeId: "templeBarHotel" },
			{ placeId: "powerscourt", arrival: traveled("car", drive), visit: at("10:48", "11:47") },
			{ placeId: "avocaPowerscourt", arrival: traveled("walk") },
			{ placeId: "glendalough", arrival: traveled("car", drive), visit: at("13:41", "14:28") },
			{ placeId: "glendaloughUpperLake", arrival: traveled("walk"), visit: at("14:37", "15:41") },
			{ placeId: "templeBarHotel", arrival: traveled("car", drive) },
			{ placeId: "theOval", arrival: traveled("walk") },
			{ placeId: "templeBarHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 5,
		date: "2023-04-03",
		title: "Kilkenny",
		baseCity: "Kilkenny",
		color: dayColors[4],
		stops:
		[
			{ placeId: "templeBarHotel" },
			// Bags dropped at the hotel first; everything else in Kilkenny was on foot.
			{ placeId: "kilkennyOrmonde", arrival: traveled("car", drive) },
			{ placeId: "blackAbbey", arrival: traveled("walk"), visit: at("13:26", "13:37") },
			{ placeId: "kilkennyCastle", arrival: traveled("walk"), visit: at("15:32", "17:17") },
			// No photos at the museum; the traveler remembers it after the castle.
			{ placeId: "medievalMileMuseum", arrival: traveled("walk") },
			{ placeId: "stCanicesCathedral", arrival: traveled("walk"), visit: at("18:53", "19:03") },
			{ placeId: "leftBank", arrival: traveled("walk"), visit: at("21:06") },
			{ placeId: "kilkennyOrmonde", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 6,
		date: "2023-04-04",
		title: "Rock of Cashel & Cahir Castle, on to Cork",
		baseCity: "Cork",
		color: dayColors[5],
		stops:
		[
			{ placeId: "kilkennyOrmonde" },
			{ placeId: "rockOfCashel", arrival: traveled("car", drive), visit: at("11:18", "12:26") },
			{ placeId: "horeAbbey", arrival: traveled("walk"), visit: at("13:03", "13:31") },
			{ placeId: "grogans", arrival: traveled("walk") },
			{ placeId: "cahirCastle", arrival: traveled("car", drive), visit: at("14:49", "15:54") },
			{ placeId: "claytonCork", arrival: traveled("car", drive) },
			{ placeId: "corkAndFork", arrival: traveled("walk") },
			{ placeId: "claytonCork", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 7,
		date: "2023-04-05",
		title: "Blarney Castle & Kinsale",
		baseCity: "Cork",
		color: dayColors[6],
		stops:
		[
			{ placeId: "claytonCork" },
			{ placeId: "blarneyCastle", arrival: traveled("car", drive), visit: at("10:35", "13:25") },
			{ placeId: "charlesFort", arrival: traveled("car", drive), visit: at("14:39", "15:54") },
			{ placeId: "claytonCork", arrival: traveled("car", drive) },
			{ placeId: "stFinBarres", arrival: traveled("walk"), visit: at("18:34", "18:53") },
			{ placeId: "thomondBar", arrival: traveled("walk") },
			{ placeId: "claytonCork", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 8,
		date: "2023-04-06",
		title: "On to Killarney & the Slea Head Drive",
		baseCity: "Killarney",
		color: dayColors[7],
		stops:
		[
			{ placeId: "claytonCork" },
			{ placeId: "theShire", arrival: traveled("car", drive) },
			{ placeId: "fahanBeehiveHuts", arrival: traveled("car", drive), visit: at("14:39") },
			{ placeId: "sleaHead", arrival: traveled("car", drive), visit: at("14:51", "15:05") },
			{ placeId: "dunmoreHead", arrival: traveled("car", drive), visit: at("15:28", "15:51") },
			{ placeId: "blasketCentre", arrival: traveled("car", drive), visit: at("16:32") },
			{ placeId: "internationalKillarney", arrival: traveled("car", drive) },
			{ placeId: "robsRanchHouse", arrival: traveled("walk") },
			{ placeId: "internationalKillarney", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 9,
		date: "2023-04-07",
		title: "Ring of Kerry",
		baseCity: "Killarney",
		color: dayColors[8],
		stops:
		[
			{ placeId: "internationalKillarney" },
			{ placeId: "rossCastle", arrival: traveled("car", drive), visit: at("08:54", "08:58") },
			{ placeId: "muckrossHouse", arrival: traveled("car", drive) },
			{ placeId: "ladiesView", arrival: traveled("car", drive), visit: at("09:40") },
			{ placeId: "staigueFort", arrival: traveled("car", drive), visit: at("11:11", "11:15") },
			{ placeId: "coomakistaPass", arrival: traveled("car", drive), visit: at("11:43") },
			{ placeId: "skelligRing", arrival: traveled("car", drive), visit: at("12:21", "12:24") },
			{ placeId: "kerryCliffs", arrival: traveled("car", drive), visit: at("12:46", "13:15") },
			{ placeId: "internationalKillarney", arrival: traveled("car", drive) },
			{ placeId: "killarneyBrewing", arrival: traveled("walk") },
			{ placeId: "internationalKillarney", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 10,
		date: "2023-04-08",
		title: "King John's Castle, on to Galway",
		baseCity: "Galway",
		color: dayColors[9],
		stops:
		[
			{ placeId: "internationalKillarney" },
			{ placeId: "mcDonaldsLimerick", arrival: traveled("car", drive) },
			{ placeId: "kingJohnsCastle", arrival: traveled("walk"), visit: at("12:25", "12:31") },
			{ placeId: "eyreSquareHotel", arrival: traveled("car", drive) },
			{ placeId: "anPucan", arrival: traveled("walk") },
			{ placeId: "eyreSquareHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 11,
		date: "2023-04-09",
		title: "Cliffs of Moher",
		baseCity: "Galway",
		color: dayColors[10],
		stops:
		[
			{ placeId: "eyreSquareHotel" },
			{ placeId: "cliffsOfMoher", arrival: traveled("car", drive), visit: at("09:21", "09:45") },
			{ placeId: "hagsHeadTrail", arrival: traveled("walk", "Along the cliff path"), visit: at("10:59", "11:08") },
			{ placeId: "cliffsOfMoher", arrival: traveled("walk", "Back along the cliff path"), visit: at("12:08", "13:48") },
			{ placeId: "eyreSquareHotel", arrival: traveled("car", drive) },
			{ placeId: "mcGettigans", arrival: traveled("walk") },
			{ placeId: "eyreSquareHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 12,
		date: "2023-04-10",
		title: "Inis Mór & the cliffs from the sea",
		baseCity: "Galway",
		color: dayColors[11],
		stops:
		[
			{ placeId: "eyreSquareHotel" },
			// Aran Island Ferries' "Aran Islands and Cliffs of Moher Day Tour" from Galway City (10:08 photo out in Galway Bay).
			{ placeId: "galwayDocks", arrival: traveled("walk") },
			{ placeId: "kilronan", arrival: traveled("ferry", "Ferry from Galway") },
			{ placeId: "sevenChurches", arrival: traveled("bike", "Rented bikes"), visit: at("13:24", "13:44") },
			{ placeId: "dunAonghasa", arrival: traveled("bike", "Bike, then the path up"), visit: at("14:04", "14:22") },
			{ placeId: "kilronan", arrival: traveled("bike"), visit: at("15:39") },
			// The 16:45 photo is Doolin's coast and Doonagore Castle from the boat, heading north.
			{ placeId: "cliffsFromTheSea", arrival: traveled("ferry", "Past Inis Oírr to the cliffs"), visit: at("16:30", "16:45") },
			{ placeId: "galwayDocks", arrival: traveled("ferry", "Back to Galway") },
			{ placeId: "eyreSquareHotel", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 13,
		date: "2023-04-11",
		title: "Kylemore Abbey, then across to Dublin",
		baseCity: "Dublin",
		color: dayColors[12],
		stops:
		[
			{ placeId: "eyreSquareHotel" },
			{ placeId: "kylemoreAbbey", arrival: traveled("car", drive), visit: at("11:00", "13:16") },
			{ placeId: "claytonDublinAirport", arrival: traveled("car", drive) },
		],
	},
	{
		dayNumber: 14,
		date: "2023-04-12",
		title: "Departure",
		baseCity: "Dublin",
		color: dayColors[13],
		stops:
		[
			{ placeId: "claytonDublinAirport" },
			{ placeId: "dublinAirport", arrival: traveled("car", "Return the car") },
		],
	},
];
