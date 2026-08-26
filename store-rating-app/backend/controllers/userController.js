const { Op } = require('sequelize');
const { Store, Rating } = require('../models');
const { validateRatingValue } = require('../utils/validators');

// GET /api/stores?name=&address=  (Normal user browses/searches stores)
exports.listStoresForUser = async (req, res) => {
  try {
    const { name, address } = req.query;
    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const stores = await Store.findAll({ where, include: [{ model: Rating, as: 'ratings' }] });

    const results = stores.map((s) => {
      const json = s.toJSON();
      const ratings = json.ratings || [];
      const overallRating = ratings.length
        ? (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length).toFixed(2)
        : null;
      const userRating = ratings.find((r) => r.user_id === req.user.id);
      return {
        id: json.id,
        name: json.name,
        address: json.address,
        overallRating,
        userSubmittedRating: userRating ? userRating.value : null,
      };
    });

    res.json({ stores: results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list stores', error: err.message });
  }
};

// POST /api/stores/:storeId/ratings   body: { value }
// Creates or updates (modifies) the logged-in user's rating for a store.
exports.submitRating = async (req, res) => {
  try {
    const { storeId } = req.params;
    const { value } = req.body;

    const error = validateRatingValue(value);
    if (error) return res.status(400).json({ errors: { value: error } });

    const store = await Store.findByPk(storeId);
    if (!store) return res.status(404).json({ message: 'Store not found' });

    const [rating, created] = await Rating.findOrCreate({
      where: { user_id: req.user.id, store_id: storeId },
      defaults: { value: Number(value) },
    });

    if (!created) {
      rating.value = Number(value);
      await rating.save();
    }

    res.status(created ? 201 : 200).json({
      message: created ? 'Rating submitted' : 'Rating updated',
      rating,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit rating', error: err.message });
  }
};
