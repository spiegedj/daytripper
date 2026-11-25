const cookieLifetimeSeconds = 60 * 60 * 24 * 365;

/** Reads one of the site's cookies; undefined when it is unset or cookies are blocked. */
export function readCookie(name: string): string | undefined
{
	try
	{
		return document.cookie
			.split("; ")
			.find((entry) => entry.startsWith(`${name}=`))
			?.slice(name.length + 1);
	}
	catch
	{
		return undefined;
	}
}

/** Remembers a value for a year. Failing to (cookies blocked) is fine: the choice still applies for this visit. */
export function writeCookie(name: string, value: string)
{
	try
	{
		const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${name}=${value}; max-age=${cookieLifetimeSeconds}; path=/; SameSite=Lax${secureFlag}`;
	}
	catch
	{
		// See above.
	}
}
