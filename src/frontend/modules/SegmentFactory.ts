import { Bezier, Point } from "bezier-js";
import { VectorCal } from "./Utils";

type CanvasCircle = {
    centerx: number
    centery: number
    radius:number
}


abstract class GUIElement {
    abstract draw(context: CanvasRenderingContext2D): void;
}

class ImageBackground implements GUIElement {
    name: string;
    image_src: string;
    image: HTMLImageElement;

    constructor(name: string, image_src: string, image: HTMLImageElement) {
        this.name = name;
        this.image_src = image_src;
        this.image = image;
    }

    draw(context: CanvasRenderingContext2D): void {
        if (this.image != null) {
            context.globalAlpha = 0.4;
            let image_ratio = this.image.height / this.image.width;
            let draw_width = window.innerWidth * 0.8;
            let draw_height =  draw_width * image_ratio;
            context.drawImage(this.image, window.innerWidth / 2 - draw_width / 2, window.innerHeight / 2 - draw_height / 2, draw_width, draw_height);
            context.globalAlpha = 1;
        }
    }
}


export abstract class TrackSegment extends GUIElement {
    abstract drawControlPoints(context: CanvasRenderingContext2D):void;
    abstract drawSegmentDirection(context: CanvasRenderingContext2D):void;
    abstract getPoints():Point[];
    abstract movePoint(pointIndex: number, x: number, y: number):void;
    abstract clickedOnControlPoint(point: {x: number, y: number}): {hit: boolean, index: number};
    abstract setName(name: string):void;
    abstract getName(): string;
}



class StraightSegment implements TrackSegment {
    
    private startPoint: Point;
    private endPoint: Point;
    private name: string;
    private controlPointSize: number = 10; // in px radius
    private arrowCount: number = 5;
    private arrowScale: number = 5;
    constructor(name: string, startPoint: Point, endPoint: Point) {
        this.name = name;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }

    draw(context: CanvasRenderingContext2D): void {
        context.beginPath();
        context.moveTo(this.startPoint.x, this.startPoint.y);
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.stroke();
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.drawCircles(context, this.startPoint.x, this.startPoint.y, this.controlPointSize);
        this.drawCircles(context, this.endPoint.x, this.endPoint.y, this.controlPointSize);
    }

    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        let forwardDirection = VectorCal.calculateLineUnitVector(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
        let sideDirection = VectorCal.calculateLineNormalUnitVector(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y);
        let revSideDirection = {x: -sideDirection.x, y: -sideDirection.y};
        
        let stepLength = VectorCal.calculateLineMag(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y) / this.arrowCount;
        
        for (let index = 0; index < this.arrowCount; index++) {
            let point = {x: this.startPoint.x + forwardDirection.x * stepLength, y: this.startPoint.y + forwardDirection.y * stepLength};
            let arrowTip1 = {x: point.x + forwardDirection.x * this.arrowScale, y: point.y + forwardDirection.y * this.arrowScale};
            let arrowTip2 = {x: point.x + sideDirection.x * this.arrowScale, y: point.y + sideDirection.y * this.arrowScale};
            let arrowTip3 = {x: point.x + revSideDirection.x * this.arrowScale, y: point.y + revSideDirection.y * this.arrowScale};
            context.beginPath();
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip2.x, arrowTip2.y);
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip3.x, arrowTip3.y);
            context.stroke();
        }
    }

    protected drawCircles(context: CanvasRenderingContext2D, centerx: number, centery: number, size: number):void {
        context.moveTo(centerx, centery);
        context.beginPath();
        context.arc(centerx, centery, size, 0, Math.PI * 2, true); // Outer circle
        context.stroke();
    }

    movePoint(pointIndex: number, x: number, y: number): void {
        if (pointIndex >= 2 || pointIndex < 0) {
            return;
        }
        if (pointIndex == 0){
            this.startPoint.x = x;
            this.startPoint.y = y;
        } else {
            this.endPoint.x = x;
            this.endPoint.y = y;
        }
    }

    getPoints(): Point[] {
        return [this.startPoint, this.endPoint];
    }

    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, index: number} {
        let res = false;
        if (VectorCal.calculateLineMag(this.startPoint.x, this.startPoint.y, point.x, point.y) <  this.controlPointSize) {
            return {hit: true, index: 0};
        }
        if (VectorCal.calculateLineMag(this.endPoint.x, this.endPoint.y, point.x, point.y) < this.controlPointSize) {
            return {hit: true, index: 1};
        }
    }

    setName(name: string) {
        this.name = name;
    }

    getName(): string{
        return this.name;
    }
}

class QuadBezierSegment implements TrackSegment {
    private bezierCurve: Bezier;
    private name: string;
    private controlPointSize: number = 10;
    private arrowCount: number = 5;
    private arrowScale: number = 5;

    constructor(name: string, bezierCurve: Bezier) {
        this.name = name;
        this.bezierCurve = bezierCurve;
    }

    draw(context: CanvasRenderingContext2D):void {
        context.moveTo(this.bezierCurve.points[0].x, this.bezierCurve.points[0].y);
        context.quadraticCurveTo(this.bezierCurve.points[1].x, this.bezierCurve.points[1].y, this.bezierCurve.points[2].x, this.bezierCurve.points[2].y);
        context.stroke();
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.bezierCurve.points.forEach((point)=>{
            this.drawCircles(context, point.x, point.y, this.controlPointSize);
        })
    }

    protected drawCircles(context: CanvasRenderingContext2D, centerx: number, centery: number, size: number):void {
        context.moveTo(centerx, centery);
        context.beginPath();
        context.arc(centerx, centery, size, 0, Math.PI * 2, true); // Outer circle
        context.stroke();
    }

    getPoints(): Point[] {
        return this.bezierCurve.points;
    }

    movePoint(pointIndex: number, x: number, y: number): void {
        if (pointIndex >= 3 || pointIndex < 0) {
            return
        }
        this.bezierCurve.points[pointIndex].x = x;
        this.bezierCurve.points[pointIndex].y = y;
        this.bezierCurve.update();
    }

    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        let step = 1 / this.arrowCount;

        for (let index = 0; index < this.arrowCount; index++){
            let t = (index + 1) * step;
            let arrowBaseMidpoint = this.bezierCurve.get(t);
            let tangentUnitVector = this.bezierCurve.derivative(t);
            let normalUnitVector = this.bezierCurve.normal(t);
            let revNormalUnitVector = {x: -normalUnitVector.x, y: -normalUnitVector.y};
            tangentUnitVector = VectorCal.calculateUnitVector(tangentUnitVector.x, tangentUnitVector.y);
            let arrowTip1:Point = {x: arrowBaseMidpoint.x + tangentUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + tangentUnitVector.y * this.arrowScale};
            let arrowTip2:Point = {x: arrowBaseMidpoint.x + normalUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + normalUnitVector.y * this.arrowScale};
            let arrowTip3:Point = {x: arrowBaseMidpoint.x + revNormalUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + revNormalUnitVector.y * this.arrowScale};
            context.beginPath();
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip2.x, arrowTip2.y);
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip3.x, arrowTip3.y);
            context.stroke();
        }
    }

    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, index: number} {
        let hit = false;
        let hitIndex = 0;
        this.bezierCurve.points.forEach((pointInCurve, index)=>{
            if (VectorCal.calculateLineMag(pointInCurve.x, pointInCurve.y, point.x, point.y) <  this.controlPointSize && !hit) {
                hit = true;
                hitIndex = index;
            }
        });
        return {hit: hit, index: hitIndex};
    }

    setName(name: string) {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }
}


class CubicBezierSegment implements TrackSegment {

    private bezierCurve: Bezier;
    private name: string;
    private controlPointSize: number = 10;
    private arrowCount: number = 5;
    private arrowScale: number = 5;

    constructor(name: string, bezierCurve: Bezier) {
        this.name = name;
        this.bezierCurve = bezierCurve;
    }

    draw(context: CanvasRenderingContext2D):void {
        context.moveTo(this.bezierCurve.points[0].x, this.bezierCurve.points[0].y);
        context.bezierCurveTo(this.bezierCurve.points[1].x, this.bezierCurve.points[1].y, this.bezierCurve.points[2].x, this.bezierCurve.points[2].y, this.bezierCurve.points[3].x, this.bezierCurve.points[3].y);
        context.stroke();
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.bezierCurve.points.forEach((point)=>{
            this.drawCircles(context, point.x, point.y, this.controlPointSize);
        })
    }

    protected drawCircles(context: CanvasRenderingContext2D, centerx: number, centery: number, size: number):void {
        context.moveTo(centerx, centery);
        context.beginPath();
        context.arc(centerx, centery, size, 0, Math.PI * 2, true); // Outer circle
        context.stroke();
    }

    getPoints(): Point[] {
        return this.bezierCurve.points;
    }

    movePoint(pointIndex: number, x: number, y: number): void {
        if (pointIndex >= 4 || pointIndex < 0) {
            return
        }
        this.bezierCurve.points[pointIndex].x = x;
        this.bezierCurve.points[pointIndex].y = y;
        this.bezierCurve.update();
    }

    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        let step = 1 / this.arrowCount;

        for (let index = 0; index < this.arrowCount; index++){
            let t = (index + 1) * step;
            let arrowBaseMidpoint = this.bezierCurve.get(t);
            let tangentUnitVector = this.bezierCurve.derivative(t);
            let normalUnitVector = this.bezierCurve.normal(t);
            let revNormalUnitVector = {x: -normalUnitVector.x, y: -normalUnitVector.y};
            tangentUnitVector = VectorCal.calculateUnitVector(tangentUnitVector.x, tangentUnitVector.y);
            let arrowTip1:Point = {x: arrowBaseMidpoint.x + tangentUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + tangentUnitVector.y * this.arrowScale};
            let arrowTip2:Point = {x: arrowBaseMidpoint.x + normalUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + normalUnitVector.y * this.arrowScale};
            let arrowTip3:Point = {x: arrowBaseMidpoint.x + revNormalUnitVector.x * this.arrowScale, y: arrowBaseMidpoint.y + revNormalUnitVector.y * this.arrowScale};
            context.beginPath();
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip2.x, arrowTip2.y);
            context.moveTo(arrowTip1.x, arrowTip1.y);
            context.lineTo(arrowTip3.x, arrowTip3.y);
            context.stroke();
        }
    }


    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, index: number} {
        let hit = false;
        let hitIndex = 0;

        this.bezierCurve.points.forEach((pointInCurve, index)=>{
            if (VectorCal.calculateLineMag(pointInCurve.x, pointInCurve.y, point.x, point.y) <  this.controlPointSize && !hit) {
                hit = true;
                hitIndex = index;
            }
        });

        return {hit: hit, index: hitIndex};
    }

    setName(name: string) {
        this.name = name;
    }

    getName(): string{
        return this.name;
    }
}


export class SegmentFactory {
    private name: string;

    constructor(name: string){
        this.name = name;
    }

    createStraightSegment(name: string, startPoint: Point, endPoint: Point):TrackSegment{
        return new StraightSegment(name, startPoint, endPoint);
    }

    createQuadBezierSegment(name: string, bezierCurve: Bezier): TrackSegment {
        return new QuadBezierSegment(name, bezierCurve);
    }

    createCubicBezierSegment(name: string, bezierCurve: Bezier): TrackSegment {
        return new CubicBezierSegment(name, bezierCurve);
    }
}



