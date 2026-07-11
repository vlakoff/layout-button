// Fallback value until the async detection has completed
// (and fallback if the call to bbDetect fails for any reason).
let layouts = ["standard", "wide", "vertical"];
const options = ["folderPaneVisible", "messagePaneVisible"];

// Derives the list of available layouts from MOZ_APP_VERSION_DISPLAY
// (e.g. "128.14.0esr-bb32" for Betterbird, "128.14.0" for Thunderbird).
function getAvailableLayouts(versionDisplay) {
	const baseLayouts = ["standard", "wide", "vertical"];

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
}

// Refreshes the checkmarks in the menu to reflect the current layout and
// pane visibility. The mailTab is fetched here (instead of being passed in
// by the caller) to avoid a stale-data pitfall: a mailTab object is not
// mutated when mailTabs.update() is called, so a tab fetched before an
// update would still hold the old values afterwards.
async function updateMenuState() {
	const [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
	if (currentTab) {
		const updates = [];
		for (const layout of layouts) {
			updates.push(messenger.menus.update(layout, { checked: currentTab.layout === layout }));
		}
		for (const option of options) {
			updates.push(messenger.menus.update(option, { checked: !!currentTab[option] }));
		}
		await Promise.all(updates);
	}
}

messenger.action.onClicked.addListener(async (t, e) => {
	try {
		const { skip } = (await messenger.storage.local.get({ skip: "none" }));
		const filteredLayouts = layouts.filter(layout => layout !== skip);
		const [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
		if (currentTab) {
			let index = filteredLayouts.findIndex(v => v === currentTab.layout);
			if (index === -1) {
				// If the current layout is not found in the filtered list,
				// fallback to the first available layout.
				index = 0;
			} else {
				index++;
				if (index >= filteredLayouts.length) {
					index = 0;
				}
			}
			await messenger.mailTabs.update({ layout: filteredLayouts[index] });

			// Workaround: refresh the menu's internal state right away, so that
			// if the context menu is opened afterwards, the checkmark doesn't
			// briefly show at its old position before jumping to the new one.
			await updateMenuState();
		}
	} catch (error) {
		console.log(error);
	}
});

// Dynamically determines the available layouts (standard/wide/vertical,
// + widethread/stacked on Betterbird >= 128, + horizontal on Betterbird >= 140),
// then builds the menus accordingly.
async function init() {
	try {
		const versionDisplay = await messenger.bbDetect.getVersionDisplay();
		layouts = getAvailableLayouts(versionDisplay);
	} catch (error) {
		// If detection fails, fall back to the 3 base layouts.
		console.log("Version detection failed, falling back:", error);
	}

	for (const layout of layouts) {
		messenger.menus.create({
			id: layout,
			title: messenger.i18n.getMessage(layout),
			type: "radio",
			checked: false,
			contexts: ["action"],
		});
	}
	messenger.menus.create({
		id: "sep1",
		type: "separator",
		contexts: ["action"],
	});
	for (const option of options) {
		messenger.menus.create({
			id: option,
			title: messenger.i18n.getMessage(option),
			type: "checkbox",
			checked: false,
			contexts: ["action"],
		});
	}
}

init();

// Update the checkmarks right before the menu is shown,
// to reflect the currently active layout and visible panes.
messenger.menus.onShown.addListener(async (info, tab) => {
	await updateMenuState();

	// menus.update() only changes the internal state of the menu items;
	// the menu is already being rendered by the time onShown fires, so
	// refresh() is needed to make Thunderbird redraw it with the new checkmarks.
	messenger.menus.refresh();
});

messenger.menus.onClicked.addListener(async (info, tab) => {
	if (layouts.includes(info.menuItemId)) {
		messenger.mailTabs.update({ layout: info.menuItemId });
	}
	else if (options.includes(info.menuItemId)) {
		messenger.mailTabs.update({ [info.menuItemId]: info.checked });
	}
});
