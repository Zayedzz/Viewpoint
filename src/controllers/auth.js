const passport = require("passport");
const Profile = require("../models/profile");

const githubOauth = passport.authenticate(
	"github",
	{ scope: ["user"] },
	() => {}
);

/**
 * Saves necessary user info in a cookie
 * Todo: Should not be a cookie
 * @param req
 * @param res
 * @return {Promise<void>}
 */
const githubOauthCallback = async (req, res) => {
	const user = await Profile.find(req.user);
	res.cookie(
		"user",
		{ username: user.username, avatar: user.avatar },
		{ secure: false }
	);
	res.redirect("/");
};

/**
 * Registers or updates local user from their GitHub information
 * Todo: Error handling
 * @param {string} access
 * @param {string} refresh
 * @param {object} profile
 * @param {function} done
 * @returns {Promise<function>}
 */
const githubRegister = async (access, refresh, profile, done) => {
	await Profile.update({
		uid: profile["id"],
		username: profile["username"],
		avatar: profile["_json"]["avatar_url"],
		email: profile["emails"][0]["value"],
	});
	return done(null, profile["username"]);
};

/**
 * Clears all session data
 * Todo: Should not be a cookie
 * @param req
 * @param res
 * @return {Promise<void>}
 */
const logout = async (req, res) => {
	req.logout();
	res.clearCookie("user");
	res.redirect("/");
};

module.exports = {
	githubRegister,
	githubOauth,
	githubOauthCallback,
	logout,
};
