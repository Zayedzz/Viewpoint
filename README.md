# viewpoint

A platform for sharing interactive data visualizations.

# Prerequisites

In order to run the dev server you will need to create a GitHub OAuth application and supply the server with the client id
and secret using the `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` environment variables. You can provide theses through the terminal or by
placing them inside a `.env` file at the project root.

# Running

Start the dev server using `npm run dev`

# Tests

_Note: Tests do not require GitHub OAuth credentials to run, all authenticated routes are stubs_

Tests can be executed using `npm run test`
