define(function() {

	class Link {
		constructor(from, to, fromPort, toPort, cnet) {
			this.from = from; 				this.to = to;
			this.fromPort = fromPort;	this.toPort = toPort;
			this.visited = false; // HACKING
			this.reverse = false;
			this.colour = colour;			this.penWidth = null;
			this.addToGraph(graph); // cheating
			this.addToNode(cnet);
		}

		addToNode(cnet) {
			var fromNode = this.graph.findNodeByKey(this.from);
			fromNode.outLinks.push(this);
			var toNode = this.graph.findNodeByKey(this.to);
			toNode.inLinks.push(this);
		}

		addToGraph(graph) {
			if (graph != null)
				graph.addLink(this);
			this.graph = graph;
			return this; // to provide chain operation
		}

		addToGroup(group) {
			group.addLink(this);
			this.group = group;
			return this; // to provide chain operation
		}

		changeToGroup(group) {
			this.group.removeLink(this);
			this.addToGroup(group);
			return this;
		}

		changeFrom(key, port) {
			var fromNode = this.graph.findNodeByKey(this.from);
			const i = fromNode.outLinks.indexOf(this);
			fromNode.outLinks.splice(i, 1);

			this.from = key;
			this.fromPort = port;
			fromNode = this.graph.findNodeByKey(this.from);
			fromNode.outLinks.splice(i,0,this);
		}

		changeTo(key, port) {
			var toNode = this.graph.findNodeByKey(this.to);
			const i = toNode.inLinks.indexOf(this);
			toNode.inLinks.splice(i, 1);

			this.to = key;
			this.toPort = port;
			toNode = this.graph.findNodeByKey(this.to);
			toNode.inLinks.splice(i,0,this);
		}

		focus(colour) {
			this.colour = colour;
			this.penWidth = "20";
		}

		clearFocus() {
			this.colour = null;
			this.penWidth = null;
			this.visited = true; // HACKING
		}

		delete() {
			var fromNode = this.graph.findNodeByKey(this.from);
			fromNode.outLinks.splice(fromNode.outLinks.indexOf(this), 1);
			var toNode = this.graph.findNodeByKey(this.to);
			toNode.inLinks.splice(toNode.inLinks.indexOf(this), 1);
			this.group.removeLink(this);
			this.graph.removeLink(this);
		}

		toString() {
			return this.from + "->" + this.to;
		}

		draw(level) {
			var str = level;

			if (!this.reverse) {
				str += this.from + '->' + this.to + '[';
				if (this.fromPort != null)
					str += 'tailport=' + this.fromPort;
				if (this.toPort != null)
					str += ',headport=' + this.toPort;
			}
			else {
				str += this.to + '->' + this.from + '[dir=back';
				if (this.fromPort != null)
					str += ',headport=' + this.fromPort;
				if (this.toPort != null)
					str += ',tailport=' + this.toPort;
			}

			if (this.colour != null)
				str += ',color=' + this.colour;
			if (this.penWidth != null)
				str += ',penwidth=' + this.penWidth;

			str += '];';
			return str;
		}
	}

	return Link;
});
