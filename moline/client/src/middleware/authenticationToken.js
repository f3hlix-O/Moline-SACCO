const jwt = require('jsonwebtoken');
const secretKey = 'Vv2N9SCG8RncrDGvfOYlFkaRpm25MA3mRaSCtjPcke4='; 

function authenticateToken(req, res, next) {
    const token = req.cookies.sessionToken;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, secretKey);
        req.userId = decoded.userId;
        next();
    } catch (err) {
        console.error('Error verifying token:', err);
        return res.status(401).json({ error: 'Unauthorized' });
    }
}

module.exports = authenticateToken;