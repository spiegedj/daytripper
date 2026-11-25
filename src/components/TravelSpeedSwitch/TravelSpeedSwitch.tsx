import { useCallback, useState } from "react";
import { readCookie, writeCookie } from "../../cookies";
import type { TravelSpeed } from "../MapView/followLegWithCamera";
import { SegmentedSwitch, type ISegmentedSwitchOption } from "../SegmentedSwitch/SegmentedSwitch";

const cookieName = "daytripper.travelSpeed";
const defaultTravelSpeed: TravelSpeed = "medium";
const travelSpeeds: TravelSpeed[] = ["slow", "medium", "fast"];

function readTravelSpeedCookie(): TravelSpeed
{
	const storedValue = readCookie(cookieName);
	return travelSpeeds.find((speed) => speed === storedValue) ?? defaultTravelSpeed;
}

/** The viewer's preferred camera travel speed, remembered for a year in a cookie. */
export function useTravelSpeed(): [TravelSpeed, (travelSpeed: TravelSpeed) => void]
{
	const [travelSpeed, setTravelSpeedState] = useState<TravelSpeed>(readTravelSpeedCookie);
	const setTravelSpeed = useCallback((nextTravelSpeed: TravelSpeed) =>
	{
		setTravelSpeedState(nextTravelSpeed);
		writeCookie(cookieName, nextTravelSpeed);
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

/** Switch for how quickly the camera travels between stops. */
export function TravelSpeedSwitch({ travelSpeed, onChange }: ITravelSpeedSwitchProps)
{
	return <SegmentedSwitch label="Travel speed" options={travelSpeedOptions} value={travelSpeed} onChange={onChange} />;
}
