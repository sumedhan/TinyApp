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

var urlDatabase = {
  'b2xVn2': 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com'
};

app.get('/', (request, response) => {
  response.send('Hello!');
});
app.get('/urls.json', (request, response) => {
  response.json(urlDatabase);
});
app.get('/urls', (request, response) => {
  response.render('urls_index', {urls: urlDatabase});
});
app.get('/urls/new', (request, response) => {
  response.render('urls_new');
});
app.get('/urls/:id', (request, response) => {
  response.render('urls_show', {shortURL: request.params.id,
                                longURL: urlDatabase[request.params.id] });
});


app.post("/urls", (req, res) => {
  console.log(req.body);  // debug statement to see POST parameters
  res.send("Ok");         // Respond with 'Ok' (we will replace this)
});


// app.listen(PORT, () => {
//   console.log(`Example app listening on port ${PORT}!`);
// });
