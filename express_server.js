var express = require("express");
var app = express();
var PORT = 8080; // default port 8080

app.set('view engine', 'ejs') 

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
app.get('/urls/:id', (request, response) => {
  response.render('urls_show', {shortURL: request.params.id,
                                longURL: urlDatabase[request.params.id] });
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});