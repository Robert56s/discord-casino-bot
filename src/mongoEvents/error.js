module.exports = {
    name: "error",
    once: true,
    async execute(error) {
        console.log(error);
    }
}