const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { jwtSecret, jwtExpiresIn } = require('../config');

function toUserDTO(userDoc) {
    if (!userDoc) return null;
    const { _id, email, name, role, createdAt } = userDoc;
    return { id: _id.toString(), email, name, role, createdAt };
}

module.exports = {
    Query: {
        me: async (_, __, { user }) => {
            return user ? toUserDTO(user) : null;
        }
    },
    Mutation: {
        register: async (_, { email, password, name }) => {
            const existing = await User.findOne({ email });
            if (existing) throw new Error('Email already in use');
            const passwordHash = await bcrypt.hash(password, 10);
            const user = await User.create({ email, passwordHash, name });
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user) throw new Error('Invalid credentials');
            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) throw new Error('Invalid credentials');
            const token = jwt.sign({ sub: user._id.toString() }, jwtSecret, { expiresIn: jwtExpiresIn });
            return { token, user: toUserDTO(user) };
        }
    }
};
