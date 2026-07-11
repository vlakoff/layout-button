import { getAvailableLayouts } from "./layouts.js";

// Kicks off the layout detection once, as soon as the script loads, and
// caches the resulting Promise (not just its resolved value). Every consumer
// below awaits this same Promise instead of calling getAvailableLayouts()
// again, so the detection only runs once per script lifetime.
//
// Note: MV3 event pages can be unloaded by Thunderbird when idle. When that
// happens, the whole script (including this line) reruns from scratch on
// the next wake-up, so the detection naturally happens once per "session"
// rather than never at all - there is no way to truly persist it in memory
// across an unload without going through the storage API.
const layoutsPromise = getAvailableLayouts();

const options = ["folderPaneVisible", "messagePaneVisible"];

// Refreshes the checkmarks in the menu to reflect the current layout and
// pane visibility. The mailTab is fetched here (instead of being passed in
// by the caller) to avoid a stale-data pitfall: a mailTab object is not
// mutated when mailTabs.update() is called, so a tab fetched before an
// update would still hold the old values afterwards.
async function updateMenuState() {
	const layouts = await layoutsPromise;
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
		const layouts = await layoutsPromise;
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

// Builds the layout/pane menus, using the layouts available on the current
// application (standard/wide/vertical, + widethread/stacked on Betterbird >= 128,
// + horizontal on Betterbird >= 140).
async function init() {
	const layouts = await layoutsPromise;

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
	const layouts = await layoutsPromise;
	if (layouts.includes(info.menuItemId)) {
		messenger.mailTabs.update({ layout: info.menuItemId });
	}
	else if (options.includes(info.menuItemId)) {
		messenger.mailTabs.update({ [info.menuItemId]: info.checked });
	}
});
