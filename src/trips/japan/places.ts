import type { IPlace } from "../../itinerary/types";
import sensoJiIconUrl from "./landmarks/sensoJi.svg";
import tokyoNationalMuseumIconUrl from "./landmarks/tokyoNationalMuseum.svg";
import tokyoSkytreeIconUrl from "./landmarks/tokyoSkytree.svg";

export const japanPlaces: Record<string, IPlace> =
{
	tokyoDomeHotel:
	{
		id: "tokyoDomeHotel",
		name: "Tokyo Dome Hotel",
		localName: "東京ドームホテル",
		category: "hotel",
		coordinates: { latitude: 35.7046, longitude: 139.7534 },
	},
	asakusaStation:
	{
		id: "asakusaStation",
		name: "Asakusa Station",
		localName: "浅草駅",
		category: "station",
		coordinates: { latitude: 35.7106, longitude: 139.7977 },
	},
	nakamiseStreet:
	{
		id: "nakamiseStreet",
		name: "Nakamise Street",
		localName: "仲見世通り",
		category: "shopping",
		coordinates: { latitude: 35.7125, longitude: 139.7965 },
	},
	sensoJi:
	{
		id: "sensoJi",
		name: "Sensō-ji",
		localName: "浅草寺",
		category: "temple",
		coordinates: { latitude: 35.7148, longitude: 139.7967 },
		landmarkIconUrl: sensoJiIconUrl,
	},
	tokyoNationalMuseum:
	{
		id: "tokyoNationalMuseum",
		name: "Tokyo National Museum",
		localName: "東京国立博物館",
		category: "museum",
		coordinates: { latitude: 35.7188, longitude: 139.7765 },
		landmarkIconUrl: tokyoNationalMuseumIconUrl,
	},
	tokyoSkytree:
	{
		id: "tokyoSkytree",
		name: "Tokyo Skytree",
		localName: "東京スカイツリー",
		category: "landmark",
		coordinates: { latitude: 35.7101, longitude: 139.8107 },
		landmarkIconUrl: tokyoSkytreeIconUrl,
		landmarkIconScale: 1.4,
	},
};
