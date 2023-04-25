import { Bezier, Point } from "bezier-js";
import { VectorCal } from "./Utils";
import { urlToHttpOptions } from "url";
import { start } from "repl";



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
    abstract movePoint(controlPointConstrained: boolean, pointIndex: number, x: number, y: number):void;
    abstract clickedOnControlPoint(point: {x: number, y: number}): {hit: boolean, controlPoints: {segmentIndex: number, pointIndex: number}[]};
    abstract setName(name: string):void;
    abstract getName(): string;
}


class CompositeSegment implements TrackSegment {

    private children: TrackSegment[];
    private name: string = "default composite";


    addChild(segment: TrackSegment) {
        this.children.push(segment);
    }

    removeFirstChild(): TrackSegment {
        return this.children.shift();
    }


    draw(context: CanvasRenderingContext2D): void {
        this.children.forEach((child)=>{
            child.draw(context);
        })        
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.children.forEach((child)=>{
            child.drawControlPoints(context);
        })
    }

    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        this.children.forEach((child)=>{
            child.drawSegmentDirection(context);
        })
    }

    getPoints(): Point[] {
        let points: Point[] = [];
        this.children.forEach((child)=>{
            points.push(...child.getPoints());
        });
        return points;
    }

    movePoint(controlPointConstrained:boolean, pointIndex: number, x: number, y: number): void {
        
    }

    clickedOnControlPoint(point: { x: number; y: number; }): { hit: boolean, controlPoints: {segmentIndex: number, pointIndex: number}[]} {
        let hit = false;
        this.children.forEach((segment, index)=>{
            let childRes = segment.clickedOnControlPoint(point);
            if (childRes.hit) {
                hit = true;

            }
        })
        return {hit: false, controlPoints: []};
    }

    setName(name: string): void {
        this.name = name;
    }

    getName(): string {
        return this.name;
    }

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
        let revSideDirection = {x: -1 * sideDirection.x, y: -1 * sideDirection.y};
        
        let stepLength = VectorCal.calculateLineMag(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y) / this.arrowCount;
        
        for (let index = 0; index < this.arrowCount; index++) {
            let point = {x: this.startPoint.x + forwardDirection.x * (index + 1) * stepLength, y: this.startPoint.y + forwardDirection.y * (index + 1) * stepLength};
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

    movePoint(controlPointConstrained:boolean, pointIndex: number, x: number, y: number): void {
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

    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, controlPoints: {segmentIndex: number, pointIndex: number}[]} {
        let res = false;
        if (VectorCal.calculateLineMag(this.startPoint.x, this.startPoint.y, point.x, point.y) <  this.controlPointSize) {
            return {hit: true, controlPoints: [{segmentIndex: 0, pointIndex: 0}]};
        }
        if (VectorCal.calculateLineMag(this.endPoint.x, this.endPoint.y, point.x, point.y) < this.controlPointSize) {
            return {hit: true, controlPoints: [{segmentIndex: 0, pointIndex: 1}]};
        }
        return {hit: false, controlPoints: []};
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
        context.setLineDash([5, 15]);
        context.moveTo(this.bezierCurve.points[0].x, this.bezierCurve.points[0].y);
        context.lineTo(this.bezierCurve.points[1].x, this.bezierCurve.points[1].y);
        context.lineTo(this.bezierCurve.points[2].x, this.bezierCurve.points[2].y);
        context.stroke();
        context.setLineDash([]);
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


    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        let step = 1 / this.arrowCount;

        for (let index = 0; index < this.arrowCount; index++){
            let t = (index + 1) * step;
            if (t > 0.95) {
                continue;
            }
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

    movePoint(controlPointConstrained: boolean, pointIndex: number, x: number, y: number): void {
        if (pointIndex >= 3 || pointIndex < 0) {
            return
        }
        this.bezierCurve.points[pointIndex].x = x;
        this.bezierCurve.points[pointIndex].y = y;
        this.bezierCurve.update();
    }

    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, controlPoints: {segmentIndex:number, pointIndex: number}[]}{
        let hit = false;
        let hitIndex = 0;
        this.bezierCurve.points.forEach((pointInCurve, index)=>{
            if (VectorCal.calculateLineMag(pointInCurve.x, pointInCurve.y, point.x, point.y) <  this.controlPointSize && !hit) {
                hit = true;
                hitIndex = index;
            }
        });
        return {hit: hit, controlPoints: [{segmentIndex: 0, pointIndex: hitIndex}]};
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
    private draggedPoint: {active: boolean, pointIndex: number} = {active: false, pointIndex: 0};

    constructor(name: string, bezierCurve: Bezier) {
        this.name = name;
        this.bezierCurve = bezierCurve;
    }

    draw(context: CanvasRenderingContext2D):void {
        context.beginPath();
        context.moveTo(this.bezierCurve.points[0].x, this.bezierCurve.points[0].y);
        context.bezierCurveTo(this.bezierCurve.points[1].x, this.bezierCurve.points[1].y, this.bezierCurve.points[2].x, this.bezierCurve.points[2].y, this.bezierCurve.points[3].x, this.bezierCurve.points[3].y);
        context.stroke();
        this.drawArcs(context);
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.bezierCurve.points.forEach((point)=>{
            this.drawCircles(context, point.x, point.y, this.controlPointSize);
        })
        context.setLineDash([5, 15]);
        context.beginPath();
        context.moveTo(this.bezierCurve.points[0].x, this.bezierCurve.points[0].y);
        context.lineTo(this.bezierCurve.points[1].x, this.bezierCurve.points[1].y);
        context.moveTo(this.bezierCurve.points[2].x, this.bezierCurve.points[2].y);
        context.lineTo(this.bezierCurve.points[3].x, this.bezierCurve.points[3].y);
        context.stroke();
        context.setLineDash([]);
    }

    drawArcs(context: CanvasRenderingContext2D): void {
        let arcs = this.bezierCurve.arcs(0.05);
        arcs.forEach((arc)=>{
            context.beginPath();
            context.moveTo(arc.x, arc.y);
            let startPoint = this.bezierCurve.get(arc.interval.start);
            let endPoint = this.bezierCurve.get(arc.interval.end);
            context.lineTo(startPoint.x, startPoint.y);
            context.moveTo(arc.x, arc.y);
            context.lineTo(endPoint.x, endPoint.y);
            // context.arcTo(startPoint.x, startPoint.y, endPoint.x, endPoint.y, arc.r);
            context.stroke();
        });
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

    movePoint(controlPointConstrained: boolean, pointIndex: number, x: number, y: number): void {
        if (pointIndex >= 4 || pointIndex < 0) {
            return
        }
        if ((pointIndex == 1 || pointIndex == 2) && controlPointConstrained) {
            let anchorIndex = pointIndex == 1? 0: 3;
            let controlPoint2WieldingPointHat = VectorCal.calculateLineUnitVector(this.bezierCurve.points[anchorIndex].x, this.bezierCurve.points[anchorIndex].y, this.bezierCurve.points[pointIndex].x, this.bezierCurve.points[pointIndex].y);
            let mousePos2WieldingPointVector = {x: x - this.bezierCurve.points[anchorIndex].x, y: y - this.bezierCurve.points[anchorIndex].y};
            let mousePosMagInControlPointLine = VectorCal.dotProduct(controlPoint2WieldingPointHat.x, controlPoint2WieldingPointHat.y, mousePos2WieldingPointVector.x, mousePos2WieldingPointVector.y);
            let newPositionOfControlPoint = {x: controlPoint2WieldingPointHat.x * mousePosMagInControlPointLine, y: controlPoint2WieldingPointHat.y * mousePosMagInControlPointLine};
            this.bezierCurve.points[pointIndex].x = this.bezierCurve.points[anchorIndex].x + newPositionOfControlPoint.x;
            this.bezierCurve.points[pointIndex].y = this.bezierCurve.points[anchorIndex].y + newPositionOfControlPoint.y;
            this.bezierCurve.update();
            return;
        }
        this.bezierCurve.points[pointIndex].x = x;
        this.bezierCurve.points[pointIndex].y = y;
        this.bezierCurve.update();
    }

    drawSegmentDirection(context: CanvasRenderingContext2D): void {
        let step = 1 / this.arrowCount;

        for (let index = 0; index < this.arrowCount; index++){
            let t = (index + 1) * step;
            if (t > 0.95) {
                continue;
            }
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


    clickedOnControlPoint(point: { x: number, y: number }): {hit: boolean, controlPoints: {segmentIndex:number, pointIndex: number}[]} {
        let hit = false;
        let hitIndex = 0;
        this.bezierCurve.points.forEach((pointInCurve, index)=>{
            if (VectorCal.calculateLineMag(pointInCurve.x, pointInCurve.y, point.x, point.y) <  this.controlPointSize && !hit) {
                hit = true;
                hitIndex = index;
            }
        });
        return {hit: hit, controlPoints: [{segmentIndex: 0, pointIndex: hitIndex}]};
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



