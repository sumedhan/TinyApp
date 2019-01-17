const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const moment = require('moment');


app.set('view engine', 'ejs') 
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));

function generateRandomString() {
  let randomString = '';
  do {
    randomString = Math.random().toString(36).substring(2,8);
  } while(!checkUniqueShortUrl(randomString)); 
  return randomString; 
}
//Returns true if random string is valid (i.e. has not been used before)
function checkUniqueShortUrl(randomString) {
  for(var shortURL in urlDatabase) {
    if(shortURL === randomString) {
      return false;
    }
  }
  return true;
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

// Route definitions -

// Root path 
app.get('/', (request, response) => {
  if(request.body.username){
    response.redirect('/urls');
  } else {
  response.redirect('/login');
  }
});

//Login page
app.get('/login', (request, response) => {
  response.render('urls_login', {username: request.cookies.username})
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
  let username = request.body.username;
  response.cookie("username",username);
  response.redirect("/urls");
});

//log out the user
app.post("/logout", (request, response) => {
  response.clearCookie("username");
  response.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
;