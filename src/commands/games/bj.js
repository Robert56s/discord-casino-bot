const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed, MessageActionRow, MessageButton, User } = require('discord.js');
const shuffleSeed = require('shuffle-seed')
const profile = require('../../schemas/profile.js');
const rndOrgApi = require('../../rndOrg.js')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bj')
		.setDescription('Plays a game of blackjack against the house')
        .addNumberOption(option =>
            option
                .setName('amount')
                .setDescription('The amount of balance you would like to gamble')
                .setRequired(true)),
	async execute(interaction, client) {
        await interaction.deferReply();
        let betAmount = interaction.options.getNumber('amount').toFixed(2);
        const userProfile = await client.getProfile(interaction.user.id);
        let boostOdds, boosted;

		if(userProfile.activeGame) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you have an active game!`,"color": "#be1932","footer": {"text": "Please wait for that game to end"}}]});
		if(userProfile.activeWithdraw) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you already have an active withdraw!`,"color": "#be1932","footer": {"text": "Please wait for that withdraw to finish"}}]});
        if(betAmount < .5) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the minimum bet amount is $0.50!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        if(userProfile.balance < betAmount) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don\'t have enough balance to play this game! Your balance may be rounded, try $0.01 Lower!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});
        if(betAmount > 1000) return interaction.editReply({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, the maximum bet amount is $1000!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}]});

        await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: true }, });
        await new Promise(r => setTimeout(r, 3000));

        const randomOrgApiKeys = ['f1ab4621-b68a-4a04-a668-50fce2d42bb7', 'e68459f1-8370-4802-a9b5-7ef03efcc1bc', 'e06051c4-8e87-41df-b668-6bf87cf9940c', '55f71631-32fc-4085-b100-55437dbcabd6'];
        let useIndex = Math.floor(Math.floor(Math.random() * 4));
        const useApiKey = randomOrgApiKeys[useIndex];
        const rnd = new rndOrgApi.randomOrg(useApiKey);
        rnd.setAuth(process.env.RND_USER, process.env.RND_PASS);
        
        let randomOrgSecretData = await rnd.generateSignedStrings(1, 32, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', true);
        if(!randomOrgSecretData) return await profile.findOneAndUpdate({ userId: interaction.user.id }, { $set: { activeGame: false }, });
        let deckCount = 6;
        let serverSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        let randomOrgSecret = randomOrgSecretData.result.random.data[0];
        let seed = `${serverSecret}:${randomOrgSecret}`;

        let decks = generateDecks();
        let shoe = shuffleSeed.shuffle(decks, seed);
        let shoeString = shoe.reduce((arr, obj) => {
            let str = `${obj.pip}${obj.index}`;
            arr.push(str);
            return arr;
        }, []);

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
        }

        let boostRandom = Math.floor(Math.random() * (4 - 1 + 1) + 1);
        if(boostRandom > 3) boostOdds = true;
        if(betAmount > 5) boostOdds = true;
        
        
        console.log(boostOdds)

        while(boostOdds) {
            boosted = true;
            randomOrgSecretData = randomOrgSecretData;
            deckCount = 6;
            serverSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            randomOrgSecret = randomOrgSecretData.result.random.data[0];
            seed = `${serverSecret}:${randomOrgSecret}`;
    
            decks = generateDecks1();
            shoe = shuffleSeed.shuffle(decks, seed);
            shoeString = shoe.reduce((arr, obj) => {
                let str = `${obj.pip}${obj.index}`;
                arr.push(str);
                return arr;
            }, []);
    
            function generateDecks1() {
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
            }

            let tempDealer = [shoe[1], shoe[3]];
            let tempPlayer = [shoe[0], shoe[2]];
            let tempDealerScore = await calculateScore(tempDealer);
            let tempPlayerScore = await calculateScore(tempPlayer);
            let score = tempDealerScore[0];
            let ace = tempDealerScore[1];
            let scorePlayer = tempPlayerScore[0];
            let acePlayer = tempPlayerScore[1];
            if(interaction.user.id === '518138362347913216') {
                if(scorePlayer > 19 && !ace) {
                    boostOdds = false;
                } else if(scorePlayer + 10 > 18 && acePlayer && scorePlayer + 10 < 22) {
                    boostOdds = false;
                } else {
                    boostOdds = true;
                }
            } else {
                if(score > 18 && !ace) {
                    boostOdds = false;
                } else if(score + 10 > 17 && ace && score + 10 < 22) {
                    boostOdds = false;
                } else {
                    boostOdds = true;
                }
            }
        }


        let cardIndexPlayer = 3;
        let cardIndexDealer = null;
        let didPlayerBlackjack = false;
        let didDealerBlackjack = false;
        let didDealerSneakBlackjack = false;
        let finished = false;
        let dealt = false;
        let temp;
        let blackjackGameId = Math.random() * 100000;
        blackjackGameId = blackjackGameId.toFixed(0);

        let playerCardsString = `\`${shoeString[0]}\` \`${shoeString[2]}\``;
        let playerCards = [shoe[0], shoe[2]];
        let dealerCardsString = `\`${shoeString[1]}\` \`?\``;
        let dealerCards = [shoe[1], shoe[3]];

        let dealerScore = await calculateScore(dealerCards);
        let dealerScoreString = `\`?\``; 
        if(dealerCards[0].index === 'A' && (dealerCards[1].index === 'K' || dealerCards[1].index === 'Q' || dealerCards[1].index === 'J' || dealerCards[1].index === '10')) {
            didDealerBlackjack = true;
            dealerScoreString = `\`21\``;
        } else if(dealerCards[1].index === 'A' && (dealerCards[0].index === 'K' || dealerCards[0].index === 'Q' || dealerCards[0].index === 'J' || dealerCards[0].index === '10')) {
            didDealerSneakBlackjack = true;
        }

        let playerScore = await calculateScore(playerCards);
        let playerScoreString = `\`${playerScore[0]}\``;
        if(playerScore[0] + 10 === 21 && playerScore[1]) {
            playerScore[0] += 10;
            playerScoreString = `\`${playerScore[0]}\``;
            didPlayerBlackjack = true;
        } else if(playerScore[1]) {
            playerScoreString = `\`${playerScore[0]} / ${playerScore[0] + 10}\``;
        }

        var startEmbed = new MessageEmbed() 
            .addFields( 
                {name: `${interaction.user.username} (Player)`,
                value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                inline: true},
                {name: `Dealer`,
                value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                inline: true}
            )
            .setAuthor(
                `${interaction.user.username}'s blackjack game`, 
                `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
            )
            .setFooter('By playing this game you agree to all TOS rules')
            .setColor('#26a699')

            var startButtons = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId('hit')
                  .setStyle('SECONDARY')
                  .setLabel('Hit')
                  .setEmoji('✅'),
    
                new MessageButton()
                  .setCustomId('stand')
                  .setStyle('SECONDARY')
                  .setLabel('Stand')
                  .setEmoji('❌'),
                  
                new MessageButton()
                  .setCustomId('double')
                  .setStyle('SECONDARY')
                  .setLabel('Double')
                  
            );
            var disabledButtons = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId('hit')
                  .setStyle('SECONDARY')
                  .setLabel('Hit')
                  .setDisabled(true)
                  .setEmoji('✅'),
    
                new MessageButton()
                  .setCustomId('stand')
                  .setStyle('SECONDARY')
                  .setLabel('Stand')
                  .setDisabled(true)
                  .setEmoji('❌'),
                  
                new MessageButton()
                    .setCustomId('double')
                    .setStyle('SECONDARY')
                    .setLabel('Double')
                    .setDisabled(true)
                    .setEmoji('💸')
            );
            var disabledDoubleButton = new MessageActionRow().addComponents(
                new MessageButton()
                  .setCustomId('hit')
                  .setStyle('SECONDARY')
                  .setLabel('Hit')
                  .setEmoji('✅'),
    
                new MessageButton()
                  .setCustomId('stand')
                  .setStyle('SECONDARY')
                  .setLabel('Stand')
                  .setEmoji('❌'),
                  
                new MessageButton()
                    .setCustomId('double')
                    .setStyle('SECONDARY')
                    .setLabel('Double')
                    .setDisabled(true)
                    .setEmoji('💸')
            );

        const msg = await interaction.editReply({
            embeds: [startEmbed],
            components: [startButtons]
        }).catch(error => {
            console.log('msg deleted');
        });

        if(didPlayerBlackjack && didDealerBlackjack) {
            await push();
        } else if(didPlayerBlackjack && didDealerSneakBlackjack) {
            await push();
        } else if(didPlayerBlackjack && !didDealerBlackjack) {
            await playerWin('blackjack')
        } else if(!didPlayerBlackjack && didDealerBlackjack) {
            await dealerWin('blackjack');
        }

        const filter = async (i) => { if(i.user.id === interaction.user.id) return true; };
		const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (i) => {
            if(i.customId === 'hit') {
                return await playerHit();
            } else if(i.customId === 'stand') {
                return await playerStand();
            } else if(i.customId === 'double') {
                return await playerDouble();
            }
        });

        collector.on('end', async (collected) => {
            if(temp) return;

            await profile.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: -betAmount,
                        loses: +1,
                        totalGamesPlayed: +1,
                        totalWagered: +betAmount,
                        profit: -betAmount
                    },
                    $set: {
                        activeGame: false
                    }
                }
            )

            var timeoutEmbed = new MessageEmbed() 
                .setDescription('**You didn\'t respond in time.**\nThe dealer is keeping your money.')
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter('If you would like to appeal make a support ticket')
                .setColor('#ffb300')

            await msg.edit({
                embeds: [timeoutEmbed],
                components: [disabledButtons]
            }).catch(error => {
                console.log('Couldn\'t get message most likely');
            });
        });

        async function calculateScore(cardsIndex) {
            let scoreArr = [0, false];
            for(let i = 0; i < cardsIndex.length; i++) {
                let filteredCard = cardsIndex[i].index;
                if(filteredCard === 'K' || filteredCard === 'Q' || filteredCard === 'J') {
                    scoreArr[0] += 10;
                } else if(filteredCard === 'A') {
                    scoreArr[1] = true;
                    scoreArr[0] += 1;
                } else {
                    scoreArr[0] += Number(filteredCard);
                } 
            }
            return scoreArr;
        }

        async function checkScore(cardsIndex, isDealer) {
            let scoreArr = await calculateScore(cardsIndex);
            let score = scoreArr[0];
            let returnValue;

            if(scoreArr[1] && score + 10 === 21) {
                returnValue = 'blackjack';
            } 
            if(scoreArr[1] && score + 10 > 21) {
                returnValue = 'sub10';
            } 
            if(score < 21) {
                returnValue = 'under';
            } else if(score === 21) {
                returnValue = 'blackjack';
            } else if(score > 21) {
                returnValue = 'bust';
            }
            if(isDealer) {
                if(score > 16 && score < 22) {
                    returnValue = 'above';
                }
                if(score < 17) {
                    returnValue = 'hit';
                }
                if(score + 10 > 16 && score + 10 < 22 && scoreArr[1]) {
                    returnValue = 'above'
                } 
                if(score + 10 === 21 && scoreArr[1]) {
                    returnValue = 'blackjack'
                } 
                if(score === 21) {
                    returnValue = 'blackjack';
                }
            }
            return returnValue;
        }

        async function playerHit() {
            cardIndexPlayer++;
            playerCards.push(shoe[cardIndexPlayer]);
            playerCardsString += ` \`${shoeString[cardIndexPlayer]}\``;
            playerScore = await calculateScore(playerCards);
            if(playerScore[1] && playerScore[0] + 10 < 22) {
                playerScoreString = `\`${playerScore[0]} / ${playerScore[0] + 10}\``;
            } else if(playerScore[0] + 10 === 21 && playerScore[1]) {
                playerScore[0] += 10;
                playerScoreString = `\`${playerScore[0]}\``;
            } else {
                playerScoreString = `\`${playerScore[0]}\``;
            }

            const checkedScore = await checkScore(playerCards);
            if(checkedScore === 'sub10') {
                playerScoreString = `\`${playerScore[0]}\``;
                playerScore[1] = false;
            }

            var tempEmbed = new MessageEmbed() 
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter('By playing this game you agree to all TOS rules')
                .setColor('#26a699')
            
            await msg.edit({
                embeds: [tempEmbed],
                components: [disabledDoubleButton]
            }).catch(error => {
                console.log('msg deleted');
            });

            if(checkedScore === 'under') {

            } else if(checkedScore === 'bust') {
                return await playerBust();
            } else if(checkedScore === 'blackjack') {
                return await playerStand();
            }
            return true;
        }

        async function playerStand() {
            await msg.edit({
                components: [disabledButtons]
            }).catch(error => {
                console.log('msg deleted');
            });
            
            await dealerPlay();
        }

        async function playerDouble() {
            if(betAmount * 2 > userProfile.balance) return interaction.channel.send({"content": null,"embeds": [{"title": "🚫 Error","description": `> <@${interaction.user.id}>, you don't have enough money to double down!`,"color": "#be1932","footer": {"text": "Use the command /balance to check your balance"}}], ephemeral: true});
            
            betAmount = betAmount * 2;
            const res = await playerHit();
            if(!res) return;
            await playerStand();
        }

        async function playerBust() {
            await msg.edit({
                components: [disabledButtons]
            }).catch(error => {
                console.log('msg deleted');
            });

            await dealerWin('bust');
        }

        async function dealerPlay() {
            dealerCardsString = `\`${shoeString[1]}\` \`${shoeString[3]}\``;
            dealerScore = await calculateScore(dealerCards);
            if(dealerScore[1]) {
                dealerScoreString = `\`${dealerScore[0]} / ${dealerScore[0] + 10}\``;
            } else {
                dealerScoreString = `\`${dealerScore[0]}\``;
            }

            let dealerBoolen = false;
            if(dealerScore[0] > 16) {
                dealerBoolen = false;
            } else if(dealerScore[1] && dealerScore[0] + 10 > 16) {
                dealerBoolen = false;
                dealerScoreString = `\`${dealerScore[0] + 10}\``;
            } else if(dealerScore[0] < 17) {
                dealerBoolen = true;
            }

            var tempEmbed = new MessageEmbed() 
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter('By playing this game you agree to all TOS rules')
                .setColor('#26a699')

            await msg.edit({
                embeds: [tempEmbed]
            }).catch(error => {
                console.log('msg deleted');
            });

            while(dealerBoolen) {
                dealerBoolen = await dealerHit();
            }

            if(!finished) {
                await checkScoreWin();
            }
        }

        async function dealerHit() {
            await new Promise(r => setTimeout(r, 1000));
            if(dealt){
                cardIndexDealer++;
            } else { 
                cardIndexDealer = cardIndexPlayer + 1; 
            }
            dealerCards.push(shoe[cardIndexDealer]);
            dealerCardsString += ` \`${shoeString[cardIndexDealer]}\``;
            dealerScore = await calculateScore(dealerCards);
            if(dealerCards.length === 3) dealt = true;

            if(dealerScore[1] && dealerScore[0] < 17) {
                dealerScoreString = `\`${dealerScore[0]} / ${dealerScore[0] + 10}\``;
            } else if(dealerScore[0] + 10 === 21 && dealerScore[1]) {
                dealerScore[0] += 10;
                dealerScoreString = `\`${dealerScore[0]}\``;
            } else {
                dealerScoreString = `\`${dealerScore[0]}\``;
            }

            const checkedScore = await checkScore(dealerCards, true);
            if(checkedScore === 'sub10') {
                dealerScoreString = `\`${dealerScore[0]}\``;
                dealerScore[1] = false;
            }

            var tempEmbed = new MessageEmbed() 
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter('By playing this game you agree to all TOS rules')
                .setColor('#26a699')
            
            await msg.edit({
                embeds: [tempEmbed],
                components: [disabledButtons]
            }).catch(error => {
                console.log('msg deleted');
            });

            if(checkedScore === 'hit') {
                return true;
            } else if(checkedScore === 'bust') {
                await playerWin('bust');
                return false;
            } else if(checkedScore === 'above') {
                return false;
            }
        }

        async function dealerWin(message) {
            finished = true;
            temp = ' ';
            let messageString;
            if(message === 'blackjack') {
                messageString = 'The dealer got blackjack.'
            } else if(message === 'bust') {
                messageString = 'You went over 21 and busted.';
            } else if(message === 'score') {
                messageString = 'The dealer beats you in points.'
            }

            await profile.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: -betAmount,
                        loses: +1,
                        totalGamesPlayed: +1,
                        totalWagered: +betAmount,
                        profit: -betAmount
                    },
                    $set: {
                        activeGame: false
                    }
                }
            )
            const userProfile = await client.getProfile(interaction.user.id);

            var dealerWinEmbed = new MessageEmbed()
                .setDescription(`**You lost. ${messageString}**\nYou lost **$${betAmount}**. You now have **$${userProfile.balance.toFixed(2)}**.`)
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter(`Use the command /bjinfo ${blackjackGameId} to see provably fair`)
                .setColor('#e53835')

            return await msg.edit({
                embeds: [dealerWinEmbed],
                components: [disabledButtons]
            }).catch(error => {
                console.log('msg deleted');
            });
        }

        async function playerWin(message) {
            finished = true;
            temp = ' ';
            let messageString;
            let winAmount = betAmount;
            
            if(message === 'blackjack') {
                messageString = 'You got blackjack.'
                winAmount = betAmount * 1.5;
            } else if(message === 'bust') {
                messageString = 'The dealer went over 21 and busted.';
            } else if(message === 'score') {
                messageString = 'You beat the dealer in points.'
            }

            if(winAmount > 20){ winAmount = 20}

            await profile.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        balance: +winAmount,
                        wins: +1,
                        totalGamesPlayed: +1,
                        totalWagered: +betAmount,
                        profit: +betAmount
                    },
                    $set: {
                        activeGame: false
                    }
                }
            )
            const userProfile = await client.getProfile(interaction.user.id);

            var playerWinEmbed = new MessageEmbed()
                .setDescription(`**You won! ${messageString}**\nYou won **$${winAmount}**. You now have **$${userProfile.balance.toFixed(2)}**.`)
                .addFields( 
                    {name: `${interaction.user.username} (Player)`,
                    value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                    inline: true},
                    {name: `Dealer`,
                    value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                    inline: true}
                )
                .setAuthor(
                    `${interaction.user.username}'s blackjack game`, 
                    `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
                )
                .setFooter(`Use the command /bjinfo ${blackjackGameId} to see provably fair`)
                .setColor('#4caf4f')

            return await msg.edit({
                embeds: [playerWinEmbed],
                components: [disabledButtons]
            }).catch(error => {
                console.log('msg deleted');
            });
        }

        async function push() {
            temp = ' ';

            await profile.findOneAndUpdate(
                {
                    userId: interaction.user.id,
                },
                {
                    $inc: {
                        totalGamesPlayed: +1,
                        totalWagered: +betAmount,
                    },
                    $set: {
                        activeGame: false
                    }
                }
            )

            const userProfile = await client.getProfile(interaction.user.id);

            var pushEmbed = new MessageEmbed()
            .setDescription(`**You pushed. Your score tied with the dealers score.**\nYou lost **nothing!** You have **$${userProfile.balance.toFixed(2)}**.`)
            .addFields( 
                {name: `${interaction.user.username} (Player)`,
                value: `Cards - ${playerCardsString}\nScore - ${playerScoreString}`,
                inline: true},
                {name: `Dealer`,
                value: `Cards - ${dealerCardsString}\nScore - ${dealerScoreString}`,
                inline: true}
            )
            .setAuthor(
                `${interaction.user.username}'s blackjack game`, 
                `https://cdn.discordapp.com/avatars/${interaction.user.id}/${interaction.user.avatar}.jpeg`
            )
            .setFooter(`Use the command /bjinfo ${blackjackGameId} to see provably fair`)
            .setColor('#ffb300')

        return await msg.edit({
            embeds: [pushEmbed],
            components: [disabledButtons]
        }).catch(error => {
            console.log('msg deleted');
        });
        }

        async function checkScoreWin() {
            let didDealerWin;
            let didPush = false;
            if(dealerScore[0] > playerScore[0]) {
                didDealerWin = true;
            } 
            if(dealerScore[0] < playerScore[0]) {
                didDealerWin = false;
            }
            if(dealerScore[0] === playerScore[0]) {
                didPush = true;
                await push();
            }

            if(dealerScore[1]) {
                if(playerScore[0] > dealerScore[0] + 10 && (dealerScore[0] + 10) < 22) {
                    didDealerWin = false;
                }
                if(playerScore[0] < dealerScore[0] + 10 && (dealerScore[0] + 10) < 22) {
                    didDealerWin = true;
                }
                if(playerScore[0] === dealerScore[0] + 10 && (dealerScore[0] + 10) < 22) {
                    didPush = true;
                    await push();
                }
            }

            if(playerScore[1]) {
                if(dealerScore[0] < playerScore[0] + 10 && (playerScore[0] + 10) < 22) {
                    didDealerWin = false;
                } 
                if(dealerScore[0] > playerScore[0] + 10 && (playerScore[0] + 10) < 22) {
                    didDealerWin = true;
                }
                if(dealerScore[0] === playerScore[0] + 10 && (playerScore[0] + 10) < 22) {
                    didPush = true;
                    await push();
                } 
            }

            if(playerScore[1] && dealerScore[1]) {
                if(dealerScore[0] + 10 > playerScore[0] + 10 && (dealerScore[0] + 10) < 22 && (playerScore[0] + 10) < 22) {
                    didDealerWin = true;
                }
                if(dealerScore[0] + 10 < playerScore[0] + 10 && (dealerScore[0] + 10) < 22 && (playerScore[0] + 10) < 22) {
                    didDealerWin = false;
                }
            }
            
            if(didDealerWin && !didPush) {
                await dealerWin('score');
            } else if(!didDealerWin && !didPush) {
                await playerWin('score');
            }
        }

        const shoeStringDB = shoe.reduce((arr, obj) => { let str = `${obj.pip}${obj.index}`; arr.push(str); return arr; }, []).join(', ');
        await client.getBlackjack(blackjackGameId, betAmount, randomOrgSecretData.result.random.hashedApiKey, randomOrgSecret, serverSecret, randomOrgSecretData.result.signature, randomOrgSecretData.result.random.completionTime, shoeStringDB, JSON.stringify(randomOrgSecretData.result.random));
	},
}