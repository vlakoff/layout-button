try {
	const { skip } = (await messenger.storage.local.get({ skip: 'none' }));
	document.getElementById(skip).checked = true;
	const radios = document.querySelectorAll('input[type="radio"]');
	radios.forEach(element => {
		element.addEventListener("change", async e => {
			messenger.storage.local.set({ skip: e.target.value });
		});
	});

	// Only show the Betterbird-only section if actually running on Betterbird
	const versionDisplay = await messenger.bbDetect.getVersionDisplay();
	const isBetterbird = /-bb\d+/.test(versionDisplay);
	if (isBetterbird) {
		const section = document.getElementById("betterbirdOnlyOption");
		section.hidden = false;

		const { bbFeature } = (await messenger.storage.local.get({ bbFeature: false }));
		const checkbox = document.getElementById("bbFeature");
		checkbox.checked = bbFeature;
		checkbox.addEventListener("change", async e => {
			messenger.storage.local.set({ bbFeature: e.target.checked });
		});
	}
} catch (error) {
	console.log(error);
}
