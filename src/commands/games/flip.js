const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const profile = require('../../schemas/profile')

const rndOrgApi = require('../../rndOrg');
const coinflip = require('../../schemas/coinflip');
const rnd = new rndOrgApi.randomOrg(process.env.API_KEY);
rnd.setAuth(process.env.RND_USER, process.env.RND_PASS);

module.exports = {
	data: new SlashCommandBuilder()
		.setName('flip')
		.setDescription('Coinflips another member for money')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('A member in this guild')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('amount')
				.setDescription('A number Ex: 4.5')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('coinside')
				.setDescription('Heads or Tails')
				.setRequired(true)
				.addChoices({name: 'Heads', value: 'heads'})
				.addChoices({name: 'Tails', value: 'tails'})),
	async execute(interaction, client) {
        await interaction.deferReply()

        // Gets the targets discord information into a constant variable
        const target = interaction.options.getUser('target');

		// Sets the targets coinside to be opposite of the senders coinside
		let targetCoinside;
		if(interaction.options.getString('coinside') === 'heads'){ targetCoinside = 'tails' } else { targetCoinside = 'heads' };

		// Gets the sender of the games profile and the targets profile
		const interactorProfile = await client.getProfile(interaction.user.id);
		const targetProfile = await client.getProfile(target.id);

		// Gets the amount that the sender would like to bet
		let amount = interaction.options.getNumber('amount');

		// Fixs the amount to be 2 decimal places after the .
		amount = amount.toFixed(2);

		// Calculates the 5% tax on the users flip
		let taxAmount = amount * 0.05;

		// Fixs the amount to be 2 decimal places after the .
		taxAmount = taxAmount.toFixed(2);

		// Checks to see if sender has an active game
        if(interactorProfile.totalWagered < 0) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you or the target have a wager requirement!`,"color": "#be1932","footer": {"text": "Make sure to wager more"}}]});

		// Checks to see if sender has an active game
        if(targetProfile.totalWagered < 0) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you or the target have a wager requirement!`,"color": "#be1932","footer": {"text": "Make sure to wager more"}}]});

		// Checks to make sure that the user isn't trying to flip themselves
		if(interactorProfile.userId === targetProfile.userId) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t coinflip yourself!`,"color": "#be1932","footer": {"text": "Please mention a different member"}}]});

		// Checks to see if sender has an active game
		if(interactorProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});

		// Checks to see if the member challanged has an active game
		if(targetProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the member mentioned has an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});

		// Checks to see if the user has an active withdraw
		if(interactorProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});

		// Checks to see if the chalanged user has an active withdraw
		if(targetProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the member mentioned has an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});

		// Checks to make sure sender is flipping above 2¢
		if(amount < .02) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t flip less than $0.02!`,"color": "#be1932","footer": {"text": "Make sure that your flip amount is above $0.02"}}]});

		// Checks if the sender has the balance to participate in the game
		if(interactorProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to participate in this game!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});

		// Checks if the member challanged has the balance to participate in the game
		if(targetProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the member mentioned doesn\'t have enough balance to participate in this game!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
	
		// Changes both profiles to have active game set to be true for anti-exploits
		await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: true } });
		await profile.findOneAndUpdate({ userId: target.id }, { $set: { activeGame: true } }) ;

		// Builds the message embed that will get sent into the channel
		var pendingCoinflipEmbed = new MessageEmbed()
			.addFields(
				{ name: `:coin: Coinflip's Info:`,
				value: `> 💵 Amount: **$${amount}**
				> 🔎 Your side: **${targetCoinside}**
				> 🧾 Tax: **$${taxAmount}**`,
				inline: true},
				{ name: `👤 ${target.username}'s Info:`,
				value: `> 💵 Current Balance: **$${targetProfile.balance.toFixed(2)}**
				> 🏆 Balance on win: **$${(Number(targetProfile.balance) + (Number(amount) - Number(taxAmount))).toFixed(2)}**
				> 💀 Balance on loss: **$${(Number(targetProfile.balance) - amount).toFixed(2)}**`,
				inline: true}
			)
			.setAuthor(
				`${target.tag} - Pending Coinflip`, 
				`https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.jpeg`
			)
			.setFooter('This coinflip offer will expire in 30 seconds')
			.setColor('#ff8400')

		// Builds the buttons that will get attached onto the embed
		var pendingButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			  .setCustomId('accepted')
			  .setStyle('SECONDARY')
			  .setLabel('Accept Flip')
			  .setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			  .setCustomId('declined')
			  .setStyle('SECONDARY')
			  .setLabel('Decline Flip')
			  .setEmoji('❌')
		);
		var disabledButtons = new MessageActionRow().addComponents(
			// Adds a new green button with a check mark emoji
			new MessageButton()
			  .setCustomId('accepted')
			  .setStyle('SECONDARY')
			  .setLabel('Accept Flip')
			  .setDisabled(true)
			  .setEmoji('✅'),

			// Adds a new red button with a red x mark emoji
			new MessageButton()
			  .setCustomId('declined')
			  .setStyle('SECONDARY')
			  .setLabel('Decline Flip')
			  .setDisabled(true)
			  .setEmoji('❌')
		);

		// Sends the pending coinflip request embed
		await interaction.editReply({
			content: `<@${target.id}>`,
			embeds: [pendingCoinflipEmbed],
			components: [pendingButtons]
		});

		// Create a button interaction collector with a filter
		const filter = async (i) => { if(i.user.id === target.id) return true }
		const collector = interaction.channel.createMessageComponentCollector({ filter, max: 1, time: 30000 });

		// Makes a variable to collect if the user responded in time 
		let temp;

		// When the user clicks a button run this code
		collector.on('collect', async (i) => {

			// Lets the code know something has been collected
			temp = 'collected';

			// If the target hits the declined button it will go into this if statment
			if(i.customId == 'declined') {
				// Builds the message embed that will get interation.editReply
				var canceledCoinflipEmbed = new MessageEmbed()
					.addFields(
						{ name: `:coin: Coinflip's Info:`,
						value: `> 💵 Amount: **$${amount}**
						> 🔎 Your side: **${targetCoinside}**
						> 🧾 Tax: **$${taxAmount}**`,
						inline: true},
						{ name: `👤 ${target.username}'s Info:`,
						value: `> 💵 Current Balance: **$${targetProfile.balance.toFixed(2)}**
						> 🏆 Balance on win: **$${(Number(targetProfile.balance) + (Number(amount) - Number(taxAmount))).toFixed(2)}**
						> 💀 Balance on loss: **$${(Number(targetProfile.balance) - amount).toFixed(2)}**`,
						inline: true}
					)
					.setAuthor(
						`${target.tag} - Declined Coinflip`, 
						`https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.jpeg`
					)
					.setFooter('This coinflip has been declined')
					.setColor('#be1932')

				// Removes the active game tag for both users
				await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: false } });
				await profile.findOneAndUpdate({ userId: target.id }, { $set: { activeGame: false } });
		
				// Edits the original message to the canceledCoinflipEmbed
				return await interaction.editReply({ 
					content: `<@${target.id}>`,
					embeds: [canceledCoinflipEmbed],
					components: [disabledButtons]
				});
			}

			// Runs this if statment if the accepted button was clicked
			if(i.customId == 'accepted') {
				// Builds the message embed that will get interation.editReply
				var acceptedCoinflipEmbed = new MessageEmbed()
					.addFields(
						{ name: `:coin: Coinflip's Info:`,
						value: `> 💵 Amount: **$${amount}**
						> 🔎 Your side: **${targetCoinside}**
						> 🧾 Tax: **$${taxAmount}**`,
						inline: true},
						{ name: `👤 ${target.username}'s Info:`,
						value: `> 💵 Current Balance: **$${targetProfile.balance.toFixed(2)}**
						> 🏆 Balance on win: **$${(Number(targetProfile.balance) + (Number(amount) - Number(taxAmount))).toFixed(2)}**
						> 💀 Balance on loss: **$${(Number(targetProfile.balance) - amount).toFixed(2)}**`,
						inline: true}
					)
					.setAuthor(
						`${target.tag} - Accepted Coinflip`, 
						`https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.jpeg`
					)
					.setFooter('This coinflip has been accepted')
					.setColor('#00ff00')
		
				// Edits the original message to the canceledCoinflipEmbed
				await interaction.editReply({ 
					content: `<@${target.id}>`,
					embeds: [acceptedCoinflipEmbed],
					components: [disabledButtons]
				});

				// Uses random.org's api to get a random number 1 or 2 with a signature
				await rnd.generateSignedIntegers(1, 1, 2, userData = null, replacement = true, base = 10).then(async (res) => {
					// Makes simple variables for use later
					const winAmt = Number(amount) - taxAmount;
					const result = res.result.random.data[0] - 1;
					const coins = ['heads', 'tails'];
					const coinflipImg = ['https://cdn.discordapp.com/attachments/828812665232425000/992189610773991424/head.jpg', 'https://cdn.discordapp.com/attachments/828812665232425000/992189632433360959/51bcZyHZpL._AC_.jpg'];
					let winner, loser;

					// Gets the winners id and the losers id
					if(coins[result] === targetCoinside) {
						winner = target;
						loser = interaction.user;
					} else if(coins[result] != targetCoinside) {
						winner = interaction.user;
						loser = target;
					}

					// Updates the database for there balance, wagered, wins, loses, and profit
					await profile.findOneAndUpdate({ userId: winner.id }, { $inc: { balance: +winAmt, totalWagered: +amount, wins: +1, profit: +winAmt, totalGamesPlayed: +1, }, $set: { activeGame: false } });
					await profile.findOneAndUpdate({ userId: loser.id }, { $inc: { balance: -amount, totalWagered: +amount, loses: +1, profit: -amount, totalGamesPlayed: +1, }, $set: { activeGame: false } });

					// Gets the winners profile
					const winnerProfile = await client.getProfile(winner.id)

					// Makes the embed that will countdown the flip
					var countEmbed = new MessageEmbed()
						.setTitle('Flipping the coin :coin:')
						.setDescription(`> Flipping in \`5\`...`)
					const countDownMsg = await interaction.channel.send({
						embeds: [countEmbed]
					});
					for(var i = 4; i > 0; i--) {
						await new Promise(resolve => setTimeout(resolve, 1000));
						var countdownEmbed = new MessageEmbed()
							.setTitle('Flipping the coin :coin:')
							.setDescription(`> Flipping in \`${i}\`...`)
						await countDownMsg.edit({
							embeds: [countdownEmbed]
						});
					}
					await new Promise(resolve => setTimeout(resolve, 1000));

					// Builds the final embed that will get sent into the channel
					var finalEmbed = new MessageEmbed()
						.setTitle(`The coinside was ${coins[result]}!`)
						.setDescription(`> <@${winner.id}> has won the coinflip! 🎉\n> **$${winAmt.toFixed(2)}** has been credited to their wallet! 💎\n> They now have **$${winnerProfile.balance.toFixed(2)}**! 💵`)
						.setAuthor(
							`${winner.tag}`, 
							`https://cdn.discordapp.com/avatars/${winner.id}/${winner.avatar}.jpeg`
						)
						.setFooter(`To see provably fair use the command /cfinfo ${res.result.random.serialNumber}`)
						.setThumbnail(coinflipImg[result])
						.setColor('#389cf4')

					// Edits the message to the final embed after the gif is finished playing
					await countDownMsg.edit({
						content: `<@${interaction.user.id}> <@${target.id}>`,
						embeds: [finalEmbed]
					});

					let random = JSON.stringify(res.result.random);
					// Creates a profile for the coinflip to get logged into the database
					await client.getCoinflip(res.result.random.serialNumber, interaction.options.getNumber('amount') * 2, winner.id, loser.id, res.result.random.hashedApiKey, res.result.signature, res.result.random.data[0], res.result.random.completionTime, random);
				}).catch(err => console.log(err));
			}
		});

		// When the time runs out run this code
		collector.on('end', async (collected) => {
			// If there was a button clicked return
			if(temp) return;

			// Builds the message embed that will get interation.editReply
			var timedOutCoinflipEmbed = new MessageEmbed()
				.addFields(
					{ name: `:coin: Coinflip's Info:`,
					value: `> 💵 Amount: **$${amount}**
					> 🔎 Your side: **${targetCoinside}**
					> 🧾 Tax: **$${taxAmount}**`,
					inline: true},
					{ name: `👤 ${target.username}'s Info:`,
					value: `> 💵 Current Balance: **$${targetProfile.balance.toFixed(2)}**
					> 🏆 Balance on win: **$${(Number(targetProfile.balance) + (Number(amount) - Number(taxAmount))).toFixed(2)}**
					> 💀 Balance on loss: **$${(Number(targetProfile.balance) - amount).toFixed(2)}**`,
					inline: true}
				)
				.setAuthor(
					`${target.tag} - Timed Out Coinflip`, 
					`https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.jpeg`
				)
				.setFooter('This coinflip has been timed out')
				.setColor('#be1932')

			// Removes the active game tag for both users
			await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: false } });
			await profile.findOneAndUpdate({ userId: target.id }, { $set: { activeGame: false } });

			// Edits the original message to the canceledCoinflipEmbed
			return await interaction.editReply({ 
				content: `<@${target.id}>`,
				embeds: [timedOutCoinflipEmbed],
				components: [disabledButtons]
			
			});
		});
	}
};