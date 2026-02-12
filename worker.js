'use strict';

require('dotenv').config();

const Amqp = require('amqplib');
const Knex = require('knex');
const { Model } = require('objection');
const KnexConfig = require('./knexfile');
const Movie = require('./lib/models/movie');
const Nodemailer = require('nodemailer');
const { stringify } = require('csv-stringify/sync');
const { formatDateTime, formatDateOnly } = require('./lib/utils/date');

const knex = Knex(KnexConfig);
Model.knex(knex);

const transporter = Nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const startWorker = async () => {

    const queue = 'export_movies';

    try {
        const connection = await Amqp.connect(process.env.AMQP_URL);
        const channel = await connection.createChannel();

        await channel.assertQueue(queue, { durable: false });

        console.log('Worker waiting for messages in %s.', queue);

        channel.consume(queue, async (msg) => {

            const content = JSON.parse(msg.content.toString());
            const adminEmail = content.email;

            console.log('Received request for:', adminEmail);

            try {
                const movies = await Movie.query();

                const csvData = movies.map((m) => ({
                    title: m.title,
                    description: m.description,
                    releaseDate: formatDateOnly(m.releaseDate),
                    director: m.director,
                    createdAt: formatDateTime(m.createdAt),
                    updatedAt: formatDateTime(m.updatedAt)
                }));

                const csvString = stringify(csvData, { header: true });

                await transporter.sendMail({
                    from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
                    to: adminEmail,
                    subject: 'Export CSV de vos films',
                    text: 'Voici l\'export de vos films au format CSV.',
                    attachments: [
                        {
                            filename: 'movies.csv',
                            content: csvString,
                            contentType: 'text/csv'
                        }
                    ]
                });

                console.log('Email sent to', adminEmail);

                channel.ack(msg);

            }
            catch (error) {
                console.error('Error processing export:', error);
            }
        });
    }
    catch (err) {
        console.error('Worker Error:', err);
    }
};

startWorker();
