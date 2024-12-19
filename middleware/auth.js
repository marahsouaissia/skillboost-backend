const jwt = require("jsonwebtoken");

const authentificateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).send({ message: "Unauthorized access. No token provided." });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).send({ message: "Unauthorized access. Token missing." });

    jwt.verify(token, "secret key", (err, user) => {
        if (err) return res.status(403).send({ message: "Unauthorized access. Invalid token." });

        req.user = user;
        next();
    });
};

module.exports = { authentificateToken };
