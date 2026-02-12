'use strict';

const Joi = require('joi');

module.exports = [
    {
        method: 'POST',
        path: '/movie/{id}/favorite',
        options: {
            auth: { scope: ['user', 'admin'] },
            tags: ['api'],
            description: 'Add a movie to favorites',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('Film ID to add to favorites')
                })
            }
        },
        handler: async (request, h) => {

            const { favoriteService } = request.services();
            const favorite = await favoriteService.add(request.auth.credentials.id, request.params.id);
            return h.response(favorite).code(201);
        }
    },
    {
        method: 'DELETE',
        path: '/movie/{id}/favorite',
        options: {
            auth: { scope: ['user', 'admin'] },
            tags: ['api'],
            description: 'Remove a movie from favorites',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().required().description('Film ID to remove from favorites')
                })
            }
        },
        handler: async (request, h) => {

            const { favoriteService } = request.services();
            await favoriteService.delete(request.auth.credentials.id, request.params.id);
            return h.response().code(204);
        }
    }
];
