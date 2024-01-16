const coinflip = require('../schemas/coinflip');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getCoinflip = async (cfId, totalAmount, winnerId, loserId, hashedApiKey, signature, result, time, random) => {
        let coinflipProfile = await coinflip.findOne({ id: cfId });
        if(coinflipProfile) {
            return coinflipProfile;
        } else if(totalAmount) {
            coinflipProfile = await new coinflip({
                _id: mongoose.Types.ObjectId(),
                id: cfId,
                totalAmount: totalAmount,
                winnerId: winnerId,
                loserId: loserId,
                hashedApiKey: hashedApiKey,
                signature: signature,
                result: result,
                time: time,
                random: random
            });
            coinflipProfile.save().catch(err => console.log(err));
            return coinflipProfile;
        }
    }
}