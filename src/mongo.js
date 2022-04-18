const { MongoClient } = require("mongodb");
const DB_NAME =
	process.env.NODE_ENV === "test" ? "viewpoint_tests" : "viewpoint";
const DB_URI = process.env.DB_URI || "mongodb://127.0.0.1:27017";

class Mongo {
	constructor() {
		this.client = new MongoClient(DB_URI);
	}

	async init() {
		try {
			await this.client.connect();
			this.db = await this.client.db(DB_NAME);
		} catch (e) {
			throw e;
		}
	}
}

module.exports = new Mongo();
