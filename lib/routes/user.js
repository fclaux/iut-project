'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');

module.exports = [
    {
        method: 'post',
        path: '/user',
        options: {
            auth: false,
            description: 'Create a user',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    firstName: Joi.string().required().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().required().min(3).example('Doe').description('Lastname of the user'),
                    username: Joi.string().required().example('johndoe').description('Username of the user'),
                    mail: Joi.string().email().required().example('johndoe@example.com').description('Email of the user'),
                    password: Joi.string().min(8).required().example('password123').description('Password of the user')
                })
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();

            return await userService.create(request.payload);
        }
    },
    {
        method: 'get',
        path: '/users',
        options: {
            auth: {
                scope: ['admin', 'user']
            },
            tags: ['api'],
            description: 'Get all users'
        },
        handler: async (request, h) => {

            const { userService } = request.services();
            return await userService.getAll();
        }
    },
    {
        method: 'delete',
        path: '/user/{id}',
        options: {
            auth: {
                scope: ['admin']
            },
            tags: ['api'],
            description: 'Delete a user by id',
            validate: {
                params: Joi.object({
                    id: Joi.number().integer().greater(0).required().example(1).description('ID of the user to delete')
                })
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();
            const deletedCount = await userService.deleteById(request.params.id);

            if (deletedCount === 0) {
                throw Boom.notFound('User not found');
            }

            return '';
        }
    },
    {
        method: 'patch',
        path: '/user/{id}',
        options: {
            tags: ['api'],
            auth: {
                scope: ['admin']
            },
            description: 'Modify a user by id',
            validate: {
                params: Joi.object({ id: Joi.number().integer().required() }),
                payload: Joi.object({
                    firstName: Joi.string().min(3).example('John').description('Firstname of the user'),
                    lastName: Joi.string().min(3).example('Doe').description('Lastname of the user'),
                    username: Joi.string().example('johndoe').description('Username of the user'),
                    mail: Joi.string().email().example('johndoe@example.com').description('Email of the user'),
                    password: Joi.string().min(8).example('password123').description('Password of the user'),
                    role: Joi.string().valid('admin', 'user').example('admin').description('Role of the user')
                }).min(1)
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();
            return await userService.update(request.params.id, request.payload);
        }
    },
    {
        method: 'post',
        path: '/user/login',
        options: {
            auth: false,
            description: 'Login a user',
            tags: ['api'],
            validate: {
                payload: Joi.object({
                    mail: Joi.string().email().example('johndoe@example.com').description('Email of the user').required(),
                    password: Joi.string().example('password123').description('Password of the user').required()
                })
            }
        },
        handler: async (request, h) => {

            const { userService } = request.services();
            const user = await userService.login(request.payload.mail, request.payload.password);

            if (!user) {
                throw Boom.unauthorized('Invalid mail or password');
            }

            return user;
        }
    }
];
