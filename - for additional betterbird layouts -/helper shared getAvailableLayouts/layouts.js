// Determines the full list of layouts available in the current application:
// the 3 base Thunderbird layouts, plus any extra ones exposed by Betterbird
// depending on its version. Falls back to the base layouts alone if the
// Experiment API call fails for any reason (e.g. bbDetect not available).
export async function getAvailableLayouts() {
	const baseLayouts = ["standard", "wide", "vertical"];

	try {
		const versionDisplay = await messenger.bbDetect.getVersionDisplay();
		const isBetterbird = /-bb\d+/.test(versionDisplay);
		if (!isBetterbird) {
			return baseLayouts;
		}

		// parseInt stops at the first non-numeric character (the first "."),
		// which directly gives the major version.
		const majorVersion = parseInt(versionDisplay, 10);

		const available = [...baseLayouts];
		if (majorVersion >= 128) {
			available.push("widethread", "stacked");
		}
		if (majorVersion >= 140) {
			available.push("horizontal");
		}
		return available;
	} catch (error) {
		console.log("Layout detection failed, falling back to base layouts:", error);
		return baseLayouts;
	}
}
