import { useMemo, type CSSProperties } from "react";
import type { IDay, IPlace, IPlaceDetails, ITripPhoto } from "../../itinerary/types";
import { categoryColors } from "../Markers/CategoryIcon";
import type { IViewerPhoto } from "../PhotoViewer/PhotoViewer";
import { ExpandableSummary } from "./ExpandableSummary";
import { PhotoCarousel, type ICarouselPhoto } from "./PhotoCarousel";
import styles from "./PlaceDetails.module.css";

/** Called with a stop's photos and the one clicked, to show them full screen. */
export type OpenPhotoHandler = (photos: IViewerPhoto[], photoIndex: number) => void;

export interface IPlaceDetailsProps
{
	place: IPlace;
	details?: IPlaceDetails;
	day: IDay;
	/** The traveler's own photos at this stop, shown before the Wikipedia ones. */
	tripPhotos?: ITripPhoto[];
	/** Width the photos are shown at, so the browser picks a sharp enough copy. */
	photoDisplayWidth: number;
	onOpenPhoto: OpenPhotoHandler;
}

// Trip photos live in public/, so they are served from the site's base path (/daytripper/ on GitHub Pages).
function toSiteUrl(path: string): string
{
	return `${import.meta.env.BASE_URL}${path}`;
}

function buildCarouselPhotos(tripPhotos: ITripPhoto[] | undefined, details: IPlaceDetails | undefined): ICarouselPhoto[]
{
	const ownPhotos = (tripPhotos ?? []).map((photo): ICarouselPhoto => (
	{
		url: toSiteUrl(photo.path),
		smallUrl: toSiteUrl(photo.thumbnailPath),
		caption: `Taken at ${photo.takenAt}`,
		isTripPhoto: true,
	}));
	const referencePhotos = (details?.photos ?? []).map((photo): ICarouselPhoto => (
	{
		url: photo.url,
		caption: `Photo: ${photo.author} · ${photo.license}`,
		captionUrl: photo.sourceUrl,
	}));
	return [...ownPhotos, ...referencePhotos];
}

function toViewerPhotos(photos: ICarouselPhoto[], placeName: string): IViewerPhoto[]
{
	return photos.map((photo) => ({ url: photo.url, smallUrl: photo.smallUrl, title: placeName, caption: photo.caption, captionUrl: photo.captionUrl }));
}

/** Whether a stop has anything for PlaceDetails to show: photos (its own or Wikipedia's), tips or a summary. */
export function hasPlaceDetails(place: IPlace, details: IPlaceDetails | undefined, tripPhotos: ITripPhoto[] | undefined): boolean
{
	return (tripPhotos?.length ?? 0) > 0 || (details?.photos?.length ?? 0) > 0 || Boolean(details?.summary) || (place.tips?.length ?? 0) > 0;
}

/**
 * The current stop's photos, tips and Wikipedia background, shown inside the day's timeline under the stop. The stop's
 * name, day and arrival are already on screen there, and its links sit in the stop's card, so only these show.
 */
export function PlaceDetails({ place, details, day, tripPhotos, photoDisplayWidth, onOpenPhoto }: IPlaceDetailsProps)
{
	// The carousel rewinds whenever its photo list changes, so the list must keep its identity between renders.
	const carouselPhotos = useMemo(() => buildCarouselPhotos(tripPhotos, details), [tripPhotos, details]);
	const openPhoto = (photoIndex: number) => onOpenPhoto(toViewerPhotos(carouselPhotos, place.name), photoIndex);
	const hasContent = (place.tips?.length ?? 0) > 0 || Boolean(details?.summary);

	return (
		<div className={styles.card} style={{ "--day-color": day.color, "--category-color": categoryColors[place.category] } as CSSProperties}>
			{carouselPhotos.length > 0 && <PhotoCarousel photos={carouselPhotos} placeName={place.name} displayWidth={photoDisplayWidth} onOpenPhoto={openPhoto} />}

			{hasContent && (
				<div className={styles.content}>
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
							{/* Long summaries fold behind "Show more", so the next stops stay close by; keyed so each stop starts folded. */}
							<ExpandableSummary key={place.id} summary={details.summary} />
							<p className={styles.source}>
								From Wikipedia, <a href={details.wikipediaUrl} target="_blank" rel="noreferrer">{details.wikipediaTitle}</a> (CC BY-SA 4.0)
							</p>
						</section>
					)}
				</div>
			)}
		</div>
	);
}
