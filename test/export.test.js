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

describe('Export Routes', () => {

    let server;
    let adminToken;
    let userToken;

    before(async () => {

        server = await Server.deployment();

        const userRes = await server.inject({
            method: 'POST',
            url: '/user',
            payload: {
                firstName: 'Export',
                lastName: 'Tester',
                username: `exporttester${Date.now()}`,
                mail: `exporttester${Date.now()}@example.com`,
                password: 'password123'
            }
        });

        const userId = userRes.result.id;
        adminToken = generateToken({ id: userId, firstName: 'Export', lastName: 'Tester', mail: userRes.result.mail, role: 'admin' });
        userToken = generateToken({ id: userId, firstName: 'Export', lastName: 'Tester', mail: userRes.result.mail, role: 'user' });
    });

    after(async () => {

        await server.stop();
    });

    describe('GET /export/movies', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/export/movies'
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/export/movies',
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should return 202 for admin (requires RabbitMQ)', { skip: !process.env.RABBITMQ_ENABLED }, async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/export/movies',
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(202);
            expect(res.result.message).to.include('Export process started');
        });
    });
});
