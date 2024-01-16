const mongoose = require('mongoose');

const profileModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: String, require: true, unique: true},
    balance: { type: Number, default: 0 },
    profit: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    loses: { type: Number, default: 0 },
    totalGamesPlayed: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawed: { type: Number, default: 0 },
    totalTipped: { type: Number, default: 0 },
    totalTipsReceived: { type: Number, default: 0 },
    activeGame: { type: Boolean, default: false },
    activeWithdraw: { type: Boolean, default: false }
});

module.exports = mongoose.model("profileModels", profileModel);