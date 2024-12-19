const { Router } = require("express");
const Feedback = require("../models/feedback");
const User = require("../models/user");
const { authentificateToken } = require("../middleware/auth");

const router = Router();

// Créer un feedback
router.post('/createFeedback', authentificateToken, async (req, res) => {
    try {
        const { comment, rating } = req.body;

        // Validation des données
        if (!comment || !rating) {
            return res.status(400).json({ message: "Les champs `comment` et `rating` sont requis." });
        }

        // Vérifier si l'utilisateur existe
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

        const feedback = new Feedback({
            user: user._id,
            comment,
            rating,
        });

        const savedFeedback = await feedback.save();
        res.status(201).json({ message: "Feedback créé avec succès.", feedback: savedFeedback });
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
    }
});

// Récupérer tous les feedbacks
router.get('/getAllFeedbacks', authentificateToken, async (req, res) => {
    try {
        const feedbacks = await Feedback.find().populate('user', 'name email');
        res.status(200).json(feedbacks);
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
    }
});

// Récupérer un feedback par ID
router.get('/getFeedbackById/:id', authentificateToken, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id).populate('user', 'name email');
        if (!feedback) return res.status(404).json({ message: "Feedback introuvable." });

        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
    }
});

// Supprimer un feedback
router.delete('/deleteFeedback/:id', authentificateToken, async (req, res) => {
    try {
        const feedback = await Feedback.findById(req.params.id);
        if (!feedback) return res.status(404).json({ message: "Feedback introuvable." });

        // Vérification des droits de l'utilisateur
        if (feedback.user.toString() !== req.user._id) {
            return res.status(403).json({ message: "Accès refusé. Vous ne pouvez pas supprimer ce feedback." });
        }

        await Feedback.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: "Feedback supprimé avec succès." });
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
    }
});

// Mettre à jour un feedback
router.put('/updateFeedback/:id', authentificateToken, async (req, res) => {
    try {
        const { comment, rating } = req.body;
        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) return res.status(404).json({ message: "Feedback introuvable." });

        // Vérification des droits de l'utilisateur
        if (feedback.user.toString() !== req.user._id) {
            return res.status(403).json({ message: "Accès refusé. Vous ne pouvez pas modifier ce feedback." });
        }

        feedback.comment = comment || feedback.comment;
        feedback.rating = rating || feedback.rating;

        const updatedFeedback = await feedback.save();
        res.status(200).json({ message: "Feedback mis à jour avec succès.", feedback: updatedFeedback });
    } catch (error) {
        res.status(500).json({ message: "Erreur interne du serveur.", error: error.message });
    }
});

module.exports = router;
