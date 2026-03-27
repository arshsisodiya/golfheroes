const serverless = require('serverless-http');
// import the Express app without triggering app.listen
const app = require('../backend/server');

module.exports = serverless(app);
