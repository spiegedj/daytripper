import type { CSSProperties } from "react";
import type { IPlace } from "../../itinerary/types";
import { CategoryIcon, categoryColors } from "./CategoryIcon";
import outlineStyles from "./landmarkOutline.module.css";
import styles from "./Markers.module.css";

export type StopProgress = "visited" | "current" | "upcoming";

export interface IStopMarkerProps
{
	place: IPlace;
	stopNumber: number;
	/** Replaces the number on the badge, for a landmark visited more than once on the day ("3, 6"). */
	badgeText?: string;
	progress: StopProgress;
	dayColor: string;
	/** Draws a landmark as a small illustration without a label, used when the full one would cover another stop. */
	isCompact?: boolean;
	onSelect: () => void;
}

/** A stop on the map. Famous places render as a freestanding landmark illustration, everything else as a category pin. */
export function StopMarker(props: IStopMarkerProps)
{
	if (!props.place.landmarkIconUrl)
	{
		return <PinMarker {...props} />;
	}
	return props.isCompact ? <MiniLandmarkMarker {...props} /> : <LandmarkMarker {...props} />;
}

function buildMarkerStyle(place: IPlace, dayColor: string): CSSProperties
{
	return {
		"--category-color": categoryColors[place.category],
		"--day-color": dayColor,
		"--landmark-scale": place.landmarkIconScale ?? 1,
	} as CSSProperties;
}

/** The line and target that tie a landmark moved out of the way back to its true location. */
export function LandmarkLeader({ dayColor, elementRef }: { dayColor: string; elementRef: (element: HTMLElement | null) => void })
{
	return (
		<span ref={elementRef} className={styles.leader} style={{ "--day-color": dayColor } as CSSProperties} aria-hidden="true">
			<span className={styles.leaderLine} />
			<span className={styles.leaderTarget} />
		</span>
	);
}

function LandmarkMarker({ place, stopNumber, badgeText, progress, dayColor, onSelect }: IStopMarkerProps)
{
	const isCurrent = progress === "current";
	const classNames = [styles.landmark, isCurrent ? styles.current : "", progress === "visited" ? styles.visited : ""];

	return (
		<button type="button" className={classNames.join(" ")} style={buildMarkerStyle(place, dayColor)} onClick={onSelect} aria-label={place.name}>
			{isCurrent && <span className={styles.groundRing} />}
			<img className={`${styles.landmarkArt} ${outlineStyles.outline}`} src={place.landmarkIconUrl} alt="" draggable={false} />
			<span className={styles.badge}>{badgeText ?? stopNumber}</span>
			<span className={styles.label}>
				<span className={styles.labelName}>{place.name}</span>
				{place.localName && <span className={styles.labelLocalName}>{place.localName}</span>}
			</span>
		</button>
	);
}

function MiniLandmarkMarker({ place, stopNumber, progress, dayColor, onSelect }: IStopMarkerProps)
{
	const classNames = [styles.miniLandmark, progress === "visited" ? styles.visited : ""];

	return (
		<button type="button" className={classNames.join(" ")} style={buildMarkerStyle(place, dayColor)} onClick={onSelect} aria-label={place.name} title={place.name}>
			<img className={`${styles.miniLandmarkArt} ${outlineStyles.outline}`} src={place.landmarkIconUrl} alt="" draggable={false} />
			<span className={styles.badge}>{stopNumber}</span>
		</button>
	);
}

function PinMarker({ place, stopNumber, progress, dayColor, onSelect }: IStopMarkerProps)
{
	const isCurrent = progress === "current";
	const classNames =
	[
		styles.pin,
		place.category === "hotel" ? styles.hotel : "",
		place.category === "station" ? styles.station : "",
		isCurrent ? styles.current : "",
		progress === "visited" ? styles.visited : "",
	];
	const glyphColor = isCurrent ? "#ffffff" : categoryColors[place.category];

	return (
		<button type="button" className={classNames.join(" ")} style={buildMarkerStyle(place, dayColor)} onClick={onSelect} aria-label={place.name} title={place.name}>
			<CategoryIcon category={place.category} size={18} color={glyphColor} />
			<span className={styles.badge}>{stopNumber}</span>
		</button>
	);
}
