const dice = require('../schemas/dice');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getDice = async (dId, amountBet, payout, playerId, hashedApiKey, signature, result, multiplier, winChance, win, time, random) => {
        let diceProfile = await dice.findOne({ id: dId });
        if(diceProfile) {
            return diceProfile;
        } else if(amountBet) {
            diceProfile = await new dice({
                _id: mongoose.Types.ObjectId(),
                id: dId,
                amountBet: amountBet,
                payout: payout,
                playerId: playerId,
                hashedApiKey: hashedApiKey,
                signature: signature,
                result: result,
                multiplier: multiplier,
                winChance: winChance,
                win: win,
                time: time,
                random: random
            });
            diceProfile.save().catch(err => console.log(err));
            return diceProfile;
        }
    }
}