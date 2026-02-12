'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');
const Argon2 = require('argon2');
const Jwt = require('@hapi/jwt');

module.exports = class UserService extends Service {
    async create(user) {

        const { User } = this.server.models();
        const { mailService } = this.server.services();

        const existingUser = await User.query().findOne({ mail: user.mail });
        if (existingUser) {
            throw Boom.conflict('This email is already registered');
        }

        user.password = await Argon2.hash(user.password);

        const createdUser = await User.query().insertAndFetch(user);

        delete createdUser.password;

        await mailService.sendWelcome(createdUser.mail, createdUser.firstName)
            .catch((err) => console.error('Error sending welcome email:', err));

        return createdUser;
    }

    getAll() {

        const { User } = this.server.models();
        return User.query().select('id', 'firstName', 'lastName', 'username', 'mail', 'role', 'createdAt', 'updatedAt');
    }

    deleteById(id) {

        const { User } = this.server.models();

        const deletedCount = User.query().deleteById(id);

        if (deletedCount === 0) {
            throw Boom.notFound('User not found');
        }

        return '';
    }

    async update(id, user) {

        const { User } = this.server.models();
        if (user.password) {
            user.password = await Argon2.hash(user.password);
        }

        const updatedUser = await User.query().patchAndFetchById(id, user);

        if (!updatedUser) {
            throw Boom.notFound('User not found');
        }

        delete updatedUser.password;

        return updatedUser;
    }

    async login(mail, password) {

        const { User } = this.server.models();
        const user = await User.query().findOne({ mail });

        if (!user) {
            throw Boom.unauthorized('Wrong email or password');
        }

        const isValid = await Argon2.verify(user.password, password);

        if (!isValid) {
            throw Boom.unauthorized('Wrong email or password');
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
                key: process.env.JWT_SECRET, // La clé qui est définit dans lib/auth/strategies/jwt.js
                algorithm: 'HS512'
            },
            {
                ttlSec: 14400 // 4 hours
            }
        );

        return { login: 'successful', token };
    }
};
