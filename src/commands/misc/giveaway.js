const { SlashCommandBuilder } = require('@discordjs/builders');
const axios = require('axios');
const { MessageEmbed, MessageActionRow, MessageButton} = require('discord.js');
const profile = require('../../schemas/profile');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('giveaway')
		.setDescription('Giveaways money to one winner.')
		.addNumberOption(option => 
			option
				.setName('amount')
				.setDescription('The amount of money you would like to giveaway.')
        .setRequired(true))
    .addStringOption(option => 
        option 
            .setName('time')
            .setDescription('The amount of time you would like this giveaway to last. Ex: 3d, 10s, 1m')
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
        } else if(timeType === 'h') {
          timeMillisec = timeInput.slice(0, timeInput.length-1);
          timeMillisec = Number(timeMillisec)
          timeMillisec = timeMillisec * 3600000;
          timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
          isTime = true;
        } else if(timeType === 'm') {
          timeMillisec = timeInput.slice(0, timeInput.length-1);
          timeMillisec = Number(timeMillisec)
          timeMillisec = timeMillisec * 60000;
          timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
          isTime = true;
        } else if(timeType === 's') {
          timeMillisec = timeInput.slice(0, timeInput.length-1);
          timeMillisec = Number(timeMillisec)
          timeMillisec = timeMillisec * 1000;
          timeEpoch = Math.floor(Date.now() / 1000) + (timeMillisec / 1000);
          isTime = true;
        } 

        // Checks to see if sender has an active game
        if(userProfile.totalWagered < 0) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, You have a wager requirement! You can't do giveaways`,"color": "#be1932","footer": {"text": "Make sure you wager more"}}]});
        if(!isTime) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, time input is malformed!`,"color": "#be1932","footer": {"text": "Use m, d, and s for minutes, seconds, and days"}}]});
        if(userProfile.balance < amount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to do this!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        if(amount < .5) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the minimum giveaway amount is $0.01!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        if(userProfile.active_game) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});
        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $inc: { balance: -amount, } });
        let joinedUserIds = [];
        let entries = 0;
        let giveawayEmbed = new MessageEmbed()
          .setTitle(`Giveaway for: $${amount}!`)
          .setDescription(`Ends: <t:${timeEpoch}:R> (<t:${timeEpoch}>)
          Hosted by: <@${interaction.user.id}>
          Entries: ${entries}
          Winners: 1`)
          .setTimestamp()
          .setColor('#0071e7')
        const giveawayButton = new MessageActionRow()
          .addComponents(
            new MessageButton()
              .setCustomId(interaction.id)
              .setStyle('SECONDARY')
              .setEmoji('🎉'),
        );
        const giveawayDisabledButton = new MessageActionRow()
          .addComponents(
            new MessageButton()
                .setCustomId(interaction.id)
                .setStyle('SECONDARY')
                .setDisabled(true)
                .setEmoji('🎉'),
        )
        await interaction.editReply({
          embeds: [giveawayEmbed],
          components: [giveawayButton]
        }).then(async (msg) => {
        
        const filter = async (i) => true;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: timeMillisec });
        
        collector.on('collect', async (i) => {
            if(joinedUserIds.includes(i.user.id) && i.customId === interaction.id) {
              await i.user.send({
                embeds: [{
                    "description": `**You** have already joined [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}) **giveaway!** :tada:`,
                    "color": "#e53835",
                }]
            }).catch(error => {});
            }

            if(!joinedUserIds.includes(i.user.id) && i.customId === interaction.id) { 
                joinedUserIds.push(i.user.id);
                entries++;
                await client.getProfile(i.user.id);
                await i.user.send({
                    embeds: [{
                        "description": `**You** have joined [this](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id}/${interaction.id}) **giveaway!** :tada:`,
                        "color": "#4caf4f",
                    }]
                }).catch(error => {});

                let giveawayEmbed = new MessageEmbed()
                  .setTitle(`Giveaway for: $${amount}!`)
                  .setDescription(`Ends: <t:${timeEpoch}:R> (<t:${timeEpoch}>)
                  Hosted by: <@${interaction.user.id}>
                  Entries: ${entries}
                  Winners: 1`)
                  .setColor('#488d38')  

                await msg.edit({
                  embeds: [giveawayEmbed]
                });
            } 
        });
        
        collector.on('end', async (collected) => {
          const winnerIndex = Math.floor(Math.floor(Math.random() * joinedUserIds.length));
          let winnerId = joinedUserIds[winnerIndex];
          let finishedEmbed = new MessageEmbed()
            .setTitle(`Giveaway for: $${amount}!`)
            .setDescription(`Ended: (<t:${timeEpoch}>)
            Hosted by: <@${interaction.user.id}>
            Entries: ${entries}
            Winner: <@${winnerId}>`)
            .setColor('#36393f') 
  
          await profile.findOneAndUpdate(
            {
              userId: winnerId
            },
            {
              $inc: {
                balance: +amount
              }
            }
          )
          await msg.edit({
            embeds: [finishedEmbed],
            components: [giveawayDisabledButton]
          }).catch(error => {});

          await msg.reply({
            content: `Congratulations <@${winnerId}>! You won **$${amount}**!`,
            embeds: [{
              "description": `**${entries}** entries :arrow_upper_right:`,
                        "color": "#36393f",
          }]
          })
        }); 
      
      })
	},
};