import { useCallback, useState } from "react";
import { SegmentedSwitch, type ISegmentedSwitchOption } from "../SegmentedSwitch/SegmentedSwitch";

export type RouteStyle = "real" | "arcs";

const storageKey = "daytripper.routeStyle";

function readStoredRouteStyle(): RouteStyle
{
	// Storage can be unavailable (private windows, blocked site data); the app then simply starts with real routes.
	try
	{
		return window.localStorage.getItem(storageKey) === "arcs" ? "arcs" : "real";
	}
	catch
	{
		return "real";
	}
}

/** The viewer's preferred way of drawing travel legs, remembered in this browser. */
export function useRouteStyle(): [RouteStyle, (routeStyle: RouteStyle) => void]
{
	const [routeStyle, setRouteStyleState] = useState<RouteStyle>(readStoredRouteStyle);
	const setRouteStyle = useCallback((nextRouteStyle: RouteStyle) =>
	{
		setRouteStyleState(nextRouteStyle);
		try
		{
			window.localStorage.setItem(storageKey, nextRouteStyle);
		}
		catch
		{
			// Not being able to remember the choice is fine; it still applies for this visit.
		}
	}, []);
	return [routeStyle, setRouteStyle];
}

const routeStyleOptions: ISegmentedSwitchOption<RouteStyle>[] =
[
	{
		value: "real",
		label: "Real",
		title: "Follow real streets, tracks and rivers",
		icon: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18c3 0 3-5 6-5s2 4 5 4 3-9 7-9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
	},
	{
		value: "arcs",
		label: "Arcs",
		title: "Draw each leg as a simple arc",
		icon: <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 18Q12 2 21 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>,
	},
];

export interface IRouteStyleSwitchProps
{
	routeStyle: RouteStyle;
	onChange: (routeStyle: RouteStyle) => void;
}

/** Small floating switch between real-world routes and simple arcs. */
export function RouteStyleSwitch({ routeStyle, onChange }: IRouteStyleSwitchProps)
{
	return <SegmentedSwitch label="Route style" options={routeStyleOptions} value={routeStyle} onChange={onChange} />;
}
