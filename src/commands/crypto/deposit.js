const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, Emoji } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deposit')
        .setDescription('Directly messages you on how to deposit crypto')
        .addStringOption(option =>
			option
				.setName('payment')
				.setDescription('Chose a deposit option')
				.setRequired(true)
				.addChoices({name: 'Bitcoin', value: 'btc'})
				.addChoices({name: 'Litcoin', value: 'ltc'})),
    async execute(interaction, client) {
        await interaction.deferReply()

        let emoji, cryptoAddy, cryptoName;

        // Logs the user into the database if they arn't in it already
		const userProfile = await client.getProfile(interaction.user.id);
        // Gets the users deposit address and links it to an ID
        const addressProfile = await client.getAddress(interaction.user.id);

        if(interaction.options.getString('payment') === 'btc'){
            emoji = process.env.BTC_EMOJI
            cryptoAddy = addressProfile.btcAddress
            cryptoName = 'Bitcoin'

        }else if(interaction.options.getString('payment') === 'ltc'){
            emoji = process.env.LTC_EMOJI
            cryptoAddy = addressProfile.ltcAddress
            cryptoName = 'Litecoin'

        }

        // Builds the message embed that will get sent into the channe
        var infoEmbed = new MessageEmbed()
            .setTitle('ℹ️  Information')
            .setDescription(`> <@${interaction.user.id}>, your deposit address has been sent via DM.`)
            .setColor('#6cabfb')

        // Sends the information embed
        await interaction.editReply({
            embeds: [infoEmbed]
        });

        

        // Builds the message embed that will get sent into the dmChannel
        var dmEmbed = new MessageEmbed()
            .setTitle(`:coin: ➡ 🏦 ${cryptoName} Deposit`)
            .setDescription(`> Deposits needs **1** confirmations to be credited to your account.\n\n**Your permanent address:**\n${emoji} \`${cryptoAddy}\``)
            .setFooter('On transaction seen and confirmed you will be directly messaged')
            .setColor('#389cf4')
            .setThumbnail(`https://chart.googleapis.com/chart?chs=500x500&cht=qr&chl=${cryptoAddy}`)

        


            // Sends the deposit information embed into the dmChannel
            await interaction.user.send({
                embeds: [dmEmbed]
            });    
            
            // Sends the deposit information embed into the dmChannel
            await interaction.user.send({
                content: cryptoAddy
            });   
            
    },
};