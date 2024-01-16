const mongoose = require('mongoose');

const diceModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    id: { type: String, require: true, unique: true},
    amountBet: { type: Number},
    payout: { type: Number},
    playerId: { type: String },
    hashedApiKey: { type: String },
    signature: { type: String },
    result: { type: String },
    multiplier: {type: String},
    winChance: {type: Number},
    win: {type: Boolean},
    time: { type: String },
    random: { type: String }
});

module.exports = mongoose.model("diceModels", diceModel);