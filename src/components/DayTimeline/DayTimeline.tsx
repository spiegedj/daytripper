import { motion } from "motion/react";
import { useEffect, useRef, type CSSProperties } from "react";
import type { IDay, IPlace } from "../../itinerary/types";
import { CategoryIcon, categoryColors, categoryLabels } from "../Markers/CategoryIcon";
import { TravelModeIcon, formatMinutes } from "../TravelModeIcon/TravelModeIcon";
import styles from "./DayTimeline.module.css";

export interface IDayTimelineProps
{
	day: IDay;
	places: Record<string, IPlace>;
	currentStopIndex: number;
	onSelectStop: (stopIndex: number) => void;
	onOpenDetails: () => void;
}

/** The ordered stops of one day, with how you get between them. The current stop expands into a highlighted card. */
export function DayTimeline({ day, places, currentStopIndex, onSelectStop, onOpenDetails }: IDayTimelineProps)
{
	const currentRowRef = useRef<HTMLLIElement>(null);

	useEffect(() =>
	{
		currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [currentStopIndex]);

	return (
		<ol className={styles.timeline} style={{ "--day-color": day.color } as CSSProperties}>
			{day.stops.map((stop, stopIndex) =>
			{
				const place = places[stop.placeId];
				const isCurrent = stopIndex === currentStopIndex;
				const isVisited = stopIndex < currentStopIndex;
				const categoryColor = categoryColors[place.category];

				return (
					<li key={`${stop.placeId}-${stopIndex}`} ref={isCurrent ? currentRowRef : undefined} className={styles.item}>
						{stop.arrival && (
							<div className={`${styles.leg} ${stopIndex <= currentStopIndex ? styles.legTraveled : ""}`}>
								<span className={styles.legIcon}><TravelModeIcon mode={stop.arrival.mode} size={14} /></span>
								<span className={styles.legText}>
									{stop.arrival.lineName ?? capitalize(stop.arrival.mode)}
									{stop.arrival.minutes !== undefined && ` · ${formatMinutes(stop.arrival.minutes)}`}
								</span>
								{stop.arrival.isGuess && <span className={styles.guessTag}>guess</span>}
							</div>
						)}
						<button
							type="button"
							className={`${styles.stop} ${isCurrent ? styles.current : ""} ${isVisited ? styles.visited : ""}`}
							onClick={() => onSelectStop(stopIndex)}
							aria-current={isCurrent ? "step" : undefined}
						>
							{isCurrent && (
								<motion.span
									layoutId="currentStopHighlight"
									className={styles.highlight}
									transition={{ type: "spring", stiffness: 420, damping: 36 }}
								/>
							)}
							<span
								className={`${styles.marker} ${place.category === "hotel" ? styles.hotelMarker : ""}`}
								style={{ "--category-color": categoryColor } as CSSProperties}
							>
								<CategoryIcon category={place.category} size={16} color={isCurrent ? "#ffffff" : categoryColor} />
							</span>
							<span className={styles.text}>
								<span className={styles.name}>{place.name}</span>
								<span className={styles.meta}>
									{place.localName && <span className={styles.localName}>{place.localName}</span>}
									{place.localName && " · "}
									{categoryLabels[place.category]}
								</span>
							</span>
							<span className={styles.number}>{stopIndex + 1}</span>
						</button>
						{isCurrent && (
							<button type="button" className={styles.detailsButton} onClick={onOpenDetails}>
								Photos &amp; details
								<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
							</button>
						)}
					</li>
				);
			})}
			{day.openQuestions?.map((question) => (
				<li key={question} className={styles.openQuestion}>
					<span className={styles.openQuestionLabel}>To be planned</span>
					{question}
				</li>
			))}
		</ol>
	);
}

function capitalize(text: string): string
{
	return text.charAt(0).toUpperCase() + text.slice(1);
}
