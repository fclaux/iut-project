'use strict';

const { Service } = require('@hapipal/schmervice');
const Amqp = require('amqplib');

module.exports = class MessageBrokerService extends Service {

    async sendExportRequest(email) {

        const connection = await Amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
        const queue = 'export_movies';

        await channel.assertQueue(queue, { durable: false });

        const message = JSON.stringify({ email });
        channel.sendToQueue(queue, Buffer.from(message));

        console.log(`Sent export request for ${email}`);

        setTimeout(() => {

            connection.close();
        }, 500);

        return true;
    }
};
