export const logoutUser = async (req, res)=>{
    try{
        res.redirect("/");        
    }catch(err){
        res.status(500).send(err);
    }
}