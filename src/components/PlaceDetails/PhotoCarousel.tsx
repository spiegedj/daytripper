import { useEffect, useRef, useState } from "react";
import styles from "./PlaceDetails.module.css";

/** A photo in the carousel: either the traveler's own or a credited Wikipedia photo. */
export interface ICarouselPhoto
{
	url: string;
	/** A smaller copy for narrow screens and the thumbnail strip, when one exists. */
	smallUrl?: string;
	caption: string;
	/** Where the caption links, such as the photo's license page. */
	captionUrl?: string;
	isTripPhoto?: boolean;
}

export interface IPhotoCarouselProps
{
	photos: ICarouselPhoto[];
	placeName: string;
	/** Width in CSS pixels the carousel is shown at on wide screens, so the browser picks a sharp enough copy. */
	displayWidth: number;
	/** Called with the photo's index when it is clicked, to show it full screen. */
	onOpenPhoto: (photoIndex: number) => void;
}

/**
 * Swipeable row of whole, uncropped photos (upright ones sit on a blurred copy of themselves), with arrows, a strip of
 * thumbnails and a caption: the time for trip photos, the required credit for the rest. Clicking a photo enlarges it.
 */
export function PhotoCarousel({ photos, placeName, displayWidth, onOpenPhoto }: IPhotoCarouselProps)
{
	const trackRef = useRef<HTMLDivElement>(null);
	const [visibleIndex, setVisibleIndex] = useState(0);
	const photoSizes = `(max-width: 640px) 100vw, ${displayWidth}px`;

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
			<div className={styles.frame}>
				<div ref={trackRef} className={styles.track} onScroll={handleScroll}>
					{photos.map((photo, photoIndex) => (
						<div key={photo.url} className={styles.slide} onClick={() => onOpenPhoto(photoIndex)}>
							<img className={styles.slideBackdrop} src={photo.smallUrl ?? photo.url} alt="" loading="lazy" aria-hidden="true" />
							<img
								className={styles.photo}
								src={photo.url}
								srcSet={photo.smallUrl ? `${photo.smallUrl} 480w, ${photo.url} 1600w` : undefined}
								sizes={photo.smallUrl ? photoSizes : undefined}
								alt={`${placeName}, photo ${photoIndex + 1} of ${photos.length}`}
								loading={photoIndex === 0 ? "eager" : "lazy"}
								decoding="async"
								draggable={false}
							/>
						</div>
					))}
				</div>
				{visiblePhoto?.isTripPhoto && (
					<span className={styles.tripPhotoBadge}>
						<svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><circle cx="12" cy="13" r="3.4" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg>
						Our photo
					</span>
				)}
				{visiblePhoto && (
					<button type="button" className={styles.expandButton} onClick={() => onOpenPhoto(visibleIndex)} aria-label="Show photo full screen">
						<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
					</button>
				)}
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
				<div className={styles.thumbnailStrip}>
					{photos.map((photo, photoIndex) => (
						<button
							key={photo.url}
							type="button"
							className={`${styles.thumbnail} ${photo.isTripPhoto ? styles.tripThumbnail : ""} ${photoIndex === visibleIndex ? styles.thumbnailActive : ""}`}
							onClick={() => scrollToPhoto(photoIndex)}
							aria-label={`Photo ${photoIndex + 1}`}
						>
							<img src={photo.smallUrl ?? photo.url} alt="" loading="lazy" draggable={false} />
						</button>
					))}
				</div>
			)}
			{visiblePhoto && (visiblePhoto.captionUrl
				? <a className={styles.credit} href={visiblePhoto.captionUrl} target="_blank" rel="noreferrer">{visiblePhoto.caption}</a>
				: <span className={styles.credit}>{visiblePhoto.caption}</span>)}
		</div>
	);
}
