// js/dim_data.js

import { default as unit } from './lib/UnitMath.js'; // Adjust path based on your setup (e.g., CDN or local file)

// For browser UMD usage: const UnitMath = window.UnitMath;
// For ES modules: import UnitMath from './unitmath.js';

/**
 * Formats a formula by replacing operators for display.
 * @param {string} formula - The formula to format.
 * @returns {string} The formatted formula.
 */
function formatFormula(formula) {
  return formula.replace(/@/g, '•').replace(/\*/g, '×');
}

/**
 * Formats a value for display based on its type.
 * @param {string|number|boolean|Array} val - The value to format (number, boolean, text, vector).
 * @param {string} [typ=null] - The type of value (number, boolean, string, vector, unknown).
 * @returns {string} The formatted string.
 */
function formatResult(val, typ = null) {
  function fmtNum(val) {
    if (val === 0) return '0.0';
    const lg = Math.log10(Math.abs(val));
    if (lg < 2) return val.toFixed(3);
    if (lg < 3) return val.toFixed(2);
    if (lg < 5) return val.toFixed(1);
    if (lg > 6) return val.toExponential(3);
    return val.toFixed(0);
  }

  function fmtNumV(val) {
    if (val === 0) return '0.0';
    const lg = Math.log10(Math.abs(val));
    if (lg < 2) return val.toFixed(2);
    if (lg < 3) return val.toFixed(1);
    if (lg > 6) return val.toExponential(2);
    return val.toFixed(0);
  }

  let text = '';
  if (typ === null) {
    const DT = new Data(val);
    typ = DT.type();
    val = DT.val();
  }

  if (typ === 'number') {
    text = fmtNum(val);
  } else if (typ === 'vector') {
    text = '[' + val.map(x => fmtNumV(x)).join(',') + ']';
  } else if (typ === 'boolean') {
    text = val ? 'true' : 'false';
  } else if (typ === 'string') {
    text = val;
  }
  return text;
}

/**
 * Represents a value with an associated unit, using UnitMath internally for conversions.
 * Supports numbers, booleans, strings, or 2/3-element numeric vectors.
 * Public interface uses plain JavaScript types, not UnitMath objects.
 */
class Data {
  /**
   * Creates a new Data instance.
   * @param {number|boolean|string|Array} value - The value (number, boolean, string, or vector).
   * @param {string} [unit=''] - The unit associated with the value.
   */
  constructor(value, unit = '') {
    this._value = value;
    this._unit = unit;
  }

  /**
   * Getter/setter for the stored value.
   * @param {number|boolean|string|Array} [v] - If provided, sets the new value.
   * @returns {number|boolean|string|Array} The current value.
   */
  val(v) {
    if (v !== undefined) {
      this._value = v;
    }
    return this._value;
  }

  /**
   * Getter/setter for the unit.
   * @param {string} [u] - If provided, sets the new unit.
   * @returns {string} The current unit.
   */
  unit(u) {
    if (u !== undefined) {
      this._unit = u;
    }
    return this._unit;
  }

  /**
   * Determines the type of the stored value.
   * @returns {string} One of: 'number', 'boolean', 'string', 'vector', 'unknown'.
   */
  type() {
    const val = this._value;
    if (typeof val === 'number') return 'number';
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'string') return 'string';
    if (Array.isArray(val) && val.length >= 2 && val.length <= 3 && val.every(x => typeof x === 'number')) return 'vector';
    return 'unknown';
  }

  /**
   * Converts the value to a string representation, including the unit if present.
   * @returns {string} The string form of the value and unit.
   */
  asString() {
    let v = this._value;
    if (Array.isArray(v)) {
      v = v.join(',');
    } else if (typeof v === 'boolean') {
      v = v ? 'true' : 'false';
    }
    return `${v} ${this._unit}`.trim();
  }

  /**
   * Converts the value to its base unit (SI equivalent) using UnitMath.
   * Returns a new Data instance. Only applies to numbers and vectors; others unchanged.
   * @returns {Data} A new Data instance in the base unit.
   */
  asBaseUnit() {
    if (!this._unit) {
      return new Data(this._value, this._unit);
    }
    const typ = this.type();
    if (typ === 'number') {
      try {
        const unitVal = unit(this._value, this._unit);
        return new Data(unitVal.getValue(), unitVal.getUnits().toString());
      } catch (e) {
        return new Data(this._value, this._unit); // Return unchanged if unit is invalid
      }
    } else if (typ === 'vector') {
      try {
        const unitVals = this._value.map(v => unit(v, this._unit));
        const baseUnit = unitVals[0]?.getUnits().toString() || this._unit;
        return new Data(unitVals.map(u => u.getValue()), baseUnit);
      } catch (e) {
        return new Data(this._value, this._unit); // Return unchanged if unit is invalid
      }
    }
    return new Data(this._value, this._unit);
  }

  /**
   * Converts the value to a given unit using UnitMath.
   * Returns a tuple [new Data instance, conversion factor].
   * Only supports numbers and vectors.
   * @param {string} targetUnit - The target unit for conversion.
   * @returns {Array<Data, number>} [new Data in target unit, conversion factor].
   * @throws {Error} If units are incompatible, unspecified, or type not supported.
   */
  asGivenUnit(targetUnit) {
    if (!targetUnit) throw new Error('Target unit must be specified');
    if (!this._unit) throw new Error('Source unit must be specified');
    if (this._unit === targetUnit) {
      return [new Data(this._value, this._unit), 1];
    }
    const typ = this.type();
    if (typ === 'number') {
      try {
        const unitVal = unit(this._value, this._unit);
        const converted = unitVal.to(targetUnit);
        const factor = converted.getValue() / unitVal.getValue();
        return [new Data(converted.getValue(), targetUnit), factor];
      } catch (e) {
        throw new Error('Incompatible units for conversion');
      }
    } else if (typ === 'vector') {
      try {
        const unitVals = this._value.map(v => unit(v, this._unit));
        const converted = unitVals.map(u => u.to(targetUnit));
        const factor = converted[0].getValue() / unitVals[0].getValue();
        return [new Data(converted.map(u => u.getValue()), targetUnit), factor];
      } catch (e) {
        throw new Error('Incompatible units for conversion');
      }
    }
    throw new Error('Conversion supported only for numbers and vectors');
  }
}

export { Data, formatFormula, formatResult };