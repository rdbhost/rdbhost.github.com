// js/dim_data.js

/**
 * Unit categories and conversion factors to base units.
 * @constant
 * @type {Object}
 */
const units = {
  length: {
    base: 'm',
    conversions: {
      m: 1,
      cm: 0.01,
      mm: 0.001,
      km: 1000,
      nm: 1e-9,
      um: 1e-6,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144,
      mi: 1609.34,
    }
  },
  area: {
    base: 'm2',
    conversions: {
      m2: 1,
      cm2: 0.0001,
      mm2: 1e-6,
      km2: 1e6,
      sqft: 0.092903,
      sqyd: 0.836127,
      sqmi: 2.58999e6,
      acre: 4046.86,
    }
  },
  volume: {
    base: 'm3',
    conversions: {
      m3: 1,
      cm3: 1e-6,
      mm3: 1e-9,
      L: 0.001,
      mL: 1e-6,
      gal: 0.00378541,
      qt: 0.000946353,
      pt: 0.000473176,
      cuft: 0.0283168,
      cuyd: 0.764555,
    }
  },
  mass: {
    base: 'kg',
    conversions: {
      kg: 1,
      g: 0.001,
      mg: 1e-6,
      t: 1000,
      lb: 0.453592,
      oz: 0.0283495,
      st: 6.35029,
      ton: 907.185,
    }
  },
  force: {
    base: 'N',
    conversions: {
      N: 1,
      dyne: 1e-5,
      lbf: 4.44822,
      kgf: 9.80665,
    }
  },
  power: {
    base: 'W',
    conversions: {
      W: 1,
      kW: 1000,
      MW: 1e6,
      hp: 745.7,
      ftlbf_s: 1.35582,
    }
  },
  velocity: {
    base: 'm/s',
    conversions: {
      'm/s': 1,
      'km/h': 1000 / 3600,
      mph: 1609.34 / 3600,
      fps: 0.3048,
      knot: 0.514444,
    }
  },
  acceleration: {
    base: 'm/s2',
    conversions: {
      'm/s2': 1,
      g: 9.80665,
      'ft/s2': 0.3048,
    }
  },
  resistance: {
    base: 'ohm',
    conversions: {
      'ohm': 1,
      'kohm': 1000,
      'Mohm': 1e6,
      'mohm': 0.001,
      'uohm': 1e-6,
    }
  },
  capacitance: {
    base: 'F',
    conversions: {
      F: 1,
      uF: 1e-6,
      nF: 1e-9,
      pF: 1e-12,
      mF: 0.001,
    }
  },
  angle: {
    base: 'rad',
    conversions: {
      rad: 1,
      deg: Math.PI / 180,
    }
  },
  time: {
    base: 's',
    conversions: {
      s: 1,
      ms: 0.001,
      us: 1e-6,
      min: 60,
      h: 3600,
      day: 86400,
      week: 604800,
      year: 31536000,
    }
  },
  // Add more categories and units as needed
};

/**
 * 
 * @param {string} formula - the formula to format
 * @returns {string}
 */
function formatFormula(formula) {
      return formula.replace(/@/g, '⋅').replace(/\*/g, '×');
}

/**
 * 
 * @param {string} val - the value to format (number, boolean, text, vector)
 * @param {string} typ - the type of value (number, boolean, string, vector, unknown)
 * @returns {string}
 */
function formatResult(val, typ) {
  let text = '';
  if (typ === 'number') {
    if (Math.abs(val) < 0.01 && val !== 0) {
      text = val.toExponential(3);
    } else {
      text = val.toFixed(3);
    }
  } else if (typ === 'vector') {
    text = val.map(x => x.toFixed(2)).join(',');
  } else if (typ === 'boolean') {
    text = val ? 'true' : 'false';
  } else if (typ === 'string') {
    text = val;
  }
  return text;
}

/**
 * Represents a value with an associated unit, supporting various types and unit conversions.
 * Values can be numbers, booleans, strings, or 2/3-element numeric vectors.
 * Supports conversion to base units and specified units.
 * @class
 */
class Data {
  /**
   * Mapping of units to their categories and conversion factors.
   * @static
   * @type {Object}
   */
  static unitInfo = {};

  static {
    for (const category in units) {
      const conv = units[category].conversions;
      for (const u in conv) {
        Data.unitInfo[u] = {
          category,
          toBase: conv[u],
          base: units[category].base,
        };
      }
    }
  }

  /**
   * Creates a new Data instance.
   * @constructor
   * @param {*} value - The value to store (number, boolean, string, or array for vector).
   * @param {string} [unit=''] - The unit associated with the value.
   */
  constructor(value, unit = '') {
    this._value = value;
    this._unit = unit;
  }

  /**
   * Getter/setter for the stored value.
   * @param {*} [v] - If provided, sets the new value.
   * @returns {*} The current value.
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
   * Converts the data to a string representation, including the unit if present.
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
   * Converts the value to its base unit (SI equivalent).
   * Returns a new Data instance. Only applies to numbers and vectors; others unchanged.
   * @returns {Data} A new Data instance in the base unit.
   */
  asBaseUnit() {
    if (!this._unit) {
      return new Data(this._value, this._unit);
    }
    const info = Data.unitInfo[this._unit];
    if (!info) {
      return new Data(this._value, this._unit);
    }
    const factor = info.toBase;
    const baseUnit = info.base;
    let newValue;
    const typ = this.type();
    if (typ === 'number') {
      newValue = this._value * factor;
    } else if (typ === 'vector') {
      newValue = this._value.map(x => x * factor);
    } else {
      return new Data(this._value, this._unit);
    }
    return new Data(newValue, baseUnit);
  }

  /**
   * Converts the value to a given unit.
   * Returns a tuple [new Data instance, conversion factor].
   * Only supports numbers and vectors.
   * @param {string} targetUnit - The target unit for conversion.
   * @returns {Array<Data, number>} [new Data in target unit, conversion factor].
   * @throws {Error} If units are incompatible, unspecified, or type not supported.
   */
  asGivenUnit(targetUnit) {
    if (!this._unit || !targetUnit) {
      throw new Error('Units must be specified for conversion');
    }
    const infoOrig = Data.unitInfo[this._unit];
    const infoTarget = Data.unitInfo[targetUnit];
    if (!infoOrig || !infoTarget || infoOrig.category !== infoTarget.category) {
      throw new Error('Incompatible units for conversion');
    }
    const factor = infoOrig.toBase / infoTarget.toBase;
    let newValue;
    const typ = this.type();
    if (typ === 'number') {
      newValue = this._value * factor;
    } else if (typ === 'vector') {
      newValue = this._value.map(x => x * factor);
    } else {
      throw new Error('Conversion supported only for numbers and vectors');
    }
    const newData = new Data(newValue, targetUnit);
    return [newData, factor];
  }
}

export { Data, formatFormula, formatResult };