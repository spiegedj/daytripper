import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { getDayLabel } from "../../itinerary/dayLabels";
import type { ITrip } from "../../itinerary/types";
import { DayRail } from "../DayRail/DayRail";
import { DayTimeline } from "../DayTimeline/DayTimeline";
import { TripPicker } from "../TripPicker/TripPicker";
import { TripSummary } from "../TripSummary/TripSummary";
import styles from "./ItineraryPanel.module.css";

export interface IItineraryPanelProps
{
	trip: ITrip;
	/** Every trip on the site, for the trip picker. */
	trips: ITrip[];
	onSelectTrip: (tripId: string) => void;
	/** The settings button, shown at the end of the panel's header. */
	settingsMenu: ReactNode;
	dayIndex: number;
	stopIndex: number;
	isOverview: boolean;
	highlightedDayNumber?: number;
	onSelectDay: (dayIndex: number) => void;
	onSelectStop: (stopIndex: number) => void;
	onOpenDetails: () => void;
	onShowOverview: () => void;
	onHighlightDay: (dayNumber: number | undefined) => void;
	/** Width of the panel while details are switched on, so photos have room; unset keeps the usual width. */
	widePanelWidth?: number;
	/** Set while the wide panel can be resized: the widths its right-edge handle can drag between. */
	resizeLimits?: IResizeLimits;
	/** Called with each width while dragging, then once more with isFinal set when the drag (or key press) ends. */
	onResize?: (width: number, isFinal: boolean) => void;
	/** The current stop's photos and details, shown inside the timeline; see DayTimeline. */
	currentStopDetails?: ReactNode;
	isCurrentStopDetailsOpen?: boolean;
	onCloseDetails?: () => void;
}

export interface IResizeLimits
{
	minimum: number;
	maximum: number;
}

const keyboardResizeStep = 20;

interface IResizeHandleProps
{
	width: number;
	limits: IResizeLimits;
	onResize: (width: number, isFinal: boolean) => void;
	onDraggingChange: (isDragging: boolean) => void;
}

/** The grip just right of the wide panel, in the gap before the map (the panel's own edge holds its scrollbar):
    drag it, or focus it and use the arrow keys. */
function ResizeHandle({ width, limits, onResize, onDraggingChange }: IResizeHandleProps)
{
	// Where the drag started, so the panel edge follows the pointer exactly.
	const dragStart = useRef<{ pointerX: number; width: number; lastWidth: number } | undefined>(undefined);
	const [isDragging, setIsDragging] = useState(false);
	const clamp = (nextWidth: number) => Math.round(Math.min(Math.max(nextWidth, limits.minimum), limits.maximum));

	const handlePointerDown = (event: PointerEvent<HTMLDivElement>) =>
	{
		if (event.button !== 0)
		{
			return;
		}
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		dragStart.current = { pointerX: event.clientX, width, lastWidth: width };
		setIsDragging(true);
		onDraggingChange(true);
	};
	const handlePointerMove = (event: PointerEvent<HTMLDivElement>) =>
	{
		const start = dragStart.current;
		if (start)
		{
			start.lastWidth = clamp(start.width + event.clientX - start.pointerX);
			onResize(start.lastWidth, false);
		}
	};
	const endDrag = () =>
	{
		const start = dragStart.current;
		if (start)
		{
			dragStart.current = undefined;
			setIsDragging(false);
			onDraggingChange(false);
			onResize(start.lastWidth, true);
		}
	};
	const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) =>
	{
		const keyWidths: Record<string, number> = {
			ArrowLeft: width - keyboardResizeStep,
			ArrowRight: width + keyboardResizeStep,
			Home: limits.minimum,
			End: limits.maximum,
		};
		if (event.key in keyWidths)
		{
			event.preventDefault();
			onResize(clamp(keyWidths[event.key]), true);
		}
	};

	return (
		<div
			className={`${styles.resizeHandle} ${isDragging ? styles.resizing : ""}`}
			style={{ "--panel-width": `${width}px` } as CSSProperties}
			role="separator"
			aria-orientation="vertical"
			aria-label="Resize the itinerary"
			aria-valuenow={width}
			aria-valuemin={limits.minimum}
			aria-valuemax={limits.maximum}
			tabIndex={0}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endDrag}
			onPointerCancel={endDrag}
			onKeyDown={handleKeyDown}
		/>
	);
}

/** The side panel (a bottom sheet on phones): trip title, Day/Trip switch, day rail, and either one day's timeline or the trip summary. */
export function ItineraryPanel(props: IItineraryPanelProps)
{
	const { trip, trips, onSelectTrip, dayIndex, stopIndex, isOverview, highlightedDayNumber, onSelectDay, onSelectStop, onOpenDetails, onShowOverview, onHighlightDay } = props;
	const { settingsMenu, widePanelWidth, resizeLimits, onResize, currentStopDetails, isCurrentStopDetailsOpen = false, onCloseDetails } = props;
	const day = trip.days[dayIndex];
	const [isResizing, setIsResizing] = useState(false);

	return (
		<>
			<aside className={`${styles.panel} ${isResizing ? styles.resizing : ""}`} style={{ "--day-color": day.color, width: widePanelWidth } as CSSProperties}>
				<header className={styles.header}>
					<img className={styles.logo} src={`${import.meta.env.BASE_URL}icon.svg`} alt="" />
					<span className={styles.brand}>Daytripper</span>
					<div className={styles.tripName}><TripPicker trips={trips} currentTripId={trip.id} onSelectTrip={onSelectTrip} /></div>
					<div className={styles.viewSwitch} role="group" aria-label="View">
						<button type="button" className={`${styles.viewOption} ${isOverview ? "" : styles.viewOptionActive}`} onClick={() => onSelectDay(dayIndex)} aria-pressed={!isOverview}>Day</button>
						<button type="button" className={`${styles.viewOption} ${isOverview ? styles.viewOptionActive : ""}`} onClick={onShowOverview} aria-pressed={isOverview}>Trip</button>
					</div>
					<div className={styles.settings}>{settingsMenu}</div>
				</header>
				<div className={styles.body}>
					<DayRail days={trip.days} selectedDayIndex={isOverview ? -1 : dayIndex} onSelectDay={onSelectDay} />
					<div className={styles.scrollArea}>
						<AnimatePresence mode="wait" initial={false}>
							<motion.div
								key={isOverview ? "overview" : day.dayNumber}
								initial={{ opacity: 0, y: 14 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -14 }}
								transition={{ duration: 0.2, ease: "easeOut" }}
							>
								{isOverview
									? <TripSummary trip={trip} highlightedDayNumber={highlightedDayNumber} onSelectDay={onSelectDay} onHighlightDay={onHighlightDay} />
									: (
										<>
											<div className={styles.dayHeader}>
												<span className={styles.dayEyebrow}>{getDayLabel(day)} · {day.baseCity}</span>
												<h1 className={styles.dayTitle}>{day.title}</h1>
												<span className={styles.daySummary}>{day.stops.length} stops</span>
											</div>
											<DayTimeline day={day} places={trip.places} currentStopIndex={stopIndex} onSelectStop={onSelectStop} onOpenDetails={onOpenDetails}
													tripPhotos={trip.tripPhotos}
													placeDetails={trip.placeDetails}
													currentStopDetails={currentStopDetails}
													isCurrentStopDetailsOpen={isCurrentStopDetailsOpen}
													onCloseDetails={onCloseDetails}
												/>
										</>
									)}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>
			</aside>
			{widePanelWidth !== undefined && resizeLimits && onResize && (
				<ResizeHandle width={widePanelWidth} limits={resizeLimits} onResize={onResize} onDraggingChange={setIsResizing} />
			)}
		</>
	);
}
