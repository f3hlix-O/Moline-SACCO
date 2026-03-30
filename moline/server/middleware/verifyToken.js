const jwt = require('jsonwebtoken');
const secretKey = 'Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4='; 

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        console.log('unauthorized');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.userId = decoded.user_id;
        next();
    });
};

module.exports = verifyToken;