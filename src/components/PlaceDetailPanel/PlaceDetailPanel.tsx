import { AnimatePresence, motion } from "motion/react";
import { useEffect, type CSSProperties } from "react";
import type { IDay, IPlace, IPlaceDetails } from "../../itinerary/types";
import { CategoryIcon, categoryColors, categoryLabels } from "../Markers/CategoryIcon";
import { TravelModeIcon, formatMinutes } from "../TravelModeIcon/TravelModeIcon";
import { PhotoCarousel } from "./PhotoCarousel";
import styles from "./PlaceDetailPanel.module.css";

export interface IPlaceDetailPanelProps
{
	isOpen: boolean;
	place: IPlace;
	details?: IPlaceDetails;
	day: IDay;
	stopIndex: number;
	onClose: () => void;
}

function buildGoogleMapsUrl(place: IPlace): string
{
	const query = `${place.name} ${place.coordinates.latitude},${place.coordinates.longitude}`;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Slide-in panel with photos, practical tips and background for the current stop. Follows the current stop while open. */
export function PlaceDetailPanel({ isOpen, place, details, day, stopIndex, onClose }: IPlaceDetailPanelProps)
{
	useEffect(() =>
	{
		const handleKeyDown = (event: KeyboardEvent) =>
		{
			if (event.key === "Escape")
			{
				onClose();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	const arrival = day.stops[stopIndex].arrival;
	const categoryColor = categoryColors[place.category];
	const hasPhotos = (details?.photos.length ?? 0) > 0;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.aside
					className={styles.panel}
					style={{ "--day-color": day.color, "--category-color": categoryColor } as CSSProperties}
					initial={{ opacity: 0, x: -24 }}
					animate={{ opacity: 1, x: 0 }}
					exit={{ opacity: 0, x: -24 }}
					transition={{ type: "spring", stiffness: 380, damping: 34 }}
					aria-label={`${place.name} details`}
				>
					<button type="button" className={styles.close} onClick={onClose} aria-label="Close details">
						<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
					</button>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={`${day.dayNumber}-${stopIndex}`}
							className={styles.scroll}
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.18 }}
						>
							{hasPhotos
								? <PhotoCarousel photos={details!.photos} placeName={place.name} />
								: <IllustrationHero place={place} />}

							<div className={styles.content}>
								<header className={styles.titleBlock}>
									<h2 className={styles.title}>{place.name}</h2>
									{place.localName && <span className={styles.localName}>{place.localName}</span>}
								</header>

								<div className={styles.chips}>
									<span className={styles.categoryChip}>
										<CategoryIcon category={place.category} size={14} color={categoryColor} />
										{categoryLabels[place.category]}
									</span>
									<span className={styles.dayChip}>Day {day.dayNumber} · Stop {stopIndex + 1}</span>
								</div>

								{arrival && (
									<section className={styles.section}>
										<h3 className={styles.sectionTitle}>Getting here</h3>
										<p className={styles.arrival}>
											<span className={styles.arrivalIcon}><TravelModeIcon mode={arrival.mode} size={16} /></span>
											<span>
												{arrival.lineName ?? arrival.mode}
												{arrival.minutes !== undefined && ` · about ${formatMinutes(arrival.minutes)}`}
											</span>
											{arrival.isGuess && <span className={styles.guessTag}>guess</span>}
										</p>
									</section>
								)}

								{place.tips && place.tips.length > 0 && (
									<section className={styles.section}>
										<h3 className={styles.sectionTitle}>Travel tips</h3>
										<ul className={styles.tips}>
											{place.tips.map((tip) => <li key={tip}>{tip}</li>)}
										</ul>
									</section>
								)}

								{details?.summary && (
									<section className={styles.section}>
										<h3 className={styles.sectionTitle}>About</h3>
										{details.summary.split("\n\n").map((paragraph) => <p key={paragraph} className={styles.paragraph}>{paragraph}</p>)}
										<p className={styles.source}>
											From Wikipedia, <a href={details.wikipediaUrl} target="_blank" rel="noreferrer">{details.wikipediaTitle}</a> (CC BY-SA 4.0)
										</p>
									</section>
								)}

								<div className={styles.links}>
									<a className={styles.primaryLink} href={buildGoogleMapsUrl(place)} target="_blank" rel="noreferrer">Open in Google Maps</a>
									{details && <a className={styles.secondaryLink} href={details.wikipediaUrl} target="_blank" rel="noreferrer">Wikipedia</a>}
								</div>
							</div>
						</motion.div>
					</AnimatePresence>
				</motion.aside>
			)}
		</AnimatePresence>
	);
}

function IllustrationHero({ place }: { place: IPlace })
{
	return (
		<div className={styles.illustrationHero}>
			{place.landmarkIconUrl
				? <img src={place.landmarkIconUrl} alt="" className={styles.heroIllustration} />
				: <CategoryIcon category={place.category} size={64} color={categoryColors[place.category]} />}
		</div>
	);
}
