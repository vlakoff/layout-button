const layouts = ["standard", "wide", "vertical"];
const options = ["folderPaneVisible", "messagePaneVisible"];

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
		}
	} catch (error) {
		console.log(error);
	}
});

const jobs = [];
for (const layout of layouts) {
	jobs.push(messenger.menus.create({
		id: layout,
		title: messenger.i18n.getMessage(layout),
		type: "radio",
		checked: false,
		contexts: ["action"],
	}));
}
jobs.push(messenger.menus.create({
	id: "sep1",
	type: "separator",
	contexts: ["action"],
}));
for (const option of options) {
	jobs.push(messenger.menus.create({
		id: option,
		title: messenger.i18n.getMessage(option),
		type: "checkbox",
		checked: false,
		contexts: ["action"],
	}));
}
Promise.all(jobs).then(() => {
	messenger.menus.onClicked.addListener(async (info, tab) => {
		if (options.includes(info.menuItemId)) {
			messenger.mailTabs.update({ [info.menuItemId]: info.checked });
		} else {
			messenger.mailTabs.update({ layout: info.menuItemId });
		}
	});

	// Update the checkmarks right before the menu is shown,
	// to reflect the currently active layout and visible panes.
	messenger.menus.onShown.addListener(async (info, tab) => {
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

			// menus.update() only changes the internal state of the menu items;
			// the menu is already being rendered by the time onShown fires, so
			// refresh() is needed to make Thunderbird redraw it with the new checkmarks.
			messenger.menus.refresh();
		}
	});
});
