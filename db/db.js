import pg from "pg";
import env from "dotenv";

env.config();

//setup the postgres database
const db = new pg.Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: parseInt(process.env.PG_PORT),
    // ssl: {
    //         rejectUnauthorized: false, 
    //     },
});

db.connect(err=>{
    if(err){
        console.log('Database error',err);
    }else{
        console.log('Database connected');
    }
});


export default db;