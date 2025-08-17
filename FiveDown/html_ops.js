// html_ops.js
/**
 * Validates an HTML snippet to ensure it meets the row definition:
 * - Must be a single <tr> element.
 * - Must have at least 8 cells (<td> or <th>).
 * - The name cell (index 2) must not be blank or undefined (unless ignored).
 * @param {string} htmlSnippet - The HTML string to validate.
 * @param {boolean} [ignoreBlankName=false] - If true, skips the blank name check.
 * @returns {boolean} True if valid, false otherwise.
 */
function validateRowHtml(htmlSnippet, ignoreBlankName = false) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${htmlSnippet}</table>`, 'text/html');
    const row = doc.querySelector('tr');
    if (!row) {
      return false;
    }
    const cells = Array.from(row.querySelectorAll('td, th'));
    if (cells.length < 8) {
      return false;
    }
    if (!ignoreBlankName) {
      const nameContent = cells[2].textContent.trim();
      if (!nameContent) {
        return false;
      }
    }
    return true;
  } catch (e) {
    console.log(e.message);
    return false;
  }
}

/**
 * Validates the row HTML and, if valid, adds a new empty <td> column to the right of the results columns
 * (i.e., before the add-results-column, which is assumed to be at index length - 3). Only results columns can be added.
 * @param {string} htmlSnippet - The HTML string of the <tr> to modify.
 * @returns {string} The modified HTML string if valid.
 * @throws {Error} If the HTML does not meet the row definition.
 */
function addColumnToRow(htmlSnippet) {
  if (!validateRowHtml(htmlSnippet)) {
    throw new Error('Invalid row HTML');
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${htmlSnippet}</table>`, 'text/html');
    const row = doc.querySelector('tr');
    const cells = Array.from(row.querySelectorAll('td, th'));
    const addResultsCell = cells[cells.length - 3];
    const newCell = doc.createElement('td');
    row.insertBefore(newCell, addResultsCell);
    return row.outerHTML;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

/**
 * Validates the row HTML and, if valid, moves a selected results column to a different position within the results range.
 * Indices are 0-based relative to the results columns (starting at overall index 4, index=0 is the first results column).
 * The resultToIndex can be from 0 to current number of results (to move to the end of results).
 * Only results columns can be moved, and they must stay within the results positions (before add-results-column).
 * @param {string} htmlSnippet - The HTML string of the <tr> to modify.
 * @param {number} resultFromIndex - The 0-based index of the results column to move.
 * @param {number} resultToIndex - The 0-based index where to insert the column (before this results position, or at the end if equal to number of results).
 * @returns {string} The modified HTML string if valid and operation succeeds.
 * @throws {Error} If the HTML does not meet the row definition or indices are invalid.
 */
function moveColumnInRow(htmlSnippet, resultFromIndex, resultToIndex) {
  if (!validateRowHtml(htmlSnippet)) {
    throw new Error('Invalid row HTML');
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${htmlSnippet}</table>`, 'text/html');
    const row = doc.querySelector('tr');
    const cells = Array.from(row.querySelectorAll('td, th'));
    const resultStartIndex = 4;
    const addResultsIndex = cells.length - 3;
    const numResults = addResultsIndex - resultStartIndex;
    if (resultFromIndex < 0 || resultFromIndex >= numResults || resultToIndex < 0 || resultToIndex > numResults) {
      throw new Error('Invalid results indices');
    }
    const overallFrom = resultStartIndex + resultFromIndex;
    const overallTo = resultStartIndex + resultToIndex;
    const cellToMove = cells[overallFrom];
    const insertBeforeCell = cells[overallTo];
    row.insertBefore(cellToMove, insertBeforeCell);
    return row.outerHTML;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

/**
 * Validates the row HTML and, if valid, removes a designated results column.
 * The index refers to the results column index (0-based, starting from the first result at index 4, index=0 is the first results column).
 * Ensures the row still has at least 8 cells after removal (i.e., at least one result column). Only results columns can be removed.
 * @param {string} htmlSnippet - The HTML string of the <tr> to modify.
 * @param {number} resultIndex - The 0-based index of the results column to remove.
 * @returns {string} The modified HTML string if valid and operation succeeds.
 * @throws {Error} If the HTML does not meet the row definition or index is invalid.
 */
function removeColumnFromRow(htmlSnippet, resultIndex) {
  if (!validateRowHtml(htmlSnippet)) {
    throw new Error('Invalid row HTML');
  }
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${htmlSnippet}</table>`, 'text/html');
    const row = doc.querySelector('tr');
    const cells = Array.from(row.querySelectorAll('td, th'));
    if (cells.length <= 8) {
      throw new Error('Cannot remove column: Row at minimum cells');
    }
    const resultStartIndex = 4;
    const addResultsIndex = cells.length - 3;
    const maxResultIndex = addResultsIndex - resultStartIndex - 1;
    if (resultIndex < 0 || resultIndex > maxResultIndex) {
      throw new Error('Invalid result index');
    }
    const overallIndex = resultStartIndex + resultIndex;
    const cellToRemove = cells[overallIndex];
    row.removeChild(cellToRemove);
    return row.outerHTML;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export { validateRowHtml, addColumnToRow, moveColumnInRow, removeColumnFromRow };