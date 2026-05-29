const { format } = require('date-fns');
const { enUS } = require('date-fns/locale');
console.log(format(new Date(), 'PP', { locale: enUS }));
console.log(format(new Date(), 'PPP', { locale: enUS }));
