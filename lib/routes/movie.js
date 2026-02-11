'use strict';

const Joi = require('joi');
const Amqp = require('amqplib');

module.exports = [
    {
        method: 'post',
        path: '/movie',
        options: {
            auth: {
                scope: ['admin']
            },
            description: 'Create a movie',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    title: Joi.string().required().min(1).example('Inception').description('Title of the movie'),
                    description: Joi.string().required().min(1).example('A mind-bending thriller about dreams within dreams.').description('Description of the movie'),
                    releaseDate: Joi.date().required().example('2010-07-16').description('Release date of the movie'),
                    director: Joi.string().required().min(3).example('Christopher Nolan').description('Director of the movie')
                })
            }
        },
        handler: async (request, h) => {

            const { movieService } = request.services();
            return await movieService.create(request.payload);
        }
    },
    {
        method: 'get',
        path: '/movies',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api'],
            description: 'Get all movies'
        },
        handler: async (request, h) => {

            const { movieService } = request.services();
            return await movieService.getAll();
        }
    },
    {
        method: 'delete',
        path: '/movie/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            description: 'Delete a movie by id',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().greater(0).required().example(1).description('ID of the movie to delete')
                })
            }
        },
        handler: async (request, h) => {

            const { movieService } = request.services();
            return await movieService.deleteById(request.params.id);
        }
    },
    {
        method: 'patch',
        path: '/movie/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            description: 'Modify a movie by id',
            validate: {
                params: Joi.object({ id: Joi.number().integer().required() }),
                payload: Joi.object({
                    title: Joi.string().min(1).example('Inception').description('Title of the movie'),
                    description: Joi.string().min(1).example('A mind-bending thriller about dreams within dreams.').description('Description of the movie'),
                    releaseDate: Joi.date().example('2010-07-16').description('Release date of the movie'),
                    director: Joi.string().min(3).example('Christopher Nolan').description('Director of the movie')
                }).min(1)
            }
        },
        handler: async (request, h) => {

            const { movieService } = request.services();
            return await movieService.update(request.params.id, request.payload);
        }
    },
    {
        method: 'GET',
        path: '/movie/export',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            description: 'Export movies list (async with RabbitMQ)'
        },
        handler: async (request, h) => {

            const connection = await Amqp.connect(process.env.AMQP_URL || 'amqp://localhost');
            const channel = await connection.createChannel();
            const queue = 'export_films_queue';

            await channel.assertQueue(queue, { durable: true });

            const message = JSON.stringify({
                email: request.auth.credentials.mail
            });

            channel.sendToQueue(queue, Buffer.from(message));
            console.log('Message send to RabbitMQ', message);

            return h.response({ message: 'Export in progress. You will receive an email shortly.' }).code(202);
        }
    }
];
