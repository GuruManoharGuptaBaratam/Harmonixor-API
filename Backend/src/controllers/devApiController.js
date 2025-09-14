const {handleSongSearch, handleSongStream} = require("./musicController")
async function handleDevApiSearchURL(req,res){
    try{

        const { Song_name} = req.query;
        if (!Song_name) return res.status(400).json({ error: "Song name required" });
        await handleSongSearch(req, res, Song_name);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch song" });
    }

}
async function handleDevApiStreamURL(req,res){
    try{
        const {Song_url} = req.query;
        if (!Song_url) return res.status(400).json({ error: "Song URL required" });
        await handleSongStream(req, res, Song_url);
    }catch(err){
        console.error(err);
        res.status(500).json({ error: "Failed to fetch song stream" });
    }

}
module.exports = {handleDevApiSearchURL,handleDevApiStreamURL}