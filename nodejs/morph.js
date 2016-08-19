"use strict";

var fs = require('fs'),
    xpath = require('xpath'),
    xmlParser = require('xmldom').DOMParser,
    xmlSerializer = require('xmldom').XMLSerializer,
    Bezier = require("bezier-js"),
    PathD = require('./svg').PathD,
    MPlusCsPlusMaybeZ = require('./svg').MPlusCsPlusMaybeZ;

var inputFileStr = process.argv[2];
var outputFileStr = process.argv[3];
var inOrOutTimeSecs = process.argv[4];
var repeat = process.argv[5];

var fileContent = fs.readFileSync(inputFileStr);
// Strange that parseFromString below seems to write the xml to stdout if and only if it contains newlines or
// or spaces at certain positions???
var doc = new xmlParser().parseFromString(fileContent.toString(), "image/svg+xml");
var select = xpath.useNamespaces({"svg": "http://www.w3.org/2000/svg"});
var pathNodes = select(".//svg:path", doc);
for (var i = 0; i < pathNodes.length; i++) {
	var pathNode = pathNodes[i];
    var pathDStr = pathNode.getAttribute("d");

    var pathD = PathD.fromString(pathDStr);

    var animationStartMPlusCsPlusMaybeZs = [];
    for (var j = 0; j < pathD.MPlusCsPlusMaybeZs.length; j++) {
        var animationStartConsecutiveCs = [];
        for (var k = 0; k < pathD.MPlusCsPlusMaybeZs[j].consecutiveCs.length; k++) {
            animationStartConsecutiveCs.push(pathD.MPlusCsPlusMaybeZs[j].initialM);
        }
        animationStartMPlusCsPlusMaybeZs.push(new MPlusCsPlusMaybeZ(null, pathD.MPlusCsPlusMaybeZs[j].initialM, animationStartConsecutiveCs, pathD.MPlusCsPlusMaybeZs[j].endingZ));

        /*
        Goal is to be able to take a svg with x paths and make it animatable into any other svg with x paths. Plan is to
        go though the path pairs and extend the one with the fewest points to that is has as many points as the one with
        most points. Playing with bezier-js to get "fair" points in between existing points, so that those "fair" in-between
        points can be inserted into the path.
        Below just showing (by adding circles to the generated svg) where the points at 0.25 (green), 0.5 (yellow) and 0.75 (blue)
        are compared to the original points (red). Seems to work well
        */
        var bezierCurve = Bezier.fromSVG(pathD.MPlusCsPlusMaybeZs[j].pathDStr);
        var ps = bezierCurve.points;
        for (var k = 0; k < ps.length-1; k+=3) {
            addCircle(doc, ps[k].x, ps[k].y, "red", pathNode);
            var bezierFragment = new Bezier(ps[k].x, ps[k].y, ps[k+1].x, ps[k+1].y, ps[k+2].x, ps[k+2].y, ps[k+3].x, ps[k+3].y);
            var bezierFragmentSplit = bezierFragment.split(0.25);
            addCircle(doc, bezierFragmentSplit.left.points[3].x, bezierFragmentSplit.left.points[3].y, "green", pathNode);
            bezierFragmentSplit = bezierFragment.split(0.5);
            addCircle(doc, bezierFragmentSplit.left.points[3].x, bezierFragmentSplit.left.points[3].y, "yellow", pathNode);
            bezierFragmentSplit = bezierFragment.split(0.75);
            addCircle(doc, bezierFragmentSplit.left.points[3].x, bezierFragmentSplit.left.points[3].y, "blue", pathNode);
        }
    }
    var animationStartPathD = new PathD(animationStartMPlusCsPlusMaybeZs);

    var animationNode = doc.createElement("animate");
    var attr = doc.createAttribute("dur");
    attr.value = (((repeat)?2:1) * inOrOutTimeSecs) + "s";
    animationNode.setAttributeNode(attr);
    attr = doc.createAttribute("attributeName");
    attr.value = "d";
    animationNode.setAttributeNode(attr);
    if (repeat) {
        attr = doc.createAttribute("repeatCount");
        attr.value = "indefinite";
        animationNode.setAttributeNode(attr);
    } else {
        attr = doc.createAttribute("fill");
        attr.value = "freeze";
        animationNode.setAttributeNode(attr);
    }
    attr = doc.createAttribute("values");
    attr.value = animationStartPathD.toString() + ";\n" + pathD.toString() + ((repeat)?(";\n" + animationStartPathD.toString()):"");
    animationNode.setAttributeNode(attr);
    pathNode.appendChild(animationNode);
}

var xml = new xmlSerializer().serializeToString(doc);
fs.writeFileSync(outputFileStr, xml);

function addCircle(doc, x, y, color, pathNode) {
    var circleNode = doc.createElement("circle");
    var attr = doc.createAttribute("cx");
    attr.value = "" + x;
    circleNode.setAttributeNode(attr);
    attr = doc.createAttribute("cy");
    attr.value = "" + y;
    circleNode.setAttributeNode(attr);
    attr = doc.createAttribute("r");
    attr.value = "0.5";
    circleNode.setAttributeNode(attr);
    attr = doc.createAttribute("fill");
    attr.value = color;
    circleNode.setAttributeNode(attr);
    pathNode.parentNode.appendChild(circleNode);
}



