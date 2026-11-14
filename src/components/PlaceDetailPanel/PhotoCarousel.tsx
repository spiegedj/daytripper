import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IPhoto } from "../../itinerary/types";
import styles from "./PlaceDetailPanel.module.css";

export interface IPhotoCarouselProps
{
	photos: IPhoto[];
	placeName: string;
	/** Content laid over the bottom of the photo, such as the place name. */
	children?: ReactNode;
}

const thumbnailWidth = 250;

// Wikimedia serves the same image at standard widths by changing the size in the thumbnail path.
function toThumbnailUrl(photoUrl: string): string
{
	return photoUrl.replace(/\/\d+px-/, `/${thumbnailWidth}px-`);
}

/** Large swipeable hero photo with a thumbnail strip and the credit line each photo's license requires. */
export function PhotoCarousel({ photos, placeName, children }: IPhotoCarouselProps)
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
			<div className={styles.hero}>
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
				<div className={styles.heroFade} aria-hidden="true" />
				{children}
				{photos.length > 1 && (
					<>
						<button type="button" className={`${styles.carouselArrow} ${styles.arrowLeft}`} onClick={() => scrollToPhoto(visibleIndex - 1)} disabled={visibleIndex === 0} aria-label="Previous photo">
							<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
						</button>
						<button type="button" className={`${styles.carouselArrow} ${styles.arrowRight}`} onClick={() => scrollToPhoto(visibleIndex + 1)} disabled={visibleIndex === photos.length - 1} aria-label="Next photo">
							<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
						</button>
					</>
				)}
			</div>
			{photos.length > 1 && (
				<div className={styles.thumbnails}>
					{photos.map((photo, photoIndex) => (
						<button
							key={photo.url}
							type="button"
							className={`${styles.thumbnail} ${photoIndex === visibleIndex ? styles.thumbnailActive : ""}`}
							onClick={() => scrollToPhoto(photoIndex)}
							aria-label={`Show photo ${photoIndex + 1}`}
							aria-current={photoIndex === visibleIndex ? "true" : undefined}
						>
							<img src={toThumbnailUrl(photo.url)} alt="" loading="lazy" decoding="async" draggable={false} />
						</button>
					))}
				</div>
			)}
			{visiblePhoto && (
				<a className={styles.credit} href={visiblePhoto.sourceUrl} target="_blank" rel="noreferrer">
					Photo: {visiblePhoto.author} · {visiblePhoto.license}
				</a>
			)}
		</div>
	);
}
