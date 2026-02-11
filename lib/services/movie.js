'use strict';

const { Service } = require('@hapipal/schmervice');

module.exports = class MovieService extends Service {
    create(movie) {

        const { Movie } = this.server.models();

        return Movie.query().insertAndFetch(movie);
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
