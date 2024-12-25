import express from "express";
import bodyParser from "body-parser";
import db from "./db.js";
import router from "./routes/auth.js";
import bookRouter from "./routes/bookRouts.js";
import editRouter from "./routes/editRoute.js";
import session from "express-session";

//setup the app and port
const app = express();
const port = 3000;

//setup the middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

//to save the session 
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: 1000*60*60,
    }
}));

//routes
app.use('/new', bookRouter);
app.use('/auth', router);
app.use('/edit', editRouter);
app.use('/delete', editRouter);


app.get("/",(req,res)=>{
    const message = req.query.message || null;
    res.render("pages/login.ejs",{message});
});

app.get("/register",(req,res)=>{
    res.render("pages/registration.ejs");
});

app.get("/add",(req,res)=>{
    res.render("pages/add.ejs",{show: false});
});

//Changes the filter value with respect to the filter selected by the user
app.get('/filter', async (req, res) => {
    const filter_value = req.query.filter; 
    res.redirect(`/index?filter=${filter_value}`);
});

//Loads the index page with the data and also applies the filter.
app.get("/index", (req, res) => {
    const userId = req.session.user?.id;
    const filter_value = req.query.filter || 'book_name';

    db.query(`SELECT books.*, user_saved.user_rating, user_saved.event_date,user_saved.book_description 
        FROM books 
        INNER JOIN user_saved 
        ON books.book_id = user_saved.book_id 
        WHERE user_saved.user_id = $1 
        ORDER BY ${filter_value} DESC`,
        [userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Database error');
        }
        res.render("pages/index.ejs", { show: true, data: result.rows, filter_value: filter_value });
    });
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
