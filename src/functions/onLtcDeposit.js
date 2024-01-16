const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const profile = require('../schemas/profile')

module.exports = (client) => {
    client.onLtcDeposit = async (reqBody) => {
        let userId = await client.getAddress(undefined, undefined, reqBody.input_address);
        userId = userId.userId;
        const user = await client.users.fetch(userId);
        setTimeout(async () => {
            let txInfo;
            await axios.get(`https://live.blockcypher.com/ltc/tx/${reqBody.input_transaction_hash}`)
                .then((res) => {
                    txInfo = res.data;
                }).catch((err) => {
                    console.error(err);
                });
            let ltcPrice;
            await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD`)
                .then((res) => {
                    ltcPrice = res.data.USD;
                }).catch((err) => {
                    console.error(err);
                });
            let usdAmtFee = (txInfo.fee / 100000000) * ltcPrice;
            let usdAmt = (reqBody.value / 100000000) * ltcPrice;
            const epoch = Math.floor(new Date().getTime()/1000);
            let txDate = new Date(epoch * 1000);
            txDate = txDate.toLocaleString()
            if(reqBody.confirmations === 0) {
                var pendingEmbed = new MessageEmbed()
                    .setTitle(`Pending Litecoin Deposit`)
                    .setDescription(`> When this transaction reaches **1** confirmation, <@${userId}> will be directly messaged.`)
                    .setFields(
                        {name: `Transaction Hash`,
                        value: `[${reqBody.input_transaction_hash}](https://live.blockcypher.com/ltc/tx/${reqBody.input_transaction_hash})`,
                        inline: false},
                        {name: `Total Amount`,
                        value: `$${usdAmt.toFixed(2)} USD`,
                        inline: true},
                        {name: `Confirmations`,
                        value: `0/1`,
                        inline: true},
                        {name: `ETA`,
                        value: `~10m`,
                        inline: true},
                        {name: `Fee`,
                        value: `$${usdAmtFee.toFixed(2)} USD`,
                        inline: true},
                        {name: `Time seen`,
                        value: `${txDate}`,
                        inline: true},
                        /*{name: `Block`,
                        value: `${txInfo.status.block_height}`,
                        inline: true},*/
                    )
                    .setColor('#00ffff')
                await user.send({
                    embeds: [pendingEmbed]
                });
                await client.channels.cache.get(process.env.DEPOSIT_LOG_CHANNEL_ID).send({
                    embeds: [pendingEmbed]
                });
            } else if(reqBody.confirmations === 1) {
                await profile.findOneAndUpdate( { userId: userId }, { $inc: { balance: +usdAmt, totalDeposited: +usdAmt } } );
                const userProfile = await client.getProfile(userId);
                var confirmedEmbed = new MessageEmbed()
                    .setTitle(`Litecoin Deposit confirmed`)
                    .setDescription(`> <@${userId}>, this [transaction](https://live.blockcypher.com/ltc/tx/${reqBody.input_transaction_hash}) has reached **1** confirmation.`)
                    .setFields(
                        {name: `Amount Deposited`,
                        value: `$${usdAmt.toFixed(2)} USD`,
                        inline: true},
                        {name: `New balance`,
                        value: `$${userProfile.balance.toFixed(2)} USD`,
                        inline: true},
                    )
                    .setFooter('If you would like to deposit more, just send more to your permanent address')
                    .setColor('#00ff00')
                await user.send({
                    embeds: [confirmedEmbed]
                });
                await client.channels.cache.get(process.env.DEPOSIT_LOG_CHANNEL_ID).send({
                    embeds: [confirmedEmbed]
                });
            }
        }, 10000);
    }   
}