import type { ILandmarkBounds } from "../../../itinerary/types";
import { keyLandmarkFiles } from "../../../components/Markers/landmarkArt";

const iconModules = import.meta.glob<string>("./*.{svg,png}", { eager: true, query: "?url", import: "default" });
// Where each illustration is drawn inside its image, measured at build time (see vite.config.ts).
const boundsModules = import.meta.glob<ILandmarkBounds>("./*.{svg,png}", { eager: true, query: "?landmarkBounds", import: "default" });

/** Landmark illustrations keyed by place id. Dropping a file named after a place id (for example sensoJi.png) gives that place a landmark icon. A PNG wins over an SVG of the same name. */
export const landmarkIcons = keyLandmarkFiles(iconModules);
export const landmarkBounds = keyLandmarkFiles(boundsModules);
