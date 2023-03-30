import { Bezier } from "bezier-js";
import { TrackSegment } from "./SegmentFactory";


type SegmentItem = {
    segment: TrackSegment;
    selected: boolean;
}

export class TrackSegmentObserver {
    private segmentMap: Map<string, SegmentItem> = new Map<string, SegmentItem>();
    private draggedPoint: {active: boolean, ident: string, index: number} = {active: false, ident: "", index: 0};

    constructor(){
        
    }

    addSegment(ident: string, segment: TrackSegment): void {
        this.segmentMap.set(ident, {segment: segment, selected: false});
    }

    deleteSegment(ident: string): void {
        if (this.segmentMap.has(ident)) {
            this.segmentMap.delete(ident)
        }
    }

    renameSegment(ident: string, name: string): void {
        if (!this.segmentMap.has(ident)) {
           return; 
        }
        let segItem = this.segmentMap.get(ident);
        segItem.segment.setName(name);
        this.segmentMap.set(ident, segItem);
    }

    selectSegment(ident: string): void {
        if (!this.segmentMap.has(ident)) {
            return;
        }
        let toBeUpdated = this.segmentMap.get(ident);
        toBeUpdated.selected = true;
        this.segmentMap.set(ident, toBeUpdated);
    }

    deselectSegment(ident: string): void {
        if (this.segmentMap.has(ident)) {
            let toBeUpdated = this.segmentMap.get(ident);
            toBeUpdated.selected = false;
            this.segmentMap.set(ident, toBeUpdated);
            this.segmentMap.delete(ident);
        }
    }

    clearSelected(): void {
        this.segmentMap.forEach((segItem, ident)=>{
            segItem.selected = false;
            this.segmentMap.set(ident, segItem);
        })
    }

    drawSegments(context: CanvasRenderingContext2D): void {
        this.segmentMap.forEach((segItem, ident)=>{
            if (segItem.selected) {
                segItem.segment.draw(context);
                segItem.segment.drawSegmentDirection(context);
                segItem.segment.drawControlPoints(context);
            } else {
                segItem.segment.draw(context);
                segItem.segment.drawSegmentDirection(context);
            }
        })
    }

    segmentControlPointClicked(click: {x: number, y: number}) {
        let hit = false;
        let hitIdent = "";
        let hitIndex = 0;
        this.segmentMap.forEach((segItem, ident) => {
            if (segItem.selected) {
                let hitRes = segItem.segment.clickedOnControlPoint(click);
                if (hitRes.hit && !hit) {
                    hit = true;
                    hitIdent = ident;
                    hitIndex = hitRes.index;
                }
            }
        });
        if (hit) {
            this.draggedPoint.active = true;
            this.draggedPoint.ident = hitIdent;
            this.draggedPoint.index = hitIndex
        } else {
            this.clearDraggedControlPoint()
        }
    }

    moveDraggedPoint(mousePos: {x: number, y: number}):void {
        if (this.draggedPoint.active && this.segmentMap.has(this.draggedPoint.ident)) {
            let segItem = this.segmentMap.get(this.draggedPoint.ident);
            if (segItem.selected) {
                segItem.segment.movePoint(this.draggedPoint.index, mousePos.x, mousePos.y);
            }
        }
    }

    clearDraggedControlPoint():void{
        this.draggedPoint.active = false;
    }


    getSegmentSelected(): string[] {
        let res: string[] = [];
        this.segmentMap.forEach((segItem, ident)=>{
            if (segItem.selected) {
                res.push(ident)
            }
        });
        return res;
    }

}