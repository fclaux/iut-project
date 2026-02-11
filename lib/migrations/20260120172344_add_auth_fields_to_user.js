'use strict';

module.exports = {

    async up(knex) {

        await knex.schema.alterTable('user', (table) => {

            table.string('mail').unique().notNullable();
            table.string('password').notNullable();
            table.string('username').unique().notNullable();
        });
    },

    async down(knex) {

        await knex.schema.alterTable('user', (table) => {

            table.dropColumn('mail');
            table.dropColumn('password');
            table.dropColumn('username');
        });
    }
};
