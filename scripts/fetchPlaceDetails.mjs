// Downloads a short Wikipedia summary and freely licensed photos (with credits) for every place in a trip.
// Run by hand when places change: node scripts/fetchPlaceDetails.mjs japan
// The output is committed, so the public site never calls these APIs at runtime.
import { readFileSync, writeFileSync } from "node:fs";

const tripId = process.argv[2] ?? "japan";
const tripFolder = `src/trips/${tripId}`;
const wikipediaTitles = JSON.parse(readFileSync(`${tripFolder}/wikipediaTitles.json`, "utf8"));
const outputPath = `${tripFolder}/placeDetails.generated.json`;

const apiUrl = "https://en.wikipedia.org/w/api.php";
const requestHeaders = { "User-Agent": "daytripper-build-script/0.1" };
const maximumPhotos = 6;
const maximumSummaryCharacters = 1100;
const photoWidth = 960;
const unwantedFilePattern = /map|logo|icon|flag|seal|emblem|diagram|plan|symbol|locator|coat[_ ]of[_ ]arms|sign|chart|route/i;

const pauseMilliseconds = 1200;

function wait(milliseconds)
{
	return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function queryWikipedia(parameters)
{
	const url = `${apiUrl}?${new URLSearchParams({ format: "json", formatversion: "2", ...parameters })}`;
	for (let attempt = 1; attempt <= 5; attempt++)
	{
		await wait(pauseMilliseconds);
		let response;
		try
		{
			response = await fetch(url, { headers: requestHeaders });
		}
		catch (networkError)
		{
			console.warn(`Network error, retrying: ${networkError.message}`);
			await wait(attempt * 5000);
			continue;
		}
		if (response.ok)
		{
			return response.json();
		}
		if (response.status !== 429)
		{
			throw new Error(`Wikipedia request failed (${response.status}): ${url}`);
		}
		// Rate limited: back off progressively before retrying.
		await wait(attempt * 10000);
	}
	throw new Error(`Wikipedia kept rate limiting: ${url}`);
}

function stripHtml(html)
{
	return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function trimToSentence(text, maximumCharacters)
{
	const paragraphs = text.split("\n").map((paragraph) => paragraph.trim()).filter(Boolean);
	let summary = "";
	for (const paragraph of paragraphs)
	{
		const candidate = summary ? `${summary}\n\n${paragraph}` : paragraph;
		if (candidate.length > maximumCharacters && summary)
		{
			break;
		}
		summary = candidate;
	}
	if (summary.length <= maximumCharacters)
	{
		return summary;
	}
	const cutAt = summary.lastIndexOf(". ", maximumCharacters);
	return cutAt > 0 ? summary.slice(0, cutAt + 1) : summary.slice(0, maximumCharacters);
}

async function fetchPage(title)
{
	const result = await queryWikipedia(
	{
		action: "query",
		redirects: "1",
		titles: title,
		prop: "extracts|pageimages|images|info",
		exintro: "1",
		explaintext: "1",
		piprop: "name",
		imlimit: "60",
		inprop: "url",
	});
	const page = result.query?.pages?.[0];
	if (page && !page.missing)
	{
		return page;
	}

	// No exact title match: fall back to the top search result, which the log shows for review.
	const search = await queryWikipedia({ action: "query", list: "search", srsearch: title, srlimit: "1" });
	const foundTitle = search.query?.search?.[0]?.title;
	if (!foundTitle || foundTitle === title)
	{
		return undefined;
	}
	console.log(`  "${title}" not found, using search result "${foundTitle}"`);
	return fetchPage(foundTitle);
}

async function fetchPhotos(page)
{
	const candidateFiles = [];
	if (page.pageimage)
	{
		candidateFiles.push(`File:${page.pageimage.replaceAll("_", " ")}`);
	}
	for (const image of page.images ?? [])
	{
		const isPhoto = /\.(jpe?g)$/i.test(image.title);
		if (isPhoto && !unwantedFilePattern.test(image.title) && !candidateFiles.includes(image.title))
		{
			candidateFiles.push(image.title);
		}
	}
	if (candidateFiles.length === 0)
	{
		return [];
	}

	const result = await queryWikipedia(
	{
		action: "query",
		titles: candidateFiles.slice(0, 12).join("|"),
		prop: "imageinfo",
		iiprop: "url|extmetadata|size",
		iiurlwidth: String(photoWidth),
	});
	const infoByTitle = new Map((result.query?.pages ?? []).map((filePage) => [filePage.title, filePage.imageinfo?.[0]]));
	const normalizedTitles = new Map((result.query?.normalized ?? []).map((entry) => [entry.from, entry.to]));

	const photos = [];
	for (const fileTitle of candidateFiles)
	{
		const info = infoByTitle.get(normalizedTitles.get(fileTitle) ?? fileTitle);
		const license = stripHtml(info?.extmetadata?.LicenseShortName?.value);
		const isFreeLicense = license && !/fair use|non-free|copyrighted/i.test(license);
		const isLandscapeEnough = info && info.width >= 600 && info.width / info.height > 0.7;
		if (!info?.thumburl || !isFreeLicense || !isLandscapeEnough)
		{
			continue;
		}
		photos.push(
		{
			url: info.thumburl,
			width: info.thumbwidth,
			height: info.thumbheight,
			author: stripHtml(info.extmetadata?.Artist?.value) || "Unknown author",
			license,
			sourceUrl: info.descriptionurl,
		});
		if (photos.length >= maximumPhotos)
		{
			break;
		}
	}
	return photos;
}

// Resume support: places already in the output are kept unless --refresh is passed.
const isRefresh = process.argv.includes("--refresh");
let placeDetails = {};
try
{
	placeDetails = isRefresh ? {} : JSON.parse(readFileSync(outputPath, "utf8"));
}
catch
{
	placeDetails = {};
}

// Wikipedia openings carry pronunciation and romanization; the app already shows the Japanese name separately.
function cleanSummary(summary)
{
	let cleaned = summary.replace(/\s?\[[^\]]*\]/g, "");
	const openIndex = cleaned.indexOf(" (");
	if (openIndex >= 0 && openIndex < 120)
	{
		let depth = 0;
		for (let characterIndex = openIndex + 1; characterIndex < cleaned.length; characterIndex++)
		{
			if (cleaned[characterIndex] === "(")
			{
				depth++;
			}
			else if (cleaned[characterIndex] === ")" && --depth === 0)
			{
				const parenthetical = cleaned.slice(openIndex, characterIndex + 1);
				const isNameGloss = /[぀-ヿ一-鿿]|Hepburn|Japanese|lit\./.test(parenthetical);
				if (isNameGloss)
				{
					cleaned = cleaned.slice(0, openIndex) + cleaned.slice(characterIndex + 1);
				}
				break;
			}
		}
	}
	return cleaned.replace(/ {2,}/g, " ").replace(/ ([,.;])/g, "$1").trim();
}

function cleanPhotoUrl(url)
{
	return url.split("?")[0];
}

const pageCache = new Map();
for (const [placeId, title] of Object.entries(wikipediaTitles))
{
	if (placeDetails[placeId])
	{
		continue;
	}
	if (!pageCache.has(title))
	{
		const page = await fetchPage(title);
		pageCache.set(title, page ? { page, photos: await fetchPhotos(page) } : undefined);
	}
	const cached = pageCache.get(title);
	if (!cached)
	{
		console.warn(`No Wikipedia page for ${placeId} ("${title}")`);
		continue;
	}
	placeDetails[placeId] =
	{
		summary: trimToSentence(cached.page.extract ?? "", maximumSummaryCharacters),
		wikipediaTitle: cached.page.title,
		wikipediaUrl: cached.page.fullurl,
		photos: cached.photos,
	};
	console.log(`${placeId}: "${cached.page.title}", ${cached.photos.length} photos`);
	writeFileSync(outputPath, JSON.stringify(placeDetails, null, "\t") + "\n");
}

for (const [placeId, details] of Object.entries(placeDetails))
{
	if (!wikipediaTitles[placeId])
	{
		delete placeDetails[placeId];
		continue;
	}
	details.summary = cleanSummary(details.summary);
	details.photos = details.photos.map((photo) => ({ ...photo, url: cleanPhotoUrl(photo.url) }));
}
writeFileSync(outputPath, JSON.stringify(placeDetails, null, "\t") + "\n");
console.log(`Wrote ${Object.keys(placeDetails).length} places to ${outputPath}`);
