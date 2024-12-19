const mongoose = require('mongoose');
const UserModel = require('./user');


// Schéma de Feedback
const FeedbackSchema = new mongoose.Schema({

    comment: { // Commentaire du feedback
        type: String,
        required: true,
        maxlength: 500
    },
    rating: { // Note sur 5
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    createdAt: { // Date de création
        type: Date,
        default: Date.now
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Référence au modèle "User"
        required: true,
    },
});

// Export du modèle Feedback
module.exports = mongoose.model('Feedback', FeedbackSchema);
