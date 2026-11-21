const iconModules = import.meta.glob<string>("./*.{svg,png}", { eager: true, query: "?url", import: "default" });

/** Landmark illustrations keyed by place id. Dropping a file named after a place id (for example sensoJi.svg) gives that place a landmark icon. A PNG wins over an SVG of the same name. */
export const landmarkIcons: Record<string, string> = Object.fromEntries(
	Object.entries(iconModules)
		.sort(([a], [b]) => Number(a.endsWith(".png")) - Number(b.endsWith(".png")))
		.map(([path, url]) => [path.replace("./", "").replace(/\.(svg|png)$/, ""), url]),
);
