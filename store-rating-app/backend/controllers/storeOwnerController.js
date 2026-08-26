const { fn, col } = require('sequelize');
const { Store, Rating, User } = require('../models');

// GET /api/store-owner/dashboard
// Shows the logged-in Store Owner's own store: raters + average rating.
exports.dashboard = async (req, res) => {
  try {
    const store = await Store.findOne({ where: { owner_id: req.user.id } });
    if (!store) {
      return res.status(404).json({ message: 'No store is associated with this account yet' });
    }

    const ratings = await Rating.findAll({
      where: { store_id: store.id },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'address'] }],
      order: [['updated_at', 'DESC']],
    });

    const avgResult = await Rating.findOne({
      where: { store_id: store.id },
      attributes: [[fn('AVG', col('value')), 'avgRating']],
      raw: true,
    });

    res.json({
      store: { id: store.id, name: store.name, email: store.email, address: store.address },
      averageRating: avgResult?.avgRating ? Number(avgResult.avgRating).toFixed(2) : null,
      totalRatings: ratings.length,
      raters: ratings.map((r) => ({
        ratingId: r.id,
        value: r.value,
        submittedAt: r.updated_at,
        user: r.user,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};
