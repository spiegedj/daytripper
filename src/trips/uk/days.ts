import type { IDay, ITravelLeg, IVisitTime, TravelMode } from "../../itinerary/types";

// This trip already happened: legs record how we actually got around, and visit times come from photo timestamps (local BST).
function traveled(mode: TravelMode, lineName?: string): ITravelLeg
{
	return { mode, lineName };
}

function at(start: string, end?: string): IVisitTime
{
	return { start, end };
}

const dayColors = ["#E64980", "#4C6EF5", "#12B886", "#F76707", "#7950F2", "#1098AD", "#D6336C", "#2F9E44", "#5C7CFA", "#E8590C", "#9C36B5", "#0CA678", "#C2255C", "#1C7ED6"];

export const ukDays: IDay[] =
[
	{
		dayNumber: 1,
		date: "2024-10-09",
		title: "Arrival & Westminster",
		baseCity: "London",
		color: dayColors[0],
		stops:
		[
			{ placeId: "heathrowAirport", visit: at("11:10") },
			{ placeId: "waterlooStation", arrival: traveled("train", "Elizabeth line, then Jubilee line") },
			{ placeId: "marlinWaterloo", arrival: traveled("walk") },
			// Photos from Parliament Square at 15:26 and 15:32 show Big Ben and the Supreme Court; the Abbey visit was the next morning.
			{ placeId: "bigBen", arrival: traveled("walk"), visit: at("15:17", "15:32") },
			{ placeId: "trafalgarSquare", arrival: traveled("walk"), visit: at("15:52", "16:09") },
			{ placeId: "goldenJubileeBridge", arrival: traveled("walk"), visit: at("18:24", "18:26") },
			{ placeId: "marlinWaterloo", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 2,
		date: "2024-10-10",
		title: "Westminster Abbey, the galleries & Abbey Road",
		baseCity: "London",
		color: dayColors[1],
		stops:
		[
			{ placeId: "marlinWaterloo" },
			{ placeId: "westminsterAbbey", arrival: traveled("walk"), visit: at("09:47", "10:33") },
			// No photos inside the galleries; they fill the gap between the Abbey and the British Museum.
			{ placeId: "nationalGallery", arrival: traveled("walk") },
			{ placeId: "nationalPortraitGallery", arrival: traveled("walk") },
			{ placeId: "leicesterSquareStation", arrival: traveled("walk") },
			{ placeId: "tottenhamCourtRoadStation", arrival: traveled("subway", "Northern line") },
			{ placeId: "britishMuseum", arrival: traveled("walk"), visit: at("14:48", "15:13") },
			{ placeId: "tottenhamCourtRoadStation", arrival: traveled("walk") },
			{ placeId: "stJohnsWoodStation", arrival: traveled("subway", "Central line, then Jubilee line") },
			{ placeId: "abbeyRoadCrossing", arrival: traveled("walk"), visit: at("17:33", "17:42") },
			{ placeId: "stJohnsWoodStation", arrival: traveled("walk") },
			{ placeId: "waterlooStation", arrival: traveled("subway", "Jubilee line") },
			{ placeId: "marlinWaterloo", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 3,
		date: "2024-10-11",
		title: "Savile Row, Buckingham Palace & the Tower",
		baseCity: "London",
		color: dayColors[2],
		stops:
		[
			{ placeId: "marlinWaterloo" },
			{ placeId: "waterlooStation", arrival: traveled("walk") },
			{ placeId: "piccadillyCircusStation", arrival: traveled("subway", "Bakerloo line") },
			{ placeId: "beatlesRooftop", arrival: traveled("walk"), visit: at("10:02", "10:04") },
			{ placeId: "buckinghamPalace", arrival: traveled("walk"), visit: at("10:24", "10:34") },
			{ placeId: "stJamesPark", arrival: traveled("walk", "Around the lake"), visit: at("11:09", "11:17") },
			{ placeId: "stJamesParkStation", arrival: traveled("walk") },
			{ placeId: "towerHillStation", arrival: traveled("subway", "District line") },
			{ placeId: "towerOfLondon", arrival: traveled("walk"), visit: at("12:01", "16:51") },
			{ placeId: "towerHillStation", arrival: traveled("walk") },
			{ placeId: "westminsterStation", arrival: traveled("subway", "District line") },
			// Night photos of Big Ben, then the London Eye from Westminster Bridge on the walk back.
			{ placeId: "bigBen", arrival: traveled("walk"), visit: at("19:54", "19:58") },
			{ placeId: "marlinWaterloo", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 4,
		date: "2024-10-12",
		title: "Windsor Castle",
		baseCity: "London",
		color: dayColors[3],
		stops:
		[
			{ placeId: "marlinWaterloo" },
			{ placeId: "windsorCastle", arrival: traveled("train"), visit: at("10:45", "11:06") },
			{ placeId: "longWalk", arrival: traveled("walk"), visit: at("11:18", "11:29") },
			{ placeId: "windsorCastle", arrival: traveled("walk"), visit: at("12:33", "15:14") },
			{ placeId: "marlinWaterloo", arrival: traveled("train") },
		],
	},
	{
		dayNumber: 5,
		date: "2024-10-13",
		title: "Oxford, then on to Salisbury",
		baseCity: "Salisbury",
		color: dayColors[4],
		stops:
		[
			{ placeId: "marlinWaterloo" },
			{ placeId: "oxfordStation", arrival: traveled("train") },
			{ placeId: "ashmoleanMuseum", arrival: traveled("walk"), visit: at("15:03") },
			{ placeId: "bodleianLibrary", arrival: traveled("walk"), visit: at("15:09", "15:14") },
			{ placeId: "radcliffeCamera", arrival: traveled("walk"), visit: at("15:17") },
			{ placeId: "oxfordBotanicGarden", arrival: traveled("walk"), visit: at("15:53", "16:33") },
			{ placeId: "tolkienGrave", arrival: traveled("bus", "Through the centre and up Woodstock Road"), visit: at("17:27", "17:30") },
			{ placeId: "oxfordStation", arrival: traveled("bus") },
			{ placeId: "peartreeApartments", arrival: traveled("train", "Changing at Basingstoke") },
		],
	},
	{
		dayNumber: 6,
		date: "2024-10-14",
		title: "Stonehenge, Old Sarum & Salisbury",
		baseCity: "Salisbury",
		color: dayColors[5],
		stops:
		[
			{ placeId: "peartreeApartments" },
			{ placeId: "stonehenge", arrival: traveled("bus"), visit: at("11:23", "12:12") },
			{ placeId: "oldSarum", arrival: traveled("bus"), visit: at("14:12", "14:40") },
			{ placeId: "salisburyCathedral", arrival: traveled("bus"), visit: at("15:07", "15:42") },
			{ placeId: "salisburyMuseum", arrival: traveled("walk"), visit: at("16:12") },
			{ placeId: "peartreeApartments", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 7,
		date: "2024-10-15",
		title: "Bath",
		baseCity: "Salisbury",
		color: dayColors[6],
		stops:
		[
			{ placeId: "peartreeApartments" },
			{ placeId: "pulteneyBridge", arrival: traveled("train"), visit: at("10:58", "11:13") },
			{ placeId: "bathAbbey", arrival: traveled("walk"), visit: at("11:22", "11:38") },
			{ placeId: "romanBaths", arrival: traveled("walk"), visit: at("13:07", "14:26") },
			{ placeId: "theCircus", arrival: traveled("walk"), visit: at("15:13", "15:29") },
			{ placeId: "bathAbbey", arrival: traveled("walk"), visit: at("15:52", "17:03") },
			{ placeId: "peartreeApartments", arrival: traveled("train") },
		],
	},
	{
		dayNumber: 8,
		date: "2024-10-16",
		title: "On to York",
		baseCity: "York",
		color: dayColors[7],
		stops:
		[
			{ placeId: "peartreeApartments" },
			{ placeId: "waterlooStation", arrival: traveled("train") },
			{ placeId: "kingsCross", arrival: traveled("subway", "Bakerloo line, then Victoria line") },
			{ placeId: "yorkStation", arrival: traveled("train", "East Coast Main Line") },
			// Includes the climb up the central tower (a 16:23 photo looks down over the rooftops).
			{ placeId: "yorkMinster", arrival: traveled("walk"), visit: at("15:58", "16:46") },
			{ placeId: "deanCourtYork", arrival: traveled("walk") },
		],
	},
	{
		dayNumber: 9,
		date: "2024-10-17",
		title: "York walls & Railway Museum, then Newcastle",
		baseCity: "Newcastle",
		color: dayColors[8],
		stops:
		[
			{ placeId: "deanCourtYork" },
			{ placeId: "yorkMinster", arrival: traveled("walk"), visit: at("10:07", "10:27") },
			// Clockwise from Bootham Bar: Monk Bar 10:30, Walmgate 10:50, Clifford's Tower 11:16, the walls by the station 11:46.
			{ placeId: "yorkCityWalls", arrival: traveled("walk", "The whole loop of the walls"), visit: at("10:30", "11:46") },
			{ placeId: "nationalRailwayMuseum", arrival: traveled("walk") },
			{ placeId: "shambles", arrival: traveled("walk"), visit: at("14:39", "14:40") },
			{ placeId: "maldronNewcastle", arrival: traveled("train") },
		],
	},
	{
		dayNumber: 10,
		date: "2024-10-18",
		title: "Hadrian's Wall",
		baseCity: "Newcastle",
		color: dayColors[9],
		stops:
		[
			{ placeId: "maldronNewcastle" },
			{ placeId: "hexhamStation", arrival: traveled("train", "Tyne Valley line"), visit: at("10:33") },
			{ placeId: "housesteadsFort", arrival: traveled("bus", "AD122 Hadrian's Wall bus"), visit: at("12:15", "13:32") },
			{ placeId: "sycamoreGap", arrival: traveled("walk", "Along the wall"), visit: at("14:16", "14:43") },
			{ placeId: "steelRigg", arrival: traveled("walk"), visit: at("14:52", "15:07") },
			{ placeId: "theSill", arrival: traveled("walk") },
			{ placeId: "hexhamStation", arrival: traveled("bus", "AD122 Hadrian's Wall bus") },
			{ placeId: "maldronNewcastle", arrival: traveled("train", "Tyne Valley line") },
		],
	},
	{
		dayNumber: 11,
		date: "2024-10-19",
		title: "On to Edinburgh & the Castle",
		baseCity: "Edinburgh",
		color: dayColors[10],
		stops:
		[
			{ placeId: "maldronNewcastle" },
			{ placeId: "apexGrassmarket", arrival: traveled("train"), visit: at("11:42") },
			{ placeId: "edinburghCastle", arrival: traveled("walk"), visit: at("13:03", "16:42") },
			{ placeId: "apexGrassmarket", arrival: traveled("walk"), visit: at("16:48") },
		],
	},
	{
		dayNumber: 12,
		date: "2024-10-20",
		title: "Arthur's Seat & museums",
		baseCity: "Edinburgh",
		color: dayColors[11],
		stops:
		[
			{ placeId: "apexGrassmarket" },
			{ placeId: "nationalMuseumOfScotland", arrival: traveled("walk") },
			{ placeId: "arthursSeat", arrival: traveled("walk"), visit: at("13:51", "14:36") },
			{ placeId: "dryDam", arrival: traveled("walk"), visit: at("14:56", "15:27") },
			{ placeId: "scottishNationalGallery", arrival: traveled("walk") },
			{ placeId: "apexGrassmarket", arrival: traveled("walk"), visit: at("17:31") },
		],
	},
	{
		dayNumber: 13,
		date: "2024-10-21",
		title: "Loch Lomond, the Trossachs & Stirling",
		baseCity: "Edinburgh",
		color: dayColors[12],
		stops:
		[
			{ placeId: "apexGrassmarket", visit: at("07:38") },
			{ placeId: "lochLomondShores", arrival: traveled("bus", "Timberbush coach tour"), visit: at("10:20", "10:28") },
			{ placeId: "lochLomondCruise", arrival: traveled("ferry", "Loch Lomond cruise"), visit: at("10:32", "10:54") },
			{ placeId: "threeLochsForestDrive", arrival: traveled("bus", "Timberbush coach tour"), visit: at("12:06") },
			{ placeId: "lochVenachar", arrival: traveled("bus", "Timberbush coach tour"), visit: at("12:33", "12:39") },
			{ placeId: "douneCastle", arrival: traveled("bus", "Timberbush coach tour"), visit: at("14:34") },
			{ placeId: "stirlingCastle", arrival: traveled("bus", "Timberbush coach tour"), visit: at("14:59", "16:50") },
			{ placeId: "theKelpies", arrival: traveled("bus", "Timberbush coach tour"), visit: at("17:17", "17:26") },
			{ placeId: "apexGrassmarket", arrival: traveled("bus", "Timberbush coach tour"), visit: at("21:04") },
		],
	},
	{
		dayNumber: 14,
		date: "2024-10-22",
		title: "Departure",
		baseCity: "Edinburgh",
		color: dayColors[13],
		stops:
		[
			{ placeId: "apexGrassmarket" },
			{ placeId: "edinburghWaverley", arrival: traveled("walk"), visit: at("08:18") },
			{ placeId: "edinburghAirport", arrival: traveled("bus", "Airlink 100") },
		],
	},
];
