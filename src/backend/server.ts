// import * as express from "express";
import express from "express";
import path from "path";
import { VectorCal } from "../frontend/modules/Utils";
import fs from "fs/promises";
import { json } from "stream/consumers";
import { Bezier } from "bezier-js";
import { first } from "lodash";

require('dotenv').config();

type SegmentData = {
    name: string;
    type: string;
    scale: number;
    curves: {
        segmentType: string;
        points: {
            x: number;
            y: number;
        }[];
    }[]
}
let jsonData: SegmentData;
// Read the JSON file
fs.readFile(path.join(__dirname, '/bezier_curves.json'), 'utf8').then((data) => {
  
    // Parse the JSON data
    jsonData = JSON.parse(data) as SegmentData;
    const sampleCurve = new Bezier(100,25 , 10,90 , 110,100 , 150,195);
    let arcs = sampleCurve.arcs();
    let firstArc = arcs[0];
    let secondArc = arcs[1];
    console.log(firstArc, secondArc);
    let endPoint = sampleCurve.get(firstArc.interval.end);
    let startPoint = sampleCurve.get(secondArc.interval.start);


    console.log(jsonData.scale);
    // Do something with the JSON data
}).catch((reason)=>{
    console.log(reason);
});


const app = express();

// Serve the static files from the React app
app.use(express.static(path.resolve(__dirname, "..")));


app.get("/bezierCurve", (req, res)=>{
    console.log("got your req");
    res.status(200).send(JSON.stringify(jsonData));
})

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(path.resolve(__dirname, ".."), '/index.html'));
});

const port = process.env.PORT || 5000;
app.listen(port);

console.log('App is listening on port ' + port);
