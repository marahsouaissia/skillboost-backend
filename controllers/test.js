const Test = require('../models/Test');
const Question = require('../models/Question');
const { Router } = require('express');
const router = Router();
const multiparty = require('connect-multiparty');
const multipartMiddleware = multiparty({ uploadDir: './images' });
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './images'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Initialize Multer
const upload = multer({ storage: storage });
router.post('/createTest', upload.single('logo'), async (req, res) => {
    try {
        // Extract fields and files from multipart form-data
        const { title, description, duration, questions } = req.body;
        const uploadedFile = req.file;

        // Validate required fields
        if (!title || !description || !duration) {
            return res.status(400).json({ message: 'Title, description, and duration are required.' });
        }

        // Handle uploaded file
        const logoPath = uploadedFile ? `/${uploadedFile.path.replace(/\\/g, '/')}` : null;

        // Parse questions JSON string
        let parsedQuestions = [];
        if (questions) {
            try {
                parsedQuestions = JSON.parse(questions);
            } catch (err) {
                console.error("Failed to parse questions:", questions);
                return res.status(400).json({ message: 'Invalid JSON format for questions field.', error: err.message });
            }
        }

        // Create a new Test document
        const newTest = new Test({
            title,
            description,
            logo: logoPath,
            duration: parseInt(duration, 10),
            numberOfQuestions: parsedQuestions.length,
        });

        await newTest.save();

        // Create Question documents if questions are provided
        if (parsedQuestions.length > 0) {
            const questionsToSave = parsedQuestions.map((q) => ({
                text: q.text,
                choices: q.choices,
                correctAnswer: q.correctAnswer,
                test: newTest._id,
            }));

            await Question.insertMany(questionsToSave);
        }

        res.status(201).json({ message: 'Test created successfully', test: newTest });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});
// Récupérer tous les tests avec leurs questions
router.get('/getAllTests', async (req, res) => {
    try {
        // Fetch all tests
        const tests = await Test.find().lean();

        // Fetch associated questions for each test
        const testsWithQuestions = await Promise.all(
            tests.map(async (test) => {
                const questions = await Question.find({ test: test._id });
                return { ...test, questions };
            })
        );

        res.status(200).json(testsWithQuestions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Ajouter une question à un test
router.post('/addQuestion/:id', async (req, res) => {
    try {
        const { text, choices, correctAnswer } = req.body;
        const testId = req.params.id; // Utilisation de req.params.id directement

        // Vérifier si le test existe
        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ message: 'Test introuvable' });

        // Ajouter une nouvelle question
        const newQuestion = new Question({ text, choices, correctAnswer, test: testId });
        await newQuestion.save();

        // Mettre à jour le nombre de questions dans le test
        test.numberOfQuestions += 1;
        await test.save();

        res.status(201).json({ message: 'Question ajoutée avec succès', question: newQuestion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/addQuestion/:id', async (req, res) => {
    try {
        const { text, choices, correctAnswer } = req.body;
        const testId = req.params.id; // Utilisation de req.params.id directement

        // Vérifier si le test existe
        const test = await Test.findByIdAndDelete(testId);
        if (!test) return res.status(404).json({ message: 'Test introuvable' });

        // Ajouter une nouvelle question
        const newQuestion = new Question({ text, choices, correctAnswer, test: testId });
        await newQuestion.save();

        // Mettre à jour le nombre de questions dans le test
        test.numberOfQuestions += 1;
        await test.save();

        res.status(201).json({ message: 'Question ajoutée avec succès', question: newQuestion });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/deleteQuestion/:id', async (req, res) => {
    try {
        const questionId = req.params.id;

        // Trouver la question à supprimer
        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: 'Question introuvable' });

        // Supprimer la question
        await question.deleteOne();

        // Mettre à jour le nombre de questions dans le test associé
        const test = await Test.findById(question.test);
        if (test) {
            test.numberOfQuestions -= 1;
            await test.save();
        }

        res.status(200).json({ message: 'Question supprimée avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});




// Récupérer tous les tests avec leurs questions


// Récupérer un test spécifique avec ses questions
router.get('/getTestById/:id', async (req, res) => {
    try {
        const id = req.params.id
        // Trouver le test
        const test = await Test.findById(id).lean();
        if (!test) return res.status(404).json({ message: 'Test introuvable' });

        // Trouver les questions associées
        const questions = await Question.find({ test: id });

        res.status(200).json({ ...test, questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mettre à jour un test
router.put('/updateTest/:id', async (req, res) => {
    try {
        const id = req.params.id; // ID du test à mettre à jour
        const { title, description, duration } = req.body; // Données de mise à jour

        // Trouver et mettre à jour le test
        const updatedTest = await Test.findByIdAndUpdate(
            id,
            { title, description, duration },
            { new: true, runValidators: true } // Renvoie le test mis à jour
        );

        if (!updatedTest) {
            return res.status(404).json({ message: 'Test introuvable' });
        }

        res.status(200).json({ message: 'Test mis à jour avec succès', test: updatedTest });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Supprimer un test et ses questions associées
router.delete('/deleteTest/:id',  async (req, res) => {
    try {
        const id= req.params.id;

        // Supprimer le test
        const test = await Test.findByIdAndDelete(id);
        if (!test) return res.status(404).json({ message: 'Test introuvable' });

        // Supprimer les questions associées
        await Question.deleteMany({ test: id });

        res.status(200).json({ message: 'Test et questions supprimés avec succès' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
