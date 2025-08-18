// dim_data.js


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
    } else if (typeof v === 'boolean') {
      strValue = v ? 'true' : 'false';
    } else {
      strValue = String(v);
    }
    return this._unit ? `${strValue} ${this._unit}` : strValue;
  }

  asBaseUnit() {
    if (!this._unit) return new Data(this._value, '');

    const conversions = {
      // Length
      'in': { base: 'm', factor: 0.0254 },
      'ft': { base: 'm', factor: 0.3048 },
      'yd': { base: 'm', factor: 0.9144 },
      'mi': { base: 'm', factor: 1609.34 },
      'cm': { base: 'm', factor: 0.01 },
      'mm': { base: 'm', factor: 0.001 },
      'km': { base: 'm', factor: 1000 },

      // Time
      'ms': { base: 's', factor: 0.001 },
      'min': { base: 's', factor: 60 },
      'h': { base: 's', factor: 3600 },
      'd': { base: 's', factor: 86400 },

      // Mass
      'g': { base: 'kg', factor: 0.001 },
      'mg': { base: 'kg', factor: 0.000001 },
      'lb': { base: 'kg', factor: 0.453592 },
      'oz': { base: 'kg', factor: 0.0283495 },

      // Add more units and their conversions to SI base units as needed
    };

    const conv = conversions[this._unit];
    if (!conv) return new Data(this._value, this._unit); // No conversion, return as is

    let newValue = this._value;
    const type = this.type();
    if (type === 'float' || type === 'integer') {
      newValue *= conv.factor;
    } else if (type === 'vector') {
      newValue = newValue.map(x => x * conv.factor);
    } else {
      // Booleans and strings don't convert
      return new Data(this._value, this._unit);
    }

    return new Data(newValue, conv.base);
  }
}

export { Data };