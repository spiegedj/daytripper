import type { IDay, ITravelLeg, TravelMode } from "../../itinerary/types";

// Travel between stops has not been decided yet, so every leg is a best guess at the usual route.
function guessed(mode: TravelMode, minutes: number, lineName?: string): ITravelLeg
{
	return { mode, minutes, lineName, isGuess: true };
}

const dayColors = ["#E64980", "#4C6EF5", "#12B886", "#F76707", "#7950F2", "#1098AD", "#D6336C", "#2F9E44", "#5C7CFA", "#E8590C", "#9C36B5", "#0CA678", "#C2255C", "#1C7ED6", "#F08C00"];

export const japanDays: IDay[] =
[
	{
		dayNumber: 1,
		title: "Arrival",
		baseCity: "Tokyo",
		color: dayColors[0],
		stops:
		[
			{ placeId: "hanedaAirport" },
			{ placeId: "tokyoDomeHotel", arrival: guessed("train", 50, "Keikyu + Toei Mita Line") },
		],
	},
	{
		dayNumber: 2,
		title: "Harajuku, Shibuya & Shinjuku",
		baseCity: "Tokyo",
		color: dayColors[1],
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "harajukuStation", arrival: guessed("train", 30, "JR Chūō + Yamanote Line") },
			{ placeId: "meijiJingu", arrival: guessed("walk", 10) },
			{ placeId: "takeshitaStreet", arrival: guessed("walk", 12) },
			{ placeId: "shibuyaCrossing", arrival: guessed("walk", 20) },
			{ placeId: "shibuyaSky", arrival: guessed("walk", 5) },
			{ placeId: "nintendoTokyo", arrival: guessed("walk", 8) },
			{ placeId: "shinjukuGyoen", arrival: guessed("train", 20, "JR Yamanote Line") },
			{ placeId: "shinjuku", arrival: guessed("walk", 15) },
			{ placeId: "godzillaHead", arrival: guessed("walk", 8) },
			{ placeId: "hanazonoShrine", arrival: guessed("walk", 6) },
		],
	},
	{
		dayNumber: 3,
		title: "Imperial Palace & Odaiba",
		baseCity: "Tokyo",
		color: dayColors[2],
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "tokyoStation", arrival: guessed("subway", 15, "Marunouchi Line") },
			{ placeId: "imperialPalaceEastGardens", arrival: guessed("walk", 12) },
			{ placeId: "ninomaruGarden", arrival: guessed("walk", 5) },
			{ placeId: "imperialPalace", arrival: guessed("walk", 15) },
			{ placeId: "odaiba", arrival: guessed("train", 35, "Yurikamome") },
			{ placeId: "hamarikyuGardens", arrival: guessed("ferry", 25, "Tokyo Water Bus") },
			{ placeId: "diverCity", arrival: guessed("train", 30, "Yurikamome") },
			{ placeId: "miraikan", arrival: guessed("walk", 10) },
		],
	},
	{
		dayNumber: 4,
		title: "Asakusa & Skytree",
		baseCity: "Tokyo",
		color: dayColors[3],
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "asakusaStation", arrival: guessed("subway", 20, "Toei Ōedo + Ginza Line") },
			{ placeId: "nakamiseStreet", arrival: guessed("walk", 3) },
			{ placeId: "sensoJi", arrival: guessed("walk", 5) },
			{ placeId: "tokyoNationalMuseum", arrival: guessed("subway", 20, "Ginza Line") },
			{ placeId: "tokyoSkytree", arrival: guessed("train", 30, "Keisei + Tobu Line") },
		],
	},
	{
		dayNumber: 5,
		title: "Nikkō day trip",
		baseCity: "Tokyo",
		color: dayColors[4],
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "tobuNikkoStation", arrival: guessed("train", 135, "Tobu Limited Express from Asakusa") },
			{ placeId: "shinkyoBridge", arrival: guessed("walk", 20) },
			{ placeId: "shoyoEnGarden", arrival: guessed("walk", 6) },
			{ placeId: "rinnojiTemple", arrival: guessed("walk", 3) },
			{ placeId: "nikkoToshogu", arrival: guessed("walk", 8) },
			{ placeId: "futarasanShrine", arrival: guessed("walk", 6) },
			{ placeId: "kanmangafuchiAbyss", arrival: guessed("walk", 25) },
			{ placeId: "tamozawaVilla", arrival: guessed("walk", 15) },
			{ placeId: "ryuzuFalls", arrival: guessed("bus", 45, "Tobu Bus to Lake Chūzenji") },
		],
	},
	{
		dayNumber: 6,
		title: "Tokyo → Kyoto",
		baseCity: "Kyoto",
		color: dayColors[5],
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "kyotoFourSisters", arrival: guessed("shinkansen", 180, "Tōkaidō Shinkansen") },
			{ placeId: "nijoCastle", arrival: guessed("walk", 20) },
			{ placeId: "kyotoBotanicalGardens", arrival: guessed("subway", 25, "Karasuma Line") },
		],
	},
	{
		dayNumber: 7,
		title: "Higashiyama & Fushimi Inari",
		baseCity: "Kyoto",
		color: dayColors[6],
		stops:
		[
			{ placeId: "kyotoFourSisters" },
			{ placeId: "kiyomizuDera", arrival: guessed("bus", 30, "City Bus") },
			{ placeId: "sannenzaka", arrival: guessed("walk", 8) },
			{ placeId: "kenninJi", arrival: guessed("walk", 15) },
			{ placeId: "higashiyama", arrival: guessed("walk", 10) },
			{ placeId: "fushimiInari", arrival: guessed("train", 30, "Keihan Line") },
			{ placeId: "mountInari", arrival: guessed("walk", 60) },
		],
	},
	{
		dayNumber: 8,
		title: "Nara day trip",
		baseCity: "Kyoto",
		color: dayColors[7],
		stops:
		[
			{ placeId: "kyotoFourSisters" },
			{ placeId: "kintetsuNaraStation", arrival: guessed("train", 60, "Kintetsu Kyoto Line") },
			{ placeId: "kofukujiChukondo", arrival: guessed("walk", 8) },
			{ placeId: "kofukujiMuseum", arrival: guessed("walk", 3) },
			{ placeId: "naraNationalMuseum", arrival: guessed("walk", 8) },
			{ placeId: "nandaimon", arrival: guessed("walk", 8) },
			{ placeId: "todaiji", arrival: guessed("walk", 5) },
			{ placeId: "nigatsudo", arrival: guessed("walk", 10) },
			{ placeId: "kasugaTaisha", arrival: guessed("walk", 20) },
		],
	},
	{
		dayNumber: 9,
		title: "Arashiyama",
		baseCity: "Kyoto",
		color: dayColors[8],
		stops:
		[
			{ placeId: "kyotoFourSisters" },
			{ placeId: "arashiyamaBamboo", arrival: guessed("train", 35, "JR Sagano Line") },
			{ placeId: "tenryuJi", arrival: guessed("walk", 5) },
			{ placeId: "monkeyPark", arrival: guessed("walk", 20) },
			{ placeId: "okochiSanso", arrival: guessed("walk", 20) },
			{ placeId: "hozugawaStart", arrival: guessed("train", 30, "JR Sagano Line to Kameoka") },
			{ placeId: "hozugawaEnd", arrival: guessed("boat", 120, "Hozugawa river boat") },
		],
		openQuestions: ["The river boat starts upriver in Kameoka, so it may fit better before the Arashiyama sights."],
	},
	{
		dayNumber: 10,
		title: "Kurama & Kifune",
		baseCity: "Kyoto",
		color: dayColors[9],
		stops:
		[
			{ placeId: "kyotoFourSisters" },
			{ placeId: "kuramaDera", arrival: guessed("train", 45, "Keihan + Eizan Railway") },
			{ placeId: "kifuneShrine", arrival: guessed("walk", 90, "Mountain trail over Kurama") },
		],
	},
	{
		dayNumber: 11,
		title: "Himeji Castle",
		baseCity: "Hiroshima",
		color: dayColors[10],
		stops:
		[
			{ placeId: "kyotoFourSisters" },
			{ placeId: "himejiCastle", arrival: guessed("shinkansen", 75, "Sanyō Shinkansen") },
			{ placeId: "sohshaShrine", arrival: guessed("walk", 10) },
			{ placeId: "kokoEn", arrival: guessed("walk", 10) },
			{ placeId: "mtShosha", arrival: guessed("bus", 45, "Shinki Bus + Shosha Ropeway") },
			{ placeId: "nagiHotel", arrival: guessed("shinkansen", 110, "Sanyō Shinkansen") },
		],
	},
	{
		dayNumber: 12,
		title: "Hiroshima",
		baseCity: "Hiroshima",
		color: dayColors[11],
		stops:
		[
			{ placeId: "nagiHotel" },
			{ placeId: "peaceMuseum", arrival: guessed("tram", 25, "Hiroden streetcar") },
			{ placeId: "peacePark", arrival: guessed("walk", 3) },
			{ placeId: "atomicBombDome", arrival: guessed("walk", 8) },
			{ placeId: "hiroshimaCastle", arrival: guessed("walk", 15) },
			{ placeId: "gokokuShrine", arrival: guessed("walk", 3) },
		],
	},
	{
		dayNumber: 13,
		title: "Miyajima",
		baseCity: "Miyajima",
		color: dayColors[12],
		stops:
		[
			{ placeId: "nagiHotel" },
			{ placeId: "itsukushimaShrine", arrival: guessed("ferry", 60, "JR Sanyō Line + JR Ferry") },
			{ placeId: "daishoin", arrival: guessed("walk", 10) },
			{ placeId: "mountMisen", arrival: guessed("walk", 90, "Daishō-in hiking trail") },
			{ placeId: "misenMainHall", arrival: guessed("walk", 10) },
			{ placeId: "miyajimaGrandHotel", arrival: guessed("walk", 75) },
		],
	},
	{
		dayNumber: 14,
		title: "Osaka",
		baseCity: "Osaka",
		color: dayColors[13],
		stops:
		[
			{ placeId: "miyajimaGrandHotel" },
			{ placeId: "hiroshimaStation", arrival: guessed("ferry", 50, "JR Ferry + JR Sanyō Line") },
			{ placeId: "osakaCastle", arrival: guessed("shinkansen", 100, "Sanyō Shinkansen") },
			{ placeId: "itamiAirport", arrival: guessed("train", 50, "Osaka Monorail") },
		],
		openQuestions: ["No hotel booked for tonight yet."],
	},
	{
		dayNumber: 15,
		title: "Departure",
		baseCity: "Tokyo",
		color: dayColors[14],
		stops:
		[
			{ placeId: "itamiAirport" },
			{ placeId: "hanedaAirport", arrival: guessed("flight", 70, "Domestic flight") },
		],
	},
];
