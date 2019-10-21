const express = require('express');

const port = 8080;

const app = express();

// Tell express to use pug and point it to the views(pages) and public(css/js) folders
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
	res.send("Hello")
})

app.listen(port, () => {
	console.log("Express started on port:"+port.toString());
})