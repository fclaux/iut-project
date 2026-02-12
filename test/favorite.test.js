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

describe('Favorite Routes', () => {

    let server;
    let adminToken;
    let userToken;
    let userId;
    let movieId;

    before(async () => {

        server = await Server.deployment();

        const userRes = await server.inject({
            method: 'POST',
            url: '/user',
            payload: {
                firstName: 'Favorite',
                lastName: 'Tester',
                username: `favtester${Date.now()}`,
                mail: `favtester${Date.now()}@example.com`,
                password: 'password123'
            }
        });

        userId = userRes.result.id;
        adminToken = generateToken({ id: userId, firstName: 'Favorite', lastName: 'Tester', mail: userRes.result.mail, role: 'admin' });
        userToken = generateToken({ id: userId, firstName: 'Favorite', lastName: 'Tester', mail: userRes.result.mail, role: 'user' });

        const movieRes = await server.inject({
            method: 'POST',
            url: '/movie',
            payload: {
                title: `FavoriteTest ${Date.now()}`,
                description: 'A movie for favorite testing',
                releaseDate: '2020-01-01',
                director: 'Test Director'
            },
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        movieId = movieRes.result.id;
    });

    after(async () => {

        await server.stop();
    });

    describe('POST /movie/{id}/favorite', () => {

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'POST',
                url: `/movie/${movieId}/favorite`
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should add movie to favorites with user token and return 201', async () => {

            const res = await server.inject({
                method: 'POST',
                url: `/movie/${movieId}/favorite`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(201);
            expect(res.result).to.include(['user_id', 'movie_id']);
        });

        it('should return 409 when adding already favorited movie', async () => {

            const res = await server.inject({
                method: 'POST',
                url: `/movie/${movieId}/favorite`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(409);
        });

        it('should return 404 for non-existing movie', async () => {

            const res = await server.inject({
                method: 'POST',
                url: '/movie/99999/favorite',
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(404);
        });

        it('should add favorite with admin token', async () => {

            const movieRes = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: `AdminFav ${Date.now()}`,
                    description: 'Admin favorite test movie',
                    releaseDate: '2021-01-01',
                    director: 'Admin Director'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            const res = await server.inject({
                method: 'POST',
                url: `/movie/${movieRes.result.id}/favorite`,
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            expect(res.statusCode).to.equal(201);
        });
    });

    describe('DELETE /movie/{id}/favorite', () => {

        let movieToUnfavoriteId;

        before(async () => {

            const movieRes = await server.inject({
                method: 'POST',
                url: '/movie',
                payload: {
                    title: `ToUnfavorite ${Date.now()}`,
                    description: 'Movie to unfavorite',
                    releaseDate: '2022-01-01',
                    director: 'Unfavorite Director'
                },
                headers: {
                    authorization: `Bearer ${adminToken}`
                }
            });

            movieToUnfavoriteId = movieRes.result.id;

            await server.inject({
                method: 'POST',
                url: `/movie/${movieToUnfavoriteId}/favorite`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });
        });

        it('should return 401 without authentication', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToUnfavoriteId}/favorite`
            });

            expect(res.statusCode).to.equal(401);
        });

        it('should remove movie from favorites and return 204', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToUnfavoriteId}/favorite`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(204);
        });

        it('should return 404 when removing non-favorited movie', async () => {

            const res = await server.inject({
                method: 'DELETE',
                url: `/movie/${movieToUnfavoriteId}/favorite`,
                headers: {
                    authorization: `Bearer ${userToken}`
                }
            });

            expect(res.statusCode).to.equal(404);
        });
    });
});
