const mongoose = require('mongoose');

const addressModel = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: { type: String, require: true, unique: true},
    btcAddress: { type: String, require: true, unique: true},
    ltcAddress: { type: String, require: true, unique: true}

});

module.exports = mongoose.model("addressModels", addressModel);