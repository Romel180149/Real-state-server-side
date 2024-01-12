const { model, Schema } = require("mongoose");

const InstagramSchema = new Schema({
  image: String,
});

const Instagram = model("Instagram", InstagramSchema);

module.exports = Instagram;
