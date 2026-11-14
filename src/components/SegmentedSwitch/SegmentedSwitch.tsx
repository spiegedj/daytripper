import type { ReactNode } from "react";
import styles from "./SegmentedSwitch.module.css";

/** One choice in a segmented switch. */
export interface ISegmentedSwitchOption<TValue extends string>
{
	value: TValue;
	label: string;
	/** Tooltip explaining the choice. */
	title: string;
	icon?: ReactNode;
}

export interface ISegmentedSwitchProps<TValue extends string>
{
	/** Names the group for screen readers, such as "Route style". */
	label: string;
	/** Optional visible caption before the choices, for switches whose choices alone don't say what they control. */
	caption?: ReactNode;
	options: ISegmentedSwitchOption<TValue>[];
	value: TValue;
	onChange: (value: TValue) => void;
}

/** A small floating pill of mutually exclusive choices, with the selected one filled in. */
export function SegmentedSwitch<TValue extends string>({ label, caption, options, value, onChange }: ISegmentedSwitchProps<TValue>)
{
	return (
		<div className={styles.switch} role="group" aria-label={label}>
			{caption && <span className={styles.caption} aria-hidden="true">{caption}</span>}
			{options.map((option) => (
				<button
					key={option.value}
					type="button"
					className={`${styles.option} ${option.value === value ? styles.active : ""}`}
					onClick={() => onChange(option.value)}
					aria-pressed={option.value === value}
					title={option.title}
				>
					{option.icon}
					{option.label}
				</button>
			))}
		</div>
	);
}
