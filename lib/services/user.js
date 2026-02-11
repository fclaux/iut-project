'use strict';

const { Service } = require('@hapipal/schmervice');
const Argon2 = require('argon2');
const Jwt = require('@hapi/jwt');

module.exports = class UserService extends Service {
    async create(user) {

        const { User } = this.server.models();

        user.password = await Argon2.hash(user.password);
        return User.query().insertAndFetch(user);
    }

    getAll() {

        const { User } = this.server.models();
        return User.query();
    }

    deleteById(id) {

        const { User } = this.server.models();

        return User.query().deleteById(id);
    }

    async update(id, user) {

        const { User } = this.server.models();
        if (user.password) {
            user.password = await Argon2.hash(user.password);
        }

        return User.query().findById(id).patch(user);
    }

    async login(mail, password) {

        const { User } = this.server.models();
        const user = await User.query().findOne({ mail });

        if (!user) {
            return null;
        }

        const isValid = await Argon2.verify(user.password, password);

        if (!isValid) {
            return null;
        }

        const token = Jwt.token.generate(
            {
                aud: 'urn:audience:iut',
                iss: 'urn:issuer:iut',
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.mail,
                scope: user.role
            },
            {
                key: 'random_string', // La clé qui est définit dans lib/auth/strategies/jwt.js
                algorithm: 'HS512'
            },
            {
                ttlSec: 14400 // 4 hours
            }
        );

        return { login: 'successful', token };
    }
};
