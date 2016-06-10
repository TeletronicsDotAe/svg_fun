"use strict";

class Point {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    static fromString(pointStr) {
        var chunks = pointStr.split(",");
        if (chunks.length != 2)
            throw "Not containing exactly two coordinates (separated by comma): " + pointStr;
        return new Point(chunks[0], chunks[1]);
    }

    toString() {
        return this.x + "," + this.y;
    }
}

class MPlusCsPlusMaybeZ {

    constructor(initialM, consecutiveCs, endingZ) {
        this.initialM = initialM;
        this.consecutiveCs = consecutiveCs;
        this.endingZ = endingZ;
    }

    static fromString(pathDStr) {
        var chunks = pathDStr.split(" ");

        var initialM = Point.fromString("0,0");
        var consecutiveCs = [];
        var endingZ = false;
        for (var i = 0; i < chunks.length; i++) {
            var chunk = chunks[i];
            if (i == 0) {
                if (chunk !== "M") throw "M expected as 1st chunk: " + pathDStr;
            } else if (i == 1) {
                initialM = Point.fromString(chunk);
            } else if (i == 2) {
                if (chunk !== "C") throw "C expected as 3rd chunk: " + pathDStr;
            } else {
                var lastChunk = (i == (chunks.length - 1));
                var point = null;
                var pointParseException = null;
                try {
                    point = Point.fromString(chunk);
                } catch (e) {
                    pointParseException = e;
                }
                ;
                if (lastChunk && point == null) {
                    if (chunk !== "Z") throw "Z or point expected as last chunk: " + pathDStr + ". " + pointParseException;
                    endingZ = true;
                } else {
                    consecutiveCs.push(point);
                }
            }
        }

        return new MPlusCsPlusMaybeZ(initialM, consecutiveCs, endingZ);
    }

    toString() {
    	return "M " + this.initialM + " C " + this.consecutiveCs.join(" ")  + ((this.endingZ)?" Z":"");
    }
}


class PathD {

    constructor(MPlusCsPlusMaybeZs) {
         this.MPlusCsPlusMaybeZs = MPlusCsPlusMaybeZs;
    }
 
    static fromString(pathDStr) {
    	var MPlusCsPlusMaybeZs = [];
        const uniqueStartOfSection = "M ";
        var currentSectionStarts = 0;
        while (currentSectionStarts < pathDStr.length) {
            var nextSectionStarts = pathDStr.indexOf(uniqueStartOfSection, currentSectionStarts + uniqueStartOfSection.length);
            if (nextSectionStarts < 0) nextSectionStarts = pathDStr.length;
            var chunk = pathDStr.substring(currentSectionStarts, nextSectionStarts);
            MPlusCsPlusMaybeZs.push(MPlusCsPlusMaybeZ.fromString(chunk.trim()));
            currentSectionStarts = nextSectionStarts;
        }

        return new PathD(MPlusCsPlusMaybeZs);
    }

    toString() {
    	return this.MPlusCsPlusMaybeZs.join(" ").trim();
    }
}

if (typeof require == 'function') {
	exports.PathD = PathD;
}
