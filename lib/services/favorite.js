'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');

module.exports = class FavoriteService extends Service {

    async add(userId, movieId) {

        const { Movie, Favorite } = this.server.models();

        const movie = await Movie.query().findById(movieId);
        if (!movie) {
            throw Boom.notFound('This movie does not exist');
        }

        const exists = await Favorite.query().findOne({ user_id: userId, movie_id: movieId });

        if (exists) {
            throw Boom.conflict('Already in favorites');
        }

        await Favorite.query().insert({
            user_id: userId,
            movie_id: movieId
        });

        return { success: true };
    }

    async delete(userId, movieId) {

        const { Favorite } = this.server.models();
        const deletedCount = await Favorite.query().delete().where({ user_id: userId, movie_id: movieId });

        if (deletedCount === 0) {
            throw Boom.notFound('Favorite not found');
        }

        return { success: true };
    }
};
