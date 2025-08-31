// tests/dim_data_tests.js

import { Data } from '../js/dim_data.js';

QUnit.module('Data Class Tests', function() {

  QUnit.test('Constructor and getters/setters', function(assert) {
    let d = new Data(42, 'm');
    assert.equal(d.val(), 42, 'Initial value');
    assert.equal(d.unit(), 'm', 'Initial unit');

    d.val(100);
    assert.equal(d.val(), 100, 'Set value');

    d.unit('km');
    assert.equal(d.unit(), 'km', 'Set unit');

    d = new Data(true);
    assert.equal(d.val(), true, 'Boolean value');
    assert.equal(d.unit(), '', 'Default unit');
  });

  QUnit.test('type() method', function(assert) {
    assert.equal(new Data(3.14).type(), 'number', 'Number type');
    assert.equal(new Data(true).type(), 'boolean', 'Boolean type');
    assert.equal(new Data('hello').type(), 'string', 'String type');
    assert.equal(new Data([1, 2]).type(), 'vector', '2D Vector type');
    assert.equal(new Data([1, 2, 3]).type(), 'vector', '3D Vector type');
    assert.equal(new Data([1]).type(), 'unknown', 'Invalid vector (1 element)');
    assert.equal(new Data([1, 'a']).type(), 'unknown', 'Invalid vector (mixed types)');
    assert.equal(new Data({}).type(), 'unknown', 'Object type');
  });

  QUnit.test('asString() method', function(assert) {
    assert.equal(new Data(42, 'm').asString(), '42 m', 'Number with unit');
    assert.equal(new Data(42).asString(), '42', 'Number without unit');
    assert.equal(new Data(true, 'bool').asString(), 'true bool', 'Boolean with unit');
    assert.equal(new Data(false).asString(), 'false', 'Boolean without unit');
    assert.equal(new Data('hello', 'text').asString(), 'hello text', 'String with unit');
    assert.equal(new Data([1, 2, 3], 'm').asString(), '1,2,3 m', 'Vector with unit');
    assert.equal(new Data([1, 2]).asString(), '1,2', 'Vector without unit');
  });

  QUnit.test('asBaseUnit() for numbers', function(assert) {
    let d = new Data(1, 'km');
    let base = d.asBaseUnit();
    assert.equal(base.unit(), 'm', 'Base unit');
    assert.equal(base.val(), 1000, 'Converted value');

    d = new Data(3600, 'h');
    base = d.asBaseUnit();
    assert.equal(base.unit(), 's', 'Time base unit');
    assert.equal(base.val(), 3600 * 3600, 'Time converted value');

    d = new Data(90, 'deg');
    base = d.asBaseUnit();
    assert.equal(base.unit(), 'rad', 'Angle base unit');
    assert.ok(Math.abs(base.val() - Math.PI / 2) < 1e-10, 'Angle converted value');

    d = new Data(42, 'unknown');
    base = d.asBaseUnit();
    assert.equal(base.val(), 42, 'Unknown unit value unchanged');
    assert.equal(base.unit(), 'unknown', 'Unknown unit unchanged');

    d = new Data(100, 'ohm');
    base = d.asBaseUnit();
    assert.equal(base.unit(), 'ohm', 'Resistance base unit');
    assert.equal(base.val(), 100, 'Resistance value unchanged');

    d = new Data(1, 'kohm');
    base = d.asBaseUnit();
    assert.equal(base.val(), 1000, 'kohm to ohm');
  });

  QUnit.test('asBaseUnit() for vectors', function(assert) {
    let d = new Data([1, 2], 'km');
    let base = d.asBaseUnit();
    assert.deepEqual(base.val(), [1000, 2000], 'Vector converted values');
    assert.equal(base.unit(), 'm', 'Vector base unit');

    d = new Data([90, 180, 270], 'deg');
    base = d.asBaseUnit();
    const expected = [Math.PI / 2, Math.PI, 3 * Math.PI / 2];
    base.val().forEach((val, i) => {
      assert.ok(Math.abs(val - expected[i]) < 1e-10, `Vector angle ${i + 1}`);
    });
    assert.equal(base.unit(), 'rad', 'Vector angle base');
  });

  QUnit.test('asBaseUnit() for non-numerics', function(assert) {
    let d = new Data(true, 'm');
    let base = d.asBaseUnit();
    assert.equal(base.val(), true, 'Boolean unchanged');
    assert.equal(base.unit(), 'm', 'Unit unchanged');

    d = new Data('hello', 's');
    base = d.asBaseUnit();
    assert.equal(base.val(), 'hello', 'String unchanged');
    assert.equal(base.unit(), 's', 'Unit unchanged');
  });

  QUnit.test('asGivenUnit() for numbers', function(assert) {
    let d = new Data(1000, 'm');
    let [newData, factor] = d.asGivenUnit('km');
    assert.equal(newData.unit(), 'km', 'Target unit');
    assert.equal(newData.val(), 1, 'Converted value');
    assert.equal(factor, 0.001, 'Conversion factor');
    assert.equal(d.val() * factor, newData.val(), 'Value * factor == new value');

    d = new Data(1, 'h');
    [newData, factor] = d.asGivenUnit('s');
    assert.equal(newData.val(), 3600, 'Time converted');
    assert.equal(factor, 3600, 'Time factor');

    d = new Data(1, 'kohm');
    [newData, factor] = d.asGivenUnit('ohm');
    assert.equal(newData.val(), 1000, 'Resistance converted');
    assert.equal(factor, 1000, 'Resistance factor');
  });

  QUnit.test('asGivenUnit() for vectors', function(assert) {
    let d = new Data([1000, 2000], 'm');
    let [newData, factor] = d.asGivenUnit('km');
    assert.deepEqual(newData.val(), [1, 2], 'Vector converted');
    assert.equal(factor, 0.001, 'Vector factor');
    assert.deepEqual(d.val().map(v => v * factor), newData.val(), 'Vector values * factor');

    d = new Data([1, 2, 3], 'min');
    [newData, factor] = d.asGivenUnit('s');
    assert.deepEqual(newData.val(), [60, 120, 180], 'Time vector converted');
    assert.equal(factor, 60, 'Time vector factor');
  });

  QUnit.test('asGivenUnit() errors', function(assert) {
    let d = new Data(1, 'm');
    assert.throws(() => d.asGivenUnit('s'), Error, 'Incompatible units');
    assert.throws(() => d.asGivenUnit('unknown'), Error, 'Unknown target unit');
    assert.throws(() => new Data(1).asGivenUnit('m'), Error, 'No original unit');
    assert.throws(() => d.asGivenUnit(''), Error, 'No target unit');
    assert.throws(() => new Data(true, 'm').asGivenUnit('km'), Error, 'Non-numeric conversion');
    assert.throws(() => new Data('text', 'm').asGivenUnit('km'), Error, 'String conversion');
  });

});