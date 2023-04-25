import { Bezier } from "bezier-js";
import { TrackSegment } from "./SegmentFactory";


type SegmentItem = {
    segment: TrackSegment;
    selected: boolean;
}


export class TrackSegmentObserver {
    private segmentMap: Map<string, SegmentItem> = new Map<string, SegmentItem>();
    private editingSegment: {editing: boolean, ident: string} = {editing: false, ident: ""};
    private draggedPoint: {active: boolean, ident: string, index: number} = {active: false, ident: "", index: 0};

    constructor(){
        
    }

    addSegment(ident: string, segment: TrackSegment): void {
        this.segmentMap.set(ident, {segment: segment, selected: false});
    }

    deleteSelectedSegment():void {
        let deleteList: string[] = this.getSelectedSegmentList();
        deleteList.forEach((ident)=>{
            this.deleteSegment(ident);
        })
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

    checkSegmentControlPointClicked(click: {x: number, y: number}):boolean {
        let hit = false;
        let hitIdent = "";
        let hitIndex = 0;
        this.segmentMap.forEach((segItem, ident) => {
            if (segItem.selected && !hit) {
                let hitResS = segItem.segment.clickedOnControlPoint(click);
                // console.log(hitResS);
                if (hitResS.hit){
                    hit = hitResS.hit;
                    hitIndex = hitResS.controlPoints[0].pointIndex;
                    hitIdent = ident;
                }
            }
        });
        if (hit) {
            this.draggedPoint.active = true;
            this.draggedPoint.ident = hitIdent;
            this.draggedPoint.index = hitIndex
            return true;
        } else {
            this.clearDraggedControlPoint()
            return false;
        }
    }

    moveDraggedPoint(e: MouseEvent, mousePos: {x: number, y: number}):void {
        if (this.draggedPoint.active && this.segmentMap.has(this.draggedPoint.ident)) {
            let segItem = this.segmentMap.get(this.draggedPoint.ident);
            if (segItem.selected) {
                segItem.segment.movePoint(e.shiftKey, this.draggedPoint.index, mousePos.x, mousePos.y);
            }
        }
    }

    clearDraggedControlPoint():void{
        this.draggedPoint.active = false;
    }


    getSegmentList(): {ident: string, name: string, selected: boolean, editing: boolean}[] {
        let res: {ident: string, name: string, selected: boolean, editing:boolean}[] = [];
        this.segmentMap.forEach((segItem, ident)=>{
            res.push({ident: ident, name: segItem.segment.getName(), selected: segItem.selected, editing: this.editingSegment.editing && this.editingSegment.ident === ident})
        });
        return res;
    }

    getSelectedSegmentList(): string[] {
        let res: string[] = [];
        this.segmentMap.forEach((segItem, ident)=>{
            if (segItem.selected) {
                res.push(ident);
            }
        })
        return res;
    }

    getSelectedSegmentSize():number {
        let count = 0;
        this.segmentMap.forEach((segItem)=>{
            if (segItem.selected) {
                count++;
            }
        })
        return count;
    }

    isSelected(ident: string):boolean {
        if (!this.segmentMap.has(ident)) {
            return false;
        }
        return this.segmentMap.get(ident).selected;
    }

    isEditing(ident: string):boolean {
        if (!this.segmentMap.has(ident)) {
            return false;
        }
        return this.editingSegment.editing && this.editingSegment.ident === ident;
    }

    doubleClickedOnSegment(ident: string): void {
        if (!this.segmentMap.has(ident)) {
            return
        }
        this.editingSegment.editing = true;
        this.editingSegment.ident = ident;
        this.clearSelected();
    }

    clickedOnSegment(shiftPressed: boolean, ident: string): void {
        if (this.isEditing(ident)) {
            return
        }
        if (shiftPressed) {
            if (this.isSelected(ident)) {
                this.deselectSegment(ident);
            } else {
                this.selectSegment(ident);
            }
        } else {
            if (this.getSelectedSegmentSize() == 1 && this.isSelected(ident)) {
                this.deselectSegment(ident)
            } else {
                this.clearSelected();
                this.selectSegment(ident);
            } 
        }
    }

    clearEditingStatus():void {
        this.editingSegment.editing = false;
        this.editingSegment.ident = "";
    }

}