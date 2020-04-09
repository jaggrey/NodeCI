// Change the default 5s before jest fails a test to 20 seconds
jest.setTimeout(20000);

const mongoose = require('mongoose');
const keys = require('../config/keys');

require('../models/User');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI, { useMongoClient: true });
