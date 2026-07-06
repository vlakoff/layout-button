const layouts = ["standard", "wide", "vertical"]
const options = ["folderPaneVisible", "messagePaneVisible"]

messenger.action.onClicked.addListener(async (t, e) => {
    try {
        let { skip } = (await messenger.storage.local.get({ skip: "none" }))
        let filteredLayouts = layouts.filter(layout => layout !== skip)
        let [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true })
        if (currentTab) {
            let index = filteredLayouts.findIndex(v => v === currentTab.layout)
            index++
            if (index >= filteredLayouts.length) {
                index = 0
            }
            await messenger.mailTabs.update({ layout: filteredLayouts[index] });
        }
    } catch (error) {
        console.log(error)
    }
})

const jobs = []
for (const layout of layouts) {
    jobs.push(messenger.menus.create({
        id: layout,
        title: messenger.i18n.getMessage(layout),
        contexts: ["action"],
    }))
}
jobs.push(messenger.menus.create({
    id: "sep1",
    type: "separator",
    contexts: ["action"],
}))
for (const option of options) {
    jobs.push(messenger.menus.create({
        id: option,
        title: messenger.i18n.getMessage(option),
        contexts: ["action"],
    }))
}
Promise.all(jobs).then(() => {
    messenger.menus.onClicked.addListener(async (info, tab) => {
        let [currentTab] = await messenger.mailTabs.query({ active: true, currentWindow: true })
        if (currentTab) {
            if (options.includes(info.menuItemId)) {
                messenger.mailTabs.update({ [info.menuItemId]: !currentTab[info.menuItemId] })
            } else {
                messenger.mailTabs.update({ layout: info.menuItemId })
            }
        }
    })
})
