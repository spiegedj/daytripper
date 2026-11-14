import { motion } from "motion/react";
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { findDayExploredAreas } from "../../itinerary/tripOverview";
import type { IDay, IPlace } from "../../itinerary/types";
import { dayOverviewStopIndex } from "../../itinerary/useItineraryNavigation";
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

/**
 * The ordered stops of one day, with how you get between them, led by an overview of the whole day.
 * The current step expands into a highlighted card.
 */
export function DayTimeline({ day, places, currentStopIndex, onSelectStop, onOpenDetails }: IDayTimelineProps)
{
	const currentRowRef = useRef<HTMLLIElement>(null);
	const neighborhoodCount = useMemo(() => findDayExploredAreas(day, 0, places).length, [day, places]);
	const isDayOverview = currentStopIndex === dayOverviewStopIndex;
	const overviewSummary = [
		neighborhoodCount > 0 ? `${neighborhoodCount} ${neighborhoodCount === 1 ? "area" : "areas"}` : undefined,
		`${day.stops.length} stops`,
	].filter(Boolean).join(" · ");

	useEffect(() =>
	{
		currentRowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
	}, [currentStopIndex]);

	return (
		<ol className={styles.timeline} style={{ "--day-color": day.color } as CSSProperties}>
			<li ref={isDayOverview ? currentRowRef : undefined} className={styles.item}>
				<button
					type="button"
					className={`${styles.stop} ${isDayOverview ? styles.current : ""}`}
					onClick={() => onSelectStop(dayOverviewStopIndex)}
					aria-current={isDayOverview ? "step" : undefined}
				>
					{isDayOverview && (
						<motion.span
							layoutId="currentStopHighlight"
							className={styles.highlight}
							transition={{ type: "spring", stiffness: 420, damping: 36 }}
						/>
					)}
					<span className={`${styles.marker} ${styles.overviewMarker}`} style={{ "--category-color": day.color } as CSSProperties}>
						<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
							<path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20" fill="none" stroke={isDayOverview ? "#ffffff" : day.color} strokeWidth="2.2" strokeLinejoin="round" />
						</svg>
					</span>
					<span className={styles.text}>
						<span className={styles.name}>Day overview</span>
						<span className={styles.meta}>{overviewSummary}</span>
					</span>
				</button>
			</li>
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
