"use strict";

var fs = require('fs'),
    xpath = require('xpath'),
    xmlParser = require('xmldom').DOMParser,
    xmlSerializer = require('xmldom').XMLSerializer,
    PathD = require('./svg').PathD;

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

    /* To be translated to js
        List<PathD.MPlusCsPlusMaybeZ> animationStartMPlusCsPlusMaybeZs = new ArrayList<>(pathD.MPlusCsPlusMaybeZs.size());
        for (int j = 0; j < pathD.MPlusCsPlusMaybeZs.size(); j++) {
            List<PathD.MPlusCsPlusMaybeZ.Point> animationStartConsecutiveCs = new ArrayList<PathD.MPlusCsPlusMaybeZ.Point>(pathD.MPlusCsPlusMaybeZs.get(j).consecutiveCs.size());
            for (int k = 0; k < pathD.MPlusCsPlusMaybeZs.get(j).consecutiveCs.size(); k++) {
                animationStartConsecutiveCs.add(pathD.MPlusCsPlusMaybeZs.get(j).initialM);
            }
            animationStartMPlusCsPlusMaybeZs.add(new PathD.MPlusCsPlusMaybeZ(pathD.MPlusCsPlusMaybeZs.get(j).initialM, animationStartConsecutiveCs, pathD.MPlusCsPlusMaybeZs.get(j).endingZ));
        }
        PathD animationStartPathD = new PathD(animationStartMPlusCsPlusMaybeZs);

        Node animationNode = doc.createElement("animate");
        Attr attr = doc.createAttribute("dur");
        attr.setValue((((repeat)?2:1) * inOrOutTimeSecs) + "s");
        animationNode.getAttributes().setNamedItem(attr);
        attr = doc.createAttribute("attributeName");
        attr.setValue("d");
        animationNode.getAttributes().setNamedItem(attr);
        if (repeat) {
            attr = doc.createAttribute("repeatCount");
            attr.setValue("indefinite");
            animationNode.getAttributes().setNamedItem(attr);
        } else {
            attr = doc.createAttribute("fill");
            attr.setValue("freeze");
            animationNode.getAttributes().setNamedItem(attr);
        }
        attr = doc.createAttribute("values");
        attr.setValue(animationStartPathD.toString() + ";\n" + pathD.toString() + ((repeat)?(";\n" + animationStartPathD.toString()):""));
        animationNode.getAttributes().setNamedItem(attr);
        pathNode.appendChild(animationNode);
    */
}

var xml = new xmlSerializer().serializeToString(doc);
fs.writeFileSync(outputFileStr, xml);



