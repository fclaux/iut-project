'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.createTable('favorite', (table) => {

            table.integer('user_id').unsigned().notNull().references('id').inTable('user').onDelete('CASCADE');
            table.integer('movie_id').unsigned().notNull().references('id').inTable('movie').onDelete('CASCADE');

            table.dateTime('createdAt').notNull().defaultTo(knex.fn.now());
            table.dateTime('updatedAt').notNull().defaultTo(knex.fn.now());

            table.primary(['user_id', 'movie_id']);
        });
    },

    async down(knex) {

        await knex.schema.dropTableIfExists('favorite');
    }
};
