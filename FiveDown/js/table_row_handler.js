// TableRowHandler.js
import { Data } from './dim_data.js'; // Assuming the Data class is available from the provided file

class TableRowHandler {
  constructor(html) {
    this.tr = this.parseHtmlToTr(html);
    this.validate();
    this.initTDs();
  }

  parseHtmlToTr(html) {
    const table = document.createElement('table');
    table.innerHTML = html;
    const tr = table.querySelector('tr');
    if (!tr) throw new Error('Provided HTML does not contain a <tr> element');
    return tr;
  }

  validate() {
    const tds = Array.from(this.tr.children);
    if (tds.length < 8) throw new Error('Row has too few columns');
    const fixedClasses = ['handle', 'description', 'name', 'formula'];
    for (let i = 0; i < 4; i++) {
      if (!tds[i].classList.contains(fixedClasses[i]))
        throw new Error(`Column ${i + 1} does not have class "${fixedClasses[i]}"`);
    }
    const endClasses = ['add-result', 'unit', 'delete'];
    for (let i = 0; i < 3; i++) {
      if (!tds[tds.length - 3 + i].classList.contains(endClasses[i]))
        throw new Error(`Column ${tds.length - 2 + i} does not have class "${endClasses[i]}"`);
    }
    for (let i = 4; i < tds.length - 3; i++) {
      if (!tds[i].classList.contains('result'))
        throw new Error(`Column ${i + 1} does not have class "result"`);
    }
  }

  initTDs() {
    const tds = Array.from(this.tr.children);
    this.descriptionTD = tds[1];
    this.nameTD = tds[2];
    this.formulaTD = tds[3];
    this.resultTDs = tds.slice(4, tds.length - 3);
    this.unitTD = tds[tds.length - 2];
  }

  update(html) {
    const newTr = this.parseHtmlToTr(html);
    const temp = { tr: newTr };
    this.validate.call(temp);
    if (this.tr.parentNode) this.tr.parentNode.replaceChild(newTr, this.tr);
    this.tr = newTr;
    this.initTDs();
  }

  description() {
    return this.descriptionTD.textContent.trim();
  }

  name(newName = null) {
    if (newName !== null) {
      if (!newName || newName.trim() === '') throw new Error('Name cannot be blank');
      const old = this.name();
      this.nameTD.textContent = newName;
      return old;
    }
    return this.nameTD.textContent.trim();
  }

  formula() {
    return this.formulaTD.textContent.trim();
  }

  unit() {
    return this.unitTD.textContent.trim();
  }

  result(idx, newValue = null) {
    if (idx < 0 || idx >= this.resultTDs.length) throw new Error('Invalid result index');
    const resultTD = this.resultTDs[idx];
    const currentData = this.getResultData(idx);
    if (newValue === null) return currentData;
    resultTD.classList.remove('converted', 'error');
    resultTD.removeAttribute('data-value');
    if (newValue instanceof Error) {
      resultTD.textContent = newValue.message;
      resultTD.classList.add('error');
    } else {
      if (!(newValue instanceof Data)) throw new Error('newValue must be a Data instance');
      let setData = newValue;
      const targetUnit = this.unit();
      if (!targetUnit) {
        this.unitTD.textContent = newValue.unit();
      } else if (targetUnit !== newValue.unit()) {
        try {
          setData = newValue.asGivenUnit(targetUnit);
          resultTD.classList.add('converted');
        } catch (error) {
          throw new Error(`Unit conversion failed: ${error.message}`);
        }
      }
      const v = setData.val();
      resultTD.textContent = this.formattedString(v);
      resultTD.setAttribute('data-value', this.valueToString(v));
    }
    return currentData;
  }

  getResultData(idx) {
    const resultTD = this.resultTDs[idx];
    if (resultTD.classList.contains('error')) return new Error(resultTD.textContent.trim());
    const valueStr = resultTD.getAttribute('data-value') || resultTD.textContent.trim();
    const value = this.parseValue(valueStr);
    return new Data(value, this.unit());
  }

  parseValue(str) {
    if (str.startsWith('[') && str.endsWith(']'))
      return str.slice(1, -1).split(',').map(x => parseFloat(x.trim()));
    else if (str === 'true') return true;
    else if (str === 'false') return false;
    else if (!isNaN(parseFloat(str))) {
      const num = parseFloat(str);
      return Number.isInteger(num) ? Math.floor(num) : num;
    } else return str;
  }

  valueToString(v) {
    if (Array.isArray(v)) return `[${v.map(x => x.toString()).join(', ')}]`;
    else return String(v);
  }

  formattedString(v) {
    if (typeof v === 'number') {
      if (v === 0) return '0.000'
      if (Math.abs(v) < 0.01) return v.toExponential(3);
      else return v.toFixed(3);
    } else if (Array.isArray(v)) {
      return `[${v.map(x => {
        if (typeof x !== 'number') return x.toString();
        if (x === 0) return '0.000'
        if (Math.abs(x) < 0.01) return x.toExponential(3);
        else return x.toFixed(3);
      }).join(', ')}]`;
    } else return String(v);
  }
}

export { TableRowHandler };