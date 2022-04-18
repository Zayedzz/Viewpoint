const router = require("express").Router();
const {
	profileView,
	getProfile,
	delProfile,
} = require("../controllers/profile");

router.get("/p", (req, res) => res.redirect("/"));
router.get("/p/:username", profileView);
router.get("/api/profile/:username", getProfile);
router.delete("/api/profile", delProfile);

module.exports = router;
