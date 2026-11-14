import type { CSSProperties } from "react";
import type { IPlace } from "../../itinerary/types";
import { CategoryIcon, categoryColors } from "./CategoryIcon";
import styles from "./Markers.module.css";

export type StopProgress = "visited" | "current" | "upcoming";

export interface IStopMarkerProps
{
	place: IPlace;
	stopNumber: number;
	progress: StopProgress;
	dayColor: string;
	/** Draws a landmark as a plain pin, used when its full illustration would cover another stop. */
	isCompact?: boolean;
	onSelect: () => void;
}

/** A stop on the map. Famous places render as a freestanding landmark illustration, everything else as a category pin. */
export function StopMarker(props: IStopMarkerProps)
{
	return props.place.landmarkIconUrl && !props.isCompact ? <LandmarkMarker {...props} /> : <PinMarker {...props} />;
}

function buildMarkerStyle(place: IPlace, dayColor: string): CSSProperties
{
	return {
		"--category-color": categoryColors[place.category],
		"--day-color": dayColor,
		"--landmark-scale": place.landmarkIconScale ?? 1,
	} as CSSProperties;
}

function LandmarkMarker({ place, stopNumber, progress, dayColor, onSelect }: IStopMarkerProps)
{
	const isCurrent = progress === "current";
	const classNames = [styles.landmark, isCurrent ? styles.current : "", progress === "visited" ? styles.visited : ""];

	return (
		<button type="button" className={classNames.join(" ")} style={buildMarkerStyle(place, dayColor)} onClick={onSelect} aria-label={place.name}>
			{isCurrent && <span className={styles.groundRing} />}
			<img className={styles.landmarkArt} src={place.landmarkIconUrl} alt="" draggable={false} />
			<span className={styles.badge}>{stopNumber}</span>
			<span className={styles.label}>
				<span className={styles.labelName}>{place.name}</span>
				{place.localName && <span className={styles.labelLocalName}>{place.localName}</span>}
			</span>
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
