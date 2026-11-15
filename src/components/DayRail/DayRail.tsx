import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { getDayDateParts, getDayLabel } from "../../itinerary/dayLabels";
import { groupDaysByCity } from "../../itinerary/tripOverview";
import type { IDay } from "../../itinerary/types";
import styles from "./DayRail.module.css";

export interface IDayRailProps
{
	days: IDay[];
	selectedDayIndex: number;
	onSelectDay: (dayIndex: number) => void;
}

/**
 * Vertical list of days grouped by the city you sleep in. Each day keeps its color; the selected day is filled.
 * Dated trips show the weekday and day of the month, with the month named on the first day and wherever it changes.
 */
export function DayRail({ days, selectedDayIndex, onSelectDay }: IDayRailProps)
{
	const selectedDayRef = useRef<HTMLButtonElement>(null);
	const cityGroups = useMemo(() => groupDaysByCity(days), [days]);

	useEffect(() =>
	{
		selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [selectedDayIndex]);

	return (
		<nav className={styles.rail} aria-label="Days">
			{cityGroups.map((group) => (
				<section key={`${group.city}-${group.dayIndexes[0]}`} className={styles.group}>
					<h2 className={styles.city}>{group.city}</h2>
					{group.dayIndexes.map((dayIndex) =>
					{
						const day = days[dayIndex];
						const isSelected = dayIndex === selectedDayIndex;
						const dateParts = getDayDateParts(day);
						const previousDateParts = dayIndex > 0 ? getDayDateParts(days[dayIndex - 1]) : undefined;
						const isNewMonth = dateParts !== undefined && dateParts.month !== previousDateParts?.month;
						return (
							<button
								key={day.dayNumber}
								ref={isSelected ? selectedDayRef : undefined}
								type="button"
								className={`${styles.day} ${isSelected ? styles.selected : ""}`}
								style={{ "--day-color": day.color } as CSSProperties}
								onClick={() => onSelectDay(dayIndex)}
								aria-current={isSelected ? "true" : undefined}
								title={`${getDayLabel(day)}: ${day.title}`}
							>
								<span className={styles.dayWord}>{dateParts ? dateParts.weekday : "Day"}</span>
								<span className={styles.dayNumber}>{dateParts ? dateParts.dayOfMonth : day.dayNumber}</span>
								{isNewMonth && <span className={styles.monthTag}>{dateParts.month}</span>}
							</button>
						);
					})}
				</section>
			))}
		</nav>
	);
}
