import { GUIElement } from "./SegmentFactory";
import { PointCal } from "point2point";

type Point = {
    x: number,
    y: number
}

enum HandleType {
    VECTOR = 1,
    ALIGNED,
    FREE
}
type HandlePoint = {
    coord: Point,
    handleType: HandleType,
}

type ControlPoint = {
    coord: Point,
    left_handle:  HandlePoint,
    right_handle: HandlePoint
}

export class BezierCurve implements GUIElement {

    anchorPoint: Point;
    points: ControlPoint[];
    orientationAngle: number; // this is in radians
    selected: boolean;
    

    constructor() {
        this.points = [];
        this.orientationAngle = 0; 
        this.selected = false;
    }

    updatePointsCoordinates():void {
        this.points.forEach((point, index) => {

        });
    }

    draw(context: CanvasRenderingContext2D) {
        context.beginPath();
        let drawPoints = this.points.filter((point, index) => {
            return index != this.points.length - 1;
        });
        drawPoints.forEach((point, index) => {
            let startPoint = point;
            let endPoint = this.points[index + 1];
            let firstHandle = startPoint.right_handle.coord;
            let secondHandle = endPoint.left_handle.coord;
            context.moveTo(startPoint.coord.x, startPoint.coord.y);
            context.bezierCurveTo(firstHandle.x, firstHandle.y, secondHandle.x, secondHandle.y, endPoint.coord.x, endPoint.coord.y);
            context.stroke();
        });
    }

    protected drawCircles(context: CanvasRenderingContext2D, centerx: number, centery: number, size: number):void {
        context.moveTo(centerx, centery);
        context.beginPath();
        context.arc(centerx, centery, size, 0, Math.PI * 2, true); // Outer circle
        context.stroke();
    }

    drawControlPoints(context: CanvasRenderingContext2D): void {
        this.points.forEach((point) => {
            this.drawControlPoint(point, context);
        })
    }


    drawControlPoint(controlPoint: ControlPoint, context: CanvasRenderingContext2D): void {
        context.setLineDash([5, 15]);
        context.beginPath();
        context.moveTo(controlPoint.coord.x, controlPoint.coord.y);
        context.lineTo(controlPoint.left_handle.coord.x, controlPoint.left_handle.coord.y);
        context.moveTo(controlPoint.coord.x, controlPoint.coord.y);
        context.lineTo(controlPoint.right_handle.coord.x, controlPoint.right_handle.coord.y);
        context.stroke();
        context.setLineDash([]);
    }

}