const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('balance')
		.setDescription('Shows your balance')
		.addUserOption(option => 
			option
				.setName('target')
				.setDescription('A member in this guild')),
	async execute(interaction, client) {
        await interaction.deferReply()

		// Checks to see if the user was getting someones balance or his own balance
		let user = (interaction.options.getUser('target') ? interaction.options.getUser('target') : interaction.user );
		
		// Either gets or creates a profile and returns the data back to the constant userProfile
		const userProfile = await client.getProfile(user.id);

		// Builds the message embed that will get sent into the channel
		var balanceEmbed = new MessageEmbed()
			.setAuthor(
				`${user.tag}`, 
				`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.jpeg`
			)
			.addField(
				`Balance:` , 
				`💵 $${userProfile.balance.toFixed(2)}`, 
				false
			)
			.setColor('#389cf4')  

		// Sends the members balance or the member mentioned balance
		await interaction.editReply({
			embeds: [balanceEmbed]
		});

	},
};