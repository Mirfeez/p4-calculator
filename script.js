// Advanced calculator logic for the existing HTML UI
(function () {
  "use strict";

  const display = document.getElementById("display");
  if (!display) return; // nothing to do if markup missing

  // State
  let current = ""; // current number being entered (string)
  let expr = ""; // full expression built from numbers/operators
  let memory = 0; // simple memory register

  // Helpers
  function updateDisplay() {
    // Keep display readable: show current if typing, otherwise show last result or 0
    display.value = current === "" ? (expr === "" ? "0" : expr) : current;
  }

  function sanitizeForEval(s) {
    // Only allow digits, operators, decimal point and parentheses
    return s.replace(/[^0-9+\-*/().]/g, "");
  }

  function evaluateExpression(s) {
    const safe = sanitizeForEval(s);
    if (safe.trim() === "") return 0;
    try {
      // Use Function instead of eval for slightly better scoping
      // Wrap in parentheses to allow expressions like -3
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + safe + ")")();
      if (typeof result === "number" && !Number.isFinite(result))
        throw new Error("Math error");
      return result;
    } catch (err) {
      return "Error";
    }
  }

  // Input handling
  function appendNumber(n) {
    if (n === "00") {
      // Avoid leading multiple zeros like 000
      if (current === "0" || current === "") {
        current = "0";
      } else {
        current += "00";
      }
      updateDisplay();
      return;
    }

    if (n === ".") {
      if (current.includes(".")) return;
      current = current === "" ? "0." : current + ".";
      updateDisplay();
      return;
    }

    // regular digits
    if (current === "0") current = n;
    else current += n;
    updateDisplay();
  }

  function pushOperator(op) {
    if (current === "" && expr === "") return; // nothing to operate on

    if (current !== "") {
      expr += current;
      current = "";
    }

    // if expression already ends with operator, replace it
    if (/[+\-*/]$/.test(expr)) {
      expr = expr.slice(0, -1) + op;
    } else {
      expr += op;
    }

    updateDisplay();
  }

  function computeResult() {
    let toEval = expr + current;
    if (toEval === "") return;
    // If expression ends with an operator, strip it
    toEval = toEval.replace(/[+\-*/]+$/, "");
    const result = evaluateExpression(toEval);
    expr = "";
    current = String(result);
    updateDisplay();
  }

  function clearAll() {
    current = "";
    expr = "";
    updateDisplay();
  }

  // Expose a global clear() because the HTML has onclick="clear()" on the C/AC buttons
  window.clear = clearAll;

  function backspace() {
    if (current !== "") {
      current = current.slice(0, -1);
    } else if (expr !== "") {
      expr = expr.slice(0, -1);
    }
    updateDisplay();
  }

  function toggleSign() {
    if (current !== "") {
      if (current.startsWith("-")) current = current.slice(1);
      else current = "-" + current;
    } else {
      // try toggling last number inside expr
      const m = expr.match(/(.*?)([0-9.]+)$/);
      if (m) expr = m[1] + (m[2].startsWith("-") ? m[2].slice(1) : "-" + m[2]);
    }
    updateDisplay();
  }

  function percent() {
    if (current !== "") {
      const val = parseFloat(current);
      current = String(val / 100);
    } else if (expr !== "") {
      const val = evaluateExpression(expr);
      if (typeof val === "number") {
        expr = String(val / 100);
      }
    }
    updateDisplay();
  }

  function squareRoot() {
    if (current !== "") {
      const val = parseFloat(current);
      if (val < 0) {
        current = "Error";
      } else {
        current = String(Math.sqrt(val));
      }
    } else if (expr !== "") {
      const val = evaluateExpression(expr);
      if (typeof val === "number") expr = String(Math.sqrt(val));
    }
    updateDisplay();
  }

  // Simple memory functions: M+, M-, MRC
  function memoryAdd() {
    const v =
      current !== ""
        ? parseFloat(current)
        : expr !== ""
        ? evaluateExpression(expr)
        : 0;
    if (typeof v === "number") memory += v;
  }

  function memorySubtract() {
    const v =
      current !== ""
        ? parseFloat(current)
        : expr !== ""
        ? evaluateExpression(expr)
        : 0;
    if (typeof v === "number") memory -= v;
  }

  function memoryRecall() {
    current = String(memory);
    updateDisplay();
  }

  // Map data-value / button text to actions
  function handleInput(val) {
    if (!val) return;
    switch (val) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
      case "00":
        appendNumber(val);
        break;
      case ".":
        appendNumber(".");
        break;
      case "+":
      case "-":
      case "*":
      case "/":
        pushOperator(val);
        break;
      case "=":
        computeResult();
        break;
      case "c":
      case "ac":
        clearAll();
        break;
      case "delete":
        backspace();
        break;
      case "+/-":
        toggleSign();
        break;
      case "%":
        percent();
        break;
      case "root":
        squareRoot();
        break;
      case "m+":
        memoryAdd();
        break;
      case "m-":
        memorySubtract();
        break;
      case "mrc":
        memoryRecall();
        break;
      default:
        // Ignore non-implemented keys like MU, GT, etc.
        break;
    }
  }

  // Attach listeners to buttons
  document.querySelectorAll(".btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const v = btn.getAttribute("data-value") || btn.textContent;
      handleInput(v);
    });
  });

  // Keyboard support
  window.addEventListener("keydown", (e) => {
    if (e.key >= "0" && e.key <= "9") {
      handleInput(e.key);
      e.preventDefault();
      return;
    }
    if (e.key === "Enter") {
      handleInput("=");
      e.preventDefault();
      return;
    }
    if (e.key === "Backspace") {
      handleInput("delete");
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      handleInput("ac");
      e.preventDefault();
      return;
    }
    if (e.key === ".") {
      handleInput(".");
      e.preventDefault();
      return;
    }
    if (["+", "-", "*", "/"].includes(e.key)) {
      handleInput(e.key);
      e.preventDefault();
      return;
    }
  });

  // Initialize
  updateDisplay();
})();


