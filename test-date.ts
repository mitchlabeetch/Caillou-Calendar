import { formatInTimeZone } from 'date-fns-tz';

console.log(formatInTimeZone(new Date(), 'Europe/Paris', 'MMMM do, yyyy'));
