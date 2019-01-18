/* eslint-disable no-restricted-syntax */
/* eslint-disable prefer-destructuring */
// Modules
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');

const app = express();
const PORT = 8080; // default port 8080


//  Middleware
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieSession({
  name: 'session',
  keys: ['dobo986', 'jene787'],
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

// Database that stores short and long url pairs
const urlDatabase = {
  b2xVn2: {
    longURL: 'http://www.lighthouselabs.ca',
    userID: 'abcde',
    dateCreated: 'Jan 17th 2019',
    numberOfVisits: 0,
  },
  '9sm5xK': {
    longURL: 'http://www.google.com',
    userID: 'dobo',
    dateCreated: 'Jan 17th 2018',
    numberOfVisits: 0,
  },
};

// User database
const users = {
  abcde: {
    id: 'abcde',
    email: 'a@b.com',
    password: hashPassword('123'),
  },
  dobo: {
    id: 'dobo',
    email: 'd@dobo.com',
    password: hashPassword('sume'),
  },
};

//  Returns true if random string is valid (i.e. has not been used before in URLS or User ids)
function checkUniqueString(randomString) {
  if (urlDatabase[randomString] || users[randomString]) {
    return false;
  }
  return true;
}

//  Function that generates a random string for the shortened URL. The url is 6 characters long.
function generateRandomString() {
  let randomString = '';
  do {
    randomString = Math.random().toString(36).substring(2, 8);
  } while (!checkUniqueString(randomString));
  return randomString;
}


// Checks if email id is already in the database
function canUserBeRegistered(email) {
  // eslint-disable-next-line no-restricted-syntax
  for (let userId in users) {
    if (email === users[userId].email) {
      return false;
    }
  }
  return true;
}

// Function to hash password using bcrypt
function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

// Function to check if password is correct
function checkPassword(password, userID) {
  return bcrypt.compareSync(password, users[userID].password);
}

// function to register a new user in the user database
function registeruserId(email, password) {
  const uniqueUserId = generateRandomString();
  const hashedPassword = hashPassword(password);
  users[uniqueUserId] = {
    id: uniqueUserId,
    email,
    hashedPassword,
  };
  return uniqueUserId;
}

// function to check if user is logged in
function isUserLoggedIn(userIdCookie) {
  if (userIdCookie) {
    return true;
  }
  return false;
}

// function to return userid given email address
function findUserId(email) {
  for (let userId in users) {
    if (email === users[userId].email) {
      return userId;
    }
  }
  return null;
}

// function to match the entered email and password to the database entries
function passwordMatch(email, password) {
  const userID = findUserId(email);
  if (checkPassword(password, userID)) {
    return true;
  }
  return false;
}

// function creates a short URL in the database
function createURL(longURL, userID) {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL,
    userID,
    dateCreated: moment().format('Do MMM YYYY'),
    numberOfVisits: 0,
  };
  return shortURL;
}

// Checks if url belongs to the user
function urlBelongsToUser(shortURL, userID) {
  if (urlDatabase[shortURL].userID === userID) {
    return true;
  }
  return false;
}
// Route definitions -

// Root path
app.get('/', (request, response) => {
  if (isUserLoggedIn(request.session.user_id)) {
    response.redirect('/urls');
  } else {
    response.redirect('/login');
  }
});

// Path that lists the url index. If logged out, redirects to login page
app.get('/urls', (request, response) => {
  if (isUserLoggedIn(request.session.user_id)) {
    response.render('urls_index', {
      urls: urlDatabase,
      user: users[request.session.user_id],
    });
  } else {
    response.redirect('/login');
  }
});

// Login page
app.get('/login', (request, response) => {
  if (isUserLoggedIn(request.session.user_id)) {
    response.redirect('/urls');
  } else {
    response.render('user_login');
  }
});

// Path to generate a new tiny URL
app.get('/urls/new', (request, response) => {
  if (isUserLoggedIn(request.session.user_id)) {
    response.render('urls_new', { user: users[request.session.user_id] });
  } else {
    response.redirect('/login');
  }
});

// shows the short and long URL for a specific short URL
app.get('/urls/:id', (request, response) => {
  const shortURL = request.params.id;
  response.render('urls_show', {
    shortURL,
    longURL: urlDatabase[shortURL].longURL,
    user: users[request.session.user_id],
  });
});

// Path that returns current JSON of URLS
app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

// Returns a page that includes a form with an email and password
app.get('/register', (request, response) => {
  response.render('user_register');
});

// Redirect short URLs to the correct long URL
app.get('/u/:shortURL', (request, response) => {
  const shortURL = request.params.shortURL;
  // checks if the short url exists in our database
  if (urlDatabase[shortURL]) {
    const longURL = urlDatabase[shortURL].longURL;
    urlDatabase[shortURL].numberOfVisits += 1;
    response.redirect(longURL);
  } else {
    const status = 400;
    response.sendStatus(status);
  }
});


// Post function to accept a new long URL , gneerate a random shortURL and then add to database
app.post('/urls', (request, response) => {
  if (isUserLoggedIn(request.session.user_id)) {
    const longURL = request.body.longURL;
    const userID = request.session.user_id;
    const shortURL = createURL(longURL, userID);
    response.redirect(`/urls/${shortURL}`);
  } else {
    response.statusCode = 400;
    response.send('Please log in');
  }
});

// Deletes URLS from database
app.post('/urls/:id/delete', (request, response) => {
  const shortURL = request.params.id;
  const userID = request.session.user_id;
  if (urlBelongsToUser(shortURL, userID)) {
    delete urlDatabase[shortURL];
    response.redirect('/urls');
  } else {
    response.statusCode = 400;
    response.send('Cannot delete links created by other users.');
  }
});

// Updates URLs in database
app.post('/urls/:id', (request, response) => {
  const shortURL = request.params.id;
  const userID = request.session.user_id;
  if (urlBelongsToUser(shortURL, userID)) {
    urlDatabase[shortURL].longURL = request.body.updatedLongURL;
    response.redirect('/urls');
  } else {
    response.statusCode = 400;
    response.send('Cannot edit links created by other users.');
  }
});

// Login the user
app.post('/login', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  if (!email || !password) {
    response.statusCode = 400;
    response.send('Missing Credentials');
  } else if (canUserBeRegistered(email)) {
    response.statusCode = 403;
    response.send('User does not exist');
  } else if (!passwordMatch(email, password)) {
    response.statusCode = 403;
    response.send('Incorrect username/password');
  } else {
    request.session.user_id = findUserId(email);
    response.redirect('/urls');
  }
});

// log out the user
app.post('/logout', (request, response) => {
  request.session = null;
  response.redirect('/urls');
});

// Registration form data submission cehcks for missing credentials and exisiting emails
app.post('/register', (request, response) => {
  const email = request.body.email;
  const password = request.body.password;
  if (!email || !password) {
    response.statusCode = 400;
    response.send('Missing Credentials');
  } else if (!canUserBeRegistered(email)) {
    response.statusCode = 400;
    response.send('User already exists');
  } else {
    const userId = registeruserId(email, password);
    request.session.user_id = userId;
    response.redirect('/urls');
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening on port ${PORT}!`);
});
