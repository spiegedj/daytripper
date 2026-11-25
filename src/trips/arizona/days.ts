import type { IDay, ITravelLeg, IVisitTime, TravelMode } from "../../itinerary/types";

// This trip already happened: the whole trip was by rental car from Phoenix Sky Harbor, plus walks. Visit times come from the
// traveler's Google Maps Timeline (Arizona time, UTC-7). Fuel and ATM stops are left out.
function traveled(mode: TravelMode, lineName?: string): ITravelLeg
{
	return { mode, lineName };
}

function at(start: string, end?: string): IVisitTime
{
	return { start, end };
}

const drive = "Drive";
const dayColors = ["#E8590C", "#1C7ED6", "#C2255C", "#2F9E44", "#7950F2"];

export const arizonaDays: IDay[] =
[
	{
		dayNumber: 1,
		date: "2025-05-20",
		title: "Phoenix to Tucson & Saguaro",
		baseCity: "Tucson",
		color: dayColors[0],
		stops:
		[
			{ placeId: "phoenixSkyHarbor", visit: at("11:05", "11:37") },
			{ placeId: "phoenixRentalCarCenter", arrival: traveled("car", drive), visit: at("11:49", "12:26") },
			{ placeId: "walmartTempe", arrival: traveled("car", drive), visit: at("12:44", "13:48") },
			{ placeId: "comfortSuitesTucson", arrival: traveled("car", drive), visit: at("15:21", "16:02") },
			{ placeId: "saguaroVisitorCenter", arrival: traveled("car", drive), visit: at("16:46", "17:00") },
			{ placeId: "cactusForestLoop", arrival: traveled("car", drive), visit: at("17:00", "18:06") },
			{ placeId: "guadalajaraFiesta", arrival: traveled("car", drive), visit: at("18:40", "19:50") },
			{ placeId: "comfortSuitesTucson", arrival: traveled("car", drive) },
		],
	},
	{
		dayNumber: 2,
		date: "2025-05-21",
		title: "Tombstone, Douglas & the long drive north",
		baseCity: "Kingman",
		color: dayColors[1],
		stops:
		[
			{ placeId: "comfortSuitesTucson" },
			{ placeId: "mcDonaldsOracleRoad", arrival: traveled("car", drive), visit: at("07:57", "08:05") },
			{ placeId: "tucsonLot", arrival: traveled("car", drive), visit: at("09:04", "09:29") },
			{ placeId: "tombstone", arrival: traveled("car", drive), visit: at("11:06", "11:18") },
			{ placeId: "carlsJrDouglas", arrival: traveled("car", drive), visit: at("12:20", "12:54") },
			// Back west through Bisbee (past the Lavender Pit) and Sierra Vista to I-10, without stopping.
			{ placeId: "jackInTheBoxSurprise", arrival: traveled("car", drive), visit: at("18:39", "19:07") },
			{ placeId: "clarionKingman", arrival: traveled("car", drive), visit: at("21:34") },
		],
	},
	{
		dayNumber: 3,
		date: "2025-05-22",
		title: "Yucca, Diamond Bar Road & Route 66",
		baseCity: "Williams",
		color: dayColors[2],
		stops:
		[
			{ placeId: "clarionKingman" },
			{ placeId: "yuccaLotsNorth", arrival: traveled("car", drive), visit: at("10:13", "10:49") },
			{ placeId: "yuccaLotsSouth", arrival: traveled("car", drive), visit: at("11:26", "11:56") },
			{ placeId: "wendysKingman", arrival: traveled("car", drive), visit: at("12:45", "13:22") },
			// Towards Grand Canyon West, turning back before the climb up the cliffs.
			{ placeId: "diamondBarRoad", arrival: traveled("car", drive), visit: at("14:47", "14:55") },
			{ placeId: "seligman", arrival: traveled("car", drive), visit: at("17:29", "17:34") },
			{ placeId: "holidayInnWilliams", arrival: traveled("car", drive), visit: at("18:14", "18:43") },
			{ placeId: "cruisersCafe", arrival: traveled("car", drive), visit: at("18:57", "19:48") },
			{ placeId: "holidayInnWilliams", arrival: traveled("car", drive) },
		],
	},
	{
		dayNumber: 4,
		date: "2025-05-23",
		title: "Grand Canyon South Rim",
		baseCity: "Bellemont",
		color: dayColors[3],
		stops:
		[
			{ placeId: "holidayInnWilliams" },
			{ placeId: "mcDonaldsWilliams", arrival: traveled("car", drive), visit: at("08:51", "09:01") },
			{ placeId: "grandCanyonVisitorCenter", arrival: traveled("car", drive), visit: at("10:15", "10:40") },
			{ placeId: "matherPoint", arrival: traveled("walk"), visit: at("10:47") },
			{ placeId: "yavapaiPoint", arrival: traveled("walk"), visit: at("11:15", "11:35") },
			{ placeId: "brightAngelFountain", arrival: traveled("walk", "Rim Trail"), visit: at("12:14", "13:08") },
			{ placeId: "pimaPoint", arrival: traveled("car", drive), visit: at("14:01", "14:10") },
			{ placeId: "southKaibabTrailhead", arrival: traveled("car", drive), visit: at("16:24", "17:00") },
			{ placeId: "yakiPoint", arrival: traveled("walk"), visit: at("17:21", "17:29") },
			{ placeId: "grandCanyonVisitorCenter", arrival: traveled("car", drive), visit: at("17:44", "17:54") },
			{ placeId: "bestWesternBellemont", arrival: traveled("car", drive), visit: at("19:17") },
		],
	},
	{
		dayNumber: 5,
		date: "2025-05-24",
		title: "Sedona & Montezuma Castle",
		baseCity: "Phoenix",
		color: dayColors[4],
		stops:
		[
			{ placeId: "bestWesternBellemont" },
			{ placeId: "redRockLoopRoad", arrival: traveled("car", drive), visit: at("09:48", "09:53") },
			{ placeId: "brokenArrowTrailhead", arrival: traveled("car", drive), visit: at("10:21", "10:25") },
			{ placeId: "montezumaCastle", arrival: traveled("car", drive), visit: at("11:18", "11:46") },
			{ placeId: "raisingCanesBellRoad", arrival: traveled("car", drive), visit: at("13:10", "13:26") },
			{ placeId: "phoenixRentalCarCenter", arrival: traveled("car", drive), visit: at("14:23", "14:26") },
			{ placeId: "phoenixSkyHarbor", arrival: traveled("car", drive), visit: at("14:41") },
		],
	},
];
