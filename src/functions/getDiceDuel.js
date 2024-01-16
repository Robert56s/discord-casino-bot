const duel = require('../schemas/duel');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getDiceDuel = async (ddId, totalAmount, winnerId, loserId, hashedApiKey, signature, senderResult, receiverResult, time, random) => {
        let diceduelProfile = await duel.findOne({ id: ddId });
        if(diceduelProfile) {
            return diceduelProfile;
        } else if(totalAmount) {
            diceduelProfile = await new duel({
                _id: mongoose.Types.ObjectId(),
                id: ddId,
                totalAmount: totalAmount,
                winnerId: winnerId,
                loserId: loserId,
                hashedApiKey: hashedApiKey,
                signature: signature,
                senderResult: senderResult,
                receiverResult: receiverResult,
                time: time,
                random: random
            });
            diceduelProfile.save().catch(err => console.log(err));
            return diceduelProfile;
        }
    }
}