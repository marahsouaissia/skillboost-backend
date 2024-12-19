const mongoose = require('mongoose');
const UserModel = require('./user');


const cvSchema = new mongoose.Schema({
    name: {
        type: String,
        required : false
    },

    file :{
        path : String,
        size : String
    },

    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Référence au modèle "User"
        required: true,
    },
})

module.exports = mongoose.model('Cv', cvSchema);
