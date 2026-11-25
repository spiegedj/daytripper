import { useCallback, useState } from "react";
import { readCookie, writeCookie } from "../../cookies";

const cookieName = "daytripper.detailsPanelWidth";

/** The width the viewer dragged the itinerary to while details are shown, remembered for a year in a cookie. */
export function useDetailsPanelWidth(defaultWidth: number): [number, (width: number) => void]
{
	const [width, setWidthState] = useState(() =>
	{
		const storedWidth = Number(readCookie(cookieName));
		return Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : defaultWidth;
	});
	const setWidth = useCallback((nextWidth: number) =>
	{
		setWidthState(nextWidth);
		writeCookie(cookieName, String(Math.round(nextWidth)));
	}, []);
	return [width, setWidth];
}
