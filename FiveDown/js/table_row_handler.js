// Module exporting an ES class for handling the specified table row structure
export class TableRowHandler {
  /**
   * Constructor taking an HTML segment (string) representing the <tr> element.
   * Parses the HTML and stores the row element for manipulation.
   * @param {string} htmlSegment - The HTML string of the <tr> element.
   */
  constructor(htmlSegment) {
    this._parseAndSetRow(htmlSegment);
  }

  /**
   * Private method to parse HTML and set the row and cells.
   * @param {string} htmlSegment - The HTML string to parse.
   */
  _parseAndSetRow(htmlSegment) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<table>${htmlSegment}</table>`, 'text/html');
    this.row = doc.querySelector('tr');
    if (!this.row) {
      throw new Error('Invalid HTML segment: No <tr> element found.');
    }
    this.cells = Array.from(this.row.querySelectorAll('td, th'));
    if (this.cells.length < 8) {
      throw new Error('Table row must have at least 8 cells.');
    }
    const nameContent = this.cells[2].textContent.trim();
    if (!nameContent) {
      throw new Error('Name cannot be blank or undefined.');
    }
  }

  /**
   * Update method to replace the current row with a new HTML segment.
   * @param {string} newHtmlSegment - The new HTML string of the <tr> element.
   */
  update(newHtmlSegment) {
    this._parseAndSetRow(newHtmlSegment);
  }

  /**
   * Gets or sets the description (cell index 1).
   * @param {string} [newValue] - If provided, sets the description.
   * @returns {string} The current description.
   */
  description(newValue) {
    if (newValue !== undefined) {
      this.cells[1].textContent = newValue;
    }
    return this.cells[1].textContent;
  }

  /**
   * Gets or sets the name (cell index 2).
   * @param {string} [newValue] - If provided, sets the name.
   * @returns {string} The current name.
   */
  name(newValue) {
    if (newValue !== undefined) {
      this.cells[2].textContent = newValue;
    }
    return this.cells[2].textContent;
  }

  /**
   * Gets or sets a result value by column number (starting at 0 for the first result cell at index 4).
   * @param {number} column - The result column index (0-based).
   * @param {string} [newValue] - If provided, sets the result.
   * @returns {string} The current result.
   */
  result(column, newValue) {
    if (typeof column !== 'number' || column < 0) {
      throw new Error('Column must be a non-negative number.');
    }
    const resultStartIndex = 4;
    const maxColumn = this.cells.length - 8;
    if (column > maxColumn) {
      throw new Error(`Invalid result column: Maximum is ${maxColumn}.`);
    }
    const cellIndex = resultStartIndex + column;
    if (newValue !== undefined) {
      this.cells[cellIndex].textContent = newValue;
    }
    return this.cells[cellIndex].textContent;
  }

  /**
   * Gets or sets the unit (second-to-last cell).
   * @param {string} [newValue] - If provided, sets the unit.
   * @returns {string} The current unit.
   */
  unit(newValue) {
    const unitIndex = this.cells.length - 2;
    if (newValue !== undefined) {
      this.cells[unitIndex].textContent = newValue;
    }
    return this.cells[unitIndex].textContent;
  }
}