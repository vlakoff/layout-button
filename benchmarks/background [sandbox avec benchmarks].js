const layouts = ["standard", "wide", "vertical"];
const options = ["folderPaneVisible", "messagePaneVisible"];

messenger.action.onClicked.addListener(async (t, e) => {
	try {
		let { skip } = (await messenger.storage.local.get({ skip: "none" }));
		let filteredLayouts = layouts.filter(layout => layout !== skip);
		let [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
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

		const t0 = performance.now();
		let [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
		const t1 = performance.now();
		console.log(`messenger.menus.onClicked --> messenger.mailTabs.query : ${(t1 - t0).toFixed(3)} ms`);

		if (!currentTab) {
			return;
		}

		if (options.includes(info.menuItemId)) {
			messenger.mailTabs.update({ [info.menuItemId]: info.checked });

			console.log("!currentTab[info.menuItemId]", !currentTab[info.menuItemId]);
			console.log("info.checked", info.checked);

			const t2 = performance.now();
			//messenger.mailTabs.update({ [info.menuItemId]: !currentTab[info.menuItemId] });
			!currentTab[info.menuItemId];
			const t3 = performance.now();
			console.log(`messenger.menus.onClicked --> !currentTab[info.menuItemId] : ${(t3 - t2).toFixed(3)} ms`);

			const t4 = performance.now();
			//messenger.mailTabs.update({ [info.menuItemId]: info.checked });
			info.checked;
			const t5 = performance.now();
			console.log(`messenger.menus.onClicked --> info.checked : ${(t5 - t4).toFixed(3)} ms`);

		} else {
			messenger.mailTabs.update({ layout: info.menuItemId });
		}
	});

	// Update the checkmarks right before the menu is shown,
	// to reflect the currently active layout and visible panes.
	messenger.menus.onShown.addListener(async (info, tab) => {
		let [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true });
		if (currentTab) {
			for (const layout of layouts) {
				await messenger.menus.update(layout, { checked: currentTab.layout === layout });
			}
			for (const option of options) {
				await messenger.menus.update(option, { checked: !!currentTab[option] });
			}


			const t6 = performance.now();
			for (const layout of layouts) {
				await messenger.menus.update(layout, { checked: currentTab.layout === layout });
			}
			for (const option of options) {
				await messenger.menus.update(option, { checked: !!currentTab[option] });
			}
			const t7 = performance.now();
			console.log(`messenger.menus.onShown --> sequential updates : ${(t7 - t6).toFixed(3)} ms`);


			const t8 = performance.now();
			const updates = [];
			for (const layout of layouts) {
				updates.push(messenger.menus.update(layout, { checked: currentTab.layout === layout }));
			}
			for (const option of options) {
				updates.push(messenger.menus.update(option, { checked: !!currentTab[option] }));
			}
			await Promise.all(updates);
			const t9 = performance.now();
			console.log(`messenger.menus.onShown --> parallel updates : ${(t9 - t8).toFixed(3)} ms`);


			// menus.update() only changes the internal state of the menu items;
			// the menu is already being rendered by the time onShown fires, so
			// refresh() is needed to make Thunderbird redraw it with the new checkmarks.
			messenger.menus.refresh();
		}
	});
});
