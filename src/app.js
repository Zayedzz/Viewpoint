require("dotenv").config();
const passport = require("passport");
const path = require("path");
const bodyParser = require("body-parser");
const { Strategy } = require("passport-github2");
const PORT = process.env.PORT || 3000;

const app = async () => {
	const app = require("express")();

	// Initialize connection to mongodb
	await require("./mongo").init();

	// Use body-parser to parse JSON before it hits the controller
	app.use(bodyParser.json());

	// Initialize passport
	app.use(passport.initialize({}));
	app.use(
		require("express-session")({
			secret: "dev secret",
			resave: false,
			saveUninitialized: false,
		})
	);
	app.use(passport.session({}));

	passport.serializeUser(function (user, done) {
		done(null, user);
	});

	passport.deserializeUser(function (obj, done) {
		done(null, obj);
	});

	passport.use(
		"github",
		new Strategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: "/login/github/auth",
				scope: ["user"],
			},
			require("./controllers/auth").githubRegister
		)
	);

	// Register routes
	app.use(require("express").static(path.join(__dirname, "../public")));
	app.use(require("./routes/auth"));
	app.use(require("./routes/profile"));
	app.use(require("./routes/project"));

	return app;
};

// Start server if executed explicitly via node cli
if (require.main === module)
	app()
		.then((app) => {
			app.listen(PORT, () => {
				if (process.env.NODE_ENV === "test") return;
				console.log(`Server started on port ${PORT}!`);
			});
		})
		.catch((e) => {
			if (process.env.NODE_ENV === "test") return;
			console.log("Error starting server!");
			console.log(e);
		});

module.exports = app;
