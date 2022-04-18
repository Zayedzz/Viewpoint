const router = require("express").Router();
const {
	githubOauth,
	githubOauthCallback,
	logout,
} = require("../controllers/auth");
const passport = require("passport");

router.get("/login/github", githubOauth);
router.get(
	"/login/github/auth",
	passport.authenticate("github", {
		failureRedirect: "/",
	}),
	githubOauthCallback
);
router.get("/logout", logout);

module.exports = router;
