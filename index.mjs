import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import session from 'express-session';
const upload = multer();
const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect('mongodb://localhost:27017/tutorials-point');

const userSchema = mongoose.Schema({
	username: { type: String, require: true },
	age: { type: Number, require: true },
	nationality: { type: String, require: true },
});

const User = mongoose.model('Users', userSchema);

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
	session({
		secret: 'tutorials-point-express-js',
		resave: true,
		saveUninitialized: true,
	})
);

// dummy Users
const dUsers = [];

// parsing multipart/form-data
app.use(upload.array());

app.use(express.static('public'));

app.get('/', (req, res) => {
	console.log('Cookies', req.cookies);
	res.cookie('tutorial', 'expressjs', { maxAge: 350000 }).render('home', {
		name: 'Page 1 | Tutorials Point',
		url: 'http://localhost:5000/page-1',
		url2: 'http://localhost:5000/new-form',
		url3: 'http://localhost:5000/users',
		url4: 'http://localhost:5000/signup',
		url5: 'http://localhost:5000/login',
	});
});

app.get('/signup', (req, res) => {
	res.render('signup', { title: 'Sign Up', url: 'http://localhost:5000' });
});

app.post('/signup', (req, res) => {
	const { id, password } = req.body;
	console.log('id: ', id, 'password: ', password);
	if (!id || !password)
		return res.render('signup', { message: 'Invalid id or password' });

	const matchedId = dUsers.find((user) => user.id === id);
	console.log('matchedId: ', matchedId);

	if (matchedId === undefined) {
		const newUser = { id, password };
		dUsers.push(newUser);
		req.session.user = newUser;
		return res.redirect('/protected-page');
	}

	res.render('signup', {
		message: 'User already exist! Please login with your ID',
		url: 'http://localhost:5000',
	});
});

function checkSignIn(req, res, next) {
	console.log('req.session.user: ', req.session.user);
	if (req.session.user) {
		let id = req.session.user.id;
		next();
	} else {
		// const err = new Error('You are not logged in!');
		// console.log(req.session.user);
		// next(err);
		return res.redirect('/login');
	}
}

app.get('/protected-page', checkSignIn, (req, res) => {
	return res.render('protected-page', {
		id: req.session.user.id,
		title: 'Protected Page',
		url: 'http://localhost:5000/logout',
	});
});

app.get('/login', (req, res) => {
	res.render('login', {
		title: 'Log In',
		url: 'http://localhost:5000',
		url2: 'http://localhost:5000/signup',
	});
});

app.post('/login', (req, res) => {
	console.log('dUsers: ', dUsers);
	const { id, password } = req.body;
	if (!id || !password) {
		return res.render('login', {
			message: 'Please enter all fields',
		});
	}

	const matchedUser = dUsers.find(
		(user) => user.id === id && user.password === password
	);
	console.log('matchedUser: ', matchedUser);
	if (matchedUser !== undefined) {
		req.session.user = { id, password };
		return res.redirect('/protected-page');
	}

	res.render('login', {
		message: 'Invalid id or password',
		url: 'http://localhost:5000',
		url2: 'http://localhost:5000/signup',
	});
});

app.get('/logout', (req, res) => {
	req.session.destroy(function () {
		console.log('You are logged out!');
	});
	res.redirect('/login');
});

app.get('/page-1', (req, res) => {
	if (req.session.views) {
		req.session.views++;
	} else {
		req.session.views = 1;
	}
	res.render('page-1', {
		title: 'Home | Tutorials Point',
		user: { name: 'Jago', age: '18' },
		url: 'http://localhost:5000',
		pageViews: req.session.views,
	});
});

app.get('/content', (req, res) => {
	res.render('content');
});

app.get('/users', async (req, res) => {
	const users = await User.find();
	if (!users)
		return res.render('show-message', {
			msg: 'Users not found',
			type: 'error',
		});

	return res.json(users);
});

app.get('/new-form', (req, res) => {
	res.render('form', { url: 'http://localhost:5000', title: 'New User' });
});

app.post('/new-form', async (req, res) => {
	console.log(req.body);
	try {
		const { username, age, nationality } = req.body;

		if (!username || !age || !nationality) {
			return res.render('show-message', {
				msg: 'Sorry, you provided wrong info',
				type: 'error',
			});
		}

		const newUser = new User({ ...req.body });
		await newUser.save();

		return res.render('show-message', {
			msg: 'User added successfully',
			type: 'success',
			user: newUser,
		});
	} catch (error) {
		res.render('show-message', { msg: error._message, type: 'error' });
	}
});

app.put('/users/:id', async (req, res) => {
	const { id, username, age, nationality } = req.body;
	if ((!username, !age, !nationality))
		return res.render('show-message', {
			msg: 'Missing Info',
			type: 'error',
		});

	const updateUser = await User.findByIdAndUpdate(
		req.params.id,
		{ ...req.body },
		{
			new: true,
		}
	);

	if (!updateUser)
		return res.render('show-message', {
			msg: 'Fail to update user',
			type: 'error',
		});

	return res.json(updateUser);
});

app.delete('/users/:id', async (req, res) => {
	try {
		if (!req.params.id)
			return res.render('show-message', {
				msg: 'Update fail',
				type: 'error',
			});

		await User.findByIdAndDelete(req.params.id);

		return res.render('show-message', { msg: 'Deleted', type: 'success' });
	} catch (error) {
		return res.render('show-message', { msg: error, type: 'error' });
	}
});

app.listen(PORT, () => console.log(`Running on PORT ${PORT}`));
