import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import styles from "./PhotoViewer.module.css";

/** One photo in the full-screen viewer. */
export interface IViewerPhoto
{
	url: string;
	/** A smaller copy for the thumbnail strip, when one exists. */
	smallUrl?: string;
	/** Main line under the photo, such as the place name. */
	title: string;
	/** Second line, such as the time taken or the photo credit. */
	caption: string;
	/** Where the caption links, such as the photo's license page. */
	captionUrl?: string;
}

export interface IPhotoViewerProps
{
	photos: IViewerPhoto[];
	startIndex: number;
	onClose: () => void;
}

/**
 * Full-screen photo viewer: the whole photo, uncropped and as large as the window allows, with arrows, a thumbnail
 * strip and keyboard control. Escape closes it without also closing the panel underneath.
 */
export function PhotoViewer({ photos, startIndex, onClose }: IPhotoViewerProps)
{
	const [photoIndex, setPhotoIndex] = useState(startIndex);
	const touchStartRef = useRef<number | undefined>(undefined);
	const activeThumbnailRef = useRef<HTMLButtonElement>(null);
	const photo = photos[photoIndex];

	const step = (direction: number) => setPhotoIndex((index) => Math.max(0, Math.min(photos.length - 1, index + direction)));

	useEffect(() =>
	{
		// Captured on the window ahead of the panels' own Escape handlers, so only the viewer closes.
		const handleKeyDown = (event: KeyboardEvent) =>
		{
			if (event.key === "Escape")
			{
				event.stopImmediatePropagation();
				onClose();
			}
			else if (event.key === "ArrowLeft" || event.key === "ArrowRight")
			{
				event.stopImmediatePropagation();
				event.preventDefault();
				setPhotoIndex((index) => Math.max(0, Math.min(photos.length - 1, index + (event.key === "ArrowLeft" ? -1 : 1))));
			}
		};
		window.addEventListener("keydown", handleKeyDown, true);
		return () => window.removeEventListener("keydown", handleKeyDown, true);
	}, [onClose, photos.length]);

	useEffect(() =>
	{
		activeThumbnailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
	}, [photoIndex]);

	const handleTouchEnd = (event: TouchEvent) =>
	{
		const startX = touchStartRef.current;
		touchStartRef.current = undefined;
		if (startX === undefined)
		{
			return;
		}
		const distance = event.changedTouches[0].clientX - startX;
		if (Math.abs(distance) > 50)
		{
			step(distance < 0 ? 1 : -1);
		}
	};

	return (
		<motion.div
			className={styles.viewer}
			role="dialog"
			aria-modal="true"
			aria-label={`${photo.title}, photo ${photoIndex + 1} of ${photos.length}`}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.18 }}
		>
			<div
				className={styles.stage}
				onClick={(event) => event.target === event.currentTarget && onClose()}
				onTouchStart={(event) => { touchStartRef.current = event.touches[0].clientX; }}
				onTouchEnd={handleTouchEnd}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					<motion.img
						key={photo.url}
						className={styles.photo}
						src={photo.url}
						alt={photo.title}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						draggable={false}
					/>
				</AnimatePresence>
				{photos.length > 1 && (
					<>
						<button type="button" className={`${styles.arrow} ${styles.arrowLeft}`} onClick={() => step(-1)} disabled={photoIndex === 0} aria-label="Previous photo">
							<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
						</button>
						<button type="button" className={`${styles.arrow} ${styles.arrowRight}`} onClick={() => step(1)} disabled={photoIndex === photos.length - 1} aria-label="Next photo">
							<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
						</button>
					</>
				)}
			</div>
			<button type="button" className={styles.close} onClick={onClose} aria-label="Close photo">
				<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
			</button>
			<footer className={styles.footer}>
				<div className={styles.captionBlock}>
					<span className={styles.title}>{photo.title}</span>
					{photo.captionUrl
						? <a className={styles.caption} href={photo.captionUrl} target="_blank" rel="noreferrer">{photo.caption}</a>
						: <span className={styles.caption}>{photo.caption}</span>}
				</div>
				<span className={styles.counter}>{photoIndex + 1} / {photos.length}</span>
				{photos.length > 1 && (
					<div className={styles.strip}>
						{photos.map((stripPhoto, stripIndex) => (
							<button
								key={stripPhoto.url}
								ref={stripIndex === photoIndex ? activeThumbnailRef : undefined}
								type="button"
								className={`${styles.thumbnail} ${stripIndex === photoIndex ? styles.thumbnailActive : ""}`}
								onClick={() => setPhotoIndex(stripIndex)}
								aria-label={`Photo ${stripIndex + 1}`}
							>
								<img src={stripPhoto.smallUrl ?? stripPhoto.url} alt="" loading="lazy" draggable={false} />
							</button>
						))}
					</div>
				)}
			</footer>
		</motion.div>
	);
}
