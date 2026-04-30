(() => {
  "use strict";

  const SED = window.SED;

  function validateScene(scene) {
    const errors = [];

    if (!scene || typeof scene !== "object") {
      return ["Scene must be an object."];
    }

    if (scene.schema !== "SED_SCENE_1") {
      errors.push("Scene schema must be SED_SCENE_1.");
    }

    if (!scene.sceneId || typeof scene.sceneId !== "string") {
      errors.push("Scene missing string sceneId.");
    }

    if (!Array.isArray(scene.steps)) {
      errors.push("Scene steps must be an array.");
      return errors;
    }

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

      // v0.2+: Validate condition jump targets
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

      if (step.type === "choice" && Array.isArray(step.options)) {
        step.options.forEach((option, optionIndex) => {
          if (option.jump && !labels[option.jump]) {
            errors.push(
              "steps[" + index + "].options[" + optionIndex + "] jumps to missing label: " + option.jump
            );
          }
        });
      }

      // v0.3: Validate loop and endLoop labels
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

      // Check unknown step types (only after all v0.3 modules are registered)
      if (SED.StepRegistry && !SED.StepRegistry.has(step.type)) {
        errors.push("steps[" + index + "] unknown step type: " + step.type);
      }
    });

    return errors;
  }

  SED.SceneValidator = {
    validateScene
  };

  SED.registerModule("SceneValidator", "0.3.0");
})();
