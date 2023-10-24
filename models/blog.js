const mongoose = require('mongoose');
const paginate = require('mongoose-paginate-v2');

const Schema = mongoose.Schema;

const BlogSchema = new Schema({
    title: String,
    description: String,
    tags: [String],
    author: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, default: Date.now },
    state: { type: String, enum: ['draft', 'published'], default: 'draft' },
    read_count: { type: Number, default: 0},
    reading_time: { type: String, default: 0 },
    body: String,
  });
  BlogSchema.plugin(paginate);

  module.exports = mongoose.model('Blogs', BlogSchema);