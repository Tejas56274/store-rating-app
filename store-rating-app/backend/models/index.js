const sequelize = require('../config/db');
const User = require('./User');
const Store = require('./Store');
const Rating = require('./Rating');

// A user (Store Owner) owns one store; a store belongs to one owner user.
User.hasOne(Store, { foreignKey: 'owner_id', as: 'ownedStore' });
Store.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// A user can submit many ratings; a rating belongs to one user.
User.hasMany(Rating, { foreignKey: 'user_id', as: 'ratings' });
Rating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// A store can have many ratings; a rating belongs to one store.
Store.hasMany(Rating, { foreignKey: 'store_id', as: 'ratings' });
Rating.belongsTo(Store, { foreignKey: 'store_id', as: 'store' });

module.exports = { sequelize, User, Store, Rating };
