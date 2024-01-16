module.exports = {
    name: "ready",
    once: true,
    execute(client) {
        console.log('Bot is Loaded and Ready!')
        client.user.setActivity(' / Commands - /help', { type: 'WATCHING' });
    }
}