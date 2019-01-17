// Modules
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const moment = require('moment');

//Middleware
app.set('view engine', 'ejs') 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));


//Function that generates a random string for the shortened URL. The url is 6 characters long.
function generateRandomString() {
  let randomString = '';
  do {
    randomString = Math.random().toString(36).substring(2,8);
  } while(!checkUniqueString(randomString)); 
  return randomString; 
}
//Returns true if random string is valid (i.e. has not been used before in URLS or User ids)
function checkUniqueString(randomString) {
  if( urlDatabase[randomString] || users[randomString]) 
    return false;
  else 
    return true;
}

// Checks if email id is already in the database
function canUserBeRegistered(email) {
  for(var userId in users) {
    if( email === users[userId].email)
      return false;
  }
  return true;
}


// function to register a new user in the user database
function registeruserId(email, password) {
  const uniqueUserId = generateRandomString();
  users[uniqueUserId] = {
    id: uniqueUserId,
    email,
    password
  };
  return uniqueUserId;
}

// function to check if user is logged in
function isUserLoggedIn(userIdCookie) {
  if(userIdCookie) 
    return true;
  else 
    return false;
}

// function to return userid given email address
function findUserId(email) {
  for(var userId in users) {
    if( email === users[userId].email)
      return userId;
  }
  return 0;
}

// function to match the entered email and password to the database entries
function passwordMatch(email, password) {
  const userId = findUserId(email);
  if(password === users[userId].password)
    return true;
  else 
    return false;
}

// Database that stores short and long url pairs
var urlDatabase = {
  'b2xVn2': 
  {
    longURL: 'http://www.lighthouselabs.ca',
    dateCreated: "Jan 17th 2019",
    numberOfVisits: 0
  },
  '9sm5xK':
  {
    longURL: 'http://www.google.com',
    dateCreated: "Jan 17th 2018",
    numberOfVisits: 0
  }
}

// User database
const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}


// Route definitions -

// Root path 
app.get('/', (request, response) => {
  if(isUserLoggedIn(request.cookies.user_id))
    response.redirect('/urls');
  else 
    response.redirect('/login');
});

//Login page
app.get('/login', (request, response) => {
  console.log(request.cookie);
  if(isUserLoggedIn(request.cookies.user_id))
    response.redirect('/urls');
  else
    response.render('urls_login');
});

// Path that lists the url index. If lo
app.get('/urls', (request, response) => {
  if(request.cookies.username) {
    response.render('urls_index', {
      urls: urlDatabase,
      username: request.cookies.username
    });
  } else {
    response.redirect('/login');
  }
});

//Path to generate a new tiny URL
app.get('/urls/new', (request, response) => {
  if(request.cookies.username) {
    response.render('urls_new', {username: request.cookies.username});
  } else {
    response.redirect('/login');
  }
});

//shows the short and long URL for a specific short URL
app.get('/urls/:id', (request, response) => {
  const shortURL = request.params.id;
  response.render('urls_show', {
    shortURL: shortURL,
    longURL: urlDatabase[shortURL].longURL,
    username: request.cookies.username
  });
});

//Path that returns current JSON of URLS
app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});

// Returns a page that includes a form with an email and password
app.get('/register', (request, response) => {
  response.render('user_register');
})

//Post function to accept a new long URL , gneerate a random shortURL and then add to database
app.post("/urls", (request, response) => {
  //request.body uses the package body parser to encode it in the key value pairs defined in the form tag
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = 
  { longURL: request.body.longURL,
    dateCreated: moment().format("Do MMM YYYY"),
    numberOfVisits: 0
  };
  
  response.redirect(`/urls/${shortURL}`);         
});

// Redirect short URLs to the correct long URL
app.get("/u/:shortURL", (request, response) => {
  let shortURL = request.params.shortURL;
  //checks if the short url exists in our database
  if(urlDatabase[shortURL]) {
  let longURL = urlDatabase[shortURL].longURL;
  urlDatabase[shortURL].numberOfVisits++;
  response.redirect(longURL);
  } else {
    let status = 400;
    response.sendStatus(status);
  }
});

//Deletes URLS from database
app.post("/urls/:id/delete", (request, response) => {
  let shortUrl = request.params.id;
  delete urlDatabase[shortUrl];
  response.redirect("/urls");
});

//Updates URLs in database
app.post("/urls/:id", (request, response) => {
  let shortUrl = request.params.id;
  let longUrl = request.body.updatedLongURL;
  urlDatabase[shortUrl].longURL = longUrl;
  response.redirect("/urls");
});

//Login the user
app.post("/login", (request, response) => {
  let email = request.body.email;
  let password = request.body.password;
  if(!email || !password) {
    response.statusCode = 400;
    response.send('Missing Credentials');
  } else if(canUserBeRegistered(email)) {
    response.statusCode = 403;
    response.send("User does not exist");
  } else if(! passwordMatch(email, password)) {
    response.statusCode = 403;
    response.send("Incorrect username/password");
  } else {
    response.cookie("user_id", email);
    response.redirect("/urls");
  }
});

//log out the user
app.post("/logout", (request, response) => {
  response.clearCookie("user_id");
  response.redirect("/urls");
});

//Registration form data submission cehcks for missing credentials and exisiting emails
app.post("/register", (request, response) => {
  let email = request.body.email;
  let password = request.body.password;
  if(!email || !password) {
    response.statusCode = 400;
    response.send('Missing Credentials');
  } else if(!canUserBeRegistered(email)) {
    response.statusCode = 400;
    response.send('User already exists');
  } else {
    const userId = registeruserId(email, password);
    response.cookie("user_id", userId);
    response.redirect('/urls');
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
;