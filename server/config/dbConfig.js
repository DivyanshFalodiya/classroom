const mongoose = require('mongoose');

mongoose.connection.on(
    'error',
    console.error.bind(console, 'Connection Error:')
);

mongoose.connection.on('open', () => {
    console.log('Connected to DB!');
});

module.exports = mongoose.connect(`mongodb://${process.env.MONGO_URI}/class`);
