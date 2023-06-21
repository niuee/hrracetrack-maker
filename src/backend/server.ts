// import * as express from "express";
import express from "express";
import path from "path";
import { VectorCal } from "../frontend/modules/Utils";
import fs from "fs/promises";
import { Bezier } from "bezier-js";

require('dotenv').config();
let serverPort = process.argv[2];
// console.log("PORT:", serverPort);

export type TrackData = {
    curves: CurveData[];
    scale: number
}

export type CurveData = {
    name: string;
    curveSegments: {
        segmentType: string;
        points: {
            x: number;
            y: number;
        }[];
    }[]
}

// let jsonData: TrackData;
// Read the JSON file
// fs.readFile(path.join(__dirname, '/bezier_curves_2.json'), 'utf8').then((data) => {
  
//     // Parse the JSON data
//     jsonData = JSON.parse(data) as TrackData;
//     // Do something with the JSON data
// }).catch((reason)=>{
//     console.log(reason);
// });


const app = express();

// Serve the static files from the React app
app.use(express.static(path.resolve(__dirname, "..")));


// app.get("/bezierCurve", (req, res)=>{
//     res.status(200).send(JSON.stringify(jsonData));
// })

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(path.resolve(__dirname, ".."), '/index.html'));
});

const port = serverPort || process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
