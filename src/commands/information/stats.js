const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const profile = require('../../schemas/profile');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats')
		.setDescription('Shows your statistics')
		.addUserOption(option => 
			option
				.setName('target')
				.setDescription('A member in this guild')),
	async execute(interaction, client) {
		await interaction.deferReply()

		// Checks to see if the user was getting someones statistics or his own statistics
		let user = (interaction.options.getUser('target') ? interaction.options.getUser('target') : interaction.user );
		
		// Either gets or creates a profile and returns the data back to the constant userProfile
		const userProfile = await client.getProfile(user.id);

		// Builds the message embed that will get sent into the channel
		var statisticsEmbed = new MessageEmbed()
			.setAuthor(
				`${user.tag}`, 
				`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpeg`
			)
            .setTitle(`Statistics:`)
            .setDescription(`
            > 🏆 Total Wins: **${userProfile.wins}**
            > 💀 Total Loses: **${userProfile.loses}**
            > 🎰 Total Games Played: **${userProfile.totalGamesPlayed}**
            > 📈 Total Profit: **$${userProfile.profit.toFixed(2)}**
            > 💰 Total Wagered: **$${userProfile.totalWagered.toFixed(2)}**

			> 💸 Total Tipped: **$${userProfile.totalTipped.toFixed(2)}**
			> 💳 Total Tips Received: **$${userProfile.totalTipsReceived.toFixed(2)}**
			> 📥 Total Deposited: **$${userProfile.totalDeposited.toFixed(2)}**
			> 📤 Total Withdrawn: **$${userProfile.totalWithdrawed.toFixed(2)}**
            `)
			.setColor('#389cf4')  
			
		// Sends the members statistics or the member mentioned statistics
		await interaction.editReply({
			embeds: [statisticsEmbed]
		});

	},
};