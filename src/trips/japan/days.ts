import type { IDay } from "../../itinerary/types";

export const japanDays: IDay[] =
[
	{
		dayNumber: 4,
		title: "Asakusa & Skytree",
		baseCity: "Tokyo",
		color: "#4C6EF5",
		stops:
		[
			{ placeId: "tokyoDomeHotel" },
			{ placeId: "asakusaStation", arrival: { mode: "subway", lineName: "Toei Ōedo + Ginza Line", minutes: 20, isGuess: true } },
			{ placeId: "nakamiseStreet", arrival: { mode: "walk", minutes: 3 } },
			{ placeId: "sensoJi", arrival: { mode: "walk", minutes: 5 } },
			{ placeId: "tokyoNationalMuseum", arrival: { mode: "subway", lineName: "Ginza Line", minutes: 20, isGuess: true } },
			{ placeId: "tokyoSkytree", arrival: { mode: "train", lineName: "Keisei + Tobu lines", minutes: 30, isGuess: true } },
		],
	},
];
