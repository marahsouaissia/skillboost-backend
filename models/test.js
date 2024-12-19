// models/Test.js
const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    title: {
        type: String, required: true
        },
    description: {
        type: String, required: true
        },
    logo:{
        type: String
    },
    duration: {
        type: Number, required: true
        },
    numberOfQuestions: {
        type: Number, default: 0
        },
    createdAt: {
        type: Date, default: Date.now
        },
});

module.exports = mongoose.model('Test', TestSchema);
