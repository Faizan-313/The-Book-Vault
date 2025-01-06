import express from "express";
import bodyParser from "body-parser";
import db from "./db/db.js";
import router from "./routes/auth.js";
import bookRouter from "./routes/bookRouts.js";
import editRouter from "./routes/editRoute.js";
import logout from "./routes/logout.js";
import session from "express-session";
import { createClient } from 'redis';
import {RedisStore} from "connect-redis"
import helmet from "helmet";


//setup the app and port
const app = express();
const port = 3000;

//setup the middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const redisClient = createClient({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

if (!redisClient.isOpen) {
    redisClient.connect();
}

app.use(session({
    store: new RedisStore({ client: redisClient}),  // Use Redis store with the Redis client
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true, 
        sameSite: 'lax',
        path: '/',
        maxAge: 1000 * 60 * 60 *24, 
    }
}));

app.use(helmet({
    contentSecurityPolicy: false,
}));

//routes
app.use('/new', bookRouter);
app.use('/auth', router);
app.use('/edit', editRouter);
app.use('/delete', editRouter);
app.use('/logout', logout);


app.get("/",(req,res)=>{
    if(req.session.user){
        return res.redirect("/index");
    }
    const message = req.query.message || null;
    const email = req.query.email || null;
    res.render("pages/login.ejs",{message:message,email:email});
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
app.get("/index", async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');  
    }
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
            // console.log(err);
            return res.status(500).send('Database error');
        }
        let username = req.session.user.username;
        username = username.toUpperCase();
        res.render("pages/index.ejs", { show: true, data: result.rows, filter_value: filter_value, username: username });
    });
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
