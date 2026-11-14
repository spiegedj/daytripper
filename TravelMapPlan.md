I'd like to create an interactive map here that displays my upcoming travel plans to Japan. This will be similar to Wanderlog, but no ability to manualy edit in the page. However it is important that the app is flexible enough to allow plans to change without a large rewrite to the code.

The first trip I'd like to do is Japan. But code should be written to make it flexible enough to add other travel plans in the future.

## Requirements

- The app will be hosted in github pages, so no server our other functionality that that doesn't support
- Write in TypeScript / React. CSS no tailwind.
- Displaying clearly the travel plans for each day is key. Being able to see the locations planned as well as route and being able to cleanly step through each step on the day, and also transition to the next day. Use clean animations when you can for this.
- Use a stylized and colorful display for the actual map of Japan. Allow zooming panning and scrolling like google maps.
- Display landmarks, planned hotel locations, train stations etc as travel plan items. Use a stylized SVG for the display, however when clicked display images of the actual location as well as historical and travel information.
- Build for desktop display, but also make the UI responsive for mobile display.

# Coding Styles

## Naming Conventions
- Booleans should be phrased as a question
- Interfaces should start with I
- Write interfaces for all publicly used objects
- Don't abbreviate, only in rare cases where the abbreviation is more known than the full name.

##  Documentation
- All public APIs should have documentation. However documentation should be limited to 2-3 sentences per function.
- Only add inline comments when some behavior is unexpected. Never describe what something does but why.

##  Structure
- React components should have their own file when they are reusable. Its fine to add some private components that are only to shared in the same file.
	- Create reusable component libraries.
- Write curly braces on their own lines. Use tabs instead of spaces.

##  Misc
- Readability is key. Write code that whose behavior describes itself by using descriptive names instead of commenting