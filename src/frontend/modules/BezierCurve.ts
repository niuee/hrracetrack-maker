import { GUIElement } from "./SegmentFactory";
import { PointCal} from "point2point";
import { Bezier } from "bezier-js";

export type Point = {
    x: number,
    y: number,
    z?: number
}

export enum HandleType {
    VECTOR = 1,
    ALIGNED,
    FREE
}

export enum TrackType {
    STRAIGHT = "STRAIGHT",
    CURVE = "CURVE",
}

export type Track = {
    tracktype: TrackType,
    startPoint: Point,
    endPoint: Point,
    angleSpan?: number,
    radius?: number,
    slope?: number,
    center?: Point,
}

type HandlePoint = {
    coord: Point,
    transformedCoord: Point,
    handleType: HandleType,
}

type ControlPoint = {
    coord: Point, // this is the local coordinate relative to an anchor point
    transformedCoord: Point, // this is the absolute coordinate that is going to be plotted on the canvas
    left_handle:  HandlePoint,
    right_handle: HandlePoint,
    slope?: number,
}

type BezierCurveArg = {
    anchorPoint?: Point,
    controlPoints?: ControlPoint[],
    orientationAngle?: number,
    scale?: number,
}

const defaultControlPoints = [
    {   
        coord: {x: 0, y: 0}, 
        transformedCoord: {x: 0, y: 0}, 
        left_handle: {
            coord: {x: -100, y: 0}, 
            transformedCoord: {x: -100, y: 0}, 
            handleType: HandleType.ALIGNED
        }, 
        right_handle: {
            coord:  {x: 100, y: 0},
            transformedCoord: {x: 100, y: 0},
            handleType: HandleType.ALIGNED
        }
    },
    {   
        coord: {x: 400, y: 0}, 
        transformedCoord: {x: 400, y: 0}, 
        left_handle: {
            coord: {x: 300, y: 0}, 
            transformedCoord: {x: 300, y: 0}, 
            handleType: HandleType.ALIGNED
        }, 
        right_handle: {
            coord:  {x: 500, y: 0},
            transformedCoord: {x: 500, y: 0},
            handleType: HandleType.VECTOR
        }
    }
];

export class BezierCurve implements GUIElement {

    anchorPoint: Point;
    controlPoints: ControlPoint[];
    orientationAngle: number; // this is in radians
    fullCurveLength: number;
    scale: number;
    

    constructor({anchorPoint={x: 0, y: 0}, controlPoints=JSON.parse(JSON.stringify(defaultControlPoints)), orientationAngle=0, scale=1}: BezierCurveArg) {
        this.controlPoints = controlPoints;
        this.anchorPoint = anchorPoint;
        this.orientationAngle = orientationAngle;
        this.scale = scale;
    }

    updatePointsCoordinates():void {
        this.fullCurveLength = 0;
        this.controlPoints.forEach((controlPoint, index) => {
            if (controlPoint.left_handle.handleType == HandleType.VECTOR) {
                if (index > 0) {
                    let prevPointCoord = this.controlPoints[index - 1].coord;
                    let posDiffDirection = PointCal.unitVector(PointCal.subVector(prevPointCoord, controlPoint.coord));
                    let posDiff = PointCal.distanceBetweenPoints(prevPointCoord, controlPoint.coord);
                    controlPoint.left_handle.coord = PointCal.addVector(controlPoint.coord, PointCal.multiplyVectorByScalar(posDiffDirection, posDiff * 0.3));
                }
            } else if (controlPoint.left_handle.handleType == HandleType.ALIGNED){
                if (controlPoint.right_handle.handleType == HandleType.VECTOR) {
                    let cp2lhDistance = PointCal.distanceBetweenPoints(controlPoint.coord, controlPoint.left_handle.coord);
                    let leftDestDirection = PointCal.unitVectorFromA2B(controlPoint.right_handle.coord, controlPoint.coord);
                    let destPos = PointCal.addVector(controlPoint.coord, PointCal.multiplyVectorByScalar(leftDestDirection, cp2lhDistance));
                    controlPoint.left_handle.coord = destPos;
                }
            }

            if (controlPoint.right_handle.handleType == HandleType.VECTOR) {
                if (index < this.controlPoints.length - 1) {
                    let nextPointCoord = this.controlPoints[index + 1].coord;
                    let posDiffDirection = PointCal.unitVector(PointCal.subVector(nextPointCoord, controlPoint.coord));
                    let posDiff = PointCal.distanceBetweenPoints(nextPointCoord, controlPoint.coord);
                    controlPoint.right_handle.coord = PointCal.addVector(controlPoint.coord, PointCal.multiplyVectorByScalar(posDiffDirection, posDiff * 0.3));
                }
            } else if (controlPoint.right_handle.handleType == HandleType.ALIGNED) {
                if (controlPoint.left_handle.handleType == HandleType.VECTOR) {
                    let cp2rhDistance = PointCal.distanceBetweenPoints(controlPoint.coord, controlPoint.right_handle.coord);
                    let rightDestDirection = PointCal.unitVectorFromA2B(controlPoint.left_handle.coord, controlPoint.coord);
                    let destPos = PointCal.addVector(controlPoint.coord, PointCal.multiplyVectorByScalar(rightDestDirection, cp2rhDistance));
                    controlPoint.right_handle.coord = destPos;
                }

            }           

            controlPoint.transformedCoord = this.transformPoint(controlPoint.coord);
            controlPoint.left_handle.transformedCoord = this.transformPoint(controlPoint.left_handle.coord);
            controlPoint.right_handle.transformedCoord = this.transformPoint(controlPoint.right_handle.coord);
            if (index > 0) {
                let startPoint = this.controlPoints[index - 1];
                let endPoint = controlPoint;
                let bCurve = new Bezier([startPoint.transformedCoord, startPoint.right_handle.transformedCoord, endPoint.left_handle.transformedCoord, endPoint.transformedCoord]);
                let {arcLengths, fullArcLength} =  this.getArcLengths(bCurve);
                this.fullCurveLength += fullArcLength;
            }
        });
    }


    changeHandleType(cpIndex: number, handle: string, newType: HandleType){
        if (cpIndex < 0 || cpIndex > this.controlPoints.length - 1) {
            return;
        }
        let controlPointOfInterest = this.controlPoints[cpIndex];
        if (handle == "lh" ) {
            switch(newType) {
            case HandleType.VECTOR:
                if (cpIndex > 0) {
                    let prevPointCoord = this.controlPoints[cpIndex - 1].coord;
                    let posDiffDirection = PointCal.unitVector(PointCal.subVector(prevPointCoord, controlPointOfInterest.coord));
                    let posDiff = PointCal.distanceBetweenPoints(prevPointCoord, controlPointOfInterest.coord);
                    controlPointOfInterest.left_handle.coord = PointCal.addVector(controlPointOfInterest.coord, PointCal.multiplyVectorByScalar(posDiffDirection, posDiff * 0.3));
                }
                controlPointOfInterest.left_handle.handleType = HandleType.VECTOR;
                if (controlPointOfInterest.right_handle.handleType !== HandleType.VECTOR){
                    controlPointOfInterest.right_handle.handleType = HandleType.FREE;
                }
                break;
            case HandleType.ALIGNED:
                controlPointOfInterest.left_handle.handleType = HandleType.ALIGNED;
                if (controlPointOfInterest.right_handle.handleType != HandleType.FREE) {
                    let destDirection = PointCal.unitVectorFromA2B(controlPointOfInterest.right_handle.coord, controlPointOfInterest.coord)
                    let projection = PointCal.dotProduct(destDirection, PointCal.subVector(controlPointOfInterest.left_handle.coord, controlPointOfInterest.coord));
                    if (projection < 0) {
                        projection = -projection;
                    }
                    let destPos = PointCal.addVector(controlPointOfInterest.coord, PointCal.multiplyVectorByScalar(destDirection, projection));
                    controlPointOfInterest.left_handle.coord = destPos;
                }
                break;
            case HandleType.FREE:
                controlPointOfInterest.left_handle.handleType = HandleType.FREE;
                break;
            default:
                console.log("nothing goes here");
            }
        } else if (handle == "rh"){
            switch(newType) {
            case HandleType.VECTOR:
                if (cpIndex < this.controlPoints.length - 1) {
                    let adjacentPointCoord = this.controlPoints[cpIndex + 1].coord;
                    let posDiffDirection = PointCal.unitVector(PointCal.subVector(adjacentPointCoord, controlPointOfInterest.coord));
                    let posDiff = PointCal.distanceBetweenPoints(adjacentPointCoord, controlPointOfInterest.coord);
                    controlPointOfInterest.right_handle.coord = PointCal.addVector(controlPointOfInterest.coord, PointCal.multiplyVectorByScalar(posDiffDirection, posDiff * 0.3));
                }
                controlPointOfInterest.right_handle.handleType = HandleType.VECTOR;
                if (controlPointOfInterest.left_handle.handleType !== HandleType.VECTOR){
                    controlPointOfInterest.left_handle.handleType = HandleType.FREE;
                }
                break;
            case HandleType.ALIGNED:
                controlPointOfInterest.right_handle.handleType = HandleType.ALIGNED;
                if (controlPointOfInterest.left_handle.handleType != HandleType.FREE) {
                    let destDirection = PointCal.unitVectorFromA2B(controlPointOfInterest.left_handle.coord, controlPointOfInterest.coord)
                    let projection = PointCal.dotProduct(destDirection, PointCal.subVector(controlPointOfInterest.right_handle.coord, controlPointOfInterest.coord));
                    if (projection < 0) {
                        projection = -projection;
                    }
                    let destPos = PointCal.addVector(controlPointOfInterest.coord, PointCal.multiplyVectorByScalar(destDirection, projection));
                    controlPointOfInterest.right_handle.coord = destPos;
                }
                break;
            case HandleType.FREE:
                controlPointOfInterest.right_handle.handleType = HandleType.FREE;
                break;
            default:
                console.log("nothing goes here");
            }

        }
        this.controlPoints[cpIndex] = controlPointOfInterest;
        this.updatePointsCoordinates();
    }


    moveAnchorPoint(destPos: Point): void{
        this.anchorPoint = destPos;
        this.updatePointsCoordinates();
    }

    moveControlPoint(destPos: Point, pointIndex: number, pointType: string): void {
        if (pointIndex >= this.controlPoints.length) {
            return;
        }
        switch (pointType){
        case "cp":
            let cpDiff = PointCal.subVector(destPos, this.controlPoints[pointIndex].coord);
            this.controlPoints[pointIndex].coord = destPos;
            let destLH = PointCal.addVector(this.controlPoints[pointIndex].left_handle.coord, cpDiff);
            let destRH = PointCal.addVector(this.controlPoints[pointIndex].right_handle.coord, cpDiff);
            this.controlPoints[pointIndex].left_handle.coord = destLH;
            this.controlPoints[pointIndex].right_handle.coord = destRH;
            break;
        case "lh":
            switch (this.controlPoints[pointIndex].left_handle.handleType){
            case HandleType.VECTOR:
                break;
            case HandleType.FREE:
                this.controlPoints[pointIndex].left_handle.coord = destPos;
                break;
            case HandleType.ALIGNED:
                if (this.controlPoints[pointIndex].right_handle.handleType == HandleType.VECTOR) {
                    let direction = PointCal.unitVectorFromA2B(this.controlPoints[pointIndex].right_handle.coord, this.controlPoints[pointIndex].coord);
                    let posDiff = PointCal.subVector(destPos, this.controlPoints[pointIndex].coord);
                    let projection = PointCal.dotProduct(posDiff, direction);
                    if (projection > 20) {
                        let newPos = PointCal.addVector(this.controlPoints[pointIndex].coord, PointCal.multiplyVectorByScalar(direction, projection));
                        this.controlPoints[pointIndex].left_handle.coord = newPos;
                    }
                } else if (this.controlPoints[pointIndex].right_handle.handleType == HandleType.ALIGNED){
                    let rightHandle2CPDistance = PointCal.distanceBetweenPoints(this.controlPoints[pointIndex].coord, this.controlPoints[pointIndex].right_handle.coord);
                    let rightHandleDestDirection = PointCal.unitVectorFromA2B(destPos, this.controlPoints[pointIndex].coord);
                    let rightHandleDestPos = PointCal.multiplyVectorByScalar(rightHandleDestDirection, rightHandle2CPDistance);
                    rightHandleDestPos = PointCal.addVector(this.controlPoints[pointIndex].coord, rightHandleDestPos);
                    this.controlPoints[pointIndex].left_handle.coord = destPos;
                    this.controlPoints[pointIndex].right_handle.coord = rightHandleDestPos;
                } else {
                    this.controlPoints[pointIndex].left_handle.coord = destPos;
                }
                break;
            default:
                console.log("nothing goes here");
            }
            break;
        case "rh":
            switch (this.controlPoints[pointIndex].right_handle.handleType){
            case HandleType.VECTOR:
                break;
            case HandleType.FREE:
                this.controlPoints[pointIndex].right_handle.coord = destPos;
                break;
            case HandleType.ALIGNED:
                if (this.controlPoints[pointIndex].left_handle.handleType == HandleType.VECTOR) {
                    let direction = PointCal.unitVectorFromA2B(this.controlPoints[pointIndex].left_handle.coord, this.controlPoints[pointIndex].coord);
                    let posDiff = PointCal.subVector(destPos, this.controlPoints[pointIndex].coord);
                    let projection = PointCal.dotProduct(posDiff, direction);
                    if (projection > 20) {
                        let newPos = PointCal.addVector(this.controlPoints[pointIndex].coord, PointCal.multiplyVectorByScalar(direction, projection));
                        this.controlPoints[pointIndex].right_handle.coord = newPos;
                    }
                } else if (this.controlPoints[pointIndex].left_handle.handleType == HandleType.ALIGNED){
                    let leftHandle2CPDistance = PointCal.distanceBetweenPoints(this.controlPoints[pointIndex].coord, this.controlPoints[pointIndex].left_handle.coord);
                    let leftHandleDestDirection = PointCal.unitVectorFromA2B(destPos, this.controlPoints[pointIndex].coord);
                    let leftHandleDestPos = PointCal.multiplyVectorByScalar(leftHandleDestDirection, leftHandle2CPDistance);
                    leftHandleDestPos = PointCal.addVector(this.controlPoints[pointIndex].coord, leftHandleDestPos);
                    this.controlPoints[pointIndex].right_handle.coord = destPos;
                    this.controlPoints[pointIndex].left_handle.coord = leftHandleDestPos;
                } else {
                    this.controlPoints[pointIndex].right_handle.coord = destPos;
                }
                break;
            default:
                console.log("nothing goes here");
            }
            break;
        default:
            console.log("nothing goes here!");
        }
        this.updatePointsCoordinates();
    }

    clickedOnPoint(cursorPosition: Point): {hit: boolean, pointIndex: number, pointType: string, pointPos: Point} {
        this.updatePointsCoordinates();
        let res = this.controlPoints.findIndex((controlPoint) => {
            let close = PointCal.distanceBetweenPoints(controlPoint.transformedCoord, cursorPosition) < 5 || 
                        PointCal.distanceBetweenPoints(controlPoint.left_handle.transformedCoord, cursorPosition) < 5 || 
                        PointCal.distanceBetweenPoints(controlPoint.right_handle.transformedCoord, cursorPosition) < 5;
            return close;
        });
        if (res != -1) {
            let controlPointInQuestion = this.controlPoints[res];
            if (PointCal.distanceBetweenPoints(controlPointInQuestion.transformedCoord, cursorPosition) < 5){
                return {hit: true, pointIndex: res, pointType: "cp", pointPos: controlPointInQuestion.transformedCoord};
            }
            if (PointCal.distanceBetweenPoints(controlPointInQuestion.left_handle.transformedCoord, cursorPosition) < 5){
                console.log(controlPointInQuestion.left_handle.handleType)
                return {hit: true, pointIndex: res, pointType: "lh", pointPos: controlPointInQuestion.left_handle.transformedCoord};
            }
            if (PointCal.distanceBetweenPoints(controlPointInQuestion.right_handle.transformedCoord, cursorPosition) < 5){
                console.log(controlPointInQuestion.right_handle.handleType)
                return {hit: true, pointIndex: res, pointType: "rh", pointPos:controlPointInQuestion.right_handle.transformedCoord};
            }
        }
        return {hit:false, pointIndex: -1, pointType: null, pointPos: null};
    }

    transformPoint(point: Point): Point {
        point = PointCal.rotatePoint(point, this.orientationAngle);
        point = PointCal.addVector(point, this.anchorPoint);
        return point;
    }

    drawGrabbedPoint(context: CanvasRenderingContext2D, pointIndex: number, pointType: string): void {
        if (pointIndex < 0 || pointIndex > this.controlPoints.length - 1) {
            return;
        }
        this.updatePointsCoordinates();
        let pointOfInterest = this.controlPoints[pointIndex];
        switch (pointType){
        case "cp":
            this.drawCircles(context, pointOfInterest.transformedCoord.x, pointOfInterest.transformedCoord.y, 5, false, true);
            break;
        case "lh":
            this.drawCircles(context, pointOfInterest.left_handle.transformedCoord.x, pointOfInterest.left_handle.transformedCoord.y, 5, false, true);
            break;
        case "rh":
            this.drawCircles(context, pointOfInterest.right_handle.transformedCoord.x, pointOfInterest.right_handle.transformedCoord.y, 5, false, true);
            break;
        default:
            console.log("nothing goes here");
        }
    }

    draw(context: CanvasRenderingContext2D, selected=false, withDirection=true, withArcFit=false) {
        // this.updatePointsCoordinates();
        this.updatePointsCoordinates();
        let drawPoints = this.controlPoints.filter((point, index) => {
            return index != this.controlPoints.length - 1;
        });
        drawPoints.forEach((point, index) => {
            let startPoint = point;
            let endPoint = this.controlPoints[index + 1];
            
            let bCurve = new Bezier([startPoint.transformedCoord, startPoint.right_handle.transformedCoord, endPoint.left_handle.transformedCoord, endPoint.transformedCoord]);
            let {arcLengths, fullArcLength} = this.getArcLengths(bCurve);

            // NOTE Below is the direction section
            if (withDirection) {
                if (selected) {
                    context.strokeStyle = "rgb(255, 79, 79)";
                }
                for (let percentage=0; percentage <= 75; percentage += 25) {
                    let tVal = this.mapPercentage2TVal(percentage, arcLengths, fullArcLength, this.mapIndex2TVal);
                    let arrowPos = bCurve.get(tVal);
                    let arrowDirection = PointCal.unitVector(bCurve.derivative(tVal));
                    let arrowWidth = 3;
                    let tipPointPos = PointCal.addVector(arrowPos, PointCal.multiplyVectorByScalar(arrowDirection, arrowWidth));
                    let leftDirection = PointCal.rotatePoint(arrowDirection, Math.PI / 2);
                    let leftPointPos = PointCal.addVector(arrowPos, PointCal.multiplyVectorByScalar(leftDirection, arrowWidth));
                    let rightDirection = PointCal.rotatePoint(arrowDirection, -Math.PI / 2);
                    let rightPointPos = PointCal.addVector(arrowPos, PointCal.multiplyVectorByScalar(rightDirection, arrowWidth));
                    context.beginPath();
                    context.moveTo(tipPointPos.x, tipPointPos.y);
                    context.lineTo(leftPointPos.x, leftPointPos.y);
                    context.stroke();
                    context.beginPath();
                    context.moveTo(tipPointPos.x, tipPointPos.y);
                    context.lineTo(rightPointPos.x, rightPointPos.y);
                    context.stroke();
                }

                context.strokeStyle = "rgb(0, 0, 0)";

            }
            // NOTE Above is the direction section

            // NOTE Below is the length text section
            let tVal = this.mapPercentage2TVal(12, arcLengths, fullArcLength, this.mapIndex2TVal);
            let lengthTextPos = bCurve.get(tVal);
            let offsetDirection = PointCal.rotatePoint(PointCal.unitVector(bCurve.derivative(tVal)), Math.PI / 2);
            let arcLengthPos = PointCal.addVector(lengthTextPos, PointCal.multiplyVectorByScalar(offsetDirection, 50));
            context.beginPath();
            context.font = "30px Noto Sans TC";
            if (startPoint.slope != null) {
                context.fillText(`區段長度: ${(fullArcLength * this.scale).toFixed(3)}公尺, 斜率: ${startPoint.slope.toFixed(3)}`, arcLengthPos.x, arcLengthPos.y);
            } else {
                context.fillText(`區段長度: ${(fullArcLength * this.scale).toFixed(3)}公尺`, arcLengthPos.x, arcLengthPos.y);
            }
            context.strokeStyle = "rgb(0, 0, 0)";
            // NOTE Above is the length text section


            // NOTE Below is the circular arc section
            if (selected) {
                context.strokeStyle = "rgb(255, 79, 79)";
            }

            if (withArcFit){
                if (startPoint.right_handle.handleType !== HandleType.VECTOR || endPoint.left_handle.handleType !== HandleType.VECTOR) {
                    try{
                        let arcs = bCurve.arcs(0.05);
                        arcs.forEach((arc)=>{
                            context.beginPath();
                            context.moveTo(arc.x, arc.y);
                            let startPoint = bCurve.get(arc.interval.start);
                            let endPoint = bCurve.get(arc.interval.end);
                            context.lineTo(startPoint.x, startPoint.y);
                            context.moveTo(arc.x, arc.y);
                            context.lineTo(endPoint.x, endPoint.y);
                            // context.arcTo(startPoint.x, startPoint.y, endPoint.x, endPoint.y, arc.r);
                            context.stroke();
                        });
                    } catch (e){
                        console.log("Arc Fit has some error");
                    }
                }
            }
            context.strokeStyle = "rgb(0, 0, 0)";
            // NOTE Above is the circular arc section

            context.beginPath();
            let firstHandle = startPoint.right_handle.transformedCoord;
            let secondHandle = endPoint.left_handle.transformedCoord;
            context.moveTo(startPoint.transformedCoord.x, startPoint.transformedCoord.y);
            context.bezierCurveTo(firstHandle.x, firstHandle.y, secondHandle.x, secondHandle.y, endPoint.transformedCoord.x, endPoint.transformedCoord.y);
            if (selected) {
                context.strokeStyle = "rgb(255, 79, 79)";
            }
            context.stroke();
            if (selected) {
                context.strokeStyle = "rgb(255, 79, 79)";
            }
            context.strokeStyle = "rgb(0, 0, 0)";
        });
    }


    private drawCircles(context: CanvasRenderingContext2D, centerx: number, centery: number, size: number, stroke=true, fill=false):void {
        context.moveTo(centerx, centery);
        context.beginPath();
        context.arc(centerx, centery, size, 0, Math.PI * 2, true); // Outer circle
        if (fill) {
            context.fill()
        }
        if (stroke) {
            context.stroke();
        }
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.controlPoints.forEach((point) => {
            this.drawControlPoint(point, context);
        })
    }

    private drawControlPoint(controlPoint: ControlPoint, context: CanvasRenderingContext2D): void {
        this.drawCircles(context, controlPoint.transformedCoord.x, controlPoint.transformedCoord.y, 5);
        this.drawCircles(context, controlPoint.left_handle.transformedCoord.x, controlPoint.left_handle.transformedCoord.y, 5);
        this.drawCircles(context, controlPoint.right_handle.transformedCoord.x, controlPoint.right_handle.transformedCoord.y, 5);
        context.setLineDash([10, 15]);
        context.lineWidth = 3;
        context.beginPath();
        switch (controlPoint.left_handle.handleType){
        case HandleType.ALIGNED:
            context.strokeStyle = "rgb(237, 185, 71)";
            break;
        case HandleType.FREE:
            context.strokeStyle = "rgb(189, 68, 86)";
            break;
        case HandleType.VECTOR:
            context.strokeStyle = "rgb(124, 153, 113)";
            break;
        default:
            console.log("nothing goes here");
        }
        context.moveTo(controlPoint.transformedCoord.x, controlPoint.transformedCoord.y);
        context.lineTo(controlPoint.left_handle.transformedCoord.x, controlPoint.left_handle.transformedCoord.y);
        context.stroke();
        switch (controlPoint.right_handle.handleType){
        case HandleType.ALIGNED:
            context.strokeStyle = "rgb(237, 185, 71)";
            break;
        case HandleType.FREE:
            context.strokeStyle = "rgb(189, 68, 86)";
            break;
        case HandleType.VECTOR:
            context.strokeStyle = "rgb(124, 153, 113)";
            break;
        default:
            console.log("nothing goes here");
        }
        context.beginPath();
        context.moveTo(controlPoint.transformedCoord.x, controlPoint.transformedCoord.y);
        context.lineTo(controlPoint.right_handle.transformedCoord.x, controlPoint.right_handle.transformedCoord.y);
        context.stroke();
        context.strokeStyle = "rgb(0, 0, 0)";
        context.lineWidth = 1;
        context.setLineDash([]);
    }

    extendControlPoint(prepend=false): void {
        let newControlPoint:ControlPoint = 
                {   
                    coord: {x: 0, y: 0}, 
                    transformedCoord: {x: 0, y: 0}, 
                    left_handle: {
                        coord: {x: -100, y: 0}, 
                        transformedCoord: {x: -100, y: 0}, 
                        handleType: HandleType.ALIGNED
                    }, 
                    right_handle: {
                        coord:  {x: 100, y: 0},
                        transformedCoord: {x: 100, y: 0},
                        handleType: HandleType.ALIGNED
                    }
                };
        if (prepend) {
            let newCoord: Point;
            if (this.controlPoints.length > 0) {
                let basePoint = this.controlPoints[0];
                let destVec = PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(basePoint.coord, basePoint.left_handle.coord), 1.3 * PointCal.distanceBetweenPoints(basePoint.coord, basePoint.left_handle.coord));
                newCoord = PointCal.addVector(basePoint.coord, destVec);
            } else {
                newCoord = this.anchorPoint;
            }
            newControlPoint.coord = newCoord; 
            newControlPoint.left_handle.coord = PointCal.addVector(newControlPoint.coord, {x: -200, y: 0});
            newControlPoint.left_handle.handleType = HandleType.ALIGNED;
            newControlPoint.right_handle.coord = PointCal.addVector(newControlPoint.coord, {x: 200, y: 0});
            newControlPoint.right_handle.handleType = HandleType.ALIGNED;
            this.controlPoints.unshift(newControlPoint);
        } else {
            let newCoord: Point;
            if (this.controlPoints.length > 0) {
                let basePoint = this.controlPoints[this.controlPoints.length - 1];
                let destVec = PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(basePoint.coord, basePoint.right_handle.coord), 1.3 * PointCal.distanceBetweenPoints(basePoint.coord, basePoint.right_handle.coord));
                newCoord = PointCal.addVector(basePoint.coord, destVec);
            } else {
                newCoord = this.anchorPoint;
            }
            newControlPoint.coord = newCoord; 
            newControlPoint.left_handle.coord = PointCal.addVector(newControlPoint.coord, {x: -200, y: 0});
            newControlPoint.left_handle.handleType = HandleType.ALIGNED;
            newControlPoint.right_handle.coord = PointCal.addVector(newControlPoint.coord, {x: 200, y: 0});
            newControlPoint.right_handle.handleType = HandleType.ALIGNED;
            this.controlPoints.push(newControlPoint);
        }
        this.updatePointsCoordinates();
    }

    private getArcLengths(bCurve: Bezier): {arcLengths: number[], fullArcLength: number} {
        let arcLengths = [];
        let arcLength = 0;
        let curPoint = bCurve.get(0);
        for (let tVal = 0; tVal <= 1; tVal += 0.001) {
            let adjacentPoint = bCurve.get(tVal);
            let dist = PointCal.distanceBetweenPoints(adjacentPoint, curPoint);
            arcLength += dist;
            arcLengths.push(arcLength);
            curPoint = adjacentPoint;
        }

        return {arcLengths: arcLengths, fullArcLength: arcLength};
    }

    getLength(): number {
        return this.fullCurveLength;
    }

    setScale(scale: number){
        this.scale = scale;
    }

    deleteSelectedControlPoint(controlPointIndex: number):boolean {
        if (controlPointIndex < 0 || controlPointIndex >= this.controlPoints.length) {
            return false;
        }
        this.controlPoints.splice(controlPointIndex, 1);
        return true;
    }

    mapPercentage2TVal(percentage: number, arcLengths: number [], fullArcLength: number, mapIndex2TVal: (index: number) => number): number {
        let targetArcLength = fullArcLength * percentage / 100;
        let left = 0;
        let right = arcLengths.length - 1;

        while (left <= right) {
            let mid = left + Math.floor((right - left) / 2);
            if (arcLengths[mid] == targetArcLength) {
                return mapIndex2TVal(mid);
            } else if (arcLengths[mid] < targetArcLength) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return mapIndex2TVal(left);
    }

    mapIndex2TVal(index: number): number {
        return index / 1000;
    }

    exportCurve(origin: Point){
        let exportTracks: Track[] = [];
        for (let index=1; index < this.controlPoints.length; index++){
            let startPoint = this.controlPoints[index - 1];
            let endPoint = this.controlPoints[index];
            if (startPoint.right_handle.handleType == HandleType.VECTOR && endPoint.left_handle.handleType == HandleType.VECTOR){
                let track: Track = {
                    tracktype: TrackType.STRAIGHT,
                    startPoint: startPoint.transformedCoord,
                    endPoint: endPoint.transformedCoord,
                };
                // NOTE straight track
                track.startPoint = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, startPoint.transformedCoord), PointCal.distanceBetweenPoints(origin, startPoint.transformedCoord) * this.scale));
                track.endPoint = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, endPoint.transformedCoord), PointCal.distanceBetweenPoints(origin, endPoint.transformedCoord) * this.scale));
                if (startPoint.slope){
                    track.slope = startPoint.slope;
                }
                exportTracks.push(track);
            } else {
                // NOTE curve track
                let startPointTransformed = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, startPoint.transformedCoord), PointCal.distanceBetweenPoints(origin, startPoint.transformedCoord) * this.scale));
                let endPointTransformed = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, endPoint.transformedCoord), PointCal.distanceBetweenPoints(origin, endPoint.transformedCoord) * this.scale));
                let rightHandleTransformed = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, startPoint.right_handle.transformedCoord), PointCal.distanceBetweenPoints(origin, startPoint.right_handle.transformedCoord) * this.scale));
                let leftHandleTransformed = PointCal.flipYAxis(PointCal.multiplyVectorByScalar(PointCal.unitVectorFromA2B(origin, endPoint.left_handle.transformedCoord), PointCal.distanceBetweenPoints(origin, endPoint.left_handle.transformedCoord) * this.scale));


                let bCurve = new Bezier([startPointTransformed, rightHandleTransformed, leftHandleTransformed, endPointTransformed]);

                try{
                    let arcs = bCurve.arcs(0.05);
                    arcs.forEach((arc)=>{

                        let track: Track= {
                            tracktype: TrackType.CURVE,
                            startPoint: {x: bCurve.get(arc.interval.start).x, y: bCurve.get(arc.interval.start).y},
                            endPoint: {x: bCurve.get(arc.interval.end).x, y: bCurve.get(arc.interval.end).y},
                            radius: arc.r,
                            center: {x: arc.x, y: arc.y},
                        };
                        track.angleSpan = PointCal.angleFromA2B(PointCal.subVector(track.startPoint, track.center), PointCal.subVector(track.endPoint, track.center));
                        if (startPoint.slope){
                            track.slope = startPoint.slope;
                        }
                        exportTracks.push(track);
                    });
                } catch (e){
                    console.log("Arc Fit has some error");
                    return null;
                }
            }

        } 
        return exportTracks;
    }

}