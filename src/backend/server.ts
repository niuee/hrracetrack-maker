// import * as express from "express";
import express from "express";
import path from "path";
import { VectorCal } from "../frontend/modules/Utils";
import fs from "fs/promises";
import { Bezier } from "bezier-js";

require('dotenv').config();
let serverPort = process.argv[2];
// console.log("PORT:", serverPort);


const app = express();

// Serve the static files from the React app
console.log(path.resolve(__dirname, ".."))
app.use(express.static(path.resolve(__dirname, "..")));


app.get('/racetrack-maker/', (req,res) =>{
    console.log("Got request");
    res.sendFile(path.join(path.resolve(__dirname, ".."), '/index.html'));
});

app.get('/racetrack-maker/builder', (req,res) =>{
    console.log("Got request");
    res.sendFile(path.join(path.resolve(__dirname, ".."), '/index.html'));
});

app.get("*", (req, res)=>{
    res.redirect("/racetrack-maker/");
})

const port = serverPort || process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
