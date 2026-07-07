const layouts = ["standard", "wide", "vertical"];

try {
	const { included } = (await messenger.storage.local.get({ included: {} }));

	for (const layout of layouts) {
		const checkbox = document.getElementById(layout);
		// A layout missing from storage is included by default.
		checkbox.checked = included[layout] ?? true;
	}

	const checkboxes = document.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach(element => {
		element.addEventListener("change", async e => {
			const updated = {};
			for (const layout of layouts) {
				const checkbox = document.getElementById(layout);
				updated[layout] = checkbox.checked;
			}
			messenger.storage.local.set({ included: updated });
		});
	});
} catch (error) {
	console.log(error);
}
