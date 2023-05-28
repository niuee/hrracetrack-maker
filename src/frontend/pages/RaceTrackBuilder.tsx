import React, { useEffect, useRef } from 'react';
import {Grid, Typography, Tooltip, TextField, Stack, Card, CardActionArea, CardMedia, CardContent} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bezier, Point, Offset} from 'bezier-js';
import { SegmentFactory, TrackSegment  } from '../modules/SegmentFactory';
import { TrackSegmentObserver } from '../modules/TrackSegmentObserver';
import { TrackSegmentMediator } from '../modules/BuilderPageMediator';
import { generateUUID } from 'three/src/math/MathUtils';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';

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

export enum ViewMode {
    OBJECT = "OBJECT",
    EDIT = "EDIT",
}


export default function RaceTrackBuilder():JSX.Element {
    const navigate = useNavigate();
    const tracksegmentMediator = useRef<TrackSegmentMediator>(new TrackSegmentMediator());
    const tracksegmentMaker = useRef<SegmentFactory>(new SegmentFactory("factory"));
    const requestRef = React.useRef<number>();
    const [segmentsList, setSegmentsList] = React.useState<SegmentListDisplay[]>([]);
    const [viewMode, setviewMode] = React.useState<ViewMode>(ViewMode.OBJECT);
    let start_point = React.useRef<{centerx: number, centery:number, raidus:number}>(null);


    // Create Staright line Button Attributes
    const [creating_straightline, setCS] = React.useState(false);
    const [selectedImage, setSelectedImage] = React.useState(null);
    const [imgString, setImgString] = React.useState("");
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
        window.addEventListener('keydown', (e) => {
            if (e.altKey) {
                switchMode();
            }
        });
        requestRef.current = requestAnimationFrame(draw);
        return ()=>{cancelAnimationFrame(requestRef.current)}
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
        setviewMode((curViewMode)=>{
            tracksegmentMediator.current.drawSegments(ctx.current, curViewMode);
            return curViewMode;
        })
        draw_racecourse(window.innerWidth, window.innerHeight, ctx.current, racecourse_img);
        if (start_point.current != null) {
            drawCircles(ctx.current, {centerx: start_point.current.centerx, centery: start_point.current.centery, radius: start_point.current.raidus});
        }
        
        requestRef.current = requestAnimationFrame(draw);
    }




    function getEventLocation(e) {
        if (e.touches && e.touches.length == 1) {
            return { x:e.touches[0].clientX, y: e.touches[0].clientY }
        } else if (e.clientX && e.clientY) {
            return { x: e.clientX, y: e.clientY }        
        }
    }

    function onPointerUp(e: MouseEvent) {
        if (e.button == 0) {
            isDragging.current = false
            lastZoom = cameraZoom
            let convertCoord = getEventLocation(e);
            if (convertCoord != null){
                let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x;
                let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y;
                tracksegmentMediator.current.clearDraggedControlPoint();
                if (picking_spot.current) {
                    start_point.current = {
                        centerx: leftClickX,
                        centery: leftClickY,
                        raidus: 100
                    };
                }
            }
        }
    }

    function onPointerDown(e: MouseEvent) {
        let convertCoord = getEventLocation(e);
        if (convertCoord == null){
            return;
        }
        if (e.button == 0 && e.metaKey) {
            isDragging.current = true;
            dragStart.x = getEventLocation(e).x/cameraZoom - cameraOffset.x
            dragStart.y = getEventLocation(e).y/cameraZoom - cameraOffset.y
        } else if (e.button == 0) {
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x - (window.innerWidth / 2 / cameraZoom);
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y - (window.innerHeight / 2 / cameraZoom);
            console.log(leftClickX, leftClickY);
            tracksegmentMediator.current.checkSegmentControlPointClicked({x: leftClickX, y: leftClickY})
        }
    }

    function onPointerMove(e:MouseEvent) {
        let convertCoord = getEventLocation(e);
        if (convertCoord == null){
            return;
        }
        if (isDragging.current) {
            cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
            cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
        } else if (e.button == 0) {
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x - (window.innerWidth / 2 / cameraZoom);
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y - (window.innerHeight / 2 / cameraZoom);
            tracksegmentMediator.current.moveDraggedPoint(e, {x: leftClickX, y: leftClickY});
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



    function clickedCard(e:React.MouseEvent<HTMLButtonElement>) {
        // console.log(e.currentTarget.id);
        // console.log(segmentsMap.current.get(e.currentTarget.id));
        if (viewMode == ViewMode.EDIT) {
            return;
        }
        tracksegmentMediator.current.clickedOnSegment(e.shiftKey, e.currentTarget.id);
        setSegmentsList(tracksegmentMediator.current.getSegmentList());
    }

    function doubleClickedCard(e: React.MouseEvent) {
        if (viewMode == ViewMode.EDIT) {
            return;
        }
        if (e.button == 0) {
            // left double clicked
            // console.log("double clicked");
            tracksegmentMediator.current.doubleClickedOnSegment(e.currentTarget.id);
            setSegmentsList(tracksegmentMediator.current.getSegmentList());
        }
    }

    function onClickdeleteSelectedSegments() {
        if (tracksegmentMediator.current.getSelectedSegmentSize() == 0) {
            alert("沒有選取的線段");
            // console.log("Nothing to be deleted")
            return
        }
        tracksegmentMediator.current.deleteSelectedSegment();
        setSegmentsList(tracksegmentMediator.current.getSegmentList());
    }


    function onClickAppendStraightline() {
        let startPoint:Point = {x: 500, y: 500};
        let endPoint:Point = {x: 500 + 200, y:500};
        tracksegmentMediator.current.addSegment(Date.now().toString(), tracksegmentMaker.current.createStraightSegment("default", startPoint, endPoint));
        setSegmentsList(tracksegmentMediator.current.getSegmentList());
    }

    function onClickAppendCurve(e: React.MouseEvent<HTMLButtonElement>) {
        let xoffset = window.innerWidth / 2;
        let yoffset = window.innerHeight / 2;
        let scaleUp = 100;
        let curve = new Bezier({x: xoffset + -1 * scaleUp, y: yoffset + 0*scaleUp}, {x: xoffset + -0.5*scaleUp, y: yoffset + 0.5*scaleUp}, {x: xoffset + 2*scaleUp, y: yoffset + 0*scaleUp}, {x: xoffset + 1*scaleUp, y: yoffset + 0*scaleUp});
        tracksegmentMediator.current.addSegment(Date.now().toString(), tracksegmentMaker.current.createCubicBezierSegment("default", curve));
        setSegmentsList(tracksegmentMediator.current.getSegmentList());
    }

    function onTextFieldBlur(e: React.FocusEvent<HTMLInputElement>){
        // console.log("Text field out of focus");
        tracksegmentMediator.current.clearEditingStatus();
        setSegmentsList(tracksegmentMediator.current.getSegmentList());
    }

    function onTextFieldFocus(e: React.FocusEvent<HTMLInputElement>) {}

    function onSegmentNameChange(e: React.ChangeEvent<HTMLInputElement>, segmentIdent:string) {
        if (e.target.value == "") {
            return
        } else {
            tracksegmentMediator.current.renameSegment(segmentIdent, e.target.value);
        }
    }

    function experiment() {
        fetch("/bezierCurve").then((res)=>{
            let scale = 1000;
            res.json().then((track:TrackData)=>{
                let curves = track.curves;
                curves.forEach((curve)=>{
                    curve.curveSegments.forEach((segment)=>{
                        segment.points = segment.points.map((point)=>{
                            return {x: point.x * scale, y: -point.y * scale};
                        });
                        if (segment.segmentType == 'cubic') {
                            tracksegmentMediator.current.addSegment(generateUUID(), tracksegmentMaker.current.createCubicBezierSegment("default", new Bezier(segment.points)));
                        } else {
                            tracksegmentMediator.current.addSegment(generateUUID(), tracksegmentMaker.current.createStraightSegment("default", segment.points[0], segment.points[1]));
                        }
                    });
                });
                setSegmentsList(tracksegmentMediator.current.getSegmentList());
            });
        })
    }


    function onChangeUploadImage(event: React.ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files[0]) {
            let something = event.target.files[0];
            const reader = new FileReader();
            reader.readAsDataURL(event.target.files[0]);
            reader.onloadend = () => {
                // Use a regex to remove data url part
                let  resString = reader.result as string
                const base64String = resString.replace('data:', '').replace(/^.+,/, '');  
                setImgString(base64String);
            };
        }
    } 

    function switchMode() {
        setviewMode((curMode)=>{
            if (curMode == ViewMode.OBJECT) {
                return ViewMode.EDIT
            } else {
                return ViewMode.OBJECT
            }
        });
    }


    return (
        <div style={{position: 'relative'}}>
            <canvas id="canvas" style={{position:'absolute', top: 0, left: 0, width: "100%", height:"100vh", margin: "none"}}></canvas>
            <img id="racecourse_overlay" style={{display: "none"}} src={`data:image/jpeg;base64,${imgString}`} alt="racecourse" />

            <Stack alignItems={'center'} spacing={2}style={{position: "absolute", margin:"50px", width: "10vw"}} >
                <div>
                    <Button onClick={()=>{navigate("/")}} variant="contained">回到首頁</Button>
                </div>
                <Button  onClick={onClickAppendCurve} variant="contained">新增曲線</Button>
                <Button  onClick={experiment} variant="contained">測試按鈕</Button>
                <Button  onClick={onClickdeleteSelectedSegments} variant="contained">刪除選取的線段</Button>
                <Button  onClick={onClickAppendStraightline} variant="contained" >新增直線</Button>
                <Button
                    variant="contained"
                    component="label">
                    上傳賽道底圖
                    <input
                        onChange={onChangeUploadImage}
                        type="file"
                        hidden
                    />
                </Button>
                <Button  onClick={() => {setSelectedImage(null)}} variant="contained" >重設成預設賽道底圖</Button>
            </Stack>
            <Stack alignItems={'center'} spacing={2}style={{position:"absolute", top: 100, left: "80vw", width: "10vw" }} >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}>
                    {viewMode == ViewMode.OBJECT? <ViewInArIcon />: <WidgetsOutlinedIcon/>}   
                    <span>  {viewMode} 模式</span>
                </div>  
                <Card sx={{ maxWidth: 345 }} style={{width: "10vw", maxHeight:"40vh", overflowY:"scroll", opacity: 0.5}}>
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
                                            "線段:" + segment.name}
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            );
                        })}
                    </Stack>
                </Card>
            </Stack>
        </div>
    )
}
