const path = require("path");
const Project = require("../models/project");
const Profile = require("../models/profile");

/**
 *  Render project view
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const projectView = (req, res) => {
	res.sendFile(path.join(__dirname, "../views/project.html"));
};

/**
 * Gets project and relevant profile data
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getProject = async (req, res) => {
	let profile = await Profile.find(req.params.username);
	if (!profile) {
		res.json({ error: "Profile not found" });
		return;
	}

	let project = await Project.find(profile.uid, req.params.slug);
	if (!project) {
		res.json({ error: "Project not found" });
		return;
	}

	res.json({ ...profile.publicData(), ...project.publicData() });
};

/**
 * Gets most recent projects
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getAllProjects = async (req, res) => {
	let limit = parseInt(req.query.limit);
	let skip = parseInt(req.query.skip);

	if (limit < 1 || limit > 100 || isNaN(limit)) limit = 1;
	if (skip < 0 || isNaN(skip)) skip = 0;

	let projects = await Project.get(limit, skip);
	if (!projects) {
		res.json({ error: "Error getting projects" });
		return;
	}

	// Todo: remove redundant lookups
	projects.projects = projects.projects.map(async (project) => {
		let user = await Profile.findUid(project.uid);
		return { ...project, ...user.publicData() };
	});

	projects.projects = await Promise.all(projects.projects);

	res.json(projects);
};

/**
 * Gets all user projects
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const getProjects = async (req, res) => {
	let limit = parseInt(req.query.limit);
	let skip = parseInt(req.query.skip);

	if (limit < 1 || limit > 100 || isNaN(limit)) limit = 1;
	if (skip < 0 || isNaN(skip)) skip = 0;

	let profile = await Profile.find(req.params.username);

	if (!profile) {
		res.json({ error: "Profile not found" });
		return;
	}

	let projects = await Project.findAllBy(profile.uid, limit, skip);
	if (projects.error) {
		res.json({ error: "Error fetching projects" });
		return;
	}

	res.json(projects);
};

/**
 * Updates or creates project data
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const createProject = async (req, res) => {
	if (!req.user) {
		res.json({ error: "Unauthorized" });
		return;
	}

	let profile = await Profile.find(req.user);
	res.json(await Project.create({ uid: profile.uid, ...req.body }));
};
/**
 * Updates or creates project data
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const updateProject = async (req, res) => {
	if (!req.user) {
		res.json({ error: "Unauthorized" });
		return;
	}

	let profile = await Profile.find(req.user);
	if (!profile) {
		res.json({ error: "Profile not found" });
		return;
	}

	res.json(await Project.update(profile.uid, req.body.slug, req.body));
};

/**
 *  Deletes project
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 */
const delProject = async (req, res) => {
	// Check if project belongs to the current user session
	if (!req.user) {
		res.json({ error: "Unauthorized" });
		return;
	}

	let profile = await Profile.find(req.user);
	if (!profile) {
		res.json({ error: "Profile not found" });
		return;
	}

	res.json(await Project.delete(profile.uid, req.body.slug));
};

module.exports = {
	projectView,
	getProject,
	getProjects,
	getAllProjects,
	updateProject,
	delProject,
	createProject,
};
