(() => {
  "use strict";

  const SED = window.SED;

  const VALID_OPERATORS = [
    "switchIs", "variableIs", "variableGte", "variableLte",
    "choiceIs", "scenePlayed", "sceneCompleted", "hasItem", "goldGte",
    "questActive", "questCompleted", "questFailed", "questObjectiveDone",
    "relationshipGte", "relationshipLte", "relationshipIs"
  ];

  function validateCondition(condition, path, errors) {
    if (!condition || typeof condition !== "object") return;
    if (VALID_OPERATORS.indexOf(condition.operator) === -1) {
      errors.push(path + " unknown condition operator: " + condition.operator);
    }
  }

  function validateGraph(scene, errors) {
    const nodes = scene.nodes || [];
    const edges = scene.edges || [];
    const nodeIds = new Set();
    const nodeMap = Object.create(null);

    nodes.forEach((node, idx) => {
      if (!node.id || typeof node.id !== "string") {
        errors.push("nodes[" + idx + "] missing id.");
      } else if (nodeIds.has(node.id)) {
        errors.push("Duplicate node id: " + node.id);
      } else {
        nodeIds.add(node.id);
        nodeMap[node.id] = node;
      }
      if (!node.type || typeof node.type !== "string") {
        errors.push("nodes[" + idx + "] missing type.");
      }
    });

    const inDegree = Object.create(null);
    nodeIds.forEach(id => { inDegree[id] = 0; });

    edges.forEach((edge, idx) => {
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push("edges[" + idx + "] source missing or invalid: " + edge.source);
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push("edges[" + idx + "] target missing or invalid: " + edge.target);
      }
      if (edge.source === edge.target) {
        errors.push("edges[" + idx + "] self-loop detected: " + edge.id);
      }
      if (edge.condition) {
        validateCondition(edge.condition, "edges[" + idx + "]", errors);
      }
      if (edge.target) inDegree[edge.target]++;
    });

    // Check for orphan nodes (no incoming, not start)
    const startNodes = [];
    nodeIds.forEach(id => {
      if (inDegree[id] === 0) startNodes.push(id);
    });
    if (startNodes.length === 0 && nodes.length > 0) {
      errors.push("Graph has no start node (all nodes have incoming edges).");
    }
    if (startNodes.length > 1) {
      errors.push("Graph has multiple start nodes: " + startNodes.join(", "));
    }

    // Check for unreachable nodes
    const visited = new Set();
    const queue = startNodes.slice();
    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);
      edges.filter(e => e.source === id).forEach(e => queue.push(e.target));
    }
    nodeIds.forEach(id => {
      if (!visited.has(id)) {
        errors.push("Unreachable node: " + id + " (" + (nodeMap[id].type || "unknown") + ")");
      }
    });

    // Check for cycles (simple DFS)
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = Object.create(null);
    nodeIds.forEach(id => { color[id] = WHITE; });
    const adj = Object.create(null);
    nodeIds.forEach(id => { adj[id] = []; });
    edges.forEach(e => { if (adj[e.source]) adj[e.source].push(e.target); });

    function dfs(id) {
      color[id] = GRAY;
      for (const target of adj[id]) {
        if (color[target] === GRAY) {
          errors.push("Graph contains a cycle involving node: " + target);
          return;
        }
        if (color[target] === WHITE) dfs(target);
      }
      color[id] = BLACK;
    }
    nodeIds.forEach(id => { if (color[id] === WHITE) dfs(id); });
  }

  function validateSteps(scene, errors) {
    const steps = scene.steps || [];

    const labels = Object.create(null);
    const labelIndexes = Object.create(null);
    const loopLabels = Object.create(null);

    scene.steps.forEach((step, index) => {
      if (!step || typeof step !== "object") {
        errors.push("steps[" + index + "] must be an object.");
        return;
      }

      if (!step.type || typeof step.type !== "string") {
        errors.push("steps[" + index + "] missing type.");
        return;
      }

      if (step.type === "label") {
        if (!step.name) {
          errors.push("steps[" + index + "] label missing name.");
        } else if (labels[step.name]) {
          errors.push("Duplicate label: " + step.name);
        } else {
          labels[step.name] = true;
          labelIndexes[step.name] = index;
        }
      }

      if (step.type === "loop" && step.label && typeof step.label === "string") {
        loopLabels[step.label] = true;
      }
    });

    scene.steps.forEach((step, index) => {
      if (!step || !step.type) return;

      // Validate jump targets
      if (step.type === "jump") {
        if (!labels[step.label]) {
          errors.push("steps[" + index + "] jumps to missing label: " + step.label);
        } else if (labelIndexes[step.label] <= index) {
          SED.Logger.warn("Potential infinite loop: jump at step " + index + " jumps backward to label " + step.label);
        }
      }

      // Validate condition jump targets
      if (step.type === "condition") {
        if (step.jumpTrue && !labels[step.jumpTrue]) {
          errors.push("steps[" + index + "] condition jumpTrue to missing label: " + step.jumpTrue);
        }
        if (step.jumpFalse && !labels[step.jumpFalse]) {
          errors.push("steps[" + index + "] condition jumpFalse to missing label: " + step.jumpFalse);
        }
        if (step.elseJump && !labels[step.elseJump]) {
          errors.push("steps[" + index + "] condition elseJump to missing label: " + step.elseJump);
        }
      }

      // Validate choice option jumps and conditions
      if (step.type === "choice" && Array.isArray(step.options)) {
        step.options.forEach((option, optionIndex) => {
          if (option.jump && !labels[option.jump]) {
            errors.push(
              "steps[" + index + "].options[" + optionIndex + "] jumps to missing label: " + option.jump
            );
          }
          if (option.condition) {
            validateCondition(option.condition, "steps[" + index + "].options[" + optionIndex + "]", errors);
          }
        });
        if (step.timeoutJump && !labels[step.timeoutJump]) {
          errors.push("steps[" + index + "] timeoutJump to missing label: " + step.timeoutJump);
        }
      }

      // Validate callScene
      if (step.type === "callScene") {
        if (!step.sceneId) {
          errors.push("steps[" + index + "] callScene missing sceneId.");
        }
        if (step.returnLabel && !labels[step.returnLabel]) {
          errors.push("steps[" + index + "] callScene returnLabel missing: " + step.returnLabel);
        }
      }

      // Validate loop and endLoop labels
      if (step.type === "loop") {
        if (!step.label || typeof step.label !== "string") {
          errors.push("steps[" + index + "] loop missing label.");
        } else if (!labels[step.label]) {
          errors.push("steps[" + index + "] loop points to missing label: " + step.label);
        }
      }

      if (step.type === "endLoop") {
        if (!step.label || typeof step.label !== "string") {
          errors.push("steps[" + index + "] endLoop missing label.");
        } else if (!loopLabels[step.label]) {
          errors.push("steps[" + index + "] endLoop label does not match any loop step: " + step.label);
        }
      }

      // Check unknown step types
      if (SED.StepRegistry && !SED.StepRegistry.has(step.type)) {
        errors.push("steps[" + index + "] unknown step type: " + step.type);
      }
    });

    return errors;
  }

  SED.SceneValidator = {
    validateScene,
    validateGraph,
    VALID_OPERATORS
  };

  SED.registerModule("SceneValidator", "1.1.0");
})();
