import db from "../db/db.js";
import bcrypt from "bcrypt";
import env from "dotenv";

env.config();

const saltRounds = parseInt(process.env.SALT_ROUNDS);

export const loginUser = async (req, res)=>{
    const {email,password} = req.body;
    const result = await db.query("select * from users where email = $1 ",[email]);
    if(result.rows.length === 0){
        res.redirect(`/?message=${encodeURIComponent("Invalid email")}`);
    }
    else{
        const user = result.rows[0];
        const storedPassword = user.password_hash;
        bcrypt.compare(password,storedPassword,(err,result)=>{
            if(!result){
                // console.log(err);
                res.redirect(`/?message=${encodeURIComponent("Wrong password")}&email=${encodeURIComponent(email)}`);
            }
            else{
                req.session.user = {id: user.user_id, email: user.email, username: user.username};
                res.redirect("/index");
            }
        })
    }
};

export const registerUser = async (req,res)=>{
    const {name,email,password} = req.body;
    const result = await db.query("select * from users where email = $1",[email]);
    if(result.rows.length === 0){
        bcrypt.hash(password,saltRounds,async (err,hash)=>{
            if(err){
                res.status(500).send("Unable to store the password");
            }else{
                await db.query("insert into users (username,email,password_hash) values ($1,$2,$3)",[name,email,hash]);
                const response = await db.query("select user_id from users where email = $1",[email]);
                const userId = response.rows[0].user_id;
                req.session.user = { id: userId, email: email, username: name };  // Set session data
                res.redirect("/index"); 
            }
        })
    }else{
        res.redirect(`/?message=${encodeURIComponent("User already exists")}`);
    }
}
