const bcrypt = require('bcryptjs');
const { Op, fn, col } = require('sequelize');
const { User, Store, Rating, sequelize } = require('../models');
const {
  validateName,
  validateAddress,
  validateEmail,
  validatePassword,
  collectErrors,
} = require('../utils/validators');

const SORTABLE_USER_FIELDS = ['name', 'email', 'address', 'role'];
const SORTABLE_STORE_FIELDS = ['name', 'email', 'address', 'rating'];

function sortParams(field, dir, allowed, fallback) {
  const column = allowed.includes(field) ? field : fallback;
  const direction = String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  return [column, direction];
}

// GET /api/admin/dashboard
exports.dashboard = async (req, res) => {
  try {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      User.count(),
      Store.count(),
      Rating.count(),
    ]);
    res.json({ totalUsers, totalStores, totalRatings });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load dashboard', error: err.message });
  }
};

// POST /api/admin/users  (create Admin or Normal User; Store Owners are usually
// created via POST /api/admin/stores, but role STORE_OWNER is allowed here too)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, address, role } = req.body;

    const errors = collectErrors([
      ['name', validateName(name)],
      ['email', validateEmail(email)],
      ['password', validatePassword(password)],
      ['address', validateAddress(address)],
    ]);
    if (errors) return res.status(400).json({ errors });

    const allowedRoles = ['ADMIN', 'NORMAL_USER', 'STORE_OWNER'];
    const finalRole = allowedRoles.includes(role) ? role : 'NORMAL_USER';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, address, role: finalRole });

    const { password: _pw, ...safeUser } = user.toJSON();
    res.status(201).json({ user: safeUser });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create user', error: err.message });
  }
};

// GET /api/admin/users?name=&email=&address=&role=&sortBy=&sortDir=
exports.listUsers = async (req, res) => {
  try {
    const { name, email, address, role, sortBy, sortDir } = req.query;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };
    if (role) where.role = role;

    const [column, direction] = sortParams(sortBy, sortDir, SORTABLE_USER_FIELDS, 'name');

    const users = await User.findAll({
      where,
      attributes: { exclude: ['password'] },
      order: [[column, direction]],
      include: [{ model: Store, as: 'ownedStore', attributes: ['id', 'name'] }],
    });

    // For Store Owners, attach their store's average rating
    const results = await Promise.all(
      users.map(async (u) => {
        const json = u.toJSON();
        if (json.role === 'STORE_OWNER' && json.ownedStore) {
          const avg = await Rating.findOne({
            where: { store_id: json.ownedStore.id },
            attributes: [[fn('AVG', col('value')), 'avgRating']],
            raw: true,
          });
          json.rating = avg?.avgRating ? Number(avg.avgRating).toFixed(2) : null;
        }
        return json;
      })
    );

    res.json({ users: results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list users', error: err.message });
  }
};

// GET /api/admin/users/:id
exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Store, as: 'ownedStore' }],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const json = user.toJSON();
    if (json.role === 'STORE_OWNER' && json.ownedStore) {
      const avg = await Rating.findOne({
        where: { store_id: json.ownedStore.id },
        attributes: [[fn('AVG', col('value')), 'avgRating']],
        raw: true,
      });
      json.rating = avg?.avgRating ? Number(avg.avgRating).toFixed(2) : null;
    }

    res.json({ user: json });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

// POST /api/admin/stores  (optionally create the owner account at the same time)
exports.createStore = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, email, address, owner } = req.body;
    // owner (optional): { name, email, password, address } -> creates a STORE_OWNER user

    const storeErrors = collectErrors([
      ['name', validateName(name)],
      ['email', validateEmail(email)],
      ['address', validateAddress(address)],
    ]);
    if (storeErrors) {
      await t.rollback();
      return res.status(400).json({ errors: storeErrors });
    }

    const existingStore = await Store.findOne({ where: { email } });
    if (existingStore) {
      await t.rollback();
      return res.status(409).json({ message: 'A store with this email already exists' });
    }

    let ownerId = null;
    if (owner && owner.email) {
      const ownerErrors = collectErrors([
        ['owner.name', validateName(owner.name)],
        ['owner.email', validateEmail(owner.email)],
        ['owner.password', validatePassword(owner.password)],
        ['owner.address', validateAddress(owner.address)],
      ]);
      if (ownerErrors) {
        await t.rollback();
        return res.status(400).json({ errors: ownerErrors });
      }

      const existingOwner = await User.findOne({ where: { email: owner.email } });
      if (existingOwner) {
        await t.rollback();
        return res.status(409).json({ message: 'An account with the owner email already exists' });
      }

      const hashed = await bcrypt.hash(owner.password, 10);
      const ownerUser = await User.create(
        {
          name: owner.name,
          email: owner.email,
          password: hashed,
          address: owner.address,
          role: 'STORE_OWNER',
        },
        { transaction: t }
      );
      ownerId = ownerUser.id;
    }

    const store = await Store.create({ name, email, address, owner_id: ownerId }, { transaction: t });
    await t.commit();

    res.status(201).json({ store });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: 'Failed to create store', error: err.message });
  }
};

// GET /api/admin/stores?name=&email=&address=&sortBy=&sortDir=
exports.listStores = async (req, res) => {
  try {
    const { name, email, address, sortBy, sortDir } = req.query;

    const where = {};
    if (name) where.name = { [Op.iLike]: `%${name}%` };
    if (email) where.email = { [Op.iLike]: `%${email}%` };
    if (address) where.address = { [Op.iLike]: `%${address}%` };

    const stores = await Store.findAll({ where, include: [{ model: Rating, as: 'ratings' }] });

    let results = stores.map((s) => {
      const json = s.toJSON();
      const ratings = json.ratings || [];
      const avg = ratings.length
        ? (ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length).toFixed(2)
        : null;
      delete json.ratings;
      return { ...json, rating: avg };
    });

    const [column, direction] = sortParams(sortBy, sortDir, SORTABLE_STORE_FIELDS, 'name');
    results.sort((a, b) => {
      let av = a[column] ?? '';
      let bv = b[column] ?? '';
      if (column === 'rating') {
        av = av === null ? -1 : Number(av);
        bv = bv === null ? -1 : Number(bv);
      } else {
        av = String(av).toLowerCase();
        bv = String(bv).toLowerCase();
      }
      if (av < bv) return direction === 'ASC' ? -1 : 1;
      if (av > bv) return direction === 'ASC' ? 1 : -1;
      return 0;
    });

    res.json({ stores: results });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list stores', error: err.message });
  }
};
