"use strict";
/*
*  Copyright (C) 1998-2017 by Northwoods Software Corporation. All Rights Reserved.
*/

import * as go from "../release/go";
import { PolygonDrawingTool } from "./PolygonDrawingTool";
import { GeometryReshapingTool } from "./GeometryReshapingTool";

var myDiagram: go.Diagram;

export function init() {
	if (typeof (<any>window)["goSamples"] === 'function') (<any>window)["goSamples"]();  // init for these samples -- you don't need to call this  

	const $ = go.GraphObject.make;

	myDiagram =
    $(go.Diagram, "myDiagramDiv",
      {
        initialContentAlignment: go.Spot.Center
      });

	myDiagram.toolManager.mouseDownTools.insertAt(3, new GeometryReshapingTool());

	myDiagram.nodeTemplateMap.add("PolygonDrawing",
		$(go.Node,
			{ locationSpot: go.Spot.Center },  // to support rotation about the center
			new go.Binding("location", "loc", go.Point.parse).makeTwoWay(go.Point.stringify),
			{
				selectionAdorned: true, selectionObjectName: "SHAPE",
				selectionAdornmentTemplate:  // custom selection adornment: a blue rectangle
				$(go.Adornment, "Auto",
					$(go.Shape, { stroke: "dodgerblue", fill: null }),
					$(go.Placeholder, { margin: -1 }))
			},
			{ resizable: true, resizeObjectName: "SHAPE" },
			{ rotatable: true, rotateObjectName: "SHAPE" },
			{ reshapable: true },  // GeometryReshapingTool assumes nonexistent Part.reshapeObjectName would be "SHAPE"
			$(go.Shape,
				{ name: "SHAPE", fill: "lightgray", strokeWidth: 1.5 },
				new go.Binding("desiredSize", "size", go.Size.parse).makeTwoWay(go.Size.stringify),
				new go.Binding("angle").makeTwoWay(),
				new go.Binding("geometryString", "geo").makeTwoWay(),
				new go.Binding("fill"),
				new go.Binding("stroke"),
				new go.Binding("strokeWidth"))
		));

	// create polygon drawing tool for myDiagram, defined in PolygonDrawingTool.js
	var tool = new PolygonDrawingTool();
	// provide the default JavaScript object for a new polygon in the model
	tool.archetypePartData =
		{ fill: "yellow", stroke: "blue", strokeWidth: 3, category: "PolygonDrawing" };
	tool.isPolygon = true;  // for a polyline drawing tool set this property to false
	// install as first mouse-down-tool
	myDiagram.toolManager.mouseDownTools.insertAt(0, tool);

	load();  // load a simple diagram from the textarea
}

export function mode(draw: boolean, polygon: boolean) {
	// assume PolygonDrawingTool is the first tool in the mouse-down-tools list
	var tool: PolygonDrawingTool = myDiagram.toolManager.mouseDownTools.elt(0) as PolygonDrawingTool;
	tool.isEnabled = draw;
	tool.isPolygon = polygon;
	(tool.archetypePartData as go.Shape).fill = (polygon ? "yellow" : null);
	tool.temporaryShape.fill = (polygon ? "yellow" : null);
}

// this command ends the PolygonDrawingTool
export function finish(commit: boolean) {
	var tool = myDiagram.currentTool;
	if (commit && tool instanceof PolygonDrawingTool) {
		var lastInput = myDiagram.lastInput;
		if (lastInput.event instanceof MouseEvent) tool.removeLastPoint();  // remove point from last mouse-down
		tool.finishShape();
	} else {
		tool.doCancel();
	}
}

// this command removes the last clicked point from the temporary Shape
export function undo() {
	var tool = myDiagram.currentTool;
	if (tool instanceof PolygonDrawingTool) {
		var lastInput = myDiagram.lastInput;
		if (lastInput.event instanceof MouseEvent) tool.removeLastPoint();  // remove point from last mouse-down
		tool.undo();
	}
}

export function updateAllAdornments() {  // called after checkboxes change Diagram.allow...
	myDiagram.selection.each((p) => { p.updateAdornments(); });
}

// save a model to and load a model from Json text, displayed below the Diagram
export function save() {
	var str = '{ "position": "' + go.Point.stringify(myDiagram.position) + '",\n  "model": ' + myDiagram.model.toJson() + ' }';
	(document.getElementById("mySavedDiagram") as any).value = str;
}
export function load() {
	var str = (document.getElementById("mySavedDiagram") as any).value
	try {
		var json = JSON.parse(str);
		myDiagram.initialPosition = go.Point.parse(json.position || "0 0");
		myDiagram.model = go.Model.fromJson(json.model);
		myDiagram.model.undoManager.isEnabled = true;
	} catch (ex) {
		alert(ex);
	}
}

export function select() {
	mode(false, false);
}
export function drawPolygon() {
	mode(true, true);
}
export function drawPolyline() {
	mode(true, false);
}
export function finishDrawing() {
	finish(true);
}
export function cancelDrawing() {
	finish(false);
}
export function allowResizing() {
	myDiagram.allowResize = !myDiagram.allowResize; updateAllAdornments();
}
export function allowReshaping() {
	myDiagram.allowReshape = !myDiagram.allowReshape; updateAllAdornments();
}
export function allowRotating() {
	myDiagram.allowRotate = !myDiagram.allowRotate; updateAllAdornments();
}