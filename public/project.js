const iframe = document.getElementById("project-frame");
const input = document.createElement("input");
let load = false;
let editor = null;
let buttonsVisible = false;
let creator = null;
let datasets = null;
let user = getUserInfo();
let username = window.location.pathname.split("/")[2];
let slug = window.location.pathname.split("/")[3];

// Append loaded data to datasets
input.type = "file";
input.onchange = (e) => {
	let file = e.target.files[0];
	let reader = new FileReader();
	reader.readAsText(file, "UTF-8");
	reader.onload = (e) => {
		datasets.push(e.target.result);
		renderDatasets();
		showSaveButtons();
	};
};

// Start loading anim
toggleLoad();

// Start fetching project data
fetch(`/api/project/${username}/${slug}`)
	.then((res) => res.json())
	.then((res) => {
		// Todo: proper error handling
		if (res.error) {
			window.location.href = "/";
		}

		document.title = res.title;
		creator = res.username;
		datasets = res.datasets;

		// Update UI
		$("#project-title").text(res.title);
		$("#project-creator").text(res.username).attr("href", `/p/${res.username}`);
		$("#project-created").text(res.created);
		$("#project-editor").text(res.code);

		// Inject code into iframe
		iframe.onload = () => {
			const script = iframe.contentWindow.document.createElement("script");
			script.type = "text/javascript";
			script.innerText = `const datasets = ${JSON.stringify(datasets)};${
				res.code
			}`;
			iframe.contentWindow.document.body.appendChild(script);
		};

		iframe.contentWindow.location.reload();

		// Render editor
		editor = ace.edit("project-editor");
		editor.getSession().setUseWorker(false);
		editor.getSession().setMode("ace/mode/javascript");
		editor.on("change", (e) => {
			showSaveButtons();
		});


		showSaveButtons();
		renderDatasets();
		toggleLoad()
	});

// Save project button
$("#button-save").click(() => {
	const code = editor.getValue();
	buttonsVisible = false;

	fetch("/api/project", {
		method: "post",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ code, slug, datasets }),
	})
		.then((res) => res.json())
		.then((res) => {
			$("#button-save").toggleClass("hidden");
			buttonsVisible = false;
		});
});

// Execute project locally without saving
$("#button-run").click(() => {
	iframe.onload = () => {
		const script = iframe.contentWindow.document.createElement("script");
		script.type = "text/javascript";
		script.innerText = `const datasets = ${JSON.stringify(
			datasets
		)};${editor.getValue()}`;
		iframe.contentWindow.document.body.appendChild(script);
	};

	iframe.contentWindow.location.reload();
});

// Add and save dataset
$("#button-add").click(() => {
	input.click();
});

/**
 * Displays dataset options and info
 */
function renderDatasets() {
	// Reset dataset container
	let dataset = $("#container-dataset");
	dataset.html("");

	// Show add button
	if (user && user.username === creator) $("#button-add").removeClass("hidden");

	// Add each dataset
	for (let key in datasets) {
		dataset.append(`
			<div class="dataset">
				<div class="dataset-options">
					<span>[${key}]</span>
					<div>
						<button class="data-button-view button" value="${key}"><i class="fa-solid fa-eye"></i></button>
						<button class="data-button-delete button ${
							user && user.username === creator ? "" : "hidden"
						}" value="${key}"><i class="fa-solid fa-trash"></i></button>
					</div>	
				</div>
				<span id="dataset-content-${key}" class="dataset-content hidden">${
			datasets[key]
		}</span>
			</div>	
		`);
	}

	$(".data-button-view")
		.unbind()
		.click((e) => {
			const target = $(e.target).val();
			$(`#dataset-content-${target}`).toggleClass("hidden");
		});

	$(".data-button-delete")
		.unbind()
		.click((e) => {
			const target = $(e.target).val();
			datasets.splice(target, 1);
			renderDatasets();
			showSaveButtons();
		});
}

$("#button-del").click(() => {
	fetch("/api/project", {
		method: "delete",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ slug }),
	}).then(res => res.json()).then(res => {
		window.location.href = "/";
	});
});

// Show save buttons
function showSaveButtons() {
	if (!buttonsVisible) {
		if (user && user.username === creator) {
			$("#button-save").toggleClass("hidden");
			$("#button-del").removeClass("hidden");
		}
		buttonsVisible = true;
	}
}

// Toggles loading animation
function toggleLoad() {
	const container = $("#container-project");
	$(".placeholder").toggleClass("hidden");
	if (load) {
		stopBarAnim();
		container.removeClass("hidden");
		load = !load;
		return;
	}
	startBarAnm();
	container.addClass("hidden");
	load = !load;
}
