const mongoose = require('mongoose');

const diceduelModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String, require: true, unique: true},
    senderId: {type: String},
    receiverId: {type: String},
    totalAmount: { type: Number},
    winnerId: { type: String },
    loserId: { type: String },
    hashedApiKey: { type: String },
    signature: { type: String },
    senderResult: { type: String },
    receiverResult: { type: String },
    time: { type: String },
    random: { type: String }
});

module.exports = mongoose.model("diceduelModels", diceduelModel);