const mongoose = require('mongoose');

const coinflipModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String, require: true, unique: true},
    totalAmount: { type: Number},
    winnerId: { type: String },
    loserId: { type: String },
    hashedApiKey: { type: String },
    signature: { type: String },
    result: { type: String },
    time: { type: String },
    random: { type: String }
});

module.exports = mongoose.model("coinflipModels", coinflipModel);