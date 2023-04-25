import React, { useEffect, useRef } from 'react';
import {Grid, Typography, Tooltip, TextField, Stack, Card, CardActionArea, CardMedia, CardContent} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Bezier, Point, Offset} from 'bezier-js';
import { SegmentFactory, TrackSegment  } from '../modules/SegmentFactory';
import { TrackSegmentObserver } from '../modules/TrackSegmentObserver';
import { uniqueId } from 'lodash';
import { generateUUID } from 'three/src/math/MathUtils';

type CanvasCircle = {
    centerx: number
    centery: number
    radius:number
}

type SegmentListDisplay = {
    name: string
    ident: string
    selected: boolean
    editing: boolean
}

type SegmentData = {
    name: string;
    type: string;
    curveSegments: {
        segmentType: string;
        points: {
            x: number;
            y: number;
        }[];
    }[]
}


export default function RaceTrackBuildCircularArcPage():JSX.Element {
    const navigate = useNavigate();
    const tracksegmentObserver = useRef<TrackSegmentObserver>(new TrackSegmentObserver());
    const tracksegmentMaker = useRef<SegmentFactory>(new SegmentFactory("factory"));
    const [segmentsList, setSegmentsList] = React.useState<SegmentListDisplay[]>([]);

    let start_point = React.useRef<{centerx: number, centery:number, raidus:number}>(null);


    // Create Staright line Button Attributes
    let [creating_straightline, setCS] = React.useState(false);
    let picking_spot = React.useRef<boolean>(false);

    let cameraOffset = { x: -window.innerWidth / 2, y: -window.innerHeight / 2 }
    let cameraZoom = 1
    let MAX_ZOOM = 5
    let MIN_ZOOM = 0.1
    let SCROLL_SENSITIVITY = 0.0005
    let isDragging = React.useRef<boolean>(false);
    let dragStart = { x: 0, y: 0 }
    let lastZoom = cameraZoom
    let img_loaded = false;
    let canvas:HTMLCanvasElement;
    let racecourse_img:HTMLImageElement;
    let ctx = React.useRef<CanvasRenderingContext2D>();

    const setup = () => {
        canvas = document.getElementById("canvas") as HTMLCanvasElement
        racecourse_img = document.getElementById("racecourse_overlay") as HTMLImageElement
        ctx.current = canvas.getContext("2d");
        racecourse_img.onload = function() {
            img_loaded = true;
        }

         
        ctx.current.save();
        


        // Gets the relevant location from a mouse or single touch event

        canvas.addEventListener('mousedown', onPointerDown)
        canvas.addEventListener('mouseup', onPointerUp)
        canvas.addEventListener('mousemove', onPointerMove)
        canvas.addEventListener( 'wheel', (e) => adjustZoom(e, e.deltaY*SCROLL_SENSITIVITY, 0.1))
        window.requestAnimationFrame( draw );
    };
    useEffect(setup, []);
    
    function draw(timestamp) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at

        ctx.current.restore();
        ctx.current.translate( window.innerWidth / 2, window.innerHeight / 2 )
        ctx.current.scale(cameraZoom, cameraZoom)
        ctx.current.translate(cameraOffset.x,  cameraOffset.y )
        
        draw_racecourse(window.innerWidth, window.innerHeight, ctx.current, racecourse_img);
        tracksegmentObserver.current.drawSegments(ctx.current); 
        if (start_point.current != null) {
            drawCircles(ctx.current, {centerx: start_point.current.centerx, centery: start_point.current.centery, radius: start_point.current.raidus});
        }
        
        window.requestAnimationFrame( draw )
    }




    function getEventLocation(e) {
        if (e.touches && e.touches.length == 1) {
            return { x:e.touches[0].clientX, y: e.touches[0].clientY }
        } else if (e.clientX && e.clientY) {
            return { x: e.clientX, y: e.clientY }        
        }
    }

    function onPointerUp(e: MouseEvent) {
        if (e.button == 1) {
            isDragging.current = false
            lastZoom = cameraZoom
        } else if (e.button == 0){
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x;
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y;
            tracksegmentObserver.current.clearDraggedControlPoint();
            if (picking_spot.current) {
                start_point.current = {
                    centerx: leftClickX,
                    centery: leftClickY,
                    raidus: 100
                };
            }
        }
    }

    function onPointerDown(e) {
        if (e.which == 2) {
            isDragging.current = true;
            dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
            dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
        } else if (e.which == 1) {
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x - (window.innerWidth / 2 / cameraZoom);
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y - (window.innerHeight / 2 / cameraZoom);
            console.log(leftClickX, leftClickY);
            tracksegmentObserver.current.checkSegmentControlPointClicked({x: leftClickX, y: leftClickY})
        }
    }

    function onPointerMove(e:MouseEvent) {
        if (isDragging.current) {
            cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
            cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
        } else if (e.button == 0) {
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x - (window.innerWidth / 2 / cameraZoom);
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y - (window.innerHeight / 2 / cameraZoom);
            tracksegmentObserver.current.moveDraggedPoint(e, {x: leftClickX, y: leftClickY});
        }
    }


    function drawCircles(context: CanvasRenderingContext2D, circle: CanvasCircle):void {
        context.moveTo(circle.centerx, circle.centery);
        context.setLineDash([])
        context.beginPath();
        context.arc(circle.centerx, circle.centery, circle.radius, 0, Math.PI * 2, true); // Outer circle
        context.stroke();
    }

    function draw_racecourse(canvas_width: number, canvas_height:number, context:CanvasRenderingContext2D, image:HTMLImageElement) {
        if (img_loaded){
            context.globalAlpha = 0.4;
            let image_ratio = image.height / image.width;
            let draw_width = canvas_width * 0.8;
            let draw_height =  draw_width * image_ratio;
            context.drawImage(image, canvas_width / 2 - draw_width / 2, canvas_height / 2 - draw_height / 2, draw_width, draw_height);
            context.globalAlpha = 1;
        }
    }

    function adjustZoom(e, zoomAmount, zoomFactor) {
        // if (e.ctrlKey) {
        //     e.preventDefault();
        //     e.stopImmediatePropagation();
        //     if (zoomAmount) {
        //         zoomAmount = -1 * zoomAmount;
        //         cameraZoom += zoomAmount
        //     } else if (zoomFactor) {
        //         // console.log(zoomFactor)
        //         cameraZoom = zoomFactor*lastZoom
        //     }
            
        //     cameraOffset.x = getEventLocation(e).x / cameraZoom - cameraOffset.x;
        //     cameraOffset.y = getEventLocation(e).y / cameraZoom - cameraOffset.y;
        //     cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
        //     cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
        //     return;
        //     // perform desired zoom action here
        // } else {
        //     cameraOffset.x += -e.deltaX/cameraZoom //+ dragStart.x
        //     cameraOffset.y += -e.deltaY/cameraZoom //+ dragStart.y
        //     e.preventDefault();
        //     e.stopImmediatePropagation();
        //     return;
        // }
        if (!isDragging.current) {
            if (zoomAmount) {
                cameraZoom += zoomAmount
            } else if (zoomFactor) {
                // console.log(zoomFactor)
                cameraZoom = zoomFactor*lastZoom
            }
            
            cameraZoom = Math.min( cameraZoom, MAX_ZOOM )
            cameraZoom = Math.max( cameraZoom, MIN_ZOOM )
            // console.log(zoomAmount)
        }
    }

    function onGesture(event) {
        console.log("gesture test");
    }


    function clickedCard(e:React.MouseEvent<HTMLButtonElement>) {
        // console.log(e.currentTarget.id);
        // console.log(segmentsMap.current.get(e.currentTarget.id));
        tracksegmentObserver.current.clickedOnSegment(e.shiftKey, e.currentTarget.id);
        setSegmentsList(tracksegmentObserver.current.getSegmentList());
    }

    function doubleClickedCard(e: React.MouseEvent) {
        if (e.button == 0) {
            // left double clicked
            // console.log("double clicked");
            tracksegmentObserver.current.doubleClickedOnSegment(e.currentTarget.id);
            setSegmentsList(tracksegmentObserver.current.getSegmentList());
        }
    }

    function onClickdeleteSelectedSegments() {
        if (tracksegmentObserver.current.getSelectedSegmentSize() == 0) {
            alert("沒有選取的線段");
            // console.log("Nothing to be deleted")
            return
        }
        tracksegmentObserver.current.deleteSelectedSegment();
        setSegmentsList(tracksegmentObserver.current.getSegmentList());
    }


    function onClickAppendStraightline() {
        let startPoint:Point = {x: 500, y: 500};
        let endPoint:Point = {x: 500 + 200, y:500};
        tracksegmentObserver.current.addSegment(Date.now().toString(), tracksegmentMaker.current.createStraightSegment("default", startPoint, endPoint));
        setSegmentsList(tracksegmentObserver.current.getSegmentList());
    }

    function onClickAppendCurve(e: React.MouseEvent<HTMLButtonElement>) {
        let xoffset = window.innerWidth / 2;
        let yoffset = window.innerHeight / 2;
        let scaleUp = 100;
        let curve = new Bezier({x: xoffset + -1 * scaleUp, y: yoffset + 0*scaleUp}, {x: xoffset + -0.5*scaleUp, y: yoffset + 0.5*scaleUp}, {x: xoffset + 2*scaleUp, y: yoffset + 0*scaleUp}, {x: xoffset + 1*scaleUp, y: yoffset + 0*scaleUp});
        tracksegmentObserver.current.addSegment(Date.now().toString(), tracksegmentMaker.current.createCubicBezierSegment("default", curve));
        setSegmentsList(tracksegmentObserver.current.getSegmentList());
    }

    function onTextFieldBlur(e: React.FocusEvent<HTMLInputElement>){
        // console.log("Text field out of focus");
        tracksegmentObserver.current.clearEditingStatus();
        setSegmentsList(tracksegmentObserver.current.getSegmentList());
    }

    function onTextFieldFocus(e: React.FocusEvent<HTMLInputElement>) {}

    function onSegmentNameChange(e: React.ChangeEvent<HTMLInputElement>, segmentIdent:string) {
        if (e.target.value == "") {
            return
        } else {
            tracksegmentObserver.current.renameSegment(segmentIdent, e.target.value);
        }
    }

    function experiment() {
        fetch("/bezierCurve").then((res)=>{
            
            console.log("got response");
            res.json().then((curves:SegmentData[])=>{
                curves.forEach(curve => {
                    curve.curveSegments.forEach((segment)=>{
                        console.log(segment);
                        if (segment.segmentType != "straight") {
                            tracksegmentObserver.current.addSegment(generateUUID() , tracksegmentMaker.current.createCubicBezierSegment("default", new Bezier(segment.points)));
                        } else {
                            tracksegmentObserver.current.addSegment(generateUUID(), tracksegmentMaker.current.createStraightSegment("default", segment.points[0], segment.points[1]));
                        }
                    })
                });
                setSegmentsList(tracksegmentObserver.current.getSegmentList());
            })
        })
    }


    return (
        <div style={{position: 'relative'}}>
            <canvas id="canvas" style={{position:'absolute', top: 0, left: 0, width: "100%", height:"100vh", margin: "none"}}></canvas>
            <img id="racecourse_overlay" style={{display: "none"}}src="./tyk_racecourse.jpg" alt="racecourse" />
            <Stack alignItems={'center'} spacing={2}style={{position:"absolute", margin:"50px", width: "10vw"}} >
                <div>
                    <Button onClick={()=>{navigate("/")}} variant="contained">回到首頁</Button>
                </div>
                <Button  onClick={onClickAppendCurve} variant="contained">新增曲線</Button>
                <Button  onClick={experiment} variant="contained">測試按鈕</Button>
                <Button  onClick={onClickdeleteSelectedSegments} variant="contained">刪除選取的線段</Button>
                <Button  onClick={onClickAppendStraightline} variant="contained" >新增直線</Button>
            </Stack>
            <Card sx={{ maxWidth: 345 }} style={{position:"absolute", top: 100, left: "80vw", width: "10vw", maxHeight:"40vh", overflowY:"scroll", opacity: 0.5}} >
                <Stack spacing={1} style={{width: "100%"}}>

                    {segmentsList.map((segment)=>{
                        return (
                            <Card style={{width: "100%", background: segment.selected? "#47e664": "white"}} key={segment.ident}>
                                <CardActionArea id={segment.ident} onClick={clickedCard} onDoubleClick={doubleClickedCard}>
                                    <CardContent style={{textAlign: 'center'}}>
                                        { segment.editing? 
                                            <TextField
                                                fullWidth
                                                required
                                                label="線段名稱"
                                                id={segment.ident+"Name"}
                                                sx={{ mt: 1, /*width: '25ch'*/ }}
                                                variant="filled"
                                                InputProps={{
                                                    inputProps: {min:0}
                                                }}
                                                onChange={(e:React.ChangeEvent<HTMLInputElement>)=>{onSegmentNameChange(e, segment.ident)}}
                                                onBlur={onTextFieldBlur}
                                                onFocus={onTextFieldFocus}
                                                // error={tankerIdFieldError}
                                                // helperText={tankerIdFieldErrorHelperText}
                                            />:
                                        "線段；" + segment.name}
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Stack>
            </Card>
        </div>
    )
}
