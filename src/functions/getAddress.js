const axios = require('axios');
const address = require('../schemas/address');
const mongoose = require('mongoose');

module.exports = (client) => {
    client.getAddress = async (userId, btcAddress, ltcAddress) => {
        let addressProfile;
        if(btcAddress) addressProfile = await address.findOne({ btcAddress: btcAddress });
        if(ltcAddress) addressProfile = await address.findOne({ ltcAddress: ltcAddress });
    
        if(userId) addressProfile = await address.findOne({ userId: userId });
        if(addressProfile) {
            return addressProfile;
        } else {
            let newBtcAddress;
            let newLtcAddress;

            const data = {
                "addr-type": "p2sh-p2wpkh",
                "callback":{                    
                  "url": process.env.LOCALTUNNEL_URL
               }
            }

            
            await axios.post(`https://apirone.com/api/v2/wallets/${process.env.BTC_APIRONE_WALLET_ID}/addresses`, data)
                .then((res) => {
                    console.log('Body: ', res.data);
                    newBtcAddress = res.data.address;
                }).catch((err) => {
                    console.error(err);
                });

            await axios.post(`https://apirone.com/api/v2/wallets/${process.env.LTC_APIRONE_WALLET_ID}/addresses`, data)
                .then((res) => {
                    console.log('Body: ', res.data);
                    newLtcAddress = res.data.address;
                }).catch((err) => {
                    console.error(err);
                });

            
            addressProfile = await new address({
                _id: mongoose.Types.ObjectId(),
                userId: userId,
                btcAddress: newBtcAddress,
                ltcAddress: newLtcAddress
            });
            addressProfile.save().catch(err => console.log(err));
            return addressProfile;
        }
    }
}