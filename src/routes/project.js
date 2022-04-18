const router = require("express").Router();
const {
	projectView,
	updateProject,
	getProject,
	getProjects,
	getAllProjects,
	delProject,
	createProject,
} = require("../controllers/project");

router.get("/p/:username/:slug", projectView);
router.get("/api/project/:username", getProjects);
router.get("/api/project/:username/:slug", getProject);
router.get("/api/project", getAllProjects);
router.delete("/api/project", delProject);
router.post("/api/project", updateProject);
router.put("/api/project", createProject);

module.exports = router;
