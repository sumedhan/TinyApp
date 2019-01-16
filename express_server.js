var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

app.set('view engine', 'ejs') 
app.use(bodyParser.urlencoded({extended: true}));


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
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

// Root path 
app.get('/', (request, response) => {
  response.send('Hello!');
});
//Path that returns current JSON of URLS
app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});
// Path that lists the url index
app.get('/urls', (request, response) => {
  response.render('urls_index', {urls: urlDatabase});
});
//Path to generate a new tiny URL
app.get('/urls/new', (request, response) => {
  response.render('urls_new');
});
//shows the short and long URL for a specific short URL
app.get('/urls/:id', (request, response) => {
  response.render('urls_show', {shortURL: request.params.id,
                                longURL: urlDatabase[request.params.id] });
});

//Post function to accept a new long URL , gneerate a random shortURL and then add to database
app.post("/urls", (request, response) => {
  //request.body uses the package body parser to encode it in the key value pairs defined in the form tag
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = request.body.longURL;
  response.redirect(`/urls/${shortURL}`);         
});

// Redirect short URLs to the correct long URL
app.get("/u/:shortURL", (request, response) => {
  let shortURL = request.params.shortURL;
  //checks if the short url exists in our database
  if(urlDatabase[shortURL]) {
  let longURL = urlDatabase[shortUrl];
  response.redirect(longURL);
  } else {
    let status = 400;
    response.sendStatus(status);
  }
});

app.post("/urls/:id/delete", (request, response) => {
  let shortUrl = request.params.id;
  delete urlDatabase[shortUrl];
  response.redirect("/urls");
});

app.post("/urls/:id", (request, response) => {
  let shortUrl = request.params.id;
  let longUrl = request.body.updatedLongURL;
  urlDatabase[shortUrl] = longUrl;
  response.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
;