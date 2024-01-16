const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const { count } = require('../../schemas/profile');
const profile = require('../../schemas/profile');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('airdrop')
		.setDescription('Airdrops money, all you have to do it click a button to join')
		.addNumberOption(option => 
			option
				.setName('amount')
				.setDescription('The amount of money you would like to airdrop')
                .setRequired(true))
        .addStringOption(option => 
            option 
                .setName('time')
                .setDescription('The amount of time you would like this airdrop to last. Ex: 3d, 10s, 1m')
                .setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply()
		const userProfile = await client.getProfile(interaction.user.id);
        const amount = interaction.options.getNumber('amount').toFixed(2);
        const timeInput = interaction.options.getString('time');
        const timeType = timeInput[timeInput.length-1].toLowerCase();
        let timeMillisec, timeEpoch, isTime;

        if(timeType === 'd') {
            timeMillisec = timeInput.slice(0, timeInput.length-1);
            timeMillisec = Number(timeMillisec)
            timeMillisec = timeMillisec * 86400000;
            timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
            isTime = true;
        } 
        else if(timeType === 'h') {
            timeMillisec = timeInput.slice(0, timeInput.length-1);
            timeMillisec = Number(timeMillisec)
            timeMillisec = timeMillisec * 3600000;
            timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
            isTime = true;
        } 
        else if(timeType === 'm') {
            timeMillisec = timeInput.slice(0, timeInput.length-1);
            timeMillisec = Number(timeMillisec)
            timeMillisec = timeMillisec * 60000;
            timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
            isTime = true;
        } 
        else if(timeType === 's') {
            timeMillisec = timeInput.slice(0, timeInput.length-1);
            timeMillisec = Number(timeMillisec)
            timeMillisec = timeMillisec * 1000;
            timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
            isTime = true;
        } 
        
        // Checks to see if sender has an active game
        if(userProfile.totalWagered < 0) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, You have a wager requirement! You can't airdrop`,"color": "#be1932","footer": {"text": "Make sure you wager more"}}]});
        if(!isTime) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, time input is malformed!`,"color": "#be1932","footer": {"text": "Use m, d, and s for minutes, seconds, and days"}}]});
        if(userProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to do this! Your balance may be rounded, try $0.01 Lower!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        if(amount < .5) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the minimum airdrop amount is $0.50!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        
        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: -amount, totalAirdropped: +amount } });

		var airdropEmbed = new MessageEmbed()
            .setTitle('✈ An airdrop appears')
            .setDescription(`> <@${interaction.user.id}> left an airdrop of **$${amount}** :dollar:\n\n Ends: <t:${timeEpoch}:R> (<t:${timeEpoch}>)`)
            .setColor('#0071e7')  

		var airdropButton = new MessageActionRow().addComponents(
			new MessageButton()
			  .setCustomId(interaction.id)
			  .setStyle('SECONDARY')
			  .setLabel('Enter airdrop')
			  .setEmoji('🎉'),
		);

		await interaction.editReply({
			embeds: [airdropEmbed],
            components: [airdropButton]
		}).then(async (msg) => {
            let joinedUserIds = [];
            const filter = async (i) => true;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeMillisec });

            collector.on('collect', async (i) => {
                if(joinedUserIds.includes(i.user.id) && i.customId === interaction.id) {
                    await i.user.send({
                        embeds: [{
                            "description": `**You** have already joined [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}) **airdrop!** :tada:`,
                            "color": "#e53835",
                        }]
                    }).catch(error => {});
                }

                if(!joinedUserIds.includes(i.user.id) && i.customId === interaction.id) { 
                    joinedUserIds.push(i.user.id);
                    await client.getProfile(i.user.id);
                    await i.user.send({
                        embeds: [{
                            "description": `**You** have joined [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}) **airdrop!** :tada:`,
                            "color": "#4caf4f",
                        }]
                    }).catch(async (error) => {
                        console.log('User can\'t be directly messaged.');
                    });
                } 
            });

            collector.on('end', async (collected) => {
                let amountForEach = (amount / joinedUserIds.length);
                let atString = '';
                for(let i = 0; i < joinedUserIds.length; i++) {
                    await profile.findOneAndUpdate({ userId: joinedUserIds[i] }, { $inc: { balance: +amountForEach, totalAirdroppedReceived: +amountForEach } });
                    let atIdTemp = `<@${joinedUserIds[i]}>, `;
                    atString += atIdTemp;
                }

                if(atString.length > 1000) {
                    atString.slice(0, 1000);
                }

                if(joinedUserIds.length === 0) {
                    var airdropCompleteEmbed = new MessageEmbed()
                    .setTitle('✈ Finished airdrop')
                    .setDescription(`> **No one** joined the airdrop! So we are **keeping** your money. :dollar:`)
                    .setFooter(`This airdrop has ended`)
                    .setColor('#0071e7')  
                    var airdropDisabledButton = new MessageActionRow().addComponents(
                        new MessageButton()
                            .setCustomId(interaction.id)
                            .setStyle('SECONDARY')
                            .setLabel('Enter airdrop')
                            .setDisabled(true)
                            .setEmoji('🎉'),
                    )
                    return await msg.edit({
                        embeds: [airdropCompleteEmbed],
                        components: [airdropDisabledButton]
                    });
                }
                var airdropCompleteEmbed = new MessageEmbed()
                    .setTitle('✈ Finished airdrop')
                    .setDescription(`> ${atString} have joined the airdrop and earned **$${amountForEach.toFixed(5)}** each! :dollar:`)
                    .setFooter(`This airdrop has ended`)
                    .setColor('#0071e7')  
                var airdropDisabledButton = new MessageActionRow().addComponents(
                    new MessageButton()
                        .setCustomId(interaction.id)
                        .setStyle('SECONDARY')
                        .setLabel('Enter airdrop')
                        .setDisabled(true)
                        .setEmoji('🎉'),
                );
                await msg.edit({
                    embeds: [airdropCompleteEmbed],
                    components: [airdropDisabledButton]
                });
            }); 
        })
	},
};