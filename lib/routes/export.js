'use strict';

module.exports = {
    method: 'GET',
    path: '/export/movies',
    options: {
        auth: {
            scope: ['admin']
        },
        tags: ['api'],
        description: 'Export all movies to CSV via email'
    },
    handler: async (request, h) => {

        const { messageBrokerService } = request.services();
        const adminEmail = request.auth.credentials.email;

        await messageBrokerService.sendExportRequest(adminEmail);

        return h.response({ message: 'Export process started. You will receive an email shortly.' }).code(202);
    }
};
