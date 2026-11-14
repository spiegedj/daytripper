import { useEffect, useRef, useState } from "react";
import type { IPhoto } from "../../itinerary/types";
import styles from "./PlaceDetailPanel.module.css";

export interface IPhotoCarouselProps
{
	photos: IPhoto[];
	placeName: string;
}

/** Swipeable row of photos with arrows, dots and the credit line each photo's license requires. */
export function PhotoCarousel({ photos, placeName }: IPhotoCarouselProps)
{
	const trackRef = useRef<HTMLDivElement>(null);
	const [visibleIndex, setVisibleIndex] = useState(0);

	useEffect(() =>
	{
		trackRef.current?.scrollTo({ left: 0 });
		setVisibleIndex(0);
	}, [photos]);

	const scrollToPhoto = (photoIndex: number) =>
	{
		const track = trackRef.current;
		if (!track)
		{
			return;
		}
		const clampedIndex = Math.max(0, Math.min(photos.length - 1, photoIndex));
		track.scrollTo({ left: clampedIndex * track.clientWidth, behavior: "smooth" });
	};

	const handleScroll = () =>
	{
		const track = trackRef.current;
		if (track)
		{
			setVisibleIndex(Math.round(track.scrollLeft / track.clientWidth));
		}
	};

	const visiblePhoto = photos[visibleIndex];

	return (
		<div className={styles.carousel}>
			<div ref={trackRef} className={styles.track} onScroll={handleScroll}>
				{photos.map((photo, photoIndex) => (
					<img
						key={photo.url}
						className={styles.photo}
						src={photo.url}
						alt={`${placeName}, photo ${photoIndex + 1} of ${photos.length}`}
						loading={photoIndex === 0 ? "eager" : "lazy"}
						decoding="async"
						draggable={false}
					/>
				))}
			</div>
			{photos.length > 1 && (
				<>
					<button type="button" className={`${styles.carouselArrow} ${styles.arrowLeft}`} onClick={() => scrollToPhoto(visibleIndex - 1)} disabled={visibleIndex === 0} aria-label="Previous photo">
						<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</button>
					<button type="button" className={`${styles.carouselArrow} ${styles.arrowRight}`} onClick={() => scrollToPhoto(visibleIndex + 1)} disabled={visibleIndex === photos.length - 1} aria-label="Next photo">
						<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</button>
					<div className={styles.dots} aria-hidden="true">
						{photos.map((photo, photoIndex) => (
							<span key={photo.url} className={`${styles.dot} ${photoIndex === visibleIndex ? styles.dotActive : ""}`} />
						))}
					</div>
				</>
			)}
			{visiblePhoto && (
				<a className={styles.credit} href={visiblePhoto.sourceUrl} target="_blank" rel="noreferrer">
					Photo: {visiblePhoto.author} · {visiblePhoto.license}
				</a>
			)}
		</div>
	);
}
