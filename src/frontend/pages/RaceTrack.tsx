import React, { useEffect, useRef } from 'react';
import {Grid, Typography, Tooltip, TextField, Stack, Card, CardActionArea, CardMedia, CardContent} from '@mui/material';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { Bezier, Point, Offset} from 'bezier-js';
import { SegmentFactory, TrackSegment  } from '../modules/SegmentFactory';

type CanvasCircle = {
    centerx: number
    centery: number
    radius:number
}

type SegmentListDisplay = {
    name: string
    identifier: string
    selected: boolean
    editing: boolean
}

type Coordinate = {
    x: number
    y: number
}

type StraightLine = {
    length: number
    points: Point[]
}

type TrackSegmentO = {
    name: string
    description: StraightLine | Bezier
}

type HitResult = {
    hitPoint: Point
    identifier: string
    index: number
}




export default function RaceTrackBuildPage():JSX.Element {
    const navigate = useNavigate();
    const segmentsMap = useRef<Map<string, TrackSegmentO>>(new Map<string, TrackSegmentO>());
    const segmentsSelected = useRef<Set<string>>(new Set<string>());
    const segmentObjs = useRef<Map<string, TrackSegment>>(new Map<string, TrackSegment>());
    const editingIdent = useRef<string>("");
    const draggedPoint = useRef<HitResult>();
    const [segments_list, setSegmentsList] = React.useState<SegmentListDisplay[]>([]);
    const controlPointSize = useRef<number>(5);
    let start_point = React.useRef<{centerx: number, centery:number, raidus:number}>(null);

    // Create Staright line Button Attributes
    let [creating_straightline, setCS] = React.useState(false);
    let picking_spot = React.useRef<boolean>(false);
    let cameraOffset = { x: 0, y: 0 }
    let cameraZoom = 1
    let MAX_ZOOM = 5
    let MIN_ZOOM = 0.1
    let SCROLL_SENSITIVITY = 0.0005
    let isDragging = React.useRef<boolean>(false);
    let isDraggingControlPoints = React.useRef<boolean>(false);
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

        const curve2 = new Bezier(100+500,25+500 , 10,90 , 110+500,100+500 , 150,195);
        let factory = new SegmentFactory("Factory");
        let curveSegment = factory.createCubicBezierSegment("test", curve2);
        segmentObjs.current.set("test", curveSegment);
        append_curve(curve2);
        segmentMap2List();
         
        ctx.current.save();
        


        // Gets the relevant location from a mouse or single touch event

        canvas.addEventListener('mousedown', onPointerDown)
        canvas.addEventListener('mouseup', onPointerUp)
        canvas.addEventListener('mousemove', onPointerMove)
        canvas.addEventListener( 'wheel', (e) => adjustZoom(e.deltaY*SCROLL_SENSITIVITY, 0.1))
        window.requestAnimationFrame( draw )
    };
    useEffect(setup, []);
    
    function draw(timestamp) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Translate to the canvas centre before zooming - so you'll always zoom on what you're looking directly at

        ctx.current.restore();
        // ctx.current.translate( window.innerWidth / 2, window.innerHeight / 2 )
        ctx.current.scale(cameraZoom, cameraZoom)
        ctx.current.translate(cameraOffset.x,  cameraOffset.y )
        
        draw_racecourse(window.innerWidth, window.innerHeight, ctx.current, racecourse_img);
        
        segmentObjs.current.forEach((segment)=>{
            segment.draw(ctx.current);
        })

        if (start_point.current != null) {
            drawCircles(ctx.current, {centerx: start_point.current.centerx, centery: start_point.current.centery, radius: start_point.current.raidus});
        }
        
        window.requestAnimationFrame( draw )
    }


    function create_straightline() {
        picking_spot.current = !picking_spot.current;
        setCS(picking_spot.current);
    }

    function checkClickProximity(click:Coordinate, threshold:number):HitResult {
        let identList:string[] = [];
        segmentsSelected.current.forEach((segment)=>{
            identList.push(segment);
        });
        let hitList = identList.filter((ident)=>{
            let segment = segmentsMap.current.get(ident);
            if (isStraightLine(segment)) {
                // TODO This is for straight line 
                let straightSegment = segment.description as StraightLine;
                return proximity(straightSegment.points[0], click, threshold) || proximity(straightSegment.points[1], click, threshold);
            } else if (segment.description instanceof Bezier) {
                let flag = false;
                segment.description.points.forEach((point)=>{
                    if (proximity(point, click, threshold)){
                        flag = true;
                    }
                })
                return flag;
            } else {
                return false;
            }
        })
        if (hitList.length > 0) {
            let firstIdent = hitList.shift(); 

            let segment = segmentsMap.current.get(firstIdent);
            if ( isStraightLine(segment)) {
                // TODO This is for straight line 
                let straightSegment = segment.description as StraightLine;
                if (proximity(straightSegment.points[0], click, threshold)) {
                    return {hitPoint: straightSegment.points[0], identifier: firstIdent, index: 0};                    
                } else if (proximity(straightSegment.points[1], click, threshold)) {
                    return {hitPoint: straightSegment.points[1], identifier: firstIdent, index: 1};                    
                } else {
                    return null;
                }
            } else if (segment.description instanceof Bezier) {
                let flag = false;
                let resPoint:Point;
                let at = 0;
                segment.description.points.forEach((point, index)=>{
                    if (proximity(point, click, threshold) && !flag){
                        flag = true;
                        resPoint = point; 
                        at = index;
                    }
                })
                return flag ? {hitPoint: resPoint, identifier: firstIdent, index: at}: null;
            } else {
                return null;
            }
        }
        return null
    }

    function proximity(point: Point, click:Coordinate, threshold: number) {
        let distance = Math.sqrt(Math.pow(point.x - click.x, 2) + Math.pow(point.y - click.y, 2));
        return distance < threshold;
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
            isDraggingControlPoints.current = false;
            if (picking_spot.current) {
                console.log("Draw Start Point")
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
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x;
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y;
            let hitPoint = checkClickProximity({x: leftClickX, y:leftClickY}, controlPointSize.current)
            if (hitPoint != null) {
                isDraggingControlPoints.current = true;
                draggedPoint.current = hitPoint;
                console.log("Clicked on: ", hitPoint);
                console.log(segmentsMap.current.get(hitPoint.identifier).description.points[hitPoint.index]);
            }
        }
    }

    function onPointerMove(e:MouseEvent) {
        if (isDragging.current) {
            cameraOffset.x = getEventLocation(e).x/cameraZoom - dragStart.x
            cameraOffset.y = getEventLocation(e).y/cameraZoom - dragStart.y
        }else if (isDraggingControlPoints.current) {
            // console.log("Should be dragging one of the control points");
            let leftClickX = getEventLocation(e).x/cameraZoom - cameraOffset.x;
            let leftClickY = getEventLocation(e).y/cameraZoom - cameraOffset.y;
            let moveSegment = segmentsMap.current.get(draggedPoint.current.identifier);
            let newPoints:Point[] = [];
            moveSegment.description.points.forEach((point, index)=>{
                newPoints.push(point);
            });
            newPoints[draggedPoint.current.index] = {x: leftClickX, y:leftClickY};
            if (moveSegment.description instanceof Bezier) {
                if (moveSegment.description.points.length == 4) {
                    // cubic
                    moveSegment.description = new Bezier(newPoints[0].x, newPoints[0].y, newPoints[1].x, newPoints[1].y, newPoints[2].x, newPoints[2].y, newPoints[3].x, newPoints[3].y);
                } else if (moveSegment.description.points.length == 3) {
                    // quadratic
                    moveSegment.description = new Bezier(newPoints[0].x, newPoints[0].y, newPoints[1].x, newPoints[1].y, newPoints[2].x, newPoints[2].y);
                }
            } else if (isStraightLine(moveSegment)) {
                moveSegment.description.points = newPoints;
                moveSegment.description.length = calMag(newPoints[0], newPoints[1]);
            }
            segmentsMap.current.set(draggedPoint.current.identifier, moveSegment)
        }
    }

    function drawCurve(context: CanvasRenderingContext2D, curve: Bezier, control_point_size: number, withControlPoints: boolean):void {

        if (curve.points.length == 4){
            const p = curve.points;
            context.beginPath();
            context.moveTo(p[0].x,p[0].y);
            context.bezierCurveTo(p[1].x,p[1].y, p[2].x,p[2].y, p[3].x,p[3].y);
            context.stroke();
            if (withControlPoints) {
                drawControlPoints(context, curve, control_point_size / 2);
            }
            drawCurvDirection(context, curve, 4, 4, 3);
        } else if(curve.points.length == 3){
            const p = curve.points;
            context.beginPath();
            context.moveTo(p[0].x, p[0].y);
            context.quadraticCurveTo(p[1].x, p[1].y, p[2].x, p[2].y);
            context.stroke();
            if (withControlPoints) {
                drawControlPoints(context, curve, control_point_size / 2);
            }
            drawCurvDirection(context, curve, 4, 4, 3);
        } else {
            console.log("Not the kind of curve I can handle right now!");
        }
    }

    function drawCurvDirection(context: CanvasRenderingContext2D, curve: Bezier, tipScale: number, tipScaleH: number, count: number) {
        let step = 1 / count;
        for (let index = 0; index < count; index++) {
            let t = (index + 1) * step;
            let arrowBaseMidpoint = curve.get(t);
            let tangentUnitVector = curve.derivative(t)
            let normalUnitVector = curve.normal(t);
            let revNormalUnitVector:Point = {x: -normalUnitVector.x, y: -normalUnitVector.y};
            tangentUnitVector = calculateUnitVector(tangentUnitVector);
            let arrowTip1:Point = {x: arrowBaseMidpoint.x + tangentUnitVector.x * tipScale, y: arrowBaseMidpoint.y + tangentUnitVector.y * tipScale};
            let arrowTip2:Point = {x: arrowBaseMidpoint.x + normalUnitVector.x * tipScaleH, y: arrowBaseMidpoint.y + normalUnitVector.y * tipScaleH};
            let arrowTip3:Point = {x: arrowBaseMidpoint.x + revNormalUnitVector.x * tipScaleH, y: arrowBaseMidpoint.y + revNormalUnitVector.y * tipScaleH};
            context.beginPath();
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip2.x, arrowTip2.y);
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip3.x, arrowTip3.y);
            context.stroke();
        }
    }

    function calculateUnitVector(vector: Point) {
        let mag = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
        return {x: vector.x / mag, y: vector.y / mag};
    }

    function drawControlPoints(context:CanvasRenderingContext2D , curve: Bezier, radius:number) {

        curve.points.forEach((point)=>{
            let control_point:CanvasCircle = {centerx: point.x, centery: point.y, radius: radius};
            drawCircles(context, control_point);
        });
        context.setLineDash([5, 15]);

        if (curve.points.length == 4) {
            context.moveTo(curve.points[0].x, curve.points[0].y);
            context.lineTo(curve.points[1].x, curve.points[1].y);
            context.moveTo(curve.points[2].x, curve.points[2].y);
            context.lineTo(curve.points[3].x, curve.points[3].y);
            context.stroke();
        } else if (curve.points.length == 3) {
            context.moveTo(curve.points[0].x, curve.points[0].y);
            context.lineTo(curve.points[1].x, curve.points[1].y);
            context.lineTo(curve.points[2].x, curve.points[2].y);
            context.stroke();
        } else {
            console.log("Not the kind of curve I can handle right now!");
        }
        context.setLineDash([]);

    }

    function drawCircles(context: CanvasRenderingContext2D, circle: CanvasCircle):void {
        context.moveTo(circle.centerx, circle.centery);
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

    function append_curve(curve:Bezier) {
        if (curve == null) {
            curve = new Bezier(100+500,25 , 10,90 , 110+500,100 , 150,195);
        }
        let ident = Date.now().toString();
        segmentsMap.current.set(ident, {name: "default", description: curve});
        segmentMap2ListFresh();
    }

    function append_straightTrack(straightTrack: StraightLine) {
        let ident = Date.now().toString();
        segmentsMap.current.set(ident, {name: "default", description: straightTrack});
        segmentMap2ListFresh();
    }

    function segmentMap2ListFresh() {
        let segment_list:SegmentListDisplay[] = [];
        segmentsMap.current.forEach((segment, identifier)=>{
            segment_list.push({name: segment.name,identifier: identifier, selected: false, editing: identifier == editingIdent.current? true:false});
        });
        setSegmentsList(segment_list);
        segmentsSelected.current.clear();
    }

    function segmentMap2List() {
        let segment_list:SegmentListDisplay[] = [];
        segmentsMap.current.forEach((segment, identifier)=>{
            segment_list.push({name: segment.name,identifier: identifier, selected: segmentsSelected.current.has(identifier) ? true: false, editing: identifier == editingIdent.current ? true: false});
        });
        setSegmentsList(segment_list);
    }

    function adjustZoom(zoomAmount, zoomFactor) {
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
        if (e.shiftKey) {
            // console.log("Shift is Pressed");
            if (segmentsSelected.current.has(e.currentTarget.id)) {
                segmentsSelected.current.delete(e.currentTarget.id);
            } else {
                segmentsSelected.current.add(e.currentTarget.id);
            }
        } else {
            // Selecting one segment
            if (e.currentTarget.id == editingIdent.current) {
                // console.log("Clicking on Editing Segment");
                e.preventDefault();
            } else if (segmentsSelected.current.size > 1) {
                segmentsSelected.current.clear();
                segmentsSelected.current.add(e.currentTarget.id);
            } else if (segmentsSelected.current.size == 1) {
                if (segmentsSelected.current.has(e.currentTarget.id)) {
                    segmentsSelected.current.delete(e.currentTarget.id);
                } else {
                    segmentsSelected.current.clear();
                    segmentsSelected.current.add(e.currentTarget.id);
                }
            }else {
                segmentsSelected.current.add(e.currentTarget.id);
            }
        }
        segmentMap2List();
        
    }

    function doubleClickedCard(e: React.MouseEvent) {
        if (e.button == 0) {
            // left double clicked
            // console.log("double clicked");
            editingIdent.current = e.currentTarget.id;
            segmentMap2ListFresh();
        }
    }

    function deleteSelectedSegments() {
        if (segmentsSelected.current.size == 0) {
            alert("沒有選取的線段");
            // console.log("Nothing to be deleted")
        }
        segmentsSelected.current.forEach((segmengIdent)=>{
            if (segmentsMap.current.has(segmengIdent)) {
                segmentsMap.current.delete(segmengIdent);
            }
        })
        segmentsSelected.current.clear();
        segmentMap2List();
    }
    

    function onClickAppendCurve(e: React.MouseEvent<HTMLButtonElement>) {
        append_curve(null);
    }

    function onTextFieldBlur(e: React.FocusEvent<HTMLInputElement>){
        // console.log("Text field out of focus");
        e.currentTarget.id
        editingIdent.current = "";
        segmentMap2List();
    }

    function onTextFieldFocus(e: React.FocusEvent<HTMLInputElement>) {}

    function onSegmentNameChange(e: React.ChangeEvent<HTMLInputElement>, segmentIdent:string) {
        if (e.target.value == "") {
            return
        } else {
            let segment = segmentsMap.current.get(segmentIdent);
            segment.name = e.target.value;
            segmentsMap.current.set(segmentIdent, segment);
        }
    }

    function experiment() {
        segmentsMap.current.forEach((segment)=>{
            if (isStraightLine(segment)) {
                console.log(segment.name, "is a straight line")
            } else {
                console.log(segment.name, "is not a straight line")
            }
        });
    }

    function isStraightLine(segment: TrackSegmentO){
        return segment.description.hasOwnProperty("length")
    }

    function calMag(point1: Point, point2: Point) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
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
                <Button  onClick={deleteSelectedSegments} variant="contained">刪除選取的線段</Button>
                <Button  onClick={create_straightline} variant="contained" color={creating_straightline? "success": "primary"}>{creating_straightline? "新增直線中": "新增直線"}</Button>
            </Stack>
            <Card sx={{ maxWidth: 345 }} style={{position:"absolute", top: 100, left: "80vw", width: "10vw", maxHeight:"40vh", overflowY:"scroll", opacity: 0.5}} >
                <Stack spacing={1} style={{width: "100%"}}>

                    {segments_list.map((segment)=>{
                        return (
                            <Card style={{width: "100%", background: segment.selected? "#47e664": "white"}} key={segment.identifier}>
                                <CardActionArea id={segment.identifier} onClick={clickedCard} onDoubleClick={doubleClickedCard}>
                                    <CardContent style={{textAlign: 'center'}}>
                                        { segment.editing? 
                                            <TextField
                                                fullWidth
                                                required
                                                label="線段名稱"
                                                id={segment.identifier+"Name"}
                                                sx={{ mt: 1, /*width: '25ch'*/ }}
                                                variant="filled"
                                                InputProps={{
                                                    inputProps: {min:0}
                                                }}
                                                onChange={(e:React.ChangeEvent<HTMLInputElement>)=>{onSegmentNameChange(e, segment.identifier)}}
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
