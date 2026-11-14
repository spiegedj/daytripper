import { useCallback, useState } from "react";
import type { TravelSpeed } from "../MapView/followLegWithCamera";
import { SegmentedSwitch, type ISegmentedSwitchOption } from "../SegmentedSwitch/SegmentedSwitch";

const cookieName = "daytripper.travelSpeed";
const cookieLifetimeSeconds = 60 * 60 * 24 * 365;
const defaultTravelSpeed: TravelSpeed = "medium";
const travelSpeeds: TravelSpeed[] = ["slow", "medium", "fast"];

function readTravelSpeedCookie(): TravelSpeed
{
	// Cookies can be blocked; the app then simply starts at the default speed.
	try
	{
		const storedValue = document.cookie
			.split("; ")
			.find((entry) => entry.startsWith(`${cookieName}=`))
			?.slice(cookieName.length + 1);
		return travelSpeeds.find((speed) => speed === storedValue) ?? defaultTravelSpeed;
	}
	catch
	{
		return defaultTravelSpeed;
	}
}

function writeTravelSpeedCookie(travelSpeed: TravelSpeed)
{
	try
	{
		const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${cookieName}=${travelSpeed}; max-age=${cookieLifetimeSeconds}; path=/; SameSite=Lax${secureFlag}`;
	}
	catch
	{
		// Not being able to remember the choice is fine; it still applies for this visit.
	}
}

/** The viewer's preferred camera travel speed, remembered for a year in a cookie. */
export function useTravelSpeed(): [TravelSpeed, (travelSpeed: TravelSpeed) => void]
{
	const [travelSpeed, setTravelSpeedState] = useState<TravelSpeed>(readTravelSpeedCookie);
	const setTravelSpeed = useCallback((nextTravelSpeed: TravelSpeed) =>
	{
		setTravelSpeedState(nextTravelSpeed);
		writeTravelSpeedCookie(nextTravelSpeed);
	}, []);
	return [travelSpeed, setTravelSpeed];
}

const travelSpeedOptions: ISegmentedSwitchOption<TravelSpeed>[] =
[
	{ value: "slow", label: "Slow", title: "Ride slowly between stops" },
	{ value: "medium", label: "Medium", title: "Ride at a steady pace between stops" },
	{ value: "fast", label: "Fast", title: "Ride quickly between stops" },
];

export interface ITravelSpeedSwitchProps
{
	travelSpeed: TravelSpeed;
	onChange: (travelSpeed: TravelSpeed) => void;
}

/** Small floating switch for how quickly the camera travels between stops. */
export function TravelSpeedSwitch({ travelSpeed, onChange }: ITravelSpeedSwitchProps)
{
	const caption = (
		<svg width="16" height="16" viewBox="0 0 24 24">
			<title>Travel speed</title>
			<path d="M4 17a8 8 0 1 1 16 0M12 17l4-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
	return <SegmentedSwitch label="Travel speed" caption={caption} options={travelSpeedOptions} value={travelSpeed} onChange={onChange} />;
}
