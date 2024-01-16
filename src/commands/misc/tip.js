const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const profile = require('../../schemas/profile.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('tip')
		.setDescription('Tips another member balance')
		.addUserOption(option =>
			option
				.setName('target')
				.setDescription('A member in this guild')
				.setRequired(true))
		.addNumberOption(option =>
			option
				.setName('amount')
				.setDescription('The amount you would like to tip the target Ex: 10.2')
				.setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply()

        // Gets the targets discord information into a constant variable
        const target = interaction.options.getUser('target');

		// Gets the sender of the tips profile and the targets profile
		let interactorProfile = await client.getProfile(interaction.user.id);
		let targetProfile = await client.getProfile(target.id);

		// Gets the amount that the sender would like to tip
		let amount = interaction.options.getNumber('amount');

		// Fixs the amount to be 2 decimal places after the .
		amount = amount.toFixed(2);

		// Checks to see if sender has an active game
        if(interactorProfile.totalWagered < 0) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, You have a wager requirement! You can't tip`,"color": "#be1932","footer": {"text": "Make sure you wager more"}}]});

		// Checks to make sure that the user isn't trying to tip themselves
		if(interactorProfile.userId === targetProfile.userId) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t tip yourself!`,"color": "#be1932","footer": {"text": "Please mention a different member"}}]});

		// Checks to see if sender has an active game request
		if(interactorProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});

		// Checks to see if the user has an active withdraw
		if(interactorProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you already have an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});
		
		// Checks to make sure sender is tipping above a cent
		if(amount < .01) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you can\'t tip less than $0.01!`,"color": "#be1932","footer": {"text": "Make sure that your tip amount is above $0.01"}}]});

		// Checks if the sender has the balance to participate in the flip
		if(interactorProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to complete this tip!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});

        // Takes away the balance from the sender
        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: -amount, totalTipped: +amount }, }) 

        // Gives balance to the target
        await profile.findOneAndUpdate({ userId: target.id }, { $inc: { balance: +amount, totalTipsReceived: +amount }, }) 

        // Reloads the new information into the profiles
        interactorProfile = await client.getProfile(interaction.user.id);
		targetProfile = await client.getProfile(target.id);

        // Builds the message embed that will get sent into the channel
        var tipEmbed = new MessageEmbed()
            .addField(
                `💸 Tip Info:`,
                `> <@${interaction.user.id}> has tipped **$${amount}** to <@${target.id}>
                > <@${interaction.user.id}> now has 💵 **$${interactorProfile.balance.toFixed(2)}**
                > <@${target.id}> now has  💵 **$${targetProfile.balance.toFixed(2)}**`
            )
            .setAuthor(
                `${interaction.user.tag}`, 
                `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
            )
            .setColor('#0071e7')  
            
		// Sends the tips information embed
		await interaction.editReply({
			embeds: [tipEmbed]
		});
	},
};