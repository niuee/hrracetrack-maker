

export class VectorCal {

    static calculateLineMag(point1x:number, point1y:number, point2x, point2y) {
        let vectorx = point2x - point1x;
        let vectory = point2y - point1y;
        return this.calculateVectorMag(vectorx, vectory);
    }

    static calculateVectorMag (vectorx: number, vectory: number){
        return Math.sqrt(Math.pow(vectorx, 2) + Math.pow(vectory, 2));
    }

    static calculateNormalUnitVector(vectorx: number, vectory: number){
        let downVectorz = -1;
        return {x: vectory * downVectorz, y:-vectorx * downVectorz};
    }

    static calculateLineNormalUnitVector(point1x: number, point1y: number, point2x: number, point2y: number){
        let vectorx = point2x - point1x;
        let vectory = point1x - point1y;

        return this.calculateNormalUnitVector(vectorx, vectory);
    }

    static calculateUnitVector(vectorx: number, vectory: number) {
        let vectorMag = this.calculateVectorMag(vectorx, vectory);

        return {x: vectorx / vectorMag, y: vectory / vectorMag};
    }

    static calculateLineUnitVector(point1x: number, point1y: number, point2x: number, point2y: number) {
        let vectorx = point2x - point1x;
        let vectory = point2y - point1y;
        let vectorMag = this.calculateLineMag(point1x, point1y, point2x, point2y);
        return {x: vectorx / vectorMag, y: vectory / vectorMag};
    }
}


