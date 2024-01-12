const { model, Schema } = require("mongoose");

const PaymentSchema = new Schema({
  propertyTitle: String,
  propertyLocation: String,
  buyerEmail: String,
  buyerName: String,
  soldPrice: String,
  transactionId: String,
  date: String,
});

const Payment = model("Payment", PaymentSchema);

module.exports = Payment;
