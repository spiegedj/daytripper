const iconModules = import.meta.glob<string>("./*.svg", { eager: true, query: "?url", import: "default" });

/** Landmark illustrations keyed by place id. Dropping a file named after a place id (for example sensoJi.svg) gives that place a landmark icon. */
export const landmarkIcons: Record<string, string> = Object.fromEntries(
	Object.entries(iconModules).map(([path, url]) => [path.replace("./", "").replace(".svg", ""), url]),
);
