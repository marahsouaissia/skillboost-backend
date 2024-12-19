const express = require('express');
const jwt = require('jsonwebtoken');
const AnswerModel = require('../models/AnswerSchema');
const QuestionModel = require('../models/Question');
const UserModel = require('../models/user');
const router = express.Router();

router.post('/submit', async (req, res) => {
    try {
        // Extract token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ message: "Unauthorized access. No token provided." });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized access. Token missing." });

        // Verify the token
        const claims = jwt.verify(token, "secret key");
        if (!claims) return res.status(401).json({ message: "Unauthorized access. Invalid token." });

        // Find the user based on token claims
        const user = await UserModel.findById(claims._id);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Validate the request body
        const { testId, answers } = req.body;
        if (!testId || !Array.isArray(answers)) {
            return res.status(400).json({ message: "Invalid request. Test ID and answers are required." });
        }

        // Validate each answer
        for (let answer of answers) {
            const question = await QuestionModel.findById(answer.question);
            if (!question) {
                return res.status(400).json({ message: `Invalid question ID: ${answer.question}` });
            }
        }

        // Save the answers
        const newAnswer = new AnswerModel({
            user: user._id,
            test: testId,
            answers
        });

        await newAnswer.save();

        res.status(201).json({
            message: "Answers submitted successfully.",
            answer: newAnswer
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
});
router.get('/user/tests', async (req, res) => {
    try {
        // Extract token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).json({ message: "Unauthorized access. No token provided." });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).json({ message: "Unauthorized access. Token missing." });

        // Verify the token
        const claims = jwt.verify(token, "secret key");
        if (!claims) return res.status(401).json({ message: "Unauthorized access. Invalid token." });

        // Find the user based on token claims
        const user = await UserModel.findById(claims._id);
        if (!user) return res.status(404).json({ message: "User not found." });

        // Fetch all answers submitted by the user
        const userAnswers = await AnswerModel.find({ user: user._id }).populate('test');

        const results = [];

        for (const answerEntry of userAnswers) {
            const { test, answers } = answerEntry;

            // Fetch all questions for the test
            const questions = await QuestionModel.find({ test: test._id });

            let score = 0;

            // Compare user's answers with correct answers
            const questionDetails = questions.map((question) => {
                const userAnswer = answers.find((a) => String(a.question) === String(question._id));
                const isCorrect = userAnswer?.selectedAnswer === question.correctAnswer;

                if (isCorrect) score++;

                return {
                    questionId: question._id,
                    text: question.text,
                    choices: question.choices,
                    correctAnswer: question.correctAnswer,
                    userAnswer: userAnswer?.selectedAnswer || null,
                    isCorrect
                };
            });

            // Add test results to the response
            results.push({
                testId: test._id,
                testTitle: test.title,
                testDescription: test.description,
                score,
                totalQuestions: questions.length,
                duree: test.duration,
                date: test.createdAt,
                questions: questionDetails
            });
        }

        res.status(200).json({ message: "Tests retrieved successfully.", results });
    } catch (error) {
        res.status(500).json({ message: "Internal server error.", error: error.message });
    }
});

module.exports = router;
