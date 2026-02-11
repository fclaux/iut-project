'use strict';

const Joi = require('joi');
const { Model } = require('@hapipal/schwifty');

module.exports = class Favorite extends Model {

    static get tableName() {

        return 'favorite';
    }

    static get idColumn() {

        return ['user_id', 'movie_id'];
    }

    static get joiSchema() {

        return Joi.object({
            user_id: Joi.number().integer().required(),
            movie_id: Joi.number().integer().required()
        });
    }

    static get relationMappings() {

        const User = require('./user');
        const Movie = require('./movie');

        return {
            user: {
                relation: Model.BelongsToOneRelation,
                modelClass: User,
                join: {
                    from: 'favorite.user_id',
                    to: 'user.id'
                }
            },

            movie: {
                relation: Model.BelongsToOneRelation,
                modelClass: Movie,
                join: {
                    from: 'favorite.movie_id',
                    to: 'movie.id'
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
