export const logoutUser = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session:', err);
                return res.status(500).send('Unable to log out');
            }
        });
        res.clearCookie('sessionId');
        res.redirect("/");
    } catch (err) {
        res.status(500).send(err);
    }
};
