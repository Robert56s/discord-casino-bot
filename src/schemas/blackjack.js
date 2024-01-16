const mongoose = require('mongoose');

const blackjackModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String, require: true, unique: true},
    amountBet: { type: Number},
    hashedApiKey: { type: String },
    rndOrgSeed: { type: String },
    serverSeed: { type: String },
    signature: { type: String },
    shoe: { type: String }, 
    time: { type: String },
    random: { type: String }
});

module.exports = mongoose.model("blackjackModels", blackjackModel);