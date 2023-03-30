// import * as express from "express";
import express from "express";
import path from "path";
import { Bezier } from "bezier-js";
import { add } from "./test";
require('dotenv').config();


console.log(add(1, 2));

const app = express();

// Serve the static files from the React app
app.use(express.static(path.resolve(__dirname, "..")));

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(path.resolve(__dirname, ".."), '/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
