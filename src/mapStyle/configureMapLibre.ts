import { setWorkerUrl } from "maplibre-gl";
import mapLibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

// MapLibre 6 loads its worker from a separate module file that Vite does not copy on its own,
// so the worker is bundled explicitly and its URL handed to MapLibre.
setWorkerUrl(mapLibreWorkerUrl);
