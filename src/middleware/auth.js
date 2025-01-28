const { User } = require('../models');

exports.isAdmin = async (req, res, next) => {
  const { userId } = req.headers;

  try {
    const user = await User.findByPk(userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
