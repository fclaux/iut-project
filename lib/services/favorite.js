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

        return await Favorite.query().insertAndFetch({
            user_id: userId,
            movie_id: movieId
        });
    }

    async delete(userId, movieId) {

        const { Favorite } = this.server.models();
        const deletedCount = await Favorite.query().deleteById([userId, movieId]);

        if (deletedCount === 0) {
            throw Boom.notFound('Favorite not found');
        }

        return '';
    }
};
