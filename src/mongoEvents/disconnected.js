module.exports = {
    name: "disconnected",
    once: true,
    async execute() {
        console.log("Disconnected from mongoDB database.");
    }
}