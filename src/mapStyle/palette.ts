/** Colors for the stylized base map. Swapping this object restyles the whole map. */
export interface IMapPalette
{
	land: string;
	residential: string;
	park: string;
	forest: string;
	water: string;
	waterLabel: string;
	building: string;
	buildingOutline: string;
	minorRoad: string;
	majorRoad: string;
	majorRoadCasing: string;
	highway: string;
	highwayCasing: string;
	rail: string;
	placeLabel: string;
	labelHalo: string;
}

export const pastelPalette: IMapPalette =
{
	land: "#EEF2DF",
	residential: "#E8EDD6",
	park: "#C3E6AC",
	forest: "#AFDB98",
	water: "#8FD0E0",
	waterLabel: "#3B8EA5",
	building: "#E2E5D6",
	buildingOutline: "#D2D6C4",
	minorRoad: "#FFFFFF",
	majorRoad: "#FFFAEF",
	majorRoadCasing: "#EBDDBF",
	highway: "#FFE0B8",
	highwayCasing: "#EFC48F",
	rail: "#A5B0BC",
	placeLabel: "#6E7A60",
	labelHalo: "#F7F9EF",
};
