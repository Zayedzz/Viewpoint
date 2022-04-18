const LIMIT = 7;
let load = false;
let skip = 0;
let lastId = 0;
const user = window.location.pathname.split("/")[2];

// Immediately fetch projects
toggleLoad();
fetchUser();

/**
 * Fetch user info from backend
 * @param limit
 * @param skip
 */
function fetchUser(limit = LIMIT, skip = 0) {
	fetch(`/api/profile/${user}`)
		.then((res) => res.json())
		.then((res) => {
			// Todo: proper error handling
			if (res.error) {
				window.location.href = "/";
			}
			$(".sidebar").append(`<img src="${res.avatar}" alt="" id="profile-pic">`);
			$(".sidebar").append(`<h2 class="project-creator">${res.username}</h2>`);
			$(".sidebar").append(
				`<button class="button github-button"><i class="fa-brands fa-github"></i> GitHub</button>`
			);

			$(".github-button").click(() => {
				window.location.href = `https://github.com/${res.username}`;
			});

			fetchProjects(limit, skip);
		});
}

/**
 * Fetches projects from backend
 * See index.js for more details
 * @param limit
 * @param skip
 */
function fetchProjects(limit = LIMIT, skip = 0) {
	fetch(`/api/project/${user}?limit=${limit}&skip=${skip}`)
		.then((res) => res.json())
		.then((res) => {
			const container = $("#container-projects");
			const pagination = $(".pagination");

			if (res.total === 0) {
				$("#container-recent-projects").append(`
					<div id="no-projects">${user} hasn't created any projects yet</span>
				`);
				toggleLoad();
				pagination.toggleClass("hidden");
				return;
			}

			res.projects.forEach((project) => {
				container.append(`
					<button value="${user}/${project.slug}" class="project-preview"><span>${project.title}</span><div><span>${project.created}</span></div></button>
				`);
			});

			pagination.append(`
				<div id="pagination-left" class="pagination-cap"><i class="fa-solid fa-chevron-left"></i></div>
			`);

			for (let i = 0; i <= Math.ceil(res.total / LIMIT) - 1; i++) {
				pagination.append(`
					<div class="pagination-item ${0 === i ? "selected" : ""}">${i + 1}</div>
				`);
			}

			pagination.append(`
				<div id="pagination-right" class="pagination-cap"><i class="fa-solid fa-chevron-right"></i></div>
			`);

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

function updateProjects(skip) {
	toggleLoad();

	fetch(`/api/project/${user}?limit=${LIMIT}&skip=${skip}`)
		.then((res) => res.json())
		.then((res) => {
			const container = $("#container-projects");
			const pagination = $(".pagination-item");
			container.html(``);

			res.projects.forEach((project) => {
				container.append(`
					<button value="${project.username}/${project.slug}" class="project-preview"><span>${project.title}</span><div><span>${project.created}</span></div></button>
				`);
			});

			const id = Math.ceil(skip / LIMIT);
			pagination.eq(lastId).removeClass("selected");
			pagination.eq(id).addClass("selected");
			lastId = id;

			$(".project-preview")
				.unbind()
				.click((e) => {
					const target = $(e.target).val();
					window.location.href = `/p/${target}`;
				});

			toggleLoad();
		});
}

function toggleLoad() {
	const container = $("#container-profile");
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
