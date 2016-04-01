import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class MorphAllPathsInSVG {

    public static void main(String[] args) throws Exception {
        String inputFileStr = args[0];
        String outputFileStr = args[1];
        int inOrOutTimeSecs = Integer.parseInt(args[2]);
        boolean repeat = Boolean.parseBoolean(args[3]);

        DocumentBuilder db = DocumentBuilderFactory.newInstance().newDocumentBuilder();
        Document doc = db.parse(new File(inputFileStr));
        XPath xpath = XPathFactory.newInstance().newXPath();
        XPathExpression expr = xpath.compile(".//path");
        NodeList pathNodes = (NodeList)expr.evaluate(doc, XPathConstants.NODESET);
        for (int i = 0; i < pathNodes.getLength(); i++) {
            Node pathNode = pathNodes.item(i);
            String pathDStr = pathNode.getAttributes().getNamedItem("d").getNodeValue();
            PathD pathD = PathD.fromString(pathDStr);

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
        }

        Transformer transformer = TransformerFactory.newInstance().newTransformer();
        DOMSource source = new DOMSource(doc);
        StreamResult result = new StreamResult(new File(outputFileStr));
        transformer.transform(source, result);
    }

    static class PathD {

        static class MPlusCsPlusMaybeZ {

            static class Point {
                String x;
                String y;

                Point(String x, String y) {
                    this.x = x;
                    this.y = y;
                }

                static Point fromString(String pointStr) {
                    String[] chunks = pointStr.split(",");
                    if (chunks.length != 2)
                        throw new RuntimeException("Not containing exactly two coordinates (separated by comma): " + pointStr);
                    return new Point(chunks[0], chunks[1]);
                }

                @Override
                public String toString() {
                    return x + "," + y;
                }
            }

            Point initialM;
            List<Point> consecutiveCs;
            boolean endingZ;

            MPlusCsPlusMaybeZ() {
                initialM = Point.fromString("0,0");
                consecutiveCs = new ArrayList<Point>();
                endingZ = false;
            }

            MPlusCsPlusMaybeZ(Point initialM, List<Point> consecutiveCs, boolean endingZ) {
                this.initialM = initialM;
                this.consecutiveCs = consecutiveCs;
                this.endingZ = endingZ;
            }

            static MPlusCsPlusMaybeZ fromString(String pathDStr) {
                String[] chunks = pathDStr.split(" ");
                MPlusCsPlusMaybeZ result = new MPlusCsPlusMaybeZ();

                for (int i = 0; i < chunks.length; i++) {
                    String chunk = chunks[i];
                    if (i == 0) {
                        if (!chunk.equals("M")) throw new RuntimeException("M expected as 1st chunk: " + pathDStr);
                    } else if (i == 1) {
                        result.initialM = Point.fromString(chunk);
                    } else if (i == 2) {
                        if (!chunk.equals("C")) throw new RuntimeException("C expected as 3rd chunk: " + pathDStr);
                    } else {
                        boolean lastChunk = (i == (chunks.length - 1));
                        Point point = null;
                        RuntimeException pointParseException = null;
                        try {
                            point = Point.fromString(chunk);
                        } catch (RuntimeException e) {
                            pointParseException = e;
                        }
                        ;
                        if (lastChunk && point == null) {
                            if (!chunk.equals("Z"))
                                throw new RuntimeException("Z or point expected as last chunk: " + pathDStr, pointParseException);
                            result.endingZ = true;
                        } else {
                            result.consecutiveCs.add(point);
                        }
                    }
                }

                return result;
            }

            @Override
            public String toString() {
                StringBuilder result = new StringBuilder("M " + initialM + " C");

                for (Point c : consecutiveCs) {
                    result.append(" ").append(c);
                }

                if (endingZ) result.append(" Z");

                return result.toString();
            }
        }

        List<MPlusCsPlusMaybeZ> MPlusCsPlusMaybeZs;

        PathD() {
            MPlusCsPlusMaybeZs = new ArrayList<MPlusCsPlusMaybeZ>();
        }

        PathD(List<MPlusCsPlusMaybeZ> MPlusCsPlusMaybeZs) {
            this.MPlusCsPlusMaybeZs = MPlusCsPlusMaybeZs;
        }

        static PathD fromString(String pathDStr) {
            PathD result = new PathD();

            final String uniqueStartOfSection = "M ";
            int currentSectionStarts = 0;
            while (currentSectionStarts < pathDStr.length()) {
                int nextSectionStarts = pathDStr.indexOf(uniqueStartOfSection, currentSectionStarts + uniqueStartOfSection.length());
                if (nextSectionStarts < 0) nextSectionStarts = pathDStr.length();
                String chunk = pathDStr.substring(currentSectionStarts, nextSectionStarts);
                result.MPlusCsPlusMaybeZs.add(MPlusCsPlusMaybeZ.fromString(chunk));
                currentSectionStarts = nextSectionStarts;
            }

            return result;
        }

        @Override
        public String toString() {
            StringBuilder result = new StringBuilder();

            for (MPlusCsPlusMaybeZ mcsz : MPlusCsPlusMaybeZs) {
                result.append(" ").append(mcsz);
            }

            return result.toString().trim();
        }
    }

}
