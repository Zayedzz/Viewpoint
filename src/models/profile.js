const Mongo = require("../mongo");
const Projects = require("./project");
const COLLECTION = "profiles";

/**
 * @typedef profileParam
 * @property {int} uid
 * @property {string} username
 * @property {string} email
 * @property {string} avatar
 */

/**
 * @property {int} uid
 * @property {string} username
 * @property {string} email
 * @property {string} avatar
 */
class Profile {
	/**
	 * Update or create profile data
	 * Todo: Remove error throwing and replace with return
	 * @param {profileParam} data
	 */
	static async update(data) {
		const { uid, username, email, avatar } = data;
		try {
			const collection = await Mongo.db.collection(COLLECTION);
			await collection.updateOne(
				{
					uid,
				},
				{
					$set: {
						uid,
						username,
						email,
						avatar,
					},
				},
				{ upsert: true }
			);
		} catch (e) {
			throw e;
		}
	}

	/**
	 * Find and retrieve user information from the database
	 * @param {string} username
	 * @return {null | Profile}
	 */
	static async find(username) {
		// Find user
		const collection = await Mongo.db.collection(COLLECTION);
		let data = await collection.findOne({ username });

		// If a user was found construct profile and merge data
		if (data == null) return null;
		return Object.assign(new Profile(), data);
	}

	/**
	 * Find and retrieve user information from the database
	 * @return {null | Profile}
	 * @param uid
	 */
	static async findUid(uid) {
		// Find user
		const collection = await Mongo.db.collection(COLLECTION);
		let data = await collection.findOne({ uid });

		// If a user was found construct profile and merge data
		if (data == null) return null;
		return Object.assign(new Profile(), data);
	}

	/**
	 * Deletes user account and all relevant projects
	 * @param {string} username
	 * @return {Promise<{}|{error: {}}>}
	 */
	static async delete(username) {
		const collection = await Mongo.db.collection(COLLECTION);
		let result = await collection.findOneAndDelete({ username });
		if (!result.value) return { error: "Error deleting profile" };

		result = await Projects.deleteAll(result.value.uid);
		if (result.error) return { error: "Error deleting projects" };
		return {};
	}

	/**
	 * Gets public profile data
	 * @return {{avatar: string, username: string}}
	 */
	publicData() {
		return {
			username: this.username,
			avatar: this.avatar,
		};
	}
}

module.exports = Profile;
