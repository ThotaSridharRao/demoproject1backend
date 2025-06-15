// middleware/adminAuth.js

// This middleware assumes that the 'auth' middleware has already run
// and populated 'req.user' with the authenticated user's information.

module.exports = function(req, res, next) {
    // Check if req.user exists (meaning auth middleware ran) and if the user is an admin
    if (!req.user || !req.user.isAdmin) {
        // 403 Forbidden status if user is not an admin
        return res.status(403).json({ msg: 'Access denied: Admin privileges required' });
    }
    // If the user is an admin, proceed to the next middleware/route handler
    next();
};
