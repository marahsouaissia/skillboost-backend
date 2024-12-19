const Cv = require('../models/cv');
const {Router} = require("express");
const CvModel = require("../models/cv");
const router =  Router();
const multiparty = require('connect-multiparty');
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");
const multipartMiddleware = multiparty({ uploadDir: './Cv' });



router.post('/create_Cv', multipartMiddleware, async (req, res) => {
    try {
        const { name, user_id } = req.body;

        // Vérification des champs obligatoires
        if (!name || !user_id) {
            return res.status(400).json({
                message: "Les champs `name` et `user_id` sont requis.",
            });
        }

        const uploadedFile = req.files.file;
        if (!uploadedFile) {
            return res.status(400).json({
                message: "Aucun fichier n'a été trouvé.",
            });
        }

        const filepath = `/${uploadedFile.path.replace(/\\/g, '/')}`;
        const file = {
            path: filepath,
            size: `${uploadedFile.size / (1024 * 1024)} MB`,
        };

        const cv = new CvModel({
            name,
            file,
            user_id,
        });

        const savedCv = await cv.save();

        res.status(200).json({
            message: "CV créé avec succès.",
            cv: savedCv,
        });
    } catch (error) {
        res.status(500).json({
            message: "Erreur interne du serveur.",
            error: error.message,
        });
    }
});


router.get('/get_byid/:id',async(req,res)=>{
    try{
        id = req.params.id;
        cv = await CvModel.findById({_id: id})
        res.status(200).send(cv);
    }
    catch(error){
        res.status(400).send(error)
    }
})
router.get('/get_my_cvs', async (req, res) => {
    try {
        // Extract token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).json({ message: "Unauthorized: No token provided." });
        }

        const token = authHeader.split(' ')[1];
        const claims = jwt.verify(token, "secret key"); // Replace "secret key" with your actual secret
        if (!claims) {
            return res.status(401).json({ message: "Unauthorized: Invalid token." });
        }

        // Find CVs for the user identified by the token
        const cvs = await CvModel.find({ user_id: claims._id }).populate('user_id', 'name email');
        res.status(200).json(cvs);
    } catch (error) {
        res.status(500).json({
            message: "Error retrieving CVs for the authenticated user.",
            error: error.message
        });
    }
});

router.delete('/delete/:id',async(req,res)=>{
    try {
        const result = await CvModel.deleteOne({ _id: req.params.id });
        res.send(result);
    } catch (err) {
        res.status(444).send(err);
    }
})


router.put('/update', multipartMiddleware , async(req,res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.status(401).send({ message: "Unauthorized access. No token provided." });

        const token = authHeader.split(' ')[1];
        if (!token) return res.status(401).send({ message: "Unauthorized access. Token missing." });

        const claims = jwt.verify(token, "secret key");
        if (!claims) return res.status(401).send({ message: "Unauthorized access. Invalid token." });

        const user = await UserModel.findById(claims._id);
        if (!user) return res.status(404).send({ message: "User not found." });

        const uploadedFile = req.files && req.files.file;
        if (!uploadedFile) return res.status(400).json({ message: "File missing." });

        const filePath = `/${uploadedFile.path.replace(/\\/g, '/')}`;
        const fileData = { path: filePath, size: uploadedFile.size };

        const newCvData = { ...req.body, file: fileData, user_id: user._id };

        await CvModel.deleteMany({ user_id: user._id });

        const newCv = new CvModel(newCvData);
        await newCv.save();

        res.status(200).send(newCv);

    } catch (err) {
        res.status(500).send({ error: "Error while updating the CV.", details: err.message });
    }
});





module.exports = router;