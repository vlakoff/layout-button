const layouts = ["standard", "wide", "vertical"];
const options = ["folderPaneVisible", "messagePaneVisible"];

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
			index++;
			if (index >= filteredLayouts.length) {
				index = 0;
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
