let create = null;

// Show login / user menu
let cookie = Cookies.get("user");
if (cookie) {
	let user = JSON.parse(cookie.substring(2));
	let menu = $("#menu");

	// Generate menu button
	menu.html(`
      <img src="${user.avatar}" alt="Profile picture"/><i class="fa-solid fa-chevron-down"></i>
   `);

	// Bind menu events
	$("#profile").click((e) => {
		e.stopPropagation();
		window.location.href = `/p/${user.username}`;
	});
	$("#logout").click((e) => {
		e.stopPropagation();
		window.location.href = "/logout";
	});
	$("#create").click(toggleCreate);

	// Hide menu when user clicks on any other element
	$(document).click((event) => {
		$("#drop-menu").addClass("hidden");
	});

	// Bind menu toggle
	menu.click((e) => {
		e.stopPropagation();
		$("#drop-menu").toggleClass("hidden");
	});

	// Show menu button
	menu.toggleClass("hidden");
} else {
	// Show login button
	let signIn = $("#sign-in");
	signIn.click(() => {
		window.location.href = "/login/github";
	});
	signIn.toggleClass("hidden");
}

/**
 * Returns user info from cookie
 * @return {null|any}
 */
function getUserInfo() {
	if (!cookie) return null;
	return JSON.parse(cookie.substring(2));
}

/**
 * Opens project create prompt
 */
function toggleCreate() {
	if (create) {
		$("#blackout").toggleClass("hidden");
	} else {
		// Generate form
		$("#blackout").append(`
			<div id="container-create">
				<form action="/api/project" method="post" id="create-form">
					<div class="create-input">
						<span class="create-text">Title:</span>
						<input type="text" name="title" id="create-title" class="create-text">		
					</div>
					<div class="create-input">
						<span class="create-text">Slug:</span>
						<input type="text" name="slug" id="create-slug" class="create-text">		
					</div>
					<div class="create-input">
						<span class="create-text">Description:</span>
						<input type="text" name="description" id="create-description" class="create-text">
					</div>
					<div class="create-submit">
						<input type="button" id="create-cancel" value="cancel">
						<input type="button" id="create-submit" value="submit">
					</div>
				</form>
			</div>
		`);

		// Bind functionality
		$("#create-cancel").click(toggleCreate);
		$("#create-submit").click(createProject);

		$("#create-title").on("input", (e) => {
			console.log(generateSlug($(e.target).val()));
			$("#create-slug").val(generateSlug($(e.target).val()));
		});

		// Show prompt
		create = $("#container-create");
		toggleCreate();
	}
}

/**
 * Requests to create a project
 * Todo: something with errors
 * @param e
 */
function createProject(e) {
	e.preventDefault();

	// Serialize form data
	const data = $("#create-form")
		.serializeArray()
		.reduce(function (json, { name, value }) {
			json[name] = value;
			return json;
		}, {});

	// Request project creation
	fetch("/api/project", {
		method: "put",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	})
		.then((res) => res.json())
		.then((res) => {
			if (!res.error) {
				let user = JSON.parse(cookie.substring(2));
				window.location.href = `/p/${user.username}/${data.slug}`;
			}
		});
}

$("#title").click((e) => {
	window.location.href = "/";
});

/**
 * Starts loading animation
 */
function startBarAnm() {
	anime({
		targets: ".bar-anm .rectangle",
		height: 65,
		delay: anime.stagger(200, {
			from: "center",
			easing: "easeInOutQuad",
			start: 200,
		}),
		direction: "alternate",
		loop: true,
	});
}

function stopBarAnim() {
	anime.remove(".bar-anm .rectangle");
}

/**
 * Convert string to slug
 * @param {string} str
 */
const generateSlug = (str) => {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9\-]+/g, " ")
		.replace(/(-+)/g, "")
		.trim()
		.replace(/(\s+)/g, "-");
};
