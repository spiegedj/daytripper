import { useCallback, useEffect, useState } from "react";
import type { ITrip } from "./types";

/** Where the traveler is in the trip: which day and which stop within it. */
export interface IItineraryPosition
{
	dayIndex: number;
	stopIndex: number;
}

/** Navigation state and actions for stepping through a trip. */
export interface IItineraryNavigation
{
	position: IItineraryPosition;
	isAtTripStart: boolean;
	isAtTripEnd: boolean;
	goToNextStop: () => void;
	goToPreviousStop: () => void;
	goToDay: (dayIndex: number) => void;
	goToStop: (stopIndex: number) => void;
}

function clamp(value: number, minimum: number, maximum: number): number
{
	return Math.max(minimum, Math.min(maximum, value));
}

function readPositionFromHash(trip: ITrip): IItineraryPosition
{
	const dayMatch = window.location.hash.match(/day-(\d+)/);
	const stopMatch = window.location.hash.match(/stop-(\d+)/);
	const dayIndex = dayMatch ? trip.days.findIndex((day) => day.dayNumber === Number(dayMatch[1])) : 0;
	const safeDayIndex = Math.max(0, dayIndex);
	const stopCount = trip.days[safeDayIndex].stops.length;
	const stopIndex = stopMatch ? clamp(Number(stopMatch[1]) - 1, 0, stopCount - 1) : 0;
	return { dayIndex: safeDayIndex, stopIndex };
}

/** Tracks the current day and stop, keeps them in the URL hash (#/japan/day-4/stop-3), and wires up arrow keys. */
export function useItineraryNavigation(trip: ITrip): IItineraryNavigation
{
	const [position, setPosition] = useState<IItineraryPosition>(() => readPositionFromHash(trip));
	const lastDayIndex = trip.days.length - 1;

	const goToNextStop = useCallback(() =>
	{
		setPosition(({ dayIndex, stopIndex }) =>
		{
			if (stopIndex < trip.days[dayIndex].stops.length - 1)
			{
				return { dayIndex, stopIndex: stopIndex + 1 };
			}
			return dayIndex < lastDayIndex ? { dayIndex: dayIndex + 1, stopIndex: 0 } : { dayIndex, stopIndex };
		});
	}, [trip, lastDayIndex]);

	const goToPreviousStop = useCallback(() =>
	{
		setPosition(({ dayIndex, stopIndex }) =>
		{
			if (stopIndex > 0)
			{
				return { dayIndex, stopIndex: stopIndex - 1 };
			}
			return dayIndex > 0 ? { dayIndex: dayIndex - 1, stopIndex: trip.days[dayIndex - 1].stops.length - 1 } : { dayIndex, stopIndex };
		});
	}, [trip]);

	const goToDay = useCallback((dayIndex: number) =>
	{
		setPosition({ dayIndex: clamp(dayIndex, 0, lastDayIndex), stopIndex: 0 });
	}, [lastDayIndex]);

	const goToStop = useCallback((stopIndex: number) =>
	{
		setPosition(({ dayIndex }) => ({ dayIndex, stopIndex: clamp(stopIndex, 0, trip.days[dayIndex].stops.length - 1) }));
	}, [trip]);

	useEffect(() =>
	{
		const dayNumber = trip.days[position.dayIndex].dayNumber;
		window.history.replaceState(null, "", `#/${trip.id}/day-${dayNumber}/stop-${position.stopIndex + 1}`);
	}, [trip, position]);

	useEffect(() =>
	{
		const handleKeyDown = (event: KeyboardEvent) =>
		{
			const isTypingInField = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;
			if (isTypingInField)
			{
				return;
			}
			if (event.key === "ArrowRight")
			{
				event.preventDefault();
				goToNextStop();
			}
			else if (event.key === "ArrowLeft")
			{
				event.preventDefault();
				goToPreviousStop();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [goToNextStop, goToPreviousStop]);

	return {
		position,
		isAtTripStart: position.dayIndex === 0 && position.stopIndex === 0,
		isAtTripEnd: position.dayIndex === lastDayIndex && position.stopIndex === trip.days[lastDayIndex].stops.length - 1,
		goToNextStop,
		goToPreviousStop,
		goToDay,
		goToStop,
	};
}
