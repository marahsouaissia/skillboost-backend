const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test',
        required: true
    },
    answers: [
        {
            question: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Question',
                required: true
            },
            selectedAnswer: {
                type: String,
                required: true
            }
        }
    ],
    submittedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Answer', AnswerSchema);
