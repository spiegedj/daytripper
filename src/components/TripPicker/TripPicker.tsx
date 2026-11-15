import { useEffect, useRef, useState } from "react";
import type { ITrip } from "../../itinerary/types";
import styles from "./TripPicker.module.css";

export interface ITripPickerProps
{
	trips: ITrip[];
	currentTripId: string;
	onSelectTrip: (tripId: string) => void;
}

/** The current trip's name as a small button that opens a list of every trip on the site. */
export function TripPicker({ trips, currentTripId, onSelectTrip }: ITripPickerProps)
{
	const [isOpen, setIsOpen] = useState(false);
	const pickerRef = useRef<HTMLDivElement>(null);
	const currentTrip = trips.find((trip) => trip.id === currentTripId) ?? trips[0];

	useEffect(() =>
	{
		if (!isOpen)
		{
			return;
		}
		const closeOnOutsideClick = (event: PointerEvent) =>
		{
			if (!pickerRef.current?.contains(event.target as Node))
			{
				setIsOpen(false);
			}
		};
		const closeOnEscape = (event: KeyboardEvent) =>
		{
			if (event.key === "Escape")
			{
				setIsOpen(false);
			}
		};
		document.addEventListener("pointerdown", closeOnOutsideClick);
		document.addEventListener("keydown", closeOnEscape);
		return () =>
		{
			document.removeEventListener("pointerdown", closeOnOutsideClick);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, [isOpen]);

	return (
		<div className={styles.picker} ref={pickerRef}>
			<button
				type="button"
				className={styles.current}
				onClick={() => setIsOpen((wasOpen) => !wasOpen)}
				aria-haspopup="true"
				aria-expanded={isOpen}
			>
				{currentTrip.name} · {currentTrip.days.length} days
				<svg className={styles.chevron} width="12" height="12" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
			</button>
			{isOpen && (
				<ul className={styles.menu} aria-label="Trips">
					{trips.map((trip) => (
						<li key={trip.id}>
							<button
								type="button"
								className={`${styles.option} ${trip.id === currentTrip.id ? styles.selected : ""}`}
								onClick={() =>
								{
									setIsOpen(false);
									onSelectTrip(trip.id);
								}}
								aria-current={trip.id === currentTrip.id ? "true" : undefined}
							>
								<span className={styles.optionName}>{trip.name}</span>
								<span className={styles.optionMeta}>{trip.tagline} · {trip.days.length} days</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
