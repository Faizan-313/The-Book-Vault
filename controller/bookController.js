import axios from 'axios';
import db from '../db.js';

//Capitalizes the first letters of each word in the book name
function capitalizeFirstLetter(string) {
    if (!string) return string; // Check for empty string
    return string.split(' ') .map(word => word.charAt(0).toUpperCase() + word.slice(1)) .join(' '); 
}

// adding new books
export const addBook = async (req,res)=>{
    const name = capitalizeFirstLetter(req.body.name);
    const get_date = new Date();
    try {
        const rating = req.body.ratings;
        const description = req.body.discription ? req.body.discription : "None";

        //checks if the book is already present or not
        const bookPresent = await db.query("select * from books where book_name = $1",[name]);
        const id = bookPresent.rows[0]?.book_id;

        //if already present in the books table
        if(bookPresent.rows.length > 0){
            const checkUserSaved = await db.query("SELECT book_id FROM user_saved  WHERE book_id = $1 and user_id = $2", [id,req.session.user?.id]);
            
            //if already present in the user_saved under the user
            if (checkUserSaved.rows.length > 0) {
                return res.redirect("/index?error=" + encodeURIComponent("Book already exists"));
            }else{
                //if not in the user_saved
                await db.query("insert into user_saved (user_id, book_id,user_rating,book_description,event_date) values($1,$2,$3,$4,$5)",[req.session.user?.id,bookPresent.rows[0].book_id,rating,description,get_date]);
                return res.redirect("/index");
            }
        }
        
        //get the book from the openlibrary api using book name.
        const response = await axios.get(`https://openlibrary.org/search.json?title=${encodeURIComponent(name)}`);
        const result = response.data.docs;
        if(result.length === 0){
            return res.redirect("/index?error="+encodeURIComponent("Book not found"));
        }
        const book = result[0];

        let isbn;
        let cover_url, i = 0;

        //check if the user has inputed the isbn
        if (req.body.isbn) {
            isbn = req.body.isbn;
        } else {
            //get the isbn from the data from api
            isbn = book.isbn[i];

            //while loop for iterating over isbn list
            while (i < book.isbn.length) {
                try {
                    //check for image
                    const response = await axios.get(`https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`, { responseType: 'arraybuffer' });
                    const dataSize = response.data.byteLength; //content size
                    
                    // Check if image is valid based on status and content-size
                    if (response.status === 200 && dataSize > 500) {
                        cover_url = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
                        break;
                    } else {
                        console.log(`Image returned but appears broken or empty for ISBN ${isbn}`);
                    }
                } catch (error) {
                    console.log(`Cover not found for ISBN ${isbn}`);
                }
                i++;
                
                //checks only for first three values
                if (i > 2) break;
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

        //insert the data into the database and redirect to index page with updated data
        await db.query("INSERT INTO books (book_name, cover_url, average_rating, author) VALUES ($1, $2, $3, $4);", 
            [name, cover_url, average_ratting, authorName]);

        const bookIdResult = await db.query('SELECT book_id FROM books WHERE book_name = $1', [name]);
        const bookId = bookIdResult.rows[0].book_id;

        await db.query('INSERT INTO user_saved (user_id, book_id, user_rating, event_date, book_description) VALUES ($1, $2,$3,$4,$5)', [req.session.user?.id, bookId,rating,get_date,description]);

        res.redirect("/index");
    } catch (error) {
        console.error(error);
        res.redirect("/index?error=Failed to get data");
    }
};

