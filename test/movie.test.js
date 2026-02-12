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

describe('Movie Routes', () => {

    let server;
    let adminToken;
    let userToken;
    let createdMovieId;

    before(async () => {

        server = await Server.deployment();

        const userRes = await server.inject({
            method: 'POST',
            url: '/user',
            payload: {
                firstName: 'Movie',
                lastName: 'Tester',
                username: `movietester${Date.now()}`,
                mail: `movietester${Date.now()}@example.com`,
                password: 'password123'
            }
        });

        const userId = userRes.result.id;
        adminToken = generateToken({ id: userId, firstName: 'Movie', lastName: 'Tester', mail: userRes.result.mail, role: 'admin' });
        userToken = generateToken({ id: userId, firstName: 'Movie', lastName: 'Tester', mail: userRes.result.mail, role: 'user' });
    });

    after(async () => {

        await server.stop();
    });

    describe('POST /movie', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: 'Inception',
                    description: 'A mind-bending thriller',
                    releaseDate: '2010-07-16',
                    director: 'Christopher Nolan'
                }
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: 'Inception',
                    description: 'A mind-bending thriller',
                    releaseDate: '2010-07-16',
                    director: 'Christopher Nolan'
                },
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should create movie with admin token and return 201', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: `Inception ${Date.now()}`,
                    description: 'A mind-bending thriller about dreams within dreams.',
                    releaseDate: '2010-07-16',
                    director: 'Christopher Nolan'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(201);
            expect(res.result).to.include(['id', 'title', 'description', 'director']);
            createdMovieId = res.result.id;
        });

        it('should return 400 for invalid payload', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: '',
                    description: 'A movie',
                    releaseDate: 'invalid-date',
                    director: 'AB'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(400);
        });
    });

    describe('GET /movies', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/movies'
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return all movies with user token', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/movies',
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array();
        });

        it('should return all movies with admin token', async () => {

            const res = await server.inject({
                method: 'GET',
                url: '/movies',
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result).to.be.an.array();
        });
    });

    describe('PATCH /movie/{id}', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/movie/${createdMovieId}`,
                payload: {
                    title: 'Updated Title'
                }
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/movie/${createdMovieId}`,
                payload: {
                    title: 'Updated Title'
                },
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should update movie with admin token', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/movie/${createdMovieId}`,
                payload: {
                    title: 'Updated Inception'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(200);
            expect(res.result.title).to.equal('Updated Inception');
        });

        it('should return 404 for non-existing movie', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: '/movie/99999',
                payload: {
                    title: 'Test'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(404);
        });

        it('should return 400 for empty payload', async () => {

            const res = await server.inject({
                method: 'PATCH',
                url: `/movie/${createdMovieId}`,
                payload: {},
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(400);
        });
    });

    describe('DELETE /movie/{id}', () => {

        let movieToDeleteId;

        before(async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: `ToDelete ${Date.now()}`,
                    description: 'Movie to be deleted',
                    releaseDate: '2020-01-01',
                    director: 'Test Director'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            movieToDeleteId = res.result.id;
        });

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToDeleteId}`
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should return 403 for non-admin user', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToDeleteId}`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(403);
        });

        it('should delete movie with admin token and return 204', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToDeleteId}`,
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(204);
        });

        it('should return 404 for non-existing movie', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: '/movie/99999',
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(404);
        });
    });
});
