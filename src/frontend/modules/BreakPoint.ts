import { VectorCal, vector} from "./Utils";

type Point = {
    x: number;
    y: number;
}

abstract class DrawType {
    abstract draw(context: CanvasRenderingContext2D);
}

class DrawCirArc implements DrawType {
    center: Point;
    startPoint: Point;
    endPoint: Point;

    constructor(cirArcCenter: Point, startPoint: Point, endPoint: Point){
        this.center = cirArcCenter;
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }

    draw(context: CanvasRenderingContext2D): void {
        let startVector: vector = {x: this.startPoint.x - this.center.x, y: this.startPoint.y - this.center.y};
        let endVector: vector = {x: this.endPoint.x - this.center.x, y: this.endPoint.y - this.center.y};
        context.moveTo(this.center.x, this.center.y);
        context.beginPath();
        context.arcTo(this.startPoint.x, this.startPoint.y, this.endPoint.x, this.endPoint.y, VectorCal.vectorMag({x: this.center.x - this.startPoint.x, y: this.center.y - this.startPoint.y}));
        context.stroke();
    }

    setStartPoint(startPoint: Point) {
        this.startPoint = startPoint;
    }
}

class DrawStright implements DrawType {
    startPoint: Point;
    endPoint: Point;
    
    constructor(startPoint: Point, endPoint: Point) {
        this.startPoint = startPoint;
        this.endPoint = endPoint;
    }

    setStartPoint(startPoint: Point) {
        this.startPoint = startPoint;
    }

    setEndPoint(endPoint: Point) {
        this.endPoint = endPoint;
    }

    draw(context: CanvasRenderingContext2D) {
        context.moveTo(this.startPoint.x, this.startPoint.y);
        context.beginPath();
        context.lineTo(this.endPoint.x, this.endPoint.y);
        context.stroke();
    }
}


class BreakPoint {
    prevBreakPoint: BreakPoint;
    position: Point;
    
    constructor(prevBreakPoint: BreakPoint){
        if (prevBreakPoint != null) {
            this.prevBreakPoint = prevBreakPoint;
        }
        this.prevBreakPoint = null;
    }
}
