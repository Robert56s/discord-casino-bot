const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const blackjack = require('../../schemas/blackjack');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bjinfo')
		.setDescription('Shows information on a blackjack game id')
		.addNumberOption(option => 
			option
				.setName('id')
				.setDescription('An id of a past blackjack game')
                .setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply()

		const id = interaction.options.getNumber('id');

		let blackjackProfile = await blackjack.findOne({ id: id });
		if(!blackjackProfile) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, there is no blackjack game id of ${id}!`,"color": "#be1932","footer": {"text": "Make sure to use a vaild id next time"}}]});
		blackjackProfile = await client.getBlackjack(id);
		const sigEn = btoa(JSON.stringify(blackjackProfile.signature))
		const rndEn = btoa(blackjackProfile.random)

		var informationEmbed = new MessageEmbed()
			.setTitle(`:black_joker: Blackjack Game ID ${id}`)
			.setDescription(`> To verify the shuffled deck, use this javascript code below, to verify the random.org seed, [click here](https://api.random.org/signatures/form).
			\`\`\`const shuffleSeed = require('shuffle-seed')

const deckCount = 6;
const serverSecret = '${blackjackProfile.serverSeed}';
const randomOrgSecret = '${blackjackProfile.rndOrgSeed}';
const seed = \`\${serverSecret}:\${randomOrgSecret}\`;

const decks = generateDecks();
const shoe = shuffleSeed.shuffle(decks, seed);
const shoeString = shoe.reduce((arr, obj) => {
	let str = \`\${obj.pip}\${obj.index}\`;
	arr.push(str);
	return arr;
}, []).join(', ');

function generateDecks() {
	const pips = ['♤', '♡', '♧', '♢'];
	const indexes = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	let cards = [];
	for (let i = 0; i < deckCount; i++){
		pips.forEach(pip => {
			indexes.forEach(index => {
				cards.push({
					pip,
					index
				});
			});
		});
	}
	return cards;
}\`\`\``)
			.setAuthor(
				`${client.user.username}'s Database`,
				`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg`
			)
			.addFields(
				{name: `:hiking_boot: Shoe:`,
				value: `\`${blackjackProfile.shoe.slice(0, 104)}...\``,
				inline: false},
				{name: `🖊️ Signature:`,
				value: `\`${blackjackProfile.signature}\``,
				inline: false},
				{name: `🎲 Random:`,
				value: `\`${blackjackProfile.random}\``,
				inline: false}
			)
			.setFooter('If there is any issue please contact support using /support command | Bot from Papy#2062')
			.setColor('#389cf4')  
			
		await interaction.editReply({
			embeds: [informationEmbed]
		});
	},
};