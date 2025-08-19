// dim_data.js
import unit from './lib/UnitMath.js';

class Data {
  constructor(value, unit = '') {
    this._value = value;
    this._unit = unit;
  }

  val(newValue = null) {
    if (newValue !== null) {
      this._value = newValue;
    }
    return this._value;
  }

  unit(newUnit = null) {
    if (newUnit !== null) {
      this._unit = newUnit;
    }
    return this._unit;
  }

  type() {
    const v = this._value;
    if (typeof v === 'boolean') return 'boolean';
    if (typeof v === 'string') return 'string';
    if (typeof v === 'number') {
      return Number.isInteger(v) ? 'integer' : 'float';
    }
    if (Array.isArray(v) && (v.length === 2 || v.length === 3) && v.every(x => typeof x === 'number')) {
      return 'vector';
    }
    return 'unknown';
  }

  asString() {
    let strValue;
    const v = this._value;
    if (Array.isArray(v)) {
      strValue = `[${v.join(', ')}]`;
    } else {
      strValue = String(v);
    }
    return this._unit ? `${strValue} ${this._unit}` : strValue;
  }

  asBaseUnit() {
    const type = this.type();
    if (type === 'boolean' || type === 'string' || !this._unit) {
      return new Data(this._value, this._unit);
    }
    if (type === 'float' || type === 'integer') {
      const u = unit(`${this._value} ${this._unit}`);
      const baseU = u.toBaseUnits();
      let baseUnitStr = baseU.toString().replace(/^[+-]?[\d.eE+-]+ /, ''); // Extract unit part
      baseUnitStr = baseUnitStr.replace(/\s*\/\s*/g, '/');
      return new Data(baseU.value, baseUnitStr);
    }
    if (type === 'vector') {
      const componentU = unit(`1 ${this._unit}`);
      const baseComponentU = componentU.toBaseUnits();
      const factor = baseComponentU.value;
      let baseUnitStr = baseComponentU.toString().replace(/^[+-]?[\d.eE+-]+ /, '');
      baseUnitStr = baseUnitStr.replace(/\s*\/\s*/g, '/');
      const newValue = this._value.map(x => x * factor);
      return new Data(newValue, baseUnitStr);
    }
    throw new Error('Unsupported type for asBaseUnit');
  }

  asGivenUnit(targetUnit) {
    const type = this.type();
    if (type === 'boolean' || type === 'string') {
      return new Data(this._value, targetUnit);
    }
    if (type === 'float' || type === 'integer') {
      const u = unit(`${this._value} ${this._unit}`);
      const valueless = unit(targetUnit);
      const convertedU = u.to(valueless);
      return new Data(convertedU.value, targetUnit);
    }
    if (type === 'vector') {
      const componentU = unit(`1 ${this._unit}`);
      const valueless = unit(targetUnit);
      const convertedComponentU = componentU.to(valueless);
      const factor = convertedComponentU.value;
      const newValue = this._value.map(x => x * factor);
      return new Data(newValue, targetUnit);
    }
    throw new Error('Unsupported type for asGivenUnit');
  }
}

export { Data };