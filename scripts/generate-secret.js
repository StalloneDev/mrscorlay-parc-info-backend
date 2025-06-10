import crypto from 'crypto';

// Génère une chaîne aléatoire de 64 caractères en hexadécimal
const sessionSecret = crypto.randomBytes(32).toString('hex');

console.log('Votre SESSION_SECRET :');
console.log(sessionSecret);
console.log('\nCopiez cette valeur dans votre fichier .env'); 