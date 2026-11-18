import { useLayoutEffect, useRef, useState } from "react";
import styles from "./PlaceDetails.module.css";

export interface IExpandableSummaryProps
{
	/** Paragraphs separated by blank lines. */
	summary: string;
}

// Collapsed, the summary shows this many lines. It only folds at all when the whole text runs past the second number:
// a "Show more" that would reveal just a line or two isn't worth the click.
const collapsedLines = 6;
const foldWhenLongerThanLines = 8;

/**
 * A Wikipedia summary that folds long text to a few faded lines with a "Show more" link. Short text shows in full
 * with no link. The fold is measured in rendered lines, so it adapts to the panel's width.
 */
export function ExpandableSummary({ summary }: IExpandableSummaryProps)
{
	const paragraphs = summary.split("\n\n");
	const textRef = useRef<HTMLDivElement>(null);
	const [measure, setMeasure] = useState<{ fullHeight: number; collapsedHeight: number; isFoldable: boolean }>();
	const [isExpanded, setIsExpanded] = useState(false);

	useLayoutEffect(() =>
	{
		const text = textRef.current;
		const firstParagraph = text?.firstElementChild;
		if (!text || !firstParagraph)
		{
			return;
		}
		const update = () =>
		{
			const lineHeight = parseFloat(getComputedStyle(firstParagraph).lineHeight);
			const fullHeight = text.scrollHeight;
			setMeasure({ fullHeight, collapsedHeight: collapsedLines * lineHeight, isFoldable: fullHeight > foldWhenLongerThanLines * lineHeight + 4 });
		};
		update();
		// The panel can still be widening, and the phone layout is narrower, so the line count is measured again on resize.
		const observer = new ResizeObserver(update);
		observer.observe(text);
		return () => observer.disconnect();
	}, [summary]);

	const isFolded = measure?.isFoldable === true && !isExpanded;
	const maxHeight = measure?.isFoldable ? (isExpanded ? measure.fullHeight : measure.collapsedHeight) : undefined;

	return (
		<>
			<div
				ref={textRef}
				className={`${styles.summaryText} ${isFolded ? styles.summaryFolded : ""}`}
				style={{ maxHeight }}
			>
				{paragraphs.map((paragraph) => <p key={paragraph} className={styles.paragraph}>{paragraph}</p>)}
			</div>
			{measure?.isFoldable && (
				<button type="button" className={styles.showMore} onClick={() => setIsExpanded(!isExpanded)} aria-expanded={isExpanded}>
					{isExpanded ? "Show less" : "Show more"}
				</button>
			)}
		</>
	);
}
