import { Bezier } from "bezier-js";
import { TrackSegment } from "./SegmentFactory";
import { BezierCurve, HandleType } from "./BezierCurve";
import { PointCal } from "point2point";



type SegmentItem = {
    segment: TrackSegment;
    selected: boolean;
}

enum ViewMode {
    EDIT = "EDIT",
    OBJECT = "OBJECT"
}

type BezierCurveItem = {
    name: string;
    curve: BezierCurve;
    selected: boolean;
}

type Point = {
    x: number;
    y: number;
    z?: number;
}

enum OperationType {
    MOVEANCHOR,
    MOVECONTROLPOINT,
    MOVEHANDLEPOINT,
    CHANGEHANDLETYPE,
}

export class TrackCurveMediator {
    
    private curveMap: Map<string, BezierCurveItem> = new Map<string, BezierCurveItem>();
    private curveBeingEdited: {editing: boolean, ident: string} = {editing: false, ident: null};
    private selectedCurveLastPos: Map<string, Point> = new Map<string, Point>();
    private grabbedPoint: {ident: string, pointIndex: number, pointType: string, lastPos: Point} = {ident: null, pointIndex: null, pointType: null, lastPos: null};
    private operationStack: {operationType: OperationType, targetIdent: string };

    constructor(){
        
    }

    addCurve(ident: string, curve: BezierCurve): void {
        this.curveMap.set(ident, {name: "default curve", curve: curve, selected: false});
    }

    deleteSelectedCurve():void {
        let deleteList: string[] = this.getSelectedCurveList();
        deleteList.forEach((ident)=>{
            this.deleteCurve(ident);
        })
    }

    getCurveList(): {ident: string, name: string, selected: boolean, beingEdited: boolean}[] {
        let res: {ident: string, name: string, selected: boolean, beingEdited:boolean}[] = [];
        this.curveMap.forEach((curveItem, ident)=>{
            res.push({ident: ident, name: curveItem.name, selected: curveItem.selected, beingEdited: this.curveBeingEdited.ident === ident})
        });
        return res;
    }

    getSelectedCurveList(): string[] {
        let selectedList: string[] = [];
        this.curveMap.forEach((item, ident)=>{
            if (item.selected) {
                selectedList.push(ident);
            }
        })
        return selectedList;
    }

    hasCurveBeingEdited(): boolean {
        return this.curveBeingEdited.ident != null;
    }

    deleteCurve(ident: string): void {
        if (this.curveMap.has(ident)) {
            this.curveMap.delete(ident)
        }
    }

    renameCurve(ident: string, name: string): void {
        if (!this.curveMap.has(ident)) {
           return; 
        }
        let curveItem = this.curveMap.get(ident);
        curveItem.name = name;
        this.curveMap.set(ident, curveItem);
    }

    selectCurve(ident: string): void {
        if (!this.curveMap.has(ident)) {
            return;
        }
        let toBeUpdated = this.curveMap.get(ident);
        toBeUpdated.selected = true;
        this.curveMap.set(ident, toBeUpdated);
    }

    deselectCurve(ident: string): void {
        if (this.curveMap.has(ident)) {
            let toBeUpdated = this.curveMap.get(ident);
            toBeUpdated.selected = false;
            this.curveMap.set(ident, toBeUpdated);
        }
    }

    drawCurves(context: CanvasRenderingContext2D, viewMode: ViewMode): void {
        this.curveMap.forEach((item, ident)=>{
            if (this.hasGrabbedPoint() && this.grabbedPoint.ident === ident){
                item.curve.drawGrabbedPoint(context, this.grabbedPoint.pointIndex, this.grabbedPoint.pointType);
            }
            item.curve.draw(context, item.selected);
            if (item.selected && viewMode == ViewMode.EDIT) {
                item.curve.drawControlPoints(context);
            }
        });
    }

    clickedOnCurveCard(shiftPressed: boolean, ident: string): void {
        if (this.curveNameisBeingEdited(ident) || this.hasCurveBeingEdited()) {
            return
        }
        if (shiftPressed) {
            if (this.curveIsSelected(ident)) {
                this.deselectCurve(ident);
            } else {
                this.selectCurve(ident);
            }
        } else {
            if (this.getSelectedCurveSize() == 1 && this.curveIsSelected(ident)) {
                this.deselectCurve(ident)
            } else {
                this.clearSelected();
                this.selectCurve(ident);
            } 
        }
    }

    doubleClickedOnCurveCard(ident: string): void {
        if (!this.curveMap.has(ident)) {
            return
        }
        this.curveBeingEdited.ident = ident;
        this.clearSelected();
    }

    getSelectedCurveSize(): number {
        let selectedSize = 0;
        this.curveMap.forEach((item)=>{
            if (item.selected) {
                selectedSize += 1;
            }
        })
        return selectedSize;
    }

    clearSelected(): void {
        this.curveMap.forEach((item, ident)=>{
            item.selected = false;
            this.curveMap.set(ident, item); 
        });
    }

    curveIsSelected(ident: string):boolean {
        if (!this.curveMap.has(ident)) {
            return false;
        }
        return this.curveMap.get(ident).selected;
    }

    curveNameisBeingEdited(ident: string):boolean {
        if (!this.curveMap.has(ident)) {
            return false;
        }
        return this.curveBeingEdited.editing && this.curveBeingEdited.ident === ident;
    }

    clearEditingStatus():void {
        this.curveBeingEdited.ident = null;
    }

    hasGrabbedPoint(): boolean {
        return this.grabbedPoint.ident != null;
    }

    releaseGrabbedPoint(): void {
        this.grabbedPoint.ident = null;
        this.grabbedPoint.lastPos = null;
        this.grabbedPoint.pointIndex = -1;
        this.grabbedPoint.pointType = null;
    }

    handleGrab(viewMode: ViewMode, shiftPressed: boolean, cursorPositionDiff: {x: number, y: number}): void {
        if (viewMode == ViewMode.EDIT) {
            if (this.grabbedPoint.ident != null) {
                let curveOfInterest = this.curveMap.get(this.grabbedPoint.ident);
                cursorPositionDiff = PointCal.transform2NewAxis(cursorPositionDiff, curveOfInterest.curve.orientationAngle);
                let destPos = PointCal.addVector(this.grabbedPoint.lastPos, cursorPositionDiff);
                curveOfInterest.curve.moveControlPoint(destPos, this.grabbedPoint.pointIndex, this.grabbedPoint.pointType)
            }
        } else if (viewMode == ViewMode.OBJECT) {
            this.getSelectedCurveList().forEach((ident)=>{
                let curveItem = this.curveMap.get(ident);
                if (this.selectedCurveLastPos.has(ident)) {
                    let destPos = PointCal.addVector(this.selectedCurveLastPos.get(ident), cursorPositionDiff);
                    curveItem.curve.moveAnchorPoint(destPos);
                }
            });
        }
    }

    handleClick(cursorPosition: {x: number, y: number}): void {
        let clickedOnPoint = false;
        this.getSelectedCurveList().forEach((ident)=>{
            console.log("in foreach");
            let curveItem = this.curveMap.get(ident);
            let onPoint = curveItem.curve.clickedOnPoint(cursorPosition);
            if (onPoint.hit) {
                console.log("Clicked on Point");
                console.log("Curve Ident:", ident);
                console.log("Curve Name:", curveItem.name);
                console.log("Point Index:", onPoint.pointIndex);
                console.log("Point Type:", onPoint.pointType);
                let thePoint = curveItem.curve.controlPoints[onPoint.pointIndex];
                let lastPos: Point;
                if (onPoint.pointType == "cp") {
                    lastPos = thePoint.coord;
                } else if (onPoint.pointType == "lh") {
                    lastPos = thePoint.left_handle.coord;
                } else {
                    lastPos = thePoint.right_handle.coord;
                }
                this.grabbedPoint = {ident: ident, pointIndex: onPoint.pointIndex, pointType: onPoint.pointType, lastPos: lastPos};
                clickedOnPoint = true;
            }
        });
        if (!clickedOnPoint) {
            this.releaseGrabbedPoint();
        }
    }

    revertPointToPrevPos(): void {
        if (this.grabbedPoint.ident != null && this.curveMap.has(this.grabbedPoint.ident)) {
            let curveOfInterest = this.curveMap.get(this.grabbedPoint.ident);
            if (this.grabbedPoint.pointIndex < curveOfInterest.curve.controlPoints.length) {
                curveOfInterest.curve.moveControlPoint(this.grabbedPoint.lastPos, this.grabbedPoint.pointIndex, this.grabbedPoint.pointType)
            }
        }
    }

    revertCurveToPrevPos(): void {
        this.selectedCurveLastPos.forEach((curveLasPosData, ident)=>{
            if (this.curveMap.has(ident)) {
                let curveOfInterest = this.curveMap.get(ident);
                curveOfInterest.curve.anchorPoint = curveLasPosData;
                this.curveMap.set(ident, curveOfInterest);
            }
        });
        this.selectedCurveLastPos.clear();
    }

    holdSelectedCurveCusPos(): void {
        this.selectedCurveLastPos.clear();
        this.curveMap.forEach((curveItem, ident)=>{
            if (curveItem.selected) {
                this.selectedCurveLastPos.set(ident, curveItem.curve.anchorPoint);
            }
        });
    }

    holdGrabbedPointCurPos(): void {
        if (this.hasGrabbedPoint() && this.curveMap.has(this.grabbedPoint.ident)) {
            let controlPointOfInterest = this.curveMap.get(this.grabbedPoint.ident).curve.controlPoints[this.grabbedPoint.pointIndex];
            if (this.grabbedPoint.pointType == "lh") {
                this.grabbedPoint.lastPos = controlPointOfInterest.left_handle.coord;
            } else if (this.grabbedPoint.pointType == "rh") {
                this.grabbedPoint.lastPos = controlPointOfInterest.right_handle.coord;
            } else if (this.grabbedPoint.pointType == "cp") {
                this.grabbedPoint.lastPos = controlPointOfInterest.coord;
            }
        }
    }

    changeGrabbedHandle2Type(type: HandleType):void {
        if (this.hasGrabbedPoint() && this.curveMap.has(this.grabbedPoint.ident)) {
            let curveOfInterest = this.curveMap.get(this.grabbedPoint.ident);
            if (this.grabbedPoint.pointType == "cp") {
                return;
            }
            curveOfInterest.curve.changeHandleType(this.grabbedPoint.pointIndex, this.grabbedPoint.pointType, type);
        } else {
            alert("沒有選取的把手");
        }
    }


    extendSelectedCurves(prepend=false): void {
        this.curveMap.forEach((curveItem)=>{
            curveItem.curve.extendControlPoint(prepend);
        });
    }

    testOnSelectedCurves(){
        this.curveMap.forEach((curveItem)=>{
            let tempBCurve = new Bezier(150,40 , 80,30 , 105,150);
            let {arcLengths, fullArcLength} = curveItem.curve.getArcLengths(tempBCurve);
            console.log("Size of arclengths:", arcLengths.length);
            console.log("Full length of the curve:", fullArcLength);
        })
    }
    
}

