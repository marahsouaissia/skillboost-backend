const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserModel = require('../models/user');
const {Router} = require("express");
const cors = require("cors");

const multiparty = require('connect-multiparty');
const fs = require('fs');
const path = require('path');
const multipartMiddleware = multiparty({ uploadDir: './images' });


let tokenBlacklist = [];
const router = Router();

const corsOptions = {
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
const checkBlacklist = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        if (tokenBlacklist.includes(token)) {
            return res.status(401).send({
                message: "Unauthorized access. Token has been invalidated."
            });
        }
    }
    next();
};
router.use(cors(corsOptions),checkBlacklist);

//router.route('/user/getAll').get(userController.getDataControllerfn);

router.post('/add', (req, res) => {
    const data = req.body;

    const usr = new UserModel(data);

    usr.save()
        .then((savedUser) => {
            res.status(200).send(savedUser);
        })
        .catch((err) => {
            res.status(400).send(err);
        });
});


// router.get('/getall', (req,res)=>{
//     User.find()
//         .then(
//             (users)=>{
//                 res.send(users);
//             }
//         )
//         .catch(
//             (err)=>{
//                 res.send(err)
//             }
//         )
//
// })

router.get('/getall', async (req, res) => {
    let users = await UserModel.find()
    res.send(users)
})

router.get('/get_byid/:id', async (req, res) => {
    try {
        id = req.params.id;
        user = await UserModel.findById({_id: id})
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error)
    }
})


router.delete('/delete/:id', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send({
                message: "Unauthorized access. No token provided."
            });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).send({
                message: "Unauthorized access. Token missing."
            });
        }

        let claims;
        try {
            claims = jwt.verify(token, "secret key");
        } catch (err) {
            return res.status(401).send({
                message: "Unauthorized access. Invalid token."
            });
        }

        const user = await UserModel.findById(claims._id);
        if (!user) {
            return res.status(404).send({
                message: "User not found."
            });
        }

        const userIdToDelete = req.params.id;
        if (!userIdToDelete) {
            return res.status(400).send({
                message: "User ID is required."
            });
        }

        // (Optionnel) Vérifiez si l'utilisateur a le droit de supprimer cet utilisateur (ex: admin)
        // if (user.role !== 'admin') {
        //     return res.status(403).send({
        //         message: "Forbidden. You don't have permission to delete this user."
        //     });
        // }

        const result = await UserModel.deleteOne({ _id: userIdToDelete });
        if (result.deletedCount === 0) {
            return res.status(404).send({
                message: "User not found."
            });
        }

        res.status(200).send({
            message: "User successfully deleted."
        });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send({
            message: "Internal server error.",
            error: err.message
        });
    }
});


router.put('/update',multipartMiddleware, async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send({
                message: "Unauthorized access. No token provided."
            });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).send({
                message: "Unauthorized access. Token missing."
            });
        }
        const claims = jwt.verify(token, "secret key");
        if (!claims) {
            return res.status(401).send({
                message: "Unauthorized access. Invalid token."
            });
        }
        const user = await UserModel.findById(claims._id);
        if (!user) {
            return res.status(404).send({
                message: "User not found."
            });
        }
        const uploadedFile = req.files.image;
        if(!uploadedFile)
            return res.status(400).json({message : "File not find"});
        const filepath = `/${uploadedFile.path.replace(/\\/g, '/')}`;
        const updatedfile = {
            ...req.body,
            image: filepath
        }
        const result = await UserModel.updateOne({_id: user.id},updatedfile);
        const userres = await UserModel.findById(user.id);

        res.status(200).send(userres);

        console.log(req.body, req.files);
    } catch (err) {
        res.status(444).send(err);
    }
})




//Register

router.post('/register', async (req, res) => {
    let email = req.body.email;
    let password = req.body.password;
    let name = req.body.name;
    let lastname = req.body.lastname;
    let phone = req.body.phone;
    let address = req.body.address;

    const record = await UserModel.findOne({email: email});

    if (record) {
        return res.status(400).send({
            message: "Email is already registered",
        });
    }

    // const salt = await bcrypt.genSalt(10); // Générer le salt
    const hashedPassword = await bcrypt.hash(password, 10);


    const user = new UserModel({
        name: name,
        lastname: lastname,
        phone: phone,
        address: address,
        email: email,
        password: hashedPassword ,
        role: "user",
    });



    await user.save();
    res.send({message: "success"})

});
router.post('/register-admin', async (req, res) => {
    const { email, password, name, lastname, phone, address } = req.body;

    try {
        const record = await UserModel.findOne({ email });

        if (record) {
            return res.status(400).send({
                message: "Email is already registered",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = new UserModel({
            name,
            lastname,
            phone,
            address,
            email,
            password: hashedPassword,
            role: "admin", // Explicitly setting role to "admin"
        });

        await admin.save();
        res.send({ message: "Admin registered successfully" });
    } catch (error) {
        res.status(500).send({ message: "Error registering admin", error });
    }
});



router.post('/login', async (req, res) => {
    const usr = await UserModel.findOne({ email: req.body.email });
    if (!usr) {
        return res.status(404).send({ message: "User not found" });
    }

    // Check if the user has a valid hashed password
    if (!usr.password) {
        return res.status(500).send({ message: "Password not set for this user" });
    }

    console.log("User found:", usr);
    console.log("Password to compare:", req.body.password);
    console.log("Hashed password from DB:", usr.password);

    const isPasswordValid = await bcrypt.compare(req.body.password, usr.password);
    if (!isPasswordValid) {
        return res.status(400).send({ message: "Password is incorrect" });
    }

    const token = jwt.sign(
        { _id: usr._id, role: usr.role },
        "secret key",
        { expiresIn: '24h' }
    );

    res.send({
        message: "success",
        token: token,
        role: usr.role,
    });
});

router.get('/user', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            return res.status(401).send({
                message: "Unauthorized access. No token provided."
            });
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).send({
                message: "Unauthorized access. Token missing."
            });
        }
        const claims = jwt.verify(token, "secret key");
        if (!claims) {
            return res.status(401).send({
                message: "Unauthorized access. Invalid token."
            });
        }
        const user = await UserModel.findById(claims._id);
        if (!user) {
            return res.status(404).send({
                message: "User not found."
            });
        }
        const {password, ...data} = user.toJSON();
        res.status(200).send(data);
    }
    catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).send({
            message: "Internal server error. Please try again later."
        });
    }
})
router.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(401).send({
            message: "Unauthorized access. No token provided."
        });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send({
            message: "Unauthorized access. Token missing."
        });
    }

    try {
        const claims = jwt.verify(token, "secret key");

        if (!claims) {
            return res.status(401).send({
                message: "Unauthorized access. Invalid token."
            });
        }

        // Add the token to the blacklist
        tokenBlacklist.push(token);

        res.status(200).send({
            message: "Successfully logged out."
        });
    } catch (error) {
        return res.status(401).send({
            message: "Unauthorized access. Invalid token."
        });
    }
});


module.exports = router;