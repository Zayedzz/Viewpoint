const Project = require("./models/project");
const Profile = require("./models/profile");

async function seed() {
	await require("./mongo").init();

	await Profile.update({
		uid: "653328",
		avatar: "https://avatars.githubusercontent.com/u/653328?v=4",
		email: "mf5030@mun.ca",
		username: "MKF",
	});

	await Project.create({
		uid: "653328",
		title: "All github commits in 2014",
		slug: "github-commits-in-2014",
		description: "",
		created: "Sat Apr 02 2022",
		code: 'let body = $(document.body);\nlet canvas = document.createElement("canvas");\nbody.css("width", "90%");\n\nconst ctx = canvas.getContext("2d");\nconst data = datasets[0].split(",").map(val => parseInt(val));\n\nconst chart = new Chart(ctx, {\n   type: "bar",\n   data: {\n       labels: ["Jan", "Feb", "Mar", "Apr", "May", \n                "Jun", "Jul", "Aug", "Sept", "Sept", "Nov", "Dec"],\n       datasets: [{\n          label: "# of Commits",\n          data: data,\n          backgroundColor: "rgba(54, 162, 235, 0.35)",\n           borderColor: "rgb(54, 162, 235)",\n        borderWidth: 2\n       }],\n   },\n   options: {\n        responsive: true\n    }\n});\n\nbody.append(canvas);',
		datasets: [
			"9383722,10230196,11014620,11233086,11075015,11090491,11440849,11921482,13112873,13917189,13918245,14224631",
		],
	});
}

seed().then((e) => {
	console.log("Seeded database");
	process.exit();
});
