

const { model, Schema } = require("mongoose");

const PropertySchema = new Schema({
  propertyImage: String,
  propertyTitle: String,
  propertyLocation: String,
  minPrice: String,
  maxPrice: String,
  verificationStatus: String,
  details: String,
  agentEmail: String,
  agentName: String,
  agentImage: String,
  advertise: String,
});

const Property = model("Property", PropertySchema);

module.exports = Property;
