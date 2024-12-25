import db from "../db.js";

//for the editing of the ratings and the description part
export const editBook = async (req,res)=>{
    const bookId = req.body.bookId;
    let newRating = req.body.rating; 
    let newDescription = req.body.description;

    // Fetch current values if new ones are not provided
    const result = await db.query("select user_rating,book_description from user_saved where book_id = $1 and user_id = $2",[bookId,req.session.user?.id]);

    // If rating or description is not provided, keep the current value
    newRating = newRating || result.rows[0].user_rating;
    newDescription = newDescription || result.rows[0].book_description;

    if(newRating === result.rows[0].user_rating){
        // Update the books in the database
        db.query(
            "UPDATE user_saved SET book_description = $1 WHERE book_id = $2 and user_id = $3", 
            [newDescription, bookId,req.session.user?.id], 
            (err) => {
            if (err) {
                console.error('Error updating book:', err);
                return res.status(500).send('Database error');
            }
        });
    }else{
        // Update the user_table
        db.query(
            "UPDATE user_saved SET user_rating = $1 WHERE book_id = $2 AND user_id = $3",
            [newRating, bookId, req.session.user?.id],
            (err) => {
            if (err) {
                console.error('Error updating user_saved:', err);
                return res.status(500).send('Database error');
            }
        });
    }
    res.redirect("/index");
};

//delete the whole book item when the delete button is clicked
export const deleteBook = async (req,res)=>{
    const id = req.body.deleteid;
    const result = await db.query("select * from user_saved where book_id = $1", [id]);
    if(result.rows.length <= 1){
        db.query("DELETE FROM user_saved WHERE book_id = $1 and user_id = $2", [id,req.session.user?.id], (err, result) => {
            if (err) {
                return res.status(500).send('Database error');
            }
        db.query("delete from books where book_id = $1", [id]);
            return res.redirect("/index");
        });
    }else{
        db.query("delete from user_saved where book_id = $1 and user_id = $2",[id,req.session.user?.id],(err,result)=>{
            if(err){
                return res.status(500).send('Database error');
            }
            return res.redirect("/index");
        });   
    }
};
