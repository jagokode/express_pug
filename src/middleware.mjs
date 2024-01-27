import express from 'express';
const app = express();

app.use(function (req, res, next) {
	console.log('START');
	next();
});

app.get('/', function (req, res, next) {
	res.send('MIDDLE');
	next();
});
