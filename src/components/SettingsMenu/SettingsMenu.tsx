import { useEffect, useRef, useState } from "react";
import type { TravelSpeed } from "../MapView/followLegWithCamera";
import { RouteStyleSwitch, type RouteStyle } from "../RouteStyleSwitch/RouteStyleSwitch";
import { TravelSpeedSwitch } from "../TravelSpeedSwitch/TravelSpeedSwitch";
import styles from "./SettingsMenu.module.css";

export interface ISettingsMenuProps
{
	routeStyle: RouteStyle;
	onRouteStyleChange: (routeStyle: RouteStyle) => void;
	travelSpeed: TravelSpeed;
	onTravelSpeedChange: (travelSpeed: TravelSpeed) => void;
}

/** A cog button that opens the map's display settings. */
export function SettingsMenu({ routeStyle, onRouteStyleChange, travelSpeed, onTravelSpeedChange }: ISettingsMenuProps)
{
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if (!isOpen)
		{
			return;
		}
		const closeOnOutsideClick = (event: PointerEvent) =>
		{
			if (!menuRef.current?.contains(event.target as Node))
			{
				setIsOpen(false);
			}
		};
		const closeOnEscape = (event: KeyboardEvent) =>
		{
			if (event.key === "Escape")
			{
				// Escape also collapses a stop's details; while this menu is open it should only close the menu.
				event.stopPropagation();
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
		<div className={styles.settings} ref={menuRef}>
			<button
				type="button"
				className={styles.cog}
				onClick={() => setIsOpen((wasOpen) => !wasOpen)}
				aria-label="Settings"
				aria-haspopup="true"
				aria-expanded={isOpen}
				title="Settings"
			>
				<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
					<circle cx="12" cy="12" r="3" />
					<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
				</svg>
			</button>
			{isOpen && (
				<div className={styles.menu} role="group" aria-label="Settings">
					<div className={styles.setting}>
						<span className={styles.settingName}>Route style</span>
						<RouteStyleSwitch routeStyle={routeStyle} onChange={onRouteStyleChange} />
					</div>
					<div className={styles.setting}>
						<span className={styles.settingName}>Travel speed</span>
						<TravelSpeedSwitch travelSpeed={travelSpeed} onChange={onTravelSpeedChange} />
					</div>
				</div>
			)}
		</div>
	);
}
