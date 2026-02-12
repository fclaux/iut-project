'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const Server = require('../server');
const Jwt = require('@hapi/jwt');

const { describe, it, before, after } = exports.lab = Lab.script();
const { expect } = Code;

const generateToken = (user) => {

    return Jwt.token.generate(
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
            key: process.env.JWT_SECRET,
            algorithm: 'HS512'
        },
        {
            ttlSec: 14400
        }
    );
};

describe('User Routes', () => {

    let server;
    let adminToken;
    let userToken;
    let createdUserId;
    const timestamp = Date.now();

    before(async () => {

        server = await Server.deployment();

        const adminRes = await server.inject({
            method: 'POST',
            url: '/user',
            payload: {
                firstName: 'Admin',
                lastName: 'User',
                username: `admin${timestamp}`,
                mail: `admin${timestamp}@example.com`,
                password: 'password123'
            }
        });

        adminToken = generateToken({
            id: adminRes.result.id,
            firstName: 'Admin',
            lastName: 'User',
            mail: adminRes.result.mail,
            role: 'admin'
        });

        const userRes = await server.inject({
            method: 'POST',
            url: '/user',
            payload: {
                firstName: 'Regular',
                lastName: 'User',
                username: `user${timestamp}`,
                mail: `user${timestamp}@example.com`,
                password: 'password123'
            }
        });

        userToken = generateToken({
            id: userRes.result.id,
            firstName: 'Regular',
            lastName: 'User',
            mail: userRes.result.mail,
            role: 'user'
        });
    });

    after(async () => {

        await server.stop();
    });

    describe('POST /user', () => {

        it('should create a new user and return 201', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'John',
                    lastName: 'Doe',
                    username: `johndoe${Date.now()}`,
                    mail: `johndoe${Date.now()}@example.com`,
                    password: 'password123'
                }
            });

            expect(res.statusCode).to.equal(201);
            expect(res.result).to.include(['id', 'firstName', 'lastName', 'username', 'mail']);
            expect(res.result.password).to.not.exist();
            createdUserId = res.result.id;
        });

        it('should return 400 for invalid payload', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'Jo',
                    lastName: 'Doe',
                    username: `invalid${Date.now()}`,
                    mail: 'invalid-email',
                    password: 'short'
                }
            });

            expect(res.statusCode).to.equal(400);
        });

        it('should return 409 for duplicate email', async () => {

            const email = `duplicate${Date.now()}@example.com`;

            await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'John',
                    lastName: 'Doe',
                    username: `dup1${Date.now()}`,
                    mail: email,
                    password: 'password123'
                }
            });

            const res = await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'Jane',
                    lastName: 'Doe',
                    username: `dup2${Date.now()}`,
                    mail: email,
                    password: 'password123'
                }
            });

            expect(res.statusCode).to.equal(409);
        });
    });

    describe('GET /users', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/users'
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return all users with valid token', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/users',
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array();
        });
    });

    describe('PATCH /user/{id}', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/user/${createdUserId}`,
                payload: {
                    firstName: 'Updated'
                }
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/user/${createdUserId}`,
                payload: {
                    firstName: 'Updated'
                },
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should update user with admin token', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/user/${createdUserId}`,
                payload: {
                    firstName: 'UpdatedName'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result.firstName).to.equal('UpdatedName');
        });

        it('should return 404 for non-existing user', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: '/user/99999',
                payload: {
                    firstName: 'Test'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(404);
        });
    });

    describe('POST /user/login', () => {

        let loginEmail;
        const loginPassword = 'password123';

        before(async () => {

            loginEmail = `login${Date.now()}@example.com`;

            await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'Login',
                    lastName: 'Test',
                    username: `logintest${Date.now()}`,
                    mail: loginEmail,
                    password: loginPassword
                }
            });
        });

        it('should return token on valid credentials', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    mail: loginEmail,
                    password: loginPassword
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result.token).to.be.a.string();
        });

        it('should return 401 for wrong password', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    mail: loginEmail,
                    password: 'wrongpassword'
                }
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 401 for non-existing email', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user/login',
                payload: {
                    mail: 'nonexisting@example.com',
                    password: 'password123'
                }
            });

            expect(res.statusCode).to.equal(401);
        });
    });

    describe('DELETE /user/{id}', () => {

        let userToDeleteId;

        before(async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/user',
                payload: {
                    firstName: 'ToDelete',
                    lastName: 'User',
                    username: `todelete${Date.now()}`,
                    mail: `todelete${Date.now()}@example.com`,
                    password: 'password123'
                }
            });

            userToDeleteId = res.result.id;
        });

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/user/${userToDeleteId}`
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/user/${userToDeleteId}`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should delete user with admin token and return 204', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/user/${userToDeleteId}`,
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(204);
        });
    });
});
