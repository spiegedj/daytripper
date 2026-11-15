import type { IDay } from "./types";

/** The parts of a dated day, for places that lay them out separately (like the day rail). */
export interface IDayDateParts
{
	weekday: string;
	month: string;
	dayOfMonth: number;
}

// Dates are calendar dates, not moments; reading and formatting them in UTC keeps the viewer's time zone from shifting them a day.
function toCalendarDate(isoDate: string): Date
{
	const [year, month, day] = isoDate.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day));
}

function format(isoDate: string, options: Intl.DateTimeFormatOptions): string
{
	return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(toCalendarDate(isoDate));
}

/** Weekday, month and day of month for a dated day, or undefined when the trip has no dates. */
export function getDayDateParts(day: IDay): IDayDateParts | undefined
{
	if (!day.date)
	{
		return undefined;
	}
	return {
		weekday: format(day.date, { weekday: "short" }),
		month: format(day.date, { month: "short" }),
		dayOfMonth: toCalendarDate(day.date).getUTCDate(),
	};
}

/** A day's short name: "Wed, Oct 9" for a dated trip, otherwise "Day 4". */
export function getDayLabel(day: IDay): string
{
	return day.date ? format(day.date, { weekday: "short", month: "short", day: "numeric" }) : `Day ${day.dayNumber}`;
}

/** A run of days as one label: "Oct 9–13" or "Sep 30–Oct 2" for dated trips, otherwise "Day 1–5, 15". */
export function getDayRangeLabel(days: IDay[], formatNumberedRanges: (dayNumbers: number[]) => string): string
{
	const datedDays = days.filter((day) => day.date).sort((first, second) => (first.date! < second.date! ? -1 : 1));
	if (datedDays.length !== days.length || datedDays.length === 0)
	{
		return `Day ${formatNumberedRanges(days.map((day) => day.dayNumber))}`;
	}
	const first = getDayDateParts(datedDays[0])!;
	const last = getDayDateParts(datedDays[datedDays.length - 1])!;
	if (datedDays.length === 1)
	{
		return `${first.month} ${first.dayOfMonth}`;
	}
	return first.month === last.month
		? `${first.month} ${first.dayOfMonth}–${last.dayOfMonth}`
		: `${first.month} ${first.dayOfMonth}–${last.month} ${last.dayOfMonth}`;
}
