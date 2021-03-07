var errorModal = document.getElementById("error-modal");
var span = document.getElementsByClassName("close")[1];
var errorModalText = document.querySelector("#error-text");
var jsonModal = document.querySelector("#json-modal");
var jsonText = document.querySelector("#json-text");
var jsonPrompt = document.querySelector("#json-prompt");
var getJsonButt = document.querySelector("#json-get");
var setJsonButt = document.querySelector("#json-set");
var submitJson = document.querySelector("#submit-json");
var buttons = document.querySelectorAll(".action");
var home = document.querySelector("#home");
window.addEventListener("keydown", function (e) {
  if (
    e.key == "Escape" ||
    e.key == "Tab" ||
    e.key == "Space" ||
    e.key == "Enter"
  ) {
    if (errorModal.style.display != "none") {
      errorModal.style.display = "none";
    }
    if (jsonModal.style.display != "none") {
      jsonModal.style.display = "none";
    }
  }
});
span.onclick = function () {
  errorModal.style.display = "none";
};

function initializeApp(data, project) {
  home.style.display = "none";
  window.document.title =
    project.replace(/^\w/, (c) => c.toUpperCase()) + " | FiveDown";
  const newColButt = document.querySelector("#new-column");
  const newRowButt = document.querySelector("#new-row");
  const fs = require("fs");
  buttons.forEach((b) => {
    b.style.display = "block";
  });

  var parser = new formulaParser.Parser();
  parser.variables = data.variables;

  //?Features
  //TODO Copy and paste rows

  //!BUGS
  //TODO loop from hell and self-assigning
  //TODO Pasting in columns can delete all of them.

  var Alts = JSON.parse(data.Alts);
  var removedAlts = data.removedAlts;
  let Editing = false;

  function showError(message) {
    errorModalText.innerText = message;
    errorModal.style.display = "block";
  }

  var eGridDiv = document.querySelector("#myGrid");
  let Grid = new agGrid.Grid(eGridDiv, {
    rowDragManaged: true,
    animateRows: true,
    rowData: data.rowData,
    columnDefs: data.columnDefs,
    rowSelection: "multiple",
    onCellValueChanged: function (event) {
      if (!Editing) {
        console.log("boom");
        let row = event.node.rowIndex,
          column = event.column.colId,
          oldValue = event.oldValue,
          newValue = event.newValue;
        if (column == "unit" || column == "description") {
          autoSaveProgress();
          return;
        }

        if (column === "name") {
          function assignNewAlts() {
            if (Alts > 0) {
              let allVariables = parser.variables;
              for (v in allVariables) {
                if (oldValue && newValue) {
                  allVariables[v][newValue] = allVariables[v][oldValue];
                  delete allVariables[v][oldValue];
                }
                if (!oldValue && newValue) {
                  allVariables[v][newValue] = event.data[v].length
                    ? event.data[v]
                    : "0";
                }
              }
              parser.variables = allVariables;
            } else {
              let currentVars = parser.variables.alt;
              if (oldValue && newValue) {
                currentVars[newValue] = currentVars[oldValue];
              }
              if (!oldValue && newValue) {
                currentVars[newValue] = event.data.alt.length
                  ? event.data.alt
                  : "0";
              }
              delete currentVars[oldValue];
              parser.variables.alt = currentVars;
            }
            autoSaveProgress();
            return;
          }
          if (!oldValue && !newValue) {
            return;
          }

          if (!newValue && oldValue) {
            //Validating if we have a blank name and an old name there
            Grid.gridOptions.api.forEachNode((row) => {
              if (
                row.data.definition &&
                row.data.definition.split(/\W/).includes(oldValue)
              ) {
                showError(
                  "Remove dependencies of this variable first before deleting this row"
                );
                return;
              }
            });
            let allVariables = parser.variables;
            if (Alts > 0) {
              for (v in allVariables) {
                delete allVariables[v][oldValue];
              }
              parser.variables = allVariables;
            } else {
              delete parser.variables.alt[oldValue];
            }
            autoSaveProgress();
            return;
          }

          if (newValue.match(/\W/g)) {
            showError("No special characters in name column.");
            event.node.setDataValue("name", `${oldValue}`);
            return;
          }

          if (newValue.includes(" ")) {
            showError("No spaces in variable names are allowed");
            event.node.setDataValue("name", `${oldValue}`);
            return;
          }

          if (Object.keys(parser.variables.alt).includes(newValue)) {
            //fix this validation
            showError("That name is already taken");
            event.node.setDataValue("name", `${oldValue}`);
            return;
          }

          if (
            parser.parse(newValue).result ||
            parser.parse(newValue).error == "#VALUE!"
          ) {
            showError("No mathematical concepts as names");
            event.node.setDataValue("name", `${oldValue}`);
            return;
          }
          Editing = true;

          assignNewAlts();
          if (oldValue) changeDisplayedVariableNames(oldValue, newValue); // Still to do!
        }

        if (column.includes("alt")) {
          if (!event.data.name && !event.data.name.length) {
            showError("Set a name before fiddling with the alt");
            event.node.setDataValue("alt", `0`);
            return;
          }
          let altIndex = event.column.colId.slice(3);
          let notExists = !newValue.match(/".*"/) && !newValue.match(/'.*'/);

          if (
            ((notExists && newValue.match(/".*"/) > newValue.length) ||
              (notExists && newValue.match(/'.*'/) > newValue.length)) &&
            isNaN(newValue)
          ) {
            showError(
              "Alt is for raw input values only, use definition for formulas"
            );
            event.node.setDataValue(
              "alt" + (altIndex.length > 0 ? altIndex : ""),
              `${oldValue}`
            );
            Editing = true;
            return;
          }
          const variableName = event.data.name;
          if (Alts > 0) {
            parser.variables[event.column.colId][variableName] = newValue;
            Editing = true;
            recalcuateVarDependents(variableName);
          } else {
            let currentValues = parser.variables.alt;
            currentValues[variableName] = isNaN(newValue)
              ? newValue
              : parseFloat(newValue).toPrecision(4);
            parser.variables.alt = currentValues;
            Editing = true;
            recalcuateVarDependents(variableName);
          }
          autoSaveProgress();
          return;
        }
        if (column === "definition") {
          if (!oldValue && !newValue) {
            return;
          }

          if (!newValue) {
            return;
          }

          if (!event.data.name) {
            showError("Set a name before fiddling with the defintion");
            event.node.setDataValue("definition", ``);
            return;
          }

          const variableName = event.data.name;
          let testFormula = newValue.split(/\W/);
          if (testFormula.includes(variableName)) {
            showError("No self-referencing variables allowed");
            event.node.setDataValue(
              "definition",
              `${oldValue ? oldValue : ""}`
            );

            return;
          }

          function errorCheck() {
            if (parser.parse(newValue).error) {
              event.node.setDataValue("definition", `${oldValue}`);
              switch (parser.parse(newValue).error) {
                case " #ERROR!":
                  showError(
                    "A general error has occured. Check whether what you entered makes sense and uses correct variables."
                  );
                  return false;
                case "#DIV/0!":
                  showError(
                    "You are dividing by zero. Something is going to explode if you do that."
                  );
                  return false;
                case "#NAME?":
                  let variables = newValue.split(/\W/);
                  let missing = [];
                  variables.forEach((v) => {
                    if (!parser.variables[v]) {
                      if (isNaN(v)) missing.push(v);
                    }
                  });
                  showError(
                    missing.toString() +
                      ` ${
                        missing.length > 1 ? "do" : "does"
                      } not exist. Retype the formula carefully.`
                  );
                  return false;
                case "#N/A":
                  showError(
                    "A value isn't available in that formula. Doube-check the values you're putting into each function."
                  );
                  return false;
                case "#NUM!":
                  showError(
                    "A number here is not a valid number. Are you using imaginary numbers?"
                  );
                  return false;
                case "#VALUE!":
                  showError(
                    "A value in this formula is not of the correct type. Ensure all of them are numbers or Maths concepts."
                  );
                  return false;

                default:
                  showError("An unknown error occured.");
                  return false;
              }
            }
            return true;
          }

          if (Alts > 0) {
            var altIndex = 0;
            var allVariables = parser.variables;

            for (v in allVariables) {
              let altCheck = "alt" + (altIndex ? altIndex : "");
              parser.variables = allVariables[altCheck];
              let checker = errorCheck();
              if (!checker) {
                parser.variables = allVariables;
                return;
              }
              let formulaResult = parser.parse(newValue).result;
              Editing = true;
              allVariables[v][variableName] = isNaN(formulaResult)
                ? formulaResult
                : parseFloat(formulaResult).toPrecision(4);
              event.node.setDataValue(
                altCheck,
                `${
                  isNaN(formulaResult)
                    ? formulaResult
                    : parseFloat(formulaResult).toPrecision(4)
                }`
              );
              parser.variables = allVariables;
              recalcuateVarDependents(variableName);
              altIndex++;
            }
          } else {
            Editing = true;
            let currentVars = parser.variables;
            parser.variables = currentVars.alt;
            let checker = errorCheck();
            if (!checker) {
              parser.variables = currentVars;
              return;
            }
            let newCalc = parser.parse(newValue).result;
            currentVars.alt[variableName] = isNaN(newCalc)
              ? newCalc
              : parseFloat(newCalc).toPrecision(4);
            parser.variables = currentVars;
            recalcuateVarDependents(variableName);
            event.node.setDataValue(
              "alt",
              `${isNaN(newCalc) ? newCalc : parseFloat(newCalc).toPrecision(4)}`
            );
          }
          autoSaveProgress();
        }
      }
    },
    onCellEditingStarted: (event) => {
      if (event.data.definition && event.column.colId.includes("alt")) {
        Grid.gridOptions.api.stopEditing(true);
        Grid.gridOptions.api.setFocusedCell(
          event.rowIndex,
          event.column.colId,
          null
        );
      }
      Editing = false;
    },
    suppressKeyboardEvent: (keypress) => {
      if (keypress.event.key === "Tab") {
        let cols = Grid.gridOptions.api.getColumnDefs();
        let numRows = Grid.gridOptions.rowData.length;
        let check1 = keypress.node.rowIndex === numRows - 1;
        let check2 = keypress.column.colId == cols[cols.length - 1].field;
        if (check1 && check2) {
          for (let i = 0; i < 6; i++) {
            addNewRow();
          }
          Grid.gridOptions.api.setFocusedCell(0, "name", null);
          return false;
        }
        return false;
      }
      if (keypress.event.key == "+" && !keypress.editing) {
        keypress.event.preventDefault();
        addNewRow();
        return true;
      }
      if (!keypress.editing) {
        let dependancy = false;
        let isDeleteKey = keypress.event.keyCode === 46;
        if (isDeleteKey) {
          let varName = keypress.data.name;
          if (varName) {
            Grid.gridOptions.api.forEachNode((row) => {
              if (
                row.data.definition &&
                row.data.definition.split(/\W/).includes(varName)
              ) {
                showError(
                  "Remove dependencies of this variable first before deleting this row"
                );
                dependancy = true;
              }
            });
          }
          if (!dependancy) {
            let allVariables = parser.variables;
            if (Alts > 0) {
              for (v in allVariables) {
                delete allVariables[v][varName];
              }
              parser.variables = allVariables;
            } else {
              delete parser.variables.alt[varName];
            }
            const selectedRows = keypress.api.getSelectedRows();
            Grid.gridOptions.rowData.splice(keypress.node.rowIndex, 1);
            Grid.gridOptions.api.applyTransaction({ remove: selectedRows });
          }
          autoSaveProgress();
          return true;
        }
      }
    },
  });

  function initCloseButts() {
    document.querySelectorAll(".closable").forEach((butt) => {
      butt.insertAdjacentHTML("beforeend", '<span class="cross">x</span>');
    });

    let closeButtons = document.querySelectorAll(".cross");
    closeButtons.forEach((butt) => {
      butt.addEventListener("click", function (e) {
        removeAltColumn(e.target.parentElement.getAttribute("col-Id"));
      });
    });
  }
  initCloseButts();

  newColButt.onclick = function () {
    addMoreAltCols();
  };
  newRowButt.onclick = function () {
    addNewRow();
  };
  function autoSaveProgress() {
    let newRows = [];
    Grid.gridOptions.api.forEachNode((row) => {
      newRows.push(row.data);
    });
    fs.writeFile(
      `/${project}.json`,
      JSON.stringify({
        rowData: newRows,
        columnDefs: Grid.gridOptions.columnDefs,
        variables: parser.variables,
        Alts: Alts,
        removedAlts: removedAlts,
      }),
      function (err) {}
    );
  }

  getJsonButt.onclick = function () {
    submitJson.style.display = "none";
    jsonPrompt.textContent = "This is the current configuration";
    jsonModal.style.display = "block";
    jsonText.value = JSON.stringify({
      variables: parser.variables,
      rowData: Grid.gridOptions.rowData,
      columnDefs: Grid.gridOptions.columnDefs,
      Alts: Alts,
      removedAlts,
    });
  };

  setJsonButt.onclick = function () {
    jsonPrompt.textContent = "Paste and submit your own configuration!";
    jsonModal.style.display = "block";
    submitJson.style.display = "block";
    jsonText.value = "";
  };

  submitJson.onclick = function () {
    let newConfig = JSON.parse(jsonText.value);
    jsonModal.style.display = "none";
    if (!newConfig.variables) {
      showError("The configuration needs a variables object");
      return;
    }
    if (!newConfig.rowData) {
      showError("The configuration needs a rowData array of objects.");
      return;
    }
    if (!newConfig.columnDefs) {
      showError("The configuration needs a columnDefs array of objects.");
      return;
    }
    if (!newConfig.removedAlts) {
      showError(
        "The configuration needs a max alt amount (equal to number of alt columns"
      );
      return;
    }
    if (isNaN(newConfig.Alts)) {
      showError("The configuration needs an Alt value.");
      return;
    }
    parser.variables = newConfig.variables;
    Alts = JSON.parse(newConfig.Alts);
    removedAlts = newConfig.removedAlts;
    Grid.gridOptions.api.setColumnDefs(newConfig.columnDefs);
    Grid.gridOptions.columnDefs = newConfig.columnDefs;
    Grid.gridOptions.api.setRowData([]);
    Grid.gridOptions.rowData = newConfig.rowData;
    Grid.gridOptions.api.setRowData(newConfig.rowData);
    autoSaveProgress();
  };

  function addMoreAltCols() {
    let currentColumns = Grid.gridOptions.columnDefs;
    let altNumber;
    if (Alts == 0) {
      removedAlts.sort((a, b) => a - b);
    }
    Alts++;
    altNumber = removedAlts.pop();
    currentColumns.push({
      headerName: "Alt " + (altNumber ? altNumber : Alts),
      field: "alt" + (altNumber ? altNumber : Alts),
      editable: true,
      headerClass: "closable",
      cellClassRules: {
        "grid-white": "!data.definition && data.alt == '0'",
        "grid-green": "data.alt && !data.definition",
        "grid-blue": "data.definition",
      },
      resizable: true,
    });
    Grid.gridOptions.api.setColumnDefs(currentColumns);

    if (Alts > 0) {
      let altCheck = "alt" + (altNumber ? altNumber : Alts);
      let newAltGroup = parser.variables.alt;
      parser.variables[altCheck] = JSON.parse(JSON.stringify(newAltGroup));
      Grid.gridOptions.api.forEachNode((innerRow) => {
        let name = innerRow.data.name;
        if (name && innerRow.data.definition) {
          innerRow.data[altCheck] = parser.variables[altCheck][name];
          Editing = true;
          recalcuateVarDependents(name);
        } else if (name && !innerRow.data.definition) {
          parser.variables[altCheck][name] = 0;
          innerRow.data[altCheck] = 0;
          Editing = true;
          recalcuateVarDependents(name);
        }
      });
      autoSaveProgress();
      initCloseButts();
    }
  }

  function removeAltColumn(id) {
    if (Alts > 0) {
      Alts--;
      let currentColumns = Grid.gridOptions.columnDefs;
      currentColumns.forEach((n, i) => {
        if (n.field == id) {
          currentColumns.splice(i, 1);
          removedAlts.push(id.slice(3, id.length));
        }
      });

      delete parser.variables[id];
      Grid.gridOptions.api.forEachNode((n) => {
        delete n.data[id];
      });
      Grid.gridOptions.api.setColumnDefs(currentColumns);
      autoSaveProgress();
      initCloseButts();
    }
  }

  function addNewRow() {
    let selectedRows = Grid.gridOptions.api.getSelectedNodes();
    let addIndex = selectedRows.length
      ? selectedRows[selectedRows.length - 1].rowIndex
      : null;

    let newRow = {
      definition: "",
      name: "",
      description: "",
      alt: "0",
      unit: "",
    };

    let currentAlts = parser.variables;
    for (v in currentAlts) {
      newRow[v] = "0";
    }

    if (!addIndex && addIndex !== 0) {
      Grid.gridOptions.rowData.push(newRow);
      Grid.gridOptions.api.applyTransaction({
        add: [newRow],
      });
    } else {
      Grid.gridOptions.rowData.splice(addIndex, 0, newRow);
      Grid.gridOptions.api.applyTransaction({
        add: [newRow],
        addIndex: addIndex + 1,
      });
    }
    autoSaveProgress();
  }

  const recalcuateVarDependents = (name) => {
    Grid.gridOptions.api.forEachNode((innerRow) => {
      if (innerRow.data.name == name || !innerRow.data.definition) return;
      let varName = innerRow.data.name;
      let definition = innerRow.data.definition;
      let variables = definition.split(/\W/);
      if (variables.includes(name)) {
        if (Alts > 0) {
          let allVars = parser.variables;
          for (v in allVars) {
            parser.variables = allVars[v];
            let formulaResult = parser.parse(definition).result;
            allVars[v][varName] = isNaN(formulaResult)
              ? formulaResult
              : parseFloat(formulaResult).toPrecision(4);
            innerRow.setDataValue(
              v,
              `${
                isNaN(formulaResult)
                  ? formulaResult
                  : parseFloat(formulaResult).toPrecision(4)
              }`
            );
            parser.variables = allVars;
            recalcuateVarDependents(varName);
          }
        } else {
          let allVars = parser.variables;
          parser.variables = allVars.alt;
          let newValue = parser.parse(definition).result;
          parser.variables[innerRow.data.name] = isNaN(newValue)
            ? newValue
            : parseFloat(newValue).toPrecision(4);
          parser.variables = allVars;
          innerRow.setDataValue(
            "alt",
            `${
              isNaN(newValue) ? newValue : parseFloat(newValue).toPrecision(4)
            }`
          );
          recalcuateVarDependents(varName);
        }
      }
    });
  };

  var changeDisplayedVariableNames = (name, newName) => {
    if (!name) return;
    Grid.gridOptions.api.forEachNode((innerRow) => {
      let definition = innerRow.data.definition;
      if (definition && definition.includes(name)) {
        Grid.gridOptions.api.startEditingCell({
          rowIndex: innerRow.rowIndex,
          colKey: "definition",
          charPress: `${definition.replace(name, newName)}`,
        });
        Grid.gridOptions.api.stopEditing();
      }
    });
    autoSaveProgress();
  };
}
