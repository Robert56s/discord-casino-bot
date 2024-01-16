const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const axios = require('axios');
const profile = require('../../schemas/profile.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('withdraw')
		.setDescription('Withdraws your balance to btc')
        .addStringOption(option =>
			option
				.setName('crypto')
				.setDescription('btc or ltc')
				.setRequired(true)
				.addChoices({name: 'Btc', value: 'btc'})
				.addChoices({name: 'Ltc', value: 'ltc'}))
        .addNumberOption(option =>
            option
                .setName('amount')
                .setDescription('The amount of balance you would like to withdraw')
                .setRequired(true))
        .addStringOption(option =>
            option 
                .setName('address')
                .setDescription('The btc or ltc address you would like to withdraw to')
                .setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply()

        // Gets the profile of the user that used the command
        const userProfile = await client.getProfile(interaction.user.id);
        let withdrawAmt = interaction.options.getNumber('amount').toFixed(2);

        let crypto, address, blockchain;

        if(interaction.options.getString('crypto') === 'btc'){
            address = 'Btc-Address'
            crypto = 'btc'
            blockchain = 'mempool.space/tx/'
        } else if(interaction.options.getString('crypto') === 'ltc'){
            address = 'Ltc-Address'
            crypto = 'ltc'
            blockchain = 'live.blockcypher.com/ltc/tx/'
        }

        // Checks to see if sender has an active game
        if(userProfile.totalWagered < 5) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you must wager at least 5$ to withdraw!`,"color": "#be1932","footer": {"text": "Make sure you wager 5$ or more"}}]});

        // Checks to see if sender has an active game
        if(userProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});

        // Checks to see if the user has an active withdraw
		if(userProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you already have an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});

        // Checks to make sure sender is flipping above 50¢
		if(withdrawAmt < 5) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t withdraw less than $5!`,"color": "#be1932","footer": {"text": "Make sure that your withdraw amount is $5 or above"}}]});
        
        // Checks if the sender has the balance to participate in the game
		if(userProfile.balance < withdrawAmt) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t withdraw balance you don\'t have!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        
        // Builds the message embed that will get sent into the channel
        var infoEmbed = new MessageEmbed()
            .setTitle('ℹ️  Information')
            .setDescription(`> <@${interaction.user.id}>, your withdraw information has been sent via DM.`)
            .setColor('#389cf4')  
            
		// Sends the information embed
		await interaction.editReply({
			embeds: [infoEmbed]
		});

        // Builds the message embed that will get sent into the channel
        var pendingEmbed = new MessageEmbed()
            .setTitle('⌛ Withdraw Confirmation')
            .setDescription(`<@${interaction.user.id}> please verify your withdraw information, you have 30 seconds.\n\n> ${address}: \`${interaction.options.getString('address')}\`\n> Amount: \`$${withdrawAmt}\`\n\nTo accept or decline hit correct button below.`)
            .setFooter('If this information is incorrect and you do not receive your funds we will not be held responsible')
            .setColor('#ff8400')

		// Builds the buttons that will get attached onto the embed
		var pendingButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			  .setCustomId('accepted')
			  .setStyle('SECONDARY')
			  .setLabel('Confirm Information')
			  .setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			  .setCustomId('declined')
			  .setStyle('SECONDARY')
			  .setLabel('Decline Information')
			  .setEmoji('❌')
		);
        var disabledButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			  .setCustomId('accepted')
			  .setStyle('SECONDARY')
			  .setLabel('Confirm Information')
			  .setDisabled(true)
			  .setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			  .setCustomId('declined')
			  .setStyle('SECONDARY')
			  .setLabel('Decline Information')
			  .setDisabled(true)
			  .setEmoji('❌')
		);

        // Builds the message embed that will get sent into the channel
        var canceledEmbed = new MessageEmbed()
            .setTitle('⚠️ Withdraw Canceled')
            .setDescription(`<@${interaction.user.id}> please verify your withdraw information, you have 30 seconds.\n\n> ${address}: \`${interaction.options.getString('address')}\`\n> Amount: \`$${withdrawAmt}\`\n\nTo accept or decline hit correct button below.`)
            .setFooter('This withdraw has been canceled')
            .setColor('#be1932')
        
        
        const msg = await interaction.user.send({
            embeds: [pendingEmbed],
            components: [pendingButtons]
        });
        
        // Gives the active withdraw to the user
        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeWithdraw: true } });
		
        // Makes a variable to collect if the user responded in time 
		let temp;
        const filter = async (i) => { return true; }
		const collector = msg.createMessageComponentCollector({ filter, max: 1, time: 30000 });

        // When the user clicks a button run this code
        collector.on('collect', async (i) => {

			// Lets the code know something has been collected
			temp = 'collected';

			// Runs this if statment if the accepted button was clicked
			if(i.customId == 'accepted') {
                // Builds the accepted embed
                var acceptedEmbed = new MessageEmbed()
                    .setTitle(':white_check_mark: Withdraw Accepted')
                    .setDescription(`<@${interaction.user.id}>, you have accepted this information to be correct.\n\n> ${address}: \`${interaction.options.getString('address')}\`\n> Amount: \`$${withdrawAmt}\`\n\nTo accept or decline hit correct button below.`)
                    .setFooter('Now processing your withdraw')
                    .setColor('#00ff00')

                    await msg.edit({ 
                        embeds: [acceptedEmbed],
                        components: [disabledButtons]
                    });
                
                // Gets the btc price and then calculates the withdraw to sat
                let btcPrice, ltcPrice, withdrawAmtSat, withdrawResData;
                await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=USD`)
                    .then((res) => {
                        btcPrice = res.data.USD;
                    }).catch((err) => {
                        console.error(err);
                    });
                
                await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD`)
                    .then((res) => {
                        ltcPrice = res.data.USD;
                    }).catch((err) => {
                        console.error(err);
                    });
                
                console.log(btcPrice)
                console.log(ltcPrice)
                
                
                if(crypto == 'btc'){
                    withdrawAmtSat = Number(withdrawAmt) / btcPrice;
                    withdrawAmtSat = Number((withdrawAmtSat * 100000000).toFixed(0));

                    // Sends the withdraw on the api client
                    const withdrawData = {
                        "transfer_key": process.env.BTC_APIRONE_TRANSFER_KEY,
                          "destinations": [
                            {
                              "address": interaction.options.getString('address'),
                              "amount": withdrawAmtSat
                            },
                           ],
                        "subtract-fee-from-amount": true
                    }
                    
                    await axios.post(`https://apirone.com/api/v2/wallets/${process.env.BTC_APIRONE_WALLET_ID}/transfer `, withdrawData)
                        .then(res => {
                            withdrawResData = res.data;
                        }).catch(err => {
                            console.log(err)
                        });
                    

                    // If there is no response data then return an error
                    if(!withdrawResData) {
                        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeWithdraw: false } });
                        return await interaction.user.send({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, an error has occured!`,"color": "#be1932","footer": {"text": "Please make sure that your withdraw address is vaild"}}]});
                    }

                } else if(crypto == 'ltc'){
                    withdrawAmtSat = Number(withdrawAmt) / ltcPrice;
                    withdrawAmtSat = Number((withdrawAmtSat * 100000000).toFixed(0));

                    // Sends the withdraw on the api client
                    const withdrawData = {
                        "transfer_key": process.env.LTC_APIRONE_TRANSFER_KEY,
                          "destinations": [
                            {
                              "address": interaction.options.getString('address'),
                              "amount": withdrawAmtSat
                            },
                           ],
                        "subtract-fee-from-amount": true
                    }
            
                    await axios.post(`https://apirone.com/api/v2/wallets/${process.env.LTC_APIRONE_WALLET_ID}/transfer `, withdrawData)
                        .then(res => {
                            withdrawResData = res.data;
                        }).catch(err => {
                            console.log(err)
                        });

                    // If there is no response data then return an error
                    if(!withdrawResData) {
                        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeWithdraw: false } });
                        return await interaction.user.send({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, an error has occured!`,"color": "#be1932","footer": {"text": "Please make sure that your withdraw address is vaild"}}]});
                    }

                    console.log(withdrawResData)
                }
                // Builds a new embed to send to the user about their withdraw
                var lastEmbed = new MessageEmbed()
                    .setTitle('📤 Withdraw Sent')
                    .setDescription(`<@${interaction.user.id}>, your withdraw has been sent.\n\n> ${address}: \`${interaction.options.getString('address')}\`\n> Amount: \`$${withdrawAmt}\`\n\n[${withdrawResData.txs[0]}](https://${blockchain}${withdrawResData.txs[0]})`)
                    .setFooter('If there are any errors, please contact support')
                    .setColor('#00ff00')
                
                 // Removes the active withdraw from the user and takes away there balance
			    await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: -withdrawAmt, totalWithdrawed: +withdrawAmt}, $set: { activeWithdraw: false }, });
                
                
                await interaction.user.send({
                    embeds: [lastEmbed]
                });
                await client.channels.cache.get(process.env.WITHDRAW_LOG_CHANNEL_ID).send({
                    embeds: [lastEmbed]
                });
                

            } else if(i.customId == 'declined') {
                // Removes the active withdraw from the user
			    await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeWithdraw: false } });

                
                await msg.edit({ 
                    embeds: [canceledEmbed],
                    components: [disabledButtons]
                });
               
            }
        });

        // When the time runs out run this code
        collector.on('end', async (collected) => {
            if(temp) return;

            // Removes the active withdraw from the user
			await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeWithdraw: false } });


			return await msg.edit({ 
			    embeds: [canceledEmbed],
			    components: [disabledButtons]
			});
            
        });
	},
}