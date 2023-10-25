  const mongoose = require('mongoose');
  require('dotenv').config();

  const MONGO_URI = process.env.MONGO_URI; 

  function connectToMongoDB() {
      mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

  }

  module.exports = { connectToMongoDB };
