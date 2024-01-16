const profile = require('../schemas/profile');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getProfile = async (userId) => {
        let userProfile = await profile.findOne({ userId: userId });
        if(userProfile) {
            return userProfile;
        } else {
            userProfile = await new profile({
                _id: mongoose.Types.ObjectId(),
                userId: userId,
                balance: 0,
                profit: 0,
                wins: 0,
                loses: 0,
                totalGamesPlayed: 0,
                totalWagered: 0,
                totalDeposited: 0,
                totalWithdrawed: 0,
                totalTipped: 0,
                totalTipsReceived: 0,
                activeGame: false,
                activeWithdraw:  false
            });
            userProfile.save().catch(err => console.log(err));
            return userProfile;
        }
    }
}

