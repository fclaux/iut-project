'use strict';

const { Service } = require('@hapipal/schmervice');
const Nodemailer = require('nodemailer');

module.exports = class MailService extends Service {
    constructor(...args) {

        super(...args);

        this.transporter = Nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    async sendWelcome(userEmail, firstName) {

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: 'Bienvenue sur Ciné IUT !',
                text: `Bonjour ${firstName}, bienvenue sur notre plateforme de films !`,
                html: `<b>Bonjour ${firstName}</b>,<br>Bienvenue sur notre plateforme de films !`
            });

            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', Nodemailer.getTestMessageUrl(info));
        }
        catch (err) {
            console.error('Erreur lors de l\'envoi du mail', err);
        }
    }

    async sendNewMovieNotification(userEmail, userFirstName, movieTitle) {

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: `Nouveauté : ${movieTitle} est disponible !`,
                text: `Bonjour ${userFirstName}, le film "${movieTitle}" vient d'être ajouté à notre catalogue. Venez le découvrir !`,
                html: `<h3>Nouveau film ajouté !</h3><p>Bonjour ${userFirstName},</p><p>Le film <b>${movieTitle}</b> vient d'être ajouté à notre catalogue.</p><p>Venez le découvrir dès maintenant !</p>`
            });
            console.log('New Movie Mail sent: %s', info.messageId);
        }
        catch (err) {
            console.error('Erreur mail nouveau film:', err);
        }
    }

    async sendMovieUpdateNotification(userEmail, userFirstName, movieTitle) {

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: `Mise à jour sur votre favori : ${movieTitle}`,
                text: `Bonjour ${userFirstName}, les informations concernant votre film favori "${movieTitle}" ont été modifiées.`,
                html: `<h3>Mise à jour d'un favori</h3><p>Bonjour ${userFirstName},</p><p>Les informations concernant votre film favori <b>${movieTitle}</b> ont été modifiées par un administrateur.</p>`
            });
            console.log('Update Movie Mail sent: %s', info.messageId);
        }
        catch (err) {
            console.error('Erreur mail update film:', err);
        }
    }

    async sendMoviesExport(userEmail, csvContent) {

        try {
            const info = await this.transporter.sendMail({
                from: `"${process.env.SMTP_NAME}" <${process.env.SMTP_USER}>`,
                to: userEmail,
                subject: 'Export des films (CSV)',
                text: 'Voici le fichier CSV contenant la liste des films que vous avez demandé.',
                html: '<p>Bonjour,</p><p>Veuillez trouver ci-joint l\'export CSV de la bibliothèque de films.</p>',
                attachments: [
                    {
                        filename: 'movies_export.csv',
                        content: csvContent,
                        contentType: 'text/csv'
                    }
                ]
            });
            console.log('Export CSV sent: %s', info.messageId);
        }
        catch (err) {
            console.error('Erreur envoi export CSV:', err);
        }
    }
};
