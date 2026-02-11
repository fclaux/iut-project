'use strict';

const { Service } = require('@hapipal/schmervice');

module.exports = class MovieService extends Service {
    async create(movie) {

        const { Movie, User } = this.server.models();
        const { mailService } = this.server.services();

        const newMovie = await Movie.query().insertAndFetch(movie);
        const users = await User.query();

        for (const user of users) {
            mailService.sendNewMovieNotification(user.mail, user.firstName, newMovie.title);
        }

        return newMovie;
    }

    getAll() {

        const { Movie } = this.server.models();
        return Movie.query();
    }

    deleteById(id) {

        const { Movie } = this.server.models();

        return Movie.query().deleteById(id);
    }

    update(id, movie) {

        const { Movie } = this.server.models();

        return Movie.query().findById(id).patch(movie);
    }
};
