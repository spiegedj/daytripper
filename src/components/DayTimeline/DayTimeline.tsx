import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { findDayExploredAreas } from "../../itinerary/tripOverview";
import { buildGoogleMapsUrl } from "../../itinerary/placeLinks";
import type { IDay, IPlace, IPlaceDetails, ITripPhoto } from "../../itinerary/types";
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
	/** The traveler's own photos, keyed "dayNumber:stopIndex"; stops that have some show a photo count. */
	tripPhotos?: Record<string, ITripPhoto[]>;
	/** Wikipedia background per place id, for the current stop's Wikipedia link. */
	placeDetails?: Record<string, IPlaceDetails>;
	/**
	 * When given, the current stop's photos and details open inside the timeline, right under the stop, instead of in a
	 * separate pane. A chevron in the stop's card opens and closes them, and while open the card also links to the place
	 * on Google Maps and Wikipedia. Null means the stop has nothing to unfold (no photos, tips or summary), so the chevron
	 * only reveals the links.
	 */
	currentStopDetails?: ReactNode;
	isCurrentStopDetailsOpen?: boolean;
	onCloseDetails?: () => void;
}

/**
 * The ordered stops of one day, with how you get between them, led by an overview of the whole day.
 * The current step expands into a highlighted card.
 */
export function DayTimeline({ day, places, currentStopIndex, onSelectStop, onOpenDetails, tripPhotos, placeDetails, currentStopDetails, isCurrentStopDetailsOpen = false, onCloseDetails }: IDayTimelineProps)
{
	const currentRowRef = useRef<HTMLLIElement>(null);
	const neighborhoodCount = useMemo(() => findDayExploredAreas(day, 0, places).length, [day, places]);
	const isDayOverview = currentStopIndex === dayOverviewStopIndex;
	const overviewSummary = [
		neighborhoodCount > 0 ? `${neighborhoodCount} ${neighborhoodCount === 1 ? "area" : "areas"}` : undefined,
		`${day.stops.length} stops`,
	].filter(Boolean).join(" · ");

	const currentStopRef = useRef<HTMLButtonElement>(null);
	const previousStopIndexRef = useRef(currentStopIndex);
	// Moving to another stop while its details are open swaps them over at once, so the timeline can scroll straight to
	// the new stop; only the details button unfolds and folds them.
	const isSteppingStops = previousStopIndexRef.current !== currentStopIndex;
	const isShowingDetails = isCurrentStopDetailsOpen && currentStopDetails !== undefined;
	const isUnfolded = isShowingDetails && currentStopDetails !== null;

	useEffect(() =>
	{
		previousStopIndexRef.current = currentStopIndex;
		const row = currentRowRef.current;
		if (!row)
		{
			return;
		}
		if (isDayOverview)
		{
			// The day's title and description sit above the timeline, so the overview scrolls all the way up to show them.
			findScrollingAncestor(row)?.scrollTo({ top: 0, behavior: "smooth" });
		}
		// With details open, the scroll waits for them to reach their final height; see revealCurrentStop.
		else if (!isUnfolded)
		{
			row.scrollIntoView({ behavior: "smooth", block: "nearest" });
		}
	}, [day.dayNumber, currentStopIndex, isDayOverview, isUnfolded]);

	const revealCurrentStop = (definition: unknown) =>
	{
		if (definition !== "unfolded")
		{
			return;
		}
		const reveal = () =>
		{
			const row = currentRowRef.current;
			if (row)
			{
				revealExpandedStop(row, currentStopRef.current ?? row);
			}
		};
		// Two frames later the previous stop's details, which leave at the same moment, are gone from the layout too.
		requestAnimationFrame(() => requestAnimationFrame(() =>
		{
			reveal();
			const row = currentRowRef.current;
			if (!row)
			{
				return;
			}
			// The panel may still be widening, which reflows the row; keep it in place until its size settles.
			const observer = new ResizeObserver(reveal);
			observer.observe(row);
			window.setTimeout(() => observer.disconnect(), revealSettleMilliseconds);
		}));
	};

	return (
		<ol className={styles.timeline} style={{ "--day-color": day.color } as CSSProperties}>
			<li ref={isDayOverview ? currentRowRef : undefined} className={styles.item}>
				<button
					type="button"
					className={`${styles.stop} ${styles.squareStop} ${isDayOverview ? styles.current : ""}`}
					onClick={() => onSelectStop(dayOverviewStopIndex)}
					aria-current={isDayOverview ? "step" : undefined}
				>
					{isDayOverview && <CurrentStepTag />}
					<span className={`${styles.marker} ${styles.overviewMarker}`} style={{ "--category-color": day.color } as CSSProperties}>
						<svg width={isDayOverview ? 22 : 16} height={isDayOverview ? 22 : 16} viewBox="0 0 24 24" aria-hidden="true">
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
				const photoCount = tripPhotos?.[`${day.dayNumber}:${stopIndex}`]?.length ?? 0;
				// Only the current stop's card carries the details chevron (and, while open, its links).
				const hasActions = isCurrent && currentStopDetails !== undefined;
				const wikipediaUrl = placeDetails?.[place.id]?.wikipediaUrl;
				// Room for the open card's icons: the chevron, the map link, and the Wikipedia link when there is one.
				const actionsClass = !hasActions ? "" : !isShowingDetails ? styles.withActions : wikipediaUrl ? styles.withLinks : styles.withMapLink;

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
						<div className={styles.stopRow}>
							<button
								ref={isCurrent ? currentStopRef : undefined}
								type="button"
								className={`${styles.stop} ${place.category === "hotel" ? styles.squareStop : ""} ${isCurrent ? styles.current : ""} ${isVisited ? styles.visited : ""} ${actionsClass}`}
								onClick={() => onSelectStop(stopIndex)}
								aria-current={isCurrent ? "step" : undefined}
							>
								{isCurrent && <CurrentStepTag />}
								<span
									className={`${styles.marker} ${place.category === "hotel" ? styles.hotelMarker : ""}`}
									style={{ "--category-color": categoryColor } as CSSProperties}
								>
									<CategoryIcon category={place.category} size={isCurrent ? 22 : 16} color={isCurrent ? "#ffffff" : categoryColor} />
								</span>
								<span className={styles.text}>
									<span className={styles.name}>{place.name}</span>
									<span className={styles.meta}>
										{place.localName && <span className={styles.localName}>{place.localName}</span>}
										{place.localName && " · "}
										{categoryLabels[place.category]}
									</span>
									{(stop.visit || photoCount > 0) && (
										<span className={styles.visitTime}>
											{stop.visit && (
												<>
													<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="M12 7v5l3 2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
													{stop.visit.end && stop.visit.end !== stop.visit.start ? `${stop.visit.start}–${stop.visit.end}` : stop.visit.start}
												</>
											)}
											{photoCount > 0 && (
												<span className={styles.photoCount} aria-label={`${photoCount} of our photos`}>
													<svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg>
													{photoCount}
												</span>
											)}
										</span>
									)}
								</span>
							</button>
							{hasActions && (
								<StopActions
									place={place}
									wikipediaUrl={wikipediaUrl}
									isExpanded={isShowingDetails}
									onToggle={isShowingDetails ? onCloseDetails : onOpenDetails}
								/>
							)}
						</div>
						<AnimatePresence initial={false} custom={!isSteppingStops}>
							{isCurrent && isUnfolded && (
								<motion.div
									key="details"
									className={styles.inlineDetails}
									custom={!isSteppingStops}
									variants={detailsVariants}
									initial="folded"
									animate="unfolded"
									exit="folded"
									onAnimationComplete={revealCurrentStop}
								>
									{currentStopDetails}
								</motion.div>
							)}
						</AnimatePresence>
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

interface IStopActionsProps
{
	place: IPlace;
	wikipediaUrl?: string;
	isExpanded: boolean;
	onToggle?: () => void;
}

// Sits over the right end of the current stop's card: the chevron that opens its details, and while they are open,
// icon links to the place elsewhere. It is a sibling of the card's button because buttons can't contain buttons.
function StopActions({ place, wikipediaUrl, isExpanded, onToggle }: IStopActionsProps)
{
	return (
		<div className={styles.stopActions}>
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						key="links"
						className={styles.stopLinks}
						initial={{ opacity: 0, x: 10 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 10 }}
						transition={{ duration: 0.16 }}
					>
						<a className={styles.stopAction} href={buildGoogleMapsUrl(place)} target="_blank" rel="noreferrer" aria-label={`Open ${place.name} in Google Maps`} title="Open in Google Maps">
							<svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.4" fill="currentColor" /></svg>
						</a>
						{wikipediaUrl && (
							<a className={styles.stopAction} href={wikipediaUrl} target="_blank" rel="noreferrer" aria-label={`Read about ${place.name} on Wikipedia`} title="Read on Wikipedia">
								<span className={styles.wikipediaMark} aria-hidden="true">W</span>
							</a>
						)}
					</motion.div>
				)}
			</AnimatePresence>
			<button
				type="button"
				className={`${styles.stopAction} ${styles.chevron}`}
				onClick={onToggle}
				aria-expanded={isExpanded}
				aria-label={isExpanded ? "Hide photos and details" : "Show photos and details"}
				title={isExpanded ? "Hide photos & details" : "Photos & details"}
			>
				<svg className={isExpanded ? styles.chevronOpen : undefined} width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
			</button>
		</div>
	);
}

const detailsUnfoldSeconds = 0.22;
// "custom" is whether to animate: false when stepping between stops, so the details swap over instantly.
const detailsVariants: Variants =
{
	folded: (isAnimated: boolean) => ({ opacity: 0, height: 0, transition: { duration: isAnimated ? detailsUnfoldSeconds : 0 } }),
	unfolded: (isAnimated: boolean) => ({ opacity: 1, height: "auto", transition: { duration: isAnimated ? detailsUnfoldSeconds : 0, ease: "easeOut" } }),
};
// Space kept between the revealed stop and the edges of the scrolling area.
const revealMargin = 12;
// Longer than the itinerary panel's width transition, so the scroll follows the row until the panel has finished widening.
const revealSettleMilliseconds = 600;

/**
 * Scrolls the timeline so the current stop and its open details are all in view. When together they are taller than
 * the visible area, the stop's card goes to the top instead, so the photos start right under it.
 */
function revealExpandedStop(row: HTMLElement, stopCard: HTMLElement)
{
	const scroller = findScrollingAncestor(row);
	if (!scroller)
	{
		return;
	}
	const area = scroller.getBoundingClientRect();
	const top = stopCard.getBoundingClientRect().top;
	const bottom = row.getBoundingClientRect().bottom;
	// Whatever sits right above the card (its travel line, or the previous stop) is scrolled fully out of view, so no
	// sliver of it peeks in above the top-aligned card.
	const elementAbove = stopCard.parentElement?.previousElementSibling ?? row.previousElementSibling;
	const aboveBottom = elementAbove ? elementAbove.getBoundingClientRect().bottom : top - revealMargin;
	let distance = 0;
	if (bottom - top + 2 * revealMargin > area.height || top < area.top + revealMargin)
	{
		distance = Math.max(top - revealMargin, aboveBottom) - area.top;
	}
	else if (bottom > area.bottom - revealMargin)
	{
		distance = bottom - area.bottom + revealMargin;
	}
	if (Math.abs(distance) > 1)
	{
		scroller.scrollBy({ top: distance, behavior: "smooth" });
	}
}

function findScrollingAncestor(element: HTMLElement): HTMLElement | undefined
{
	for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement)
	{
		const overflow = getComputedStyle(ancestor).overflowY;
		if (overflow === "auto" || overflow === "scroll")
		{
			return ancestor;
		}
	}
	return undefined;
}

const tagSpring ={ type: "spring", stiffness: 420, damping: 36 } as const;

// The tag's fill and its outline slide between rows together; the outline is a separate layer so it can sit above
// the icon and cover the seam where the icon meets it.
function CurrentStepTag()
{
	return (
		<>
			<motion.span layoutId="currentStopHighlight" className={styles.highlight} transition={tagSpring} />
			<motion.span layoutId="currentStopOutline" className={styles.outline} transition={tagSpring} />
		</>
	);
}

function capitalize(text: string): string
{
	return text.charAt(0).toUpperCase() + text.slice(1);
}
