(() => {
  "use strict";

  const SED = window.SED;

  function GraphQueue(nodes, edges, labels) {
    this._nodes = nodes || [];
    this._edges = edges || [];
    this._labels = labels || Object.create(null);
    this._nodeMap = new Map();
    this._outEdges = new Map();
    this._inEdges = new Map();
    this._visited = new Set();
    this._chosenEdgeId = null;

    for (const node of this._nodes) {
      this._nodeMap.set(node.id, node);
      this._outEdges.set(node.id, []);
      this._inEdges.set(node.id, []);
    }

    for (const edge of this._edges) {
      const outs = this._outEdges.get(edge.source);
      if (outs) outs.push(edge);
      const ins = this._inEdges.get(edge.target);
      if (ins) ins.push(edge);
    }

    this._currentNodeId = this._findStartNode();
  }

  GraphQueue.prototype._findStartNode = function() {
    const hasIncoming = new Set();
    for (const edge of this._edges) {
      hasIncoming.add(edge.target);
    }
    for (const node of this._nodes) {
      if (!hasIncoming.has(node.id)) return node.id;
    }
    return this._nodes[0] ? this._nodes[0].id : null;
  };

  GraphQueue.prototype.currentNodeId = function() {
    return this._currentNodeId;
  };

  GraphQueue.prototype.currentIndex = function() {
    if (!this._currentNodeId) return 0;
    const m = this._currentNodeId.match(/^step_(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  };

  GraphQueue.prototype.next = function() {
    if (!this._currentNodeId) return null;
    const node = this._nodeMap.get(this._currentNodeId);
    if (!node) return null;

    this._visited.add(this._currentNodeId);

    // Pre-advance to default next node (can be overridden by jumpTo)
    const outs = this._outEdges.get(this._currentNodeId) || [];
    if (outs.length === 0) {
      this._currentNodeId = null;
    } else if (outs.length === 1) {
      this._currentNodeId = outs[0].target;
    } else {
      if (this._chosenEdgeId) {
        const edge = outs.find(e => e.id === this._chosenEdgeId);
        this._currentNodeId = edge ? edge.target : outs[0].target;
        this._chosenEdgeId = null;
      } else {
        this._currentNodeId = outs[0].target;
      }
    }

    return node;
  };

  GraphQueue.prototype.chooseEdge = function(edgeId) {
    this._chosenEdgeId = String(edgeId);
  };

  GraphQueue.prototype.jumpTo = function(labelOrNodeId) {
    const nodeId = this._labels[labelOrNodeId] || labelOrNodeId;
    if (this._nodeMap.has(nodeId)) {
      this._currentNodeId = nodeId;
      this._chosenEdgeId = null;
    } else {
      throw new Error("GraphQueue: missing node/label: " + labelOrNodeId);
    }
  };

  GraphQueue.prototype.getOutEdges = function(nodeId) {
    return (this._outEdges.get(nodeId || this._currentNodeId) || []).slice();
  };

  GraphQueue.prototype.isComplete = function() {
    if (!this._currentNodeId) return true;
    const outs = this._outEdges.get(this._currentNodeId) || [];
    return outs.length === 0;
  };

  GraphQueue.prototype.hasVisited = function(nodeId) {
    return this._visited.has(nodeId || this._currentNodeId);
  };

  GraphQueue.prototype.getNode = function(nodeId) {
    return this._nodeMap.get(nodeId) || null;
  };

  SED.GraphQueue = GraphQueue;
  SED.registerModule("GraphQueue", "2.0.0");
})();
