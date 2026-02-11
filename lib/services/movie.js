'use strict';

const { Service } = require('@hapipal/schmervice');
const Boom = require('@hapi/boom');

module.exports = class MovieService extends Service {
    async create(movie) {

        const { Movie, User } = this.server.models();
        const { mailService } = this.server.services();

        const newMovie = await Movie.query().insertAndFetch(movie);
        const users = await User.query();

        for (const user of users) {
            mailService.sendNewMovieNotification(user.mail, user.firstName, newMovie.title)
                .catch((err) => console.error(`Error sending new movie notification to ${user.mail}:`, err));
        }

        return newMovie;
    }

    getAll() {

        const { Movie } = this.server.models();
        return Movie.query();
    }

    async deleteById(id) {

        const { Movie } = this.server.models();

        const deletedCount = await Movie.query().deleteById(id);
        if (deletedCount === 0) {
            throw Boom.notFound('Movie not found');
        }

        return { success: true };
    }

    async update(id, movie) {

        const { Movie, Favorite } = this.server.models();
        const { mailService } = this.server.services();

        const updatedMovie = await Movie.query().patchAndFetchById(id, movie);

        if (!updatedMovie) {
            throw Boom.notFound('Movie not found');
        }

        const favorites = await Favorite.query()
            .where('movie_id', id)
            .withGraphFetched('user')
            .select();

        for (const favorite of favorites) {
            const user = favorite.user;
            mailService.sendMovieUpdateNotification(user.mail, user.firstName, updatedMovie.title)
                .catch((err) => console.error(`Error sending update notification to ${user.mail}`, err));
        }

        return updatedMovie;
    }
};
