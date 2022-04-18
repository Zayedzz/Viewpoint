/**
 * Convert string to slug
 * @param {string} str
 */
const generateSlug = (str) => {
	return str
		.toLowerCase()
		.replace(/[^a-z0-9\-]+/g, " ")
		.replace(/(-+)/g, "")
		.trim()
		.replace(/(\s+)/g, "-");
};

module.exports = { generateSlug };
