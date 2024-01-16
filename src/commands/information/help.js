const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows all of the bots current commands'),
	async execute(interaction, client) {

        await interaction.deferReply()

        // Logs the user into the database if they arn't in it already
		const userProfile = await client.getProfile(interaction.user.id);

		// Builds the message embed that will get sent into the channel
		var helpEmbed = new MessageEmbed()
            .setAuthor(
				`${client.user.username}'s Commands`,
				`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`
			)
            //.setTitle(`${client.user.username}'s Current Commands`)
            .addFields(
                {name: `:coin: Crypto`,
                value: `> **/deposit** \`{crypto}\`\n> **/withdraw** \`{crypto}\` \`{amount}\` \`{address}\`\n> **/prices**`},
                {name: `🎰 PVP Games`,
                value: `> **/flip** \`@user\` \`{amount}\`\n> **/duel** \`@user\` \`{amount}\``},
		        {name: `🎰 PVH Games`,
                value: `> **/bj** \`@user\` \`{amount}\`\n> **/dice** \`{multiplier}\` \`{amount}\``},
                {name: `📚 Information`,
                value: `> **/help**\n> **/bjrules**\n> **/balance** \`@user\`\n> **/stats** \`@user\``},
                {name:`👍 Provably Fair`,
				value:`> **/bjinfo** \`{blackjack id}\`\n> **/dinfo** \`{dice id}\`\n> **/cfinfo** \`{coinflip id}\`\n> **/ddinfo** \`{dice duel id}\``},
				{name: `💡 Misc`,
                value: `> **/tip** \`@user\` \`{amount}\`\n> **/airdrop** \`{amount}\` \`{time}\`\n> **/giveaway** \`{amount}\` \`{time}\``},
            )
            .setFooter(`To use any of these commands just type / in the text bar! | Bot from Papy#2062\nThe Minimum withdraw amount is $5 and the Maximum win amount is $20!`)
			.setColor('#389cf4')  

		// Sends the bots help command embed
		await interaction.editReply({
			embeds: [helpEmbed]
		});
	},
};