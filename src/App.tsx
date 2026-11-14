import { useEffect, useState } from "react";
import { MapView } from "./components/MapView/MapView";
import { trips } from "./trips";
import styles from "./App.module.css";

/** Reads a deep link such as #/japan/day-4/stop-3 and returns the zero-based stop index. */
function readStopIndexFromHash(stopCount: number): number
{
	const stopMatch = window.location.hash.match(/stop-(\d+)/);
	const stopNumber = stopMatch ? Number(stopMatch[1]) : 1;
	return Math.max(0, Math.min(stopCount - 1, stopNumber - 1));
}

/** Map test screen: one day of the first trip, stepped through with the buttons or arrow keys. */
export function App()
{
	const trip = trips[0];
	const day = trip.days[0];
	const [currentStopIndex, setCurrentStopIndex] = useState(() => readStopIndexFromHash(day.stops.length));
	const lastStopIndex = day.stops.length - 1;
	const currentPlace = trip.places[day.stops[currentStopIndex].placeId];

	const goToStop = (stopIndex: number) => setCurrentStopIndex(Math.max(0, Math.min(lastStopIndex, stopIndex)));

	useEffect(() =>
	{
		const handleKeyDown = (event: KeyboardEvent) =>
		{
			if (event.key === "ArrowRight")
			{
				setCurrentStopIndex((index) => Math.min(lastStopIndex, index + 1));
			}
			else if (event.key === "ArrowLeft")
			{
				setCurrentStopIndex((index) => Math.max(0, index - 1));
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [lastStopIndex]);

	return (
		<div className={styles.app}>
			<MapView day={day} places={trip.places} currentStopIndex={currentStopIndex} onSelectStop={goToStop} />
			<div className={styles.player}>
				<button type="button" className={styles.stepButton} onClick={() => goToStop(currentStopIndex - 1)} disabled={currentStopIndex === 0} aria-label="Previous stop">‹</button>
				<div className={styles.playerText}>
					<span className={styles.playerEyebrow} style={{ color: day.color }}>
						Day {day.dayNumber} · Stop {currentStopIndex + 1} of {day.stops.length}
					</span>
					<span className={styles.playerTitle}>{currentPlace.name}</span>
				</div>
				<button type="button" className={`${styles.stepButton} ${styles.primary}`} style={{ background: day.color }} onClick={() => goToStop(currentStopIndex + 1)} disabled={currentStopIndex === lastStopIndex} aria-label="Next stop">›</button>
			</div>
		</div>
	);
}
