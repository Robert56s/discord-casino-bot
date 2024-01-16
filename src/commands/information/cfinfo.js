const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const coinflip = require('../../schemas/coinflip');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('cfinfo')
		.setDescription('Shows information on a coinflip id')
		.addNumberOption(option => 
			option
				.setName('id')
				.setDescription('An id of a past coinflip')
                .setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply()

        // Makes a constant variable with the coinflip serial number that the user wants to get
        const id = interaction.options.getNumber('id');

        // Gets the coinflip
        const coinflipProfile = await client.getCoinflip(id);

        // Makes sure that there is actually a coinflip with that id
        if(!coinflipProfile) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, there is no coinflip with the id of ${id}!`,"color": "#be1932","footer": {"text": "Make sure to use a vaild id next time"}}]});

        // Shows the result to the member that uses the command ex: heads || tails
        let coinside;
        if(coinflipProfile.result == 1) {
            coinside = 'heads';
        } else {
            coinside = 'tails';
        }

        // Builds the random file that will get attatched to the message embed
        const random = coinflipProfile.random;

        // Builds the message embed that will get sent into the channel
		var informationEmbed = new MessageEmbed()
            .setAuthor(
				`${client.user.username}'s Database`,
				`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`
			)
            .setTitle(`:coin: Coinflip ID ${id}`)
            .setDescription(`> [Click here](https://api.random.org/signatures/form) to verify this data on [random.org](https://random.org/) | Bot from Papy#2062`)
            .addFields(
                {name: `🏆 Winner:`,
                value: `<@${coinflipProfile.winnerId}>`,
                inline: true},
                {name: `💀 Loser:`,
                value: `<@${coinflipProfile.loserId}>`,
                inline: true},
                {name: `💵 Total Amount Flipped:`,
                value: `\`$${coinflipProfile.totalAmount}\``,
                inline: true},
                {name: `❓ Result:`,
                value: `\`${coinflipProfile.result} - (${coinside})\``,
                inline: true},
                {name: `📅 Date/Time:`,
                value: `\`${coinflipProfile.time}\``,
                inline: true},
                {name: `🖊️ Signature:`,
                value: `\`${coinflipProfile.signature}\``,
                inline: false},
                {name: `🎲 Random:`,
                value: `\`${coinflipProfile.random}\``,
                inline: false}
            )
            .setFooter('Click the link above and paste in the information to verify the result | Bot from Papy#2062')
			.setColor('#389cf4')  
			
		// Sends information on the coinflip serial number with an embed
		await interaction.editReply({
			embeds: [informationEmbed]
		});

	},
};