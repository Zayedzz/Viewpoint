const Mongo = require("../mongo");
const { generateSlug } = require("../util");
const COLLECTION = "projects";

/**
 * @typedef projectParams
 * @property {number} uid
 * @property {string} title
 * @property {string | undefined} description
 * @property {string | undefined} code
 * @property {[string] | undefined} datasets
 * @property {string | undefined} slug
 */

class Project {
	constructor() {
		this.uid = null;
		this.title = "";
		this.description = "";
		this.code = "";
		this.datasets = [];
		this.created = "";
		this.slug = "";
	}

	/**
	 * Gets projects public data
	 * @return {{code: string, created: string, description: string, datasets: [], title: string}}
	 */
	publicData() {
		return {
			title: this.title,
			description: this.description,
			code: this.code,
			datasets: this.datasets,
			created: this.created,
			slug: this.slug,
			uid: this.uid,
		};
	}

	/**
	 * Finds a project
	 * @param {number} uid
	 * @param {string} slug
	 * @return {Promise<(Project & Document & {_id: InferIdType<Document>})|null>}
	 */
	static async find(uid, slug) {
		const projects = await Mongo.db.collection("projects");
		let data = await projects.findOne(
			{ uid, slug },
			{ projection: { _id: 0 } }
		);

		// If a project was found construct profile and merge data
		if (data == null) return null;
		return Object.assign(new Project(), data);
	}

	/**
	 * Finds all projects by user
	 * @param {number} uid
	 * @param limit
	 * @param skip
	 */
	static async findAllBy(uid, limit = 10, skip = 0) {
		const projects = await Mongo.db.collection("projects");
		let data = await projects
			.find({ uid }, { projection: { _id: 0 } })
			.limit(limit)
			.skip(skip)
			.toArray();
		let total = await projects.countDocuments({ uid });

		// If a project was found construct profile and merge data
		if (data == null) return { projects: [] };
		let proj = data
			.map((i) => Object.assign(new Project(), i))
			.map((proj) => proj.publicData());

		return { projects: proj, total };
	}

	/**
	 * Get most recent projects
	 * @param {string|number} limit
	 * @param {number} skip
	 */
	static async get(limit = 10, skip = 0) {
		const projects = await Mongo.db.collection("projects");
		let data = await projects.find({}).limit(limit).skip(skip).toArray();
		let total = await projects.countDocuments();

		// Get project data
		if (data == null) return { projects: [] };
		let proj = data
			.map((i) => Object.assign(new Project(), i))
			.map((proj) => proj.publicData());

		return { projects: proj, total };
	}

	/**
	 * Creates and stores project information in database
	 * @param {projectParams} data
	 * @return {Promise<Object>}
	 */
	static async create(data) {
		// Check if data is valid
		let validation = Project.validate(data);
		if (validation.length > 0) return { error: validation };

		try {
			const projects = await Mongo.db.collection(COLLECTION);

			// Check if project already exists
			let slug = data.slug || generateSlug(data.title);
			const count = await projects.countDocuments(
				{
					uid: data.uid,
					slug,
				},
				{ limit: 1 }
			);
			if (count > 0) return { error: "Project already exists" };

			// Create project
			await projects.insertOne({
				...data,
				slug,
				created: new Date().toDateString(),
			});

			// OK
			return {};
		} catch (e) {
			return { error: e };
		}
	}

	/**
	 * Updates project data
	 * @param {number} uid
	 * @param {string} slug
	 * @param {projectParams} data
	 * @return {Promise<Object>}
	 */
	static async update(uid, slug, data) {
		// Validate user submitted data
		let validation = Project.validate(data);
		if (validation.length > 0) return { error: validation };

		try {
			const projects = await Mongo.db.collection(COLLECTION);
			let project = await projects.findOneAndUpdate(
				{
					uid,
					slug,
				},
				{
					$set: { ...data },
				}
			);

			// If a project was found construct profile and merge data
			if (!project.value) return { error: "Project could not be updated" };
			return Object.assign(new Project(), { ...project.value, ...data });
		} catch (e) {
			return { error: e };
		}
	}

	/**
	 * Deletes project from database
	 * @param uid
	 * @param slug
	 * @return {Promise<{error: string}|{}|{error}>}
	 */
	static async delete(uid, slug) {
		try {
			const projects = await Mongo.db.collection(COLLECTION);
			let result = await projects.deleteOne({ uid, slug });
			if (result.acknowledged && result.deletedCount > 0) return {};
			else return { error: "Error deleting project" };
		} catch (e) {
			return { error: e };
		}
	}

	/**
	 * Deletes all projects made by a user
	 * @param uid
	 * @return {Promise<{error: string}|{}|{error}>}
	 */
	static async deleteAll(uid) {
		try {
			const projects = await Mongo.db.collection(COLLECTION);
			let result = await projects.deleteMany({ uid });
			if (result.acknowledged) return {};
			else return { error: "Error deleting projects" };
		} catch (e) {
			return { error: e };
		}
	}

	/**
	 * Validates user submitted data
	 * @param {projectParams} data
	 * @return {[string]} errors
	 */
	static validate(data) {
		let errors = [];

		// Todo: validate key types and check for extras
		for (let key in data) {
			switch (key) {
				case "title":
					if (data.title.length > 120 || data.title.length < 1)
						errors.push("title");
					break;
				case "slug":
					if (/[^a-z0-9\-]+/g.test(data.slug)) errors.push("slug");
					break;
			}
		}

		return errors;
	}
}

module.exports = Project;
