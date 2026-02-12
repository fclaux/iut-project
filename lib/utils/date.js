'use strict';

const formatDateTime = (date) => {

    return date ? new Date(date).toLocaleString('fr-FR') : '';
};

const formatDateOnly = (date) => {

    return date ? new Date(date).toLocaleDateString('fr-FR') : '';
};

module.exports = {
    formatDateTime,
    formatDateOnly
};
