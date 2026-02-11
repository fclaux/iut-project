'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class Movie extends Model {

    static get tableName() {

        return 'movie';
    }

    static get joiSchema() {

        return Joi.object({
            id: Joi.number().integer().greater(0),
            title: Joi.string().min(1).example('Inception').description('Title of the movie'),
            description: Joi.string().example('A mind-bending thriller about dreams within dreams.').description('Description of the movie'),
            releaseDate: Joi.date().example('2010-07-16').description('Release date of the movie'),
            director: Joi.string().min(3).example('Christopher Nolan').description('Director of the movie'),
            createdAt: Joi.date(),
            updatedAt: Joi.date()
        });
    }

    static get relationMappings() {

        const Favorite = require('./favorite');

        return {
            favoritedBy: {
                relation: Model.HasManyRelation,
                modelClass: Favorite,
                join: {
                    from: 'movie.id',
                    to: 'favorite.movie_id'
                }
            }
        };
    }

    $beforeInsert(queryContext) {

        this.updatedAt = new Date();
        this.createdAt = this.updatedAt;
    }

    $beforeUpdate(opt, queryContext) {

        this.updatedAt = new Date();
    }

};
