import type { IPlace, PlaceCategory } from "../../itinerary/types";
import { landmarkBounds, landmarkIcons } from "./landmarks";
import { japanPlaceTips } from "./placeTips";

interface IPlaceEntry
{
	name: string;
	localName?: string;
	category: PlaceCategory;
	latitude: number;
	longitude: number;
	landmarkIconScale?: number;
}

const placeEntries: Record<string, IPlaceEntry> =
{
	// Tokyo
	hanedaAirport: { name: "Haneda Airport", localName: "羽田空港", category: "airport", latitude: 35.5457, longitude: 139.7761 },
	tokyoDomeHotel: { name: "Tokyo Dome Hotel", localName: "東京ドームホテル", category: "hotel", latitude: 35.7036, longitude: 139.7535 },
	harajukuStation: { name: "Harajuku Station", localName: "原宿駅", category: "station", latitude: 35.6705, longitude: 139.7024 },
	meijiJingu: { name: "Meiji Jingu", localName: "明治神宮", category: "temple", latitude: 35.6748, longitude: 139.6996 },
	takeshitaStreet: { name: "Takeshita Street", localName: "竹下通り", category: "shopping", latitude: 35.6717, longitude: 139.7029 },
	shibuyaCrossing: { name: "Shibuya Crossing", localName: "渋谷スクランブル交差点", category: "landmark", latitude: 35.6595, longitude: 139.7005 },
	shibuyaSky: { name: "Shibuya Sky", localName: "渋谷スカイ", category: "landmark", latitude: 35.6584, longitude: 139.7022 },
	nintendoTokyo: { name: "Nintendo Tokyo", localName: "ニンテンドートウキョウ", category: "shopping", latitude: 35.6620, longitude: 139.6988 },
	shinjukuGyoen: { name: "Shinjuku Gyoen", localName: "新宿御苑", category: "nature", latitude: 35.6851, longitude: 139.7096 },
	shinjuku: { name: "Shinjuku", localName: "新宿", category: "shopping", latitude: 35.6922, longitude: 139.7006 },
	godzillaHead: { name: "Godzilla Head", localName: "ゴジラヘッド", category: "landmark", latitude: 35.6956, longitude: 139.7023 },
	hanazonoShrine: { name: "Hanazono Shrine", localName: "花園神社", category: "temple", latitude: 35.6933, longitude: 139.7058 },
	tokyoStation: { name: "Tokyo Station", localName: "東京駅", category: "station", latitude: 35.6812, longitude: 139.7671 },
	imperialPalaceEastGardens: { name: "Imperial Palace East Gardens", localName: "皇居東御苑", category: "nature", latitude: 35.6867, longitude: 139.7574 },
	ninomaruGarden: { name: "Ninomaru Garden", localName: "二の丸庭園", category: "nature", latitude: 35.6875, longitude: 139.7589 },
	imperialPalace: { name: "Imperial Palace", localName: "皇居", category: "landmark", latitude: 35.6839, longitude: 139.7507 },
	odaiba: { name: "Odaiba", localName: "お台場", category: "landmark", latitude: 35.6311, longitude: 139.7774 },
	hamarikyuGardens: { name: "Hamarikyu Gardens", localName: "浜離宮恩賜庭園", category: "nature", latitude: 35.6600, longitude: 139.7633 },
	diverCity: { name: "DiverCity Tokyo Plaza", localName: "ダイバーシティ東京", category: "shopping", latitude: 35.6246, longitude: 139.7760 },
	miraikan: { name: "Miraikan", localName: "日本科学未来館", category: "museum", latitude: 35.6192, longitude: 139.7767 },
	asakusaStation: { name: "Asakusa Station", localName: "浅草駅", category: "station", latitude: 35.7114, longitude: 139.7983 },
	nakamiseStreet: { name: "Nakamise Street", localName: "仲見世通り", category: "shopping", latitude: 35.7125, longitude: 139.7965 },
	sensoJi: { name: "Sensō-ji", localName: "浅草寺", category: "temple", latitude: 35.7134, longitude: 139.7955 },
	tokyoNationalMuseum: { name: "Tokyo National Museum", localName: "東京国立博物館", category: "museum", latitude: 35.7190, longitude: 139.7760 },
	tokyoSkytree: { name: "Tokyo Skytree", localName: "東京スカイツリー", category: "landmark", latitude: 35.7101, longitude: 139.8107 },

	// Nikkō
	tobuNikkoStation: { name: "Tōbu-Nikkō Station", localName: "東武日光駅", category: "station", latitude: 36.7476, longitude: 139.6202 },
	shinkyoBridge: { name: "Shinkyō Bridge", localName: "神橋", category: "landmark", latitude: 36.7533, longitude: 139.6040 },
	shoyoEnGarden: { name: "Shōyō-en Garden", localName: "逍遥園", category: "nature", latitude: 36.7542, longitude: 139.6008 },
	rinnojiTemple: { name: "Rinnō-ji", localName: "輪王寺", category: "temple", latitude: 36.7543, longitude: 139.6001 },
	nikkoToshogu: { name: "Nikkō Tōshōgū", localName: "日光東照宮", category: "temple", latitude: 36.7581, longitude: 139.5988 },
	futarasanShrine: { name: "Futarasan Shrine", localName: "二荒山神社", category: "temple", latitude: 36.7584, longitude: 139.5967 },
	kanmangafuchiAbyss: { name: "Kanmangafuchi Abyss", localName: "憾満ヶ淵", category: "nature", latitude: 36.7490, longitude: 139.5884 },
	tamozawaVilla: { name: "Tamozawa Imperial Villa", localName: "田母沢御用邸", category: "museum", latitude: 36.7524, longitude: 139.5911 },
	ryuzuFalls: { name: "Ryūzu Falls", localName: "竜頭の滝", category: "nature", latitude: 36.7577, longitude: 139.4515 },

	// Kyoto
	kyotoFourSisters: { name: "Kyoto Four Sisters Residence", category: "hotel", latitude: 35.0169, longitude: 135.7669 },
	nijoCastle: { name: "Nijō Castle", localName: "二条城", category: "landmark", latitude: 35.0140, longitude: 135.7485 },
	kyotoBotanicalGardens: { name: "Kyoto Botanical Gardens", localName: "京都府立植物園", category: "nature", latitude: 35.0483, longitude: 135.7630 },
	kiyomizuDera: { name: "Kiyomizu-dera", localName: "清水寺", category: "temple", latitude: 34.9949, longitude: 135.7850 },
	sannenzaka: { name: "Sannenzaka", localName: "三年坂", category: "shopping", latitude: 34.9965, longitude: 135.7813 },
	kenninJi: { name: "Kennin-ji", localName: "建仁寺", category: "temple", latitude: 35.0003, longitude: 135.7737 },
	higashiyama: { name: "Higashiyama", localName: "東山", category: "landmark", latitude: 34.9985, longitude: 135.7791 },
	fushimiInari: { name: "Fushimi Inari Taisha", localName: "伏見稲荷大社", category: "temple", latitude: 34.9671, longitude: 135.7727 },
	mountInari: { name: "Mount Inari", localName: "稲荷山", category: "nature", latitude: 34.9653, longitude: 135.7922 },
	arashiyamaBamboo: { name: "Arashiyama Bamboo Forest", localName: "嵐山竹林の小径", category: "nature", latitude: 35.0167, longitude: 135.6712 },
	tenryuJi: { name: "Tenryū-ji", localName: "天龍寺", category: "temple", latitude: 35.0158, longitude: 135.6737 },
	monkeyPark: { name: "Arashiyama Monkey Park", localName: "嵐山モンキーパーク", category: "nature", latitude: 35.0091, longitude: 135.6750 },
	okochiSanso: { name: "Ōkōchi Sansō Garden", localName: "大河内山荘", category: "nature", latitude: 35.0166, longitude: 135.6696 },
	hozugawaStart: { name: "Hozugawa River Boat (start)", localName: "保津川下り乗船場", category: "station", latitude: 35.0174, longitude: 135.5866 },
	hozugawaEnd: { name: "Hozugawa River Boat (end)", localName: "嵐山", category: "station", latitude: 35.0129, longitude: 135.6778 },
	kuramaDera: { name: "Kurama-dera", localName: "鞍馬寺", category: "temple", latitude: 35.1179, longitude: 135.7707 },
	kifuneShrine: { name: "Kifune Shrine", localName: "貴船神社", category: "temple", latitude: 35.1219, longitude: 135.7629 },

	// Nara
	kintetsuNaraStation: { name: "Kintetsu-Nara Station", localName: "近鉄奈良駅", category: "station", latitude: 34.6850, longitude: 135.8261 },
	kofukujiChukondo: { name: "Kōfuku-ji", localName: "興福寺 中金堂", category: "temple", latitude: 34.6830, longitude: 135.8319 },
	kofukujiMuseum: { name: "Kōfuku-ji National Treasure Museum", localName: "興福寺国宝館", category: "museum", latitude: 34.6835, longitude: 135.8325 },
	naraNationalMuseum: { name: "Nara National Museum", localName: "奈良国立博物館", category: "museum", latitude: 34.6831, longitude: 135.8383 },
	nandaimon: { name: "Nandaimon Gate", localName: "南大門", category: "temple", latitude: 34.6858, longitude: 135.8399 },
	todaiji: { name: "Tōdai-ji", localName: "東大寺 大仏殿", category: "temple", latitude: 34.6890, longitude: 135.8398 },
	nigatsudo: { name: "Nigatsu-dō", localName: "二月堂", category: "temple", latitude: 34.6893, longitude: 135.8443 },
	kasugaTaisha: { name: "Kasuga Taisha", localName: "春日大社", category: "temple", latitude: 34.6812, longitude: 135.8484 },

	// Himeji
	himejiCastle: { name: "Himeji Castle", localName: "姫路城", category: "landmark", latitude: 34.8394, longitude: 134.6940 },
	sohshaShrine: { name: "Harima Sōsha Shrine", localName: "播磨国総社", category: "temple", latitude: 34.8338, longitude: 134.6954 },
	kokoEn: { name: "Kōko-en Garden", localName: "好古園", category: "nature", latitude: 34.8371, longitude: 134.6904 },
	mtShosha: { name: "Mt. Shosha", localName: "書写山圓教寺", category: "temple", latitude: 34.8888, longitude: 134.6591 },

	// Hiroshima and Miyajima
	nagiHotel: { name: "NAGI Hiroshima Hotel", localName: "NAGI広島", category: "hotel", latitude: 34.3926, longitude: 132.4756 },
	peaceMuseum: { name: "Peace Memorial Museum", localName: "広島平和記念資料館", category: "museum", latitude: 34.3916, longitude: 132.4531 },
	peacePark: { name: "Peace Memorial Park", localName: "平和記念公園", category: "nature", latitude: 34.3932, longitude: 132.4523 },
	atomicBombDome: { name: "Atomic Bomb Dome", localName: "原爆ドーム", category: "landmark", latitude: 34.3955, longitude: 132.4536 },
	hiroshimaCastle: { name: "Hiroshima Castle", localName: "広島城", category: "landmark", latitude: 34.4022, longitude: 132.4595 },
	gokokuShrine: { name: "Gokoku Shrine", localName: "広島護國神社", category: "temple", latitude: 34.4011, longitude: 132.4589 },
	itsukushimaShrine: { name: "Itsukushima Shrine", localName: "厳島神社", category: "temple", latitude: 34.2960, longitude: 132.3198 },
	daishoin: { name: "Daishō-in", localName: "大聖院", category: "temple", latitude: 34.2917, longitude: 132.3186 },
	mountMisen: { name: "Mount Misen", localName: "弥山", category: "nature", latitude: 34.2796, longitude: 132.3196 },
	misenMainHall: { name: "Misen Main Hall", localName: "弥山本堂", category: "temple", latitude: 34.2803, longitude: 132.3213 },
	miyajimaGrandHotel: { name: "Miyajima Grand Hotel Arimoto", localName: "宮島グランドホテル有もと", category: "hotel", latitude: 34.2960, longitude: 132.3218 },
	hiroshimaStation: { name: "Hiroshima Station", localName: "広島駅", category: "station", latitude: 34.3978, longitude: 132.4756 },

};

export const japanPlaces: Record<string, IPlace> = Object.fromEntries(
	Object.entries(placeEntries).map(([id, entry]) =>
	{
		const place: IPlace =
		{
			id,
			name: entry.name,
			localName: entry.localName,
			category: entry.category,
			coordinates: { latitude: entry.latitude, longitude: entry.longitude },
			landmarkIconUrl: landmarkIcons[id],
			landmarkBounds: landmarkBounds[id],
			landmarkIconScale: entry.landmarkIconScale,
			tips: japanPlaceTips[id],
		};
		return [id, place];
	}),
);
