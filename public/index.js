const LIMIT = 7;
let load = false;
let skip = 0;
let lastId = 0;

// Immediately fetch projects
toggleLoad();
fetchProjects();

/**
 * Fetches projects from the server
 * @param limit
 * @param skip
 */
function fetchProjects(limit = LIMIT, skip = 0) {
	fetch(`/api/project?limit=${limit}&skip=${skip}`)
		.then((res) => res.json())
		.then((res) => {
			const container = $("#container-projects");
			const pagination = $(".pagination");

			// Check if any projects was found
			if (res.total === 0) {
				$("#container-content").append(`
					<div id="no-projects">No projects available</span>
				`);
				toggleLoad();
				pagination.toggleClass("hidden");
				return;
			}

			// Generate project html
			res.projects.forEach((project) => {
				container.append(`
					<button value="${project.username}/${project.slug}" class="project-preview"><span>${project.title}</span><div><img src="${project.avatar}" class="project-icon" alt=""><span>${project.username}</span></div></button>
				`);
			});

			// Generate pagination button
			pagination.append(`
				<div id="pagination-left" class="pagination-cap"><i class="fa-solid fa-chevron-left"></i></div>
			`);

			// Generate pages
			for (let i = 0; i <= Math.ceil(res.total / LIMIT) - 1; i++) {
				pagination.append(`
					<div class="pagination-item ${0 === i ? "selected" : ""}">${i + 1}</div>
				`);
			}

			// Generate pagination button
			pagination.append(`
				<div id="pagination-right" class="pagination-cap"><i class="fa-solid fa-chevron-right"></i></div>
			`);

			// Register events
			$("#pagination-left").click(() => {
				if (skip === 0) return;
				updateProjects((skip -= LIMIT));
			});

			$("#pagination-right").click(() => {
				if (skip >= res.total - LIMIT) return;
				updateProjects((skip += LIMIT));
			});

			$(".project-preview")
				.unbind()
				.click((e) => {
					const target = $(e.target).val();
					window.location.href = `/p/${target}`;
				});

			toggleLoad();
		});
}

/**
 * Updates shown projects
 * @param skip
 */
function updateProjects(skip) {
	toggleLoad();

	fetch(`/api/project?limit=${LIMIT}&skip=${skip}`)
		.then((res) => res.json())
		.then((res) => {
			const container = $("#container-projects");
			const pagination = $(".pagination-item");
			container.html(``); // Remove previous projects

			// Generate project buttons
			res.projects.forEach((project) => {
				container.append(`
					<button value="${project.username}/${project.slug}" class="project-preview"><span>${project.title}</span><div><img src="${project.avatar}" class="project-icon" alt=""><span>${project.username}</span></div></button>
				`);
			});

			// Updated selected style
			const id = Math.ceil(skip / LIMIT);
			pagination.eq(lastId).removeClass("selected");
			pagination.eq(id).addClass("selected");
			lastId = id;

			// Rebind project buttons
			$(".project-preview")
				.unbind()
				.click((e) => {
					const target = $(e.target).val();
					window.location.href = `/p/${target}`;
				});

			toggleLoad();
		});
}

/**
 * Toggles loading animation
 */
function toggleLoad() {
	const container = $("#container-projects");
	const pagination = $(".pagination");
	$(".placeholder").toggleClass("hidden");
	if (load) {
		stopBarAnim();
		container.removeClass("hidden");
		pagination.removeClass("hidden");
		load = !load;
		return;
	}
	startBarAnm();
	container.addClass("hidden");
	pagination.addClass("hidden");
	load = !load;
}
