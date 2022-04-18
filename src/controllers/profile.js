const path = require("path");
const Profile = require("../models/profile");

/**
 *  Render user profile
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const profileView = (req, res) => {
	res.sendFile(path.join(__dirname, "../views/profile.html"));
};

/**
 * Gets users public profile data
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getProfile = async (req, res) => {
	let profile = await Profile.find(req.params.username);
	if (!profile) res.json({ error: "Profile not found" });
	else res.json(profile.publicData());
};

/**
 *  Deletes user account
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const delProfile = async (req, res) => {
	// Check if profile belongs to the current user session
	if (!req.user) {
		res.json({ error: "Unauthorized" });
		return;
	}
	await Profile.delete(req.user);
	res.json({});
};

module.exports = {
	profileView,
	delProfile,
	getProfile,
};
