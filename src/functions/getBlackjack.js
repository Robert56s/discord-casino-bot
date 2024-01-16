const blackjack = require('../schemas/blackjack');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getBlackjack = async (bjId, amountBet, hashedApiKey, rndOrgSeed, serverSeed, signature, time, shoe, random) => {
        let blackjackProfile = await blackjack.findOne({ id: bjId });
        if(blackjackProfile) {
            return blackjackProfile;
        } else if(!blackjackProfile) {
            blackjackProfile = await new blackjack({
                _id: mongoose.Types.ObjectId(),
                id: bjId,
                amountBet: amountBet,
                hashedApiKey: hashedApiKey,
                rndOrgSeed: rndOrgSeed,
                serverSeed: serverSeed,
                signature: signature,
                time: time,
                shoe: shoe,
                random: random
            });
            blackjackProfile.save().catch(err => console.log(err));
            return blackjackProfile;
        }
    }
}