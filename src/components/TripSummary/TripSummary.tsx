import type { CSSProperties } from "react";
import { formatDayRanges, groupDaysByCity } from "../../itinerary/tripOverview";
import type { ITrip } from "../../itinerary/types";
import styles from "./TripSummary.module.css";

export interface ITripSummaryProps
{
	trip: ITrip;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
}

/** The whole trip as a list: each city stay with its days. Hovering a day highlights its route on the map. */
export function TripSummary({ trip, highlightedDayNumber, onSelectDay, onHighlightDay }: ITripSummaryProps)
{
	const stays = groupDaysByCity(trip.days);
	const cityCount = new Set(trip.days.map((day) => day.baseCity)).size;
	const stopCount = trip.days.reduce((total, day) => total + day.stops.length, 0);

	return (
		<div className={styles.summary}>
			<div className={styles.header}>
				<span className={styles.eyebrow}>Trip overview</span>
				<h1 className={styles.title}>{trip.name}</h1>
				<span className={styles.facts}>{trip.days.length} days · {cityCount} cities · {stopCount} stops</span>
			</div>
			<ol className={styles.stays}>
				{stays.map((stay) =>
				{
					const dayNumbers = stay.dayIndexes.map((dayIndex) => trip.days[dayIndex].dayNumber);
					const city = trip.cities.find((candidate) => candidate.name === stay.city);
					return (
						<li key={`${stay.city}-${dayNumbers[0]}`} className={styles.stay}>
							<div className={styles.stayHeader}>
								<span className={styles.stayCity}>{stay.city}</span>
								{city?.localName && <span className={styles.stayLocalName}>{city.localName}</span>}
								<span className={styles.stayDays}>Day {formatDayRanges(dayNumbers)}</span>
							</div>
							<ul className={styles.days}>
								{stay.dayIndexes.map((dayIndex) =>
								{
									const day = trip.days[dayIndex];
									const isHighlighted = day.dayNumber === highlightedDayNumber;
									return (
										<li key={day.dayNumber}>
											<button
												type="button"
												className={`${styles.day} ${isHighlighted ? styles.highlighted : ""}`}
												style={{ "--day-color": day.color } as CSSProperties}
												onClick={() => onSelectDay(dayIndex)}
												onMouseEnter={() => onHighlightDay(day.dayNumber)}
												onMouseLeave={() => onHighlightDay(undefined)}
												onFocus={() => onHighlightDay(day.dayNumber)}
												onBlur={() => onHighlightDay(undefined)}
											>
												<span className={styles.dayNumber}>{day.dayNumber}</span>
												<span className={styles.dayText}>
													<span className={styles.dayTitle}>{day.title}</span>
													<span className={styles.dayMeta}>
														{day.stops.length} stops
														{day.openQuestions && day.openQuestions.length > 0 && <span className={styles.openFlag}> · to be planned</span>}
													</span>
												</span>
												<svg className={styles.chevron} width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
											</button>
										</li>
									);
								})}
							</ul>
						</li>
					);
				})}
			</ol>
		</div>
	);
}
