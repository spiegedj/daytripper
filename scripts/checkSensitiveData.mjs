// Fails the build when trip data looks like it contains booking details, because the site is public.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const tripsFolder = "src/trips";
const forbiddenPatterns =
[
	{ description: "long number (confirmation code?)", pattern: /\d{8,}/ },
	{ description: "price", pattern: /[$¥€£]\s?\d/ },
	{ description: "booking wording", pattern: /confirmation|reservation under|booking ref/i },
	{ description: "email address", pattern: /[\w.+-]+@[\w-]+\.[\w.]+/ },
];

function listFiles(folder)
{
	return readdirSync(folder).flatMap((entry) =>
	{
		const path = join(folder, entry);
		return statSync(path).isDirectory() ? listFiles(path) : [path];
	});
}

const problems = [];
for (const file of listFiles(tripsFolder).filter((path) => /\.(ts|tsx|json|md)$/.test(path)))
{
	readFileSync(file, "utf8").split("\n").forEach((line, index) =>
	{
		for (const { description, pattern } of forbiddenPatterns)
		{
			if (pattern.test(line))
			{
				problems.push(`${file}:${index + 1} ${description}`);
			}
		}
	});
}

if (problems.length > 0)
{
	console.error("Possible sensitive data in trip files:\n" + problems.join("\n"));
	process.exit(1);
}
console.log("Trip data check passed.");
