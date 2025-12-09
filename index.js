require('module-alias/register');
require('dotenv').config();
// Si tu archivo se llama MyClient.js
const MyClient = require('./src/structures/MyClient.js');


const client = new MyClient();

client.start();
