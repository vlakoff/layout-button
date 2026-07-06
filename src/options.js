try {
    const { skip } = (await messenger.storage.local.get({ skip: 'none' }))
    document.getElementById(skip).checked = true
    let radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(element => {
        element.addEventListener("change", async e => {
            messenger.storage.local.set({ skip: e.target.value })
        })
    });
} catch (error) {
    console.log(error)
}