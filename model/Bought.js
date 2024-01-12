const { model, Schema } = require("mongoose");

const BoughtSchema = new Schema({
  propertyImage: String,
  propertyTitle: String,
  propertyLocation: String,
  agentEmail: String,
  agentName: String,
  offeredAmount: String,
  buyerEmail: String,
  buyerName: String,
  buyingDate: String,
  status: String,
});

const Bought = model("Bought", BoughtSchema);

module.exports = Bought;
