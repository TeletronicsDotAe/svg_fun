"use strict";

var fs = require('fs'),
    xpath = require('xpath'),
    xmlParser = require('xmldom').DOMParser,
    xmlSerializer = require('xmldom').XMLSerializer,
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
        animationStartMPlusCsPlusMaybeZs.push(new MPlusCsPlusMaybeZ(pathD.MPlusCsPlusMaybeZs[j].initialM, animationStartConsecutiveCs, pathD.MPlusCsPlusMaybeZs[j].endingZ));
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



