const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bjrules')
		.setDescription('Shows all of the basic rules of blackjack'),
	async execute(interaction, client) {
        await interaction.deferReply()

		const userProfile = await client.getProfile(interaction.user.id);

		var helpEmbed = new MessageEmbed()
            .setTitle(`Basic Blackjack Rules:`)
            .setDescription(`
            > The goal of blackjack is to beat the dealer's hand without going over 21.

            > Face cards are worth 10. Aces are worth 1 or 11. Two through Ten are face value.
            
            > Each player starts with two cards, one of the dealer's cards is hidden until the end.
            
            > To 'Hit' is to ask for another card. To 'Stand' is to hold your total and end your turn. To 'Double' is to double your bet, and you only get one extra card if you do double your bet!
            
            > If you go over 21 you bust, and the dealer wins regardless of the dealer's hand.
            
            > If you are dealt 21 from the start (Ace & 10), you got a blackjack. This rewards you with a 2.5x multiplier! 
            
            > Dealer will hit until his/her cards total 17 or higher.
            
            > If the dealer bust or your cards total higher than the dealer then your bet is multiplied by 2x!
            
            \`Note: We do not offer Insurance or Side Bets right now, these features might be added later on\``)
            .setFooter('To use any of these commands just type / in the text bar!')
			.setColor('#0071e7')  

		await interaction.editReply({
			embeds: [helpEmbed]
		});
	},
};