process.env.NODE_ENV = "test";
process.env.GITHUB_CLIENT_ID = "test";
process.env.GITHUB_CLIENT_SECRET = "test";

const sinon = require("sinon");
const chai = require("chai");
const chaiHttp = require("chai-http");
const chaiAsPromised = require("chai-as-promised");
const should = chai.should();

let Mongo = require("../src/mongo");
let app = require("../src/app");
const Profile = require("../src/models/profile");
const Project = require("../src/models/project");
const { generateSlug } = require("../src/util");

chai.use(chaiHttp);
chai.use(chaiAsPromised);

// Stub controller routes
let profileController = require("../src/controllers/profile");
let delProfile = profileController.delProfile;
sinon.stub(profileController, "delProfile");
let projectController = require("../src/controllers/project");
let { delProject, updateProject, createProject } = projectController;
sinon.stub(projectController, "updateProject");
sinon.stub(projectController, "delProject");
sinon.stub(projectController, "createProject");

// Test account info
const uid = 1234;
let username = "test";
const avatar = "test.png";
const email = "test@test.test";

// Test project info
let title = "Test Title";
const datasets = ["{test: 123,}"];

// Generate app settings and instantiate database connection
before(async () => {
	app = await app();
});

describe("Models", () => {
	describe("Profile", () => {
		it("Should crate a user in the database", (done) => {
			Profile.update({ uid, username, avatar, email })
				.should.eventually.not.be.rejectedWith(Error)
				.notify(done);
		});

		it("Should retrieve a user from the database", async () => {
			let user = await Profile.find(username);
			user.uid.should.equal(uid);
			user.username.should.equal(username);
			user.avatar.should.equal(avatar);
			user.email.should.equal(email);
		});

		it("Should update an existing user in the database", async () => {
			username = "new test";
			await Profile.update({ uid, username, avatar, email });
			let user = await Profile.find(username);
			user.uid.should.equal(uid);
			user.username.should.equal(username);
			user.avatar.should.equal(avatar);
			user.email.should.equal(email);
		});
	});

	describe("Project", () => {
		it("Should create a project in the database", (done) => {
			Project.create({ uid, title, datasets })
				.should.eventually.not.have.property("error")
				.notify(done);
		});

		it("Should not create duplicate entries", (done) => {
			Project.create({ uid, title, datasets })
				.should.eventually.have.property("error")
				.notify(done);
		});

		it("Should return an error if user enters invalid data", (done) => {
			Project.create({ uid, title, datasets, slug: "TEN-tst" })
				.should.eventually.have.property("error")
				.notify(done);
		});

		it("Should retrieve a project from the database", async () => {
			let project = await Project.find(uid, generateSlug(title));
			project.uid.should.equal(uid);
			project.title.should.equal(title);
			project.slug.should.equal(generateSlug(title));
			project.created.should.not.be.null;
		});

		it("Should update a project in the database", async () => {
			let project = await Project.update(uid, generateSlug(title), {
				code: "test code",
				description: "test des",
				title: "new title",
			});
			project.should.not.have.property("error");
			project.uid.should.equal(uid);
			project.title.should.not.equal(title);
			project.slug.should.equal(generateSlug(title));
			project.created.should.not.be.null;
			project.code.length.should.be.greaterThan(1);
			project.description.length.should.be.greaterThan(1);
		});

		it("Should delete a project in the database", (done) => {
			Project.delete(uid, generateSlug(title))
				.should.eventually.not.have.property("error")
				.notify(done);
		});
	});
});

describe("Routes", () => {
	// Generate test data
	before(async () => {
		await Profile.update({ uid, username, avatar, email });
		await Project.create({ uid, title, datasets });
	});

	describe("/", () => {
		describe("GET", () => {
			it("Should return index page", (done) => {
				chai
					.request(app)
					.get("/")
					.end((err, res) => {
						res.should.have.status(200);
						done();
					});
			});
		});
	});

	describe("/p", () => {
		describe("GET", () => {
			it("Should redirect to index", (done) => {
				chai
					.request(app)
					.get("/p")
					.end((err, res) => {
						res.should.have.status(200);
						res.should.redirect;
						done();
					});
			});
		});
	});

	describe("/p/:username", () => {
		describe("GET", () => {
			it("Should render profile page", () => {
				chai
					.request(app)
					.get("/p/username")
					.end((err, res) => {
						res.should.have.status(200);
					});
			});
		});
	});

	describe("/api/profile", () => {
		describe("DEL", () => {
			it("Should require user to be logged in", (done) => {
				profileController.delProfile.callsFake(delProfile); // Use original controller
				chai
					.request(app)
					.del(`/api/profile`)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});

			it("Should delete account records", (done) => {
				// Modify request to imitate logged in session
				profileController.delProfile.callsFake((req, res) => {
					req.user = username;
					return delProfile(req, res);
				});

				chai
					.request(app)
					.delete(`/api/profile`)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.not.have.property("error");
						Profile.find(username).should.eventually.be.null.notify(done);
					});
			});
		});

		after(async () => {
			// Replace deleted profile and project
			await Profile.update({ uid, username, avatar, email });
			await Project.create({ uid, title, datasets });
		});
	});

	describe("/api/profile/:username", () => {
		describe("GET", () => {
			it("Should return public profile information", (done) => {
				chai
					.request(app)
					.get(`/api/profile/${username}`)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.username.should.equal(username);
						done();
					});
			});
		});
	});

	describe("/p/:username/:slug", () => {
		describe("GET", () => {
			it("Should render project view", (done) => {
				chai
					.request(app)
					.get(`/p/${username}/${generateSlug(title)}`)
					.end((err, res) => {
						res.should.have.status(200);
						done();
					});
			});
		});
	});

	describe("/api/project/:username/:slug", () => {
		describe("GET", () => {
			it("Should return project data", (done) => {
				chai
					.request(app)
					.get(`/api/project/${username}/${generateSlug(title)}`)
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.not.have.property("error");
						res.body.username.should.equal(username);
						res.body.slug.should.not.be.null;
						res.body.title.should.equal(title);
						res.body.code.should.not.be.null;
						res.body.datasets.should.not.be.null;
						done();
					});
			});
		});
	});

	describe("/api/projects/:username", () => {
		// Generate extra project
		before(async () => {
			await Project.create({ uid, title: "Extra project" });
		});

		describe("GET", () => {
			it("Should return multiple projects", (done) => {
				chai
					.request(app)
					.get(`/api/project/${username}`)
					.query({ all: true })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.be.a("object");
						res.body.total.should.be.greaterThan(1);
						done();
					});
			});
		});
	});

	describe("/api/project", () => {
		describe("PUT", () => {
			it("Should require user to be logged in", (done) => {
				projectController.createProject.callsFake(createProject); // Use original controller
				chai
					.request(app)
					.put(`/api/project`)
					.send({ title: "other project" })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});

			it("Should allow user to create a project", (done) => {
				// Modify request to imitate logged in session
				projectController.createProject.callsFake((req, res) => {
					req.user = username;
					return createProject(req, res);
				});

				chai
					.request(app)
					.put(`/api/project`)
					.send({ title: "other project" })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.not.have.property("error");
						done();
					});
			});

			it("Should not allow the user have duplicate projects", (done) => {
				// Modify request to imitate logged in session
				projectController.createProject.callsFake((req, res) => {
					req.user = username;
					return createProject(req, res);
				});

				chai
					.request(app)
					.put(`/api/project`)
					.send({ title: "other project" })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});
		});

		describe("POST", () => {
			it("Should require user to be logged in", (done) => {
				projectController.updateProject.callsFake(updateProject); // Use original controller
				chai
					.request(app)
					.post(`/api/project`)
					.set("title", "new title")
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});

			it("Should not allow user to edit other projects", (done) => {
				// Modify request to imitate logged in session
				projectController.updateProject.callsFake((req, res) => {
					req.user = "OtherUser";
					return updateProject(req, res);
				});

				chai
					.request(app)
					.post(`/api/project`)
					.set("title", "new title")
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});

			it("Should update the project data", (done) => {
				// Modify request to imitate logged in session
				projectController.updateProject.callsFake((req, res) => {
					req.user = username;
					return updateProject(req, res);
				});

				// Change title
				let oldSlug = generateSlug(title);
				let newTitle = "new title";
				chai
					.request(app)
					.post(`/api/project`)
					.send({ title: newTitle, slug: oldSlug })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.not.have.property("error");
						res.body.title.should.equal(newTitle);
						res.body.slug.should.equal(oldSlug);
						done();
					});
			});
		});

		describe("DEL", () => {
			it("Should require user to be logged in", (done) => {
				projectController.delProject.callsFake(delProject); // Use original controller
				chai
					.request(app)
					.del(`/api/project`)
					.query({ slug: generateSlug(title) })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.have.property("error");
						done();
					});
			});

			it("Should allow user to delete their project", (done) => {
				// Modify request to imitate logged in session
				projectController.delProject.callsFake((req, res) => {
					req.user = username;
					return delProject(req, res);
				});

				chai
					.request(app)
					.del(`/api/project`)
					.send({ slug: generateSlug(title) })
					.end((err, res) => {
						res.should.have.status(200);
						res.body.should.not.have.property("error");
						done();
					});
			});
		});
	});
});

describe("Utils", () => {
	describe("generateSlug", () => {
		it("Should generate a string that conforms to the slug regex", () => {
			let test = generateSlug(
				"RISETNnisetnrst@!#%!*&^><{ iresnt yfuF456RT URF rfyitu! ~* qf uqf456 'qfT QU#(~ $~@4st* &~wufpnis ernyut )EISRNTI YU &~*@"
			);
			/[^a-z0-9\-]+/g.test(test).should.be.false;
		});
	});
});

// Delete the test database
after(async () => {
	await Mongo.db.dropDatabase();
});
