(() => {
  "use strict";

  const SED = window.SED;

  function convertStepsToGraph(steps) {
    steps = steps || [];
    const nodes = [];
    const edges = [];
    const labels = Object.create(null);
    const loopLabels = Object.create(null);

    // Pass 1: create nodes and build label map
    steps.forEach((step, index) => {
      const nodeId = "step_" + index;
      nodes.push({ id: nodeId, ...step });
      if (step.type === "label" && step.name) {
        labels[step.name] = nodeId;
      }
      if (step.type === "loop" && step.label) {
        loopLabels[step.label] = nodeId;
      }
    });

    // Pass 2: create edges
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const nodeId = "step_" + i;
      const nextNodeId = i + 1 < steps.length ? "step_" + (i + 1) : null;

      if (step.type === "jump") {
        if (step.label && labels[step.label]) {
          edges.push({ id: "e_" + i + "_jump", source: nodeId, target: labels[step.label] });
        }
        continue;
      }

      if (step.type === "choice" && Array.isArray(step.options)) {
        let hasJumps = false;
        step.options.forEach((opt, idx) => {
          if (opt.jump && labels[opt.jump]) {
            hasJumps = true;
            edges.push({ id: "e_" + i + "_opt" + idx, source: nodeId, target: labels[opt.jump] });
          }
        });
        if (!hasJumps && nextNodeId) {
          edges.push({ id: "e_" + i + "_seq", source: nodeId, target: nextNodeId });
        }
        continue;
      }

      if (step.type === "condition") {
        let hasCondJumps = false;
        if (step.jumpTrue && labels[step.jumpTrue]) {
          hasCondJumps = true;
          edges.push({ id: "e_" + i + "_true", source: nodeId, target: labels[step.jumpTrue] });
        }
        if (step.jumpFalse && labels[step.jumpFalse]) {
          hasCondJumps = true;
          edges.push({ id: "e_" + i + "_false", source: nodeId, target: labels[step.jumpFalse] });
        }
        if (step.elseJump && labels[step.elseJump]) {
          hasCondJumps = true;
          edges.push({ id: "e_" + i + "_else", source: nodeId, target: labels[step.elseJump] });
        }
        if (!hasCondJumps && nextNodeId) {
          edges.push({ id: "e_" + i + "_seq", source: nodeId, target: nextNodeId });
        }
        continue;
      }

      if (step.type === "endLoop") {
        if (step.label && loopLabels[step.label]) {
          edges.push({ id: "e_" + i + "_loopback", source: nodeId, target: loopLabels[step.label] });
        } else if (nextNodeId) {
          edges.push({ id: "e_" + i + "_seq", source: nodeId, target: nextNodeId });
        }
        continue;
      }

      if (step.type === "return") {
        // Return is handled by Runner call stack; no graph edge needed
        continue;
      }

      // Default sequential flow
      if (nextNodeId) {
        edges.push({ id: "e_" + i + "_seq", source: nodeId, target: nextNodeId });
      }
    }

    return { nodes, edges, labels };
  }

  function normalizeScene(scene) {
    if (!scene) return null;
    if (Array.isArray(scene.nodes) && Array.isArray(scene.edges)) {
      // Already graph format; ensure labels map exists
      if (!scene._labels) {
        scene._labels = Object.create(null);
        scene.nodes.forEach(n => {
          if (n.type === "label" && n.name) {
            scene._labels[n.name] = n.id;
          }
        });
      }
      return scene;
    }
    if (Array.isArray(scene.steps)) {
      const graph = convertStepsToGraph(scene.steps);
      return {
        ...scene,
        schema: "SED_SCENE_2",
        nodes: graph.nodes,
        edges: graph.edges,
        _labels: graph.labels,
        _convertedFromSteps: true
      };
    }
    return scene;
  }

  SED.GraphConverter = {
    convertStepsToGraph,
    normalizeScene
  };

  SED.registerModule("GraphConverter", "2.0.0");
})();
