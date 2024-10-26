import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios";
import env from "dotenv";

//setup the app and port
const app = express();
const port = 3000;

//setup the bodyparser
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
env.config();

//setup the postgres database
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});
db.connect();

//Capitalizes the first letters of each word in the book name
function capitalizeFirstLetter(string) {
    if (!string) return string; // Check for empty string
    return string.split(' ') .map(word => word.charAt(0).toUpperCase() + word.slice(1)) .join(' '); 
}

const get_date = new Date();

//Stores the data after retreving the data from the database
let data = [];

let filter_value = 'id'; // Default filter value 

//Changes the filter value with respect to the filter selected by the user
app.get('/filter', async (req, res) => {
    filter_value = req.query.filter; 
    res.redirect("/");
});

//Loads the index page with the data and also applies the filter.
app.get("/", (req, res) => {
    let order = 'desc';
    if(filter_value === 'id'){
        order = 'asc';
    }
    db.query(`SELECT * FROM books ORDER BY ${filter_value} ${order}`, (err, result) => {
        if (err) {
            console.log('Error fetching books:', err);
            return res.status(500).send('Database error');
        }
        data = result.rows;
        res.render("index.ejs", { show: true, data: data, filter_value: filter_value });
    });
});

//Renders the add page with nav bar not haveing add and filter options
app.get("/add",(req,res)=>{
    res.render("add.ejs",{show: false});
});

// adding new books
app.post("/new", async (req,res)=>{
    const name =capitalizeFirstLetter(req.body.name);

    //try and catch block to add new books
    try{
        //checks if the book is already present or not
        const duplicateCheckResult = await new Promise((resolve, reject) => {
            db.query("SELECT * FROM books WHERE name = $1;", [name], (err, result) => {
                if (err) {
                    console.error('Error checking for duplicates:', err);
                    return reject(err);
                }
                resolve(result);
            });
        });

        //if present then show the alert message and return to the index page
        if (duplicateCheckResult.rows.length > 0) {
            return res.redirect("/?error=" + encodeURIComponent("Book already exists"));
        }
        
        //get the book from the openlibrary api using book name.
        const response = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(name)}`);
        const result = response.data.docs;
        const book = result[0];

        let isbn;
        let cover_url,i=1;

        //check if the user has inputed the isbn
        if (req.body.isbn) {
            isbn = req.body.isbn;
        } else {
            //get the isbn from the data from api
            isbn = book.isbn[0];

            //while loop for iterating over isbn list
            while (i < book.isbn.length) {
                try {
                    //check for image
                    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`, { responseType: 'arraybuffer' });
                    const dataSize = response.data.byteLength; //content size
                    
                    // Check if image is valid based on status and content-size
                    if (response.status === 200 && dataSize > 500) {
                        console.log(`Valid cover found for ISBN ${isbn}`);
                        cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                        break;
                    } else {
                        console.log(`Image returned but appears broken or empty for ISBN ${isbn}`);
                    }
                } catch (error) {
                    console.log(`Cover not found for ISBN ${isbn}`);
                }
                i += 1;
                
                //checks only for first three values
                if(i>2){
                    break;
                }
                isbn = book.isbn[i];
            }
        }
        
        //if no cover_url then use the default image
        if (!cover_url) {
            console.log("No valid cover found for any ISBN.");
            cover_url = "/images/default_image.jpeg"; // Set a default placeholder if no valid cover is found
        }
        
        //get the average ratings and authors names
        const average_ratting = book.ratings_average;
        const authorName = book.author_name.join(" , ");
        
        //get the user inputed ratings and description
        const ratting = req.body.rattings;
        const discription = req.body.discription ? req.body.discription : "None";

        //insert the data into the database and redirect to index page with updated data
        db.query("INSERT INTO books (name, rattings, event_date, cover_url, average_ratting,author,description) VALUES ($1, $2, $3, $4, $5, $6,$7);", 
            [name, ratting, get_date, cover_url,average_ratting,authorName,discription],
            (err, result) => {
                if (err) {
                    console.error('Error inserting data:', err); // Log error if any
                    res.status(500).send('Database error');
                } else {
                    //render the index page with updated data
                    db.query("SELECT * FROM books;", (err, result) => {
                        if (err) {
                            console.error('Error fetching books:', err);
                            res.status(500).send('Database error');
                        }
                        data = result.rows; // Get the rows from the query result
                        res.render("index.ejs",{show: true, data: data, filter_value: filter_value}); 
                    });
                }
        });
    }catch{
        console.log("failed to get data");
        res.redirect("/?error=failed_to_get_data");
    }
});

//for the editing of the ratings and the description part
app.post('/edit', (req, res) => {
    const bookId = req.body.bookId;
    let newRating = req.body.rating; 
    let newDescription = req.body.description;

    // Fetch current values if new ones are not provided
    db.query("SELECT rattings, description FROM books WHERE id = $1", [bookId], (err, result) => {
        if (err) {
            console.error('Error fetching current values:', err);
            return res.status(500).send('Database error');
        }

        // If rating or description is not provided, keep the current value
        newRating = newRating || result.rows[0].rattings;
        newDescription = newDescription || result.rows[0].description;

        // Update the books in the database
        db.query(
            "UPDATE books SET rattings = $1, description = $2 WHERE id = $3", 
            [newRating, newDescription, bookId], 
            (err, updateResult) => {
                if (err) {
                    console.error('Error updating book:', err);
                    return res.status(500).send('Database error');
                }
                res.redirect("/"); // Redirect after successful update
            }
        );
    });
});

//delete the whole book item when the delete button is clicked
app.post("/delete", (req,res)=>{
    const id = req.body.deleteid;
    db.query("DELETE FROM books WHERE id = $1", [id], (err, result) => {
        if (err) {
            console.error('Error deleting book:', err);
            return res.status(500).send('Database error');
        }
        res.redirect("/");
    });
});

app.listen(port, ()=>{
    console.log(`Server running on port ${port}`);
});
