import { Data } from '../js/dim_data.js';

QUnit.module('Data Class');

QUnit.test('constructor sets value and unit', function(assert) {
  const data = new Data(42, 'm');
  assert.equal(data.val(), 42, 'Value set correctly');
  assert.equal(data.unit(), 'm', 'Unit set correctly');

  const noUnit = new Data('test');
  assert.equal(noUnit.unit(), '', 'Default unit empty');
});

QUnit.test('val getter/setter', function(assert) {
  const data = new Data(10);
  assert.equal(data.val(), 10, 'Getter returns value');
  data.val(20);
  assert.equal(data.val(), 20, 'Setter updates value');
});

QUnit.test('unit getter/setter', function(assert) {
  const data = new Data(10, 's');
  assert.equal(data.unit(), 's', 'Getter returns unit');
  data.unit('m');
  assert.equal(data.unit(), 'm', 'Setter updates unit');
});

QUnit.test('type method', function(assert) {
  assert.equal(new Data(true).type(), 'boolean', 'Boolean type');
  assert.equal(new Data('hello').type(), 'string', 'String type');
  assert.equal(new Data(42).type(), 'integer', 'Integer type');
  assert.equal(new Data(3.14).type(), 'float', 'Float type');
  assert.equal(new Data([1, 2]).type(), 'vector', '2-element vector type');
  assert.equal(new Data([1, 2, 3]).type(), 'vector', '3-element vector type');
  assert.equal(new Data([1, 2, 3, 4]).type(), 'unknown', '4-element unknown');
  assert.equal(new Data({}).type(), 'unknown', 'Object unknown');
});

QUnit.test('asString method', function(assert) {
  assert.equal(new Data(42, 'm').asString(), '42 m', 'Number with unit');
  assert.equal(new Data(42).asString(), '42', 'Number without unit');
  assert.equal(new Data(true).asString(), 'true', 'Boolean');
  assert.equal(new Data('test', 'unit').asString(), 'test unit', 'String with unit');
  assert.equal(new Data([1, 2, 3], 'm').asString(), '[1, 2, 3] m', 'Vector with unit');
});

QUnit.test('asBaseUnit', function(assert) {
  const inch = new Data(12, 'in');
  const base = inch.asBaseUnit();
  assert.ok(Math.abs(base.val() - 0.3048) < 0.0001, '12 in to m ≈ 0.3048');
  assert.equal(base.unit(), 'm', 'Base unit m');

  const hour = new Data(1, 'h');
  const baseTime = hour.asBaseUnit();
  assert.equal(baseTime.val(), 3600, '1 h to 3600 s');
  assert.equal(baseTime.unit(), 's', 'Base unit s');

  const vec = new Data([1, 2], 'mi');
  const baseVec = vec.asBaseUnit();
  assert.ok(Math.abs(baseVec.val()[0] - 1609.34) < 0.01, '1 mi to m ≈ 1609.34');
  assert.ok(Math.abs(baseVec.val()[1] - 3218.68) < 0.01, '2 mi to m ≈ 3218.68');
  assert.equal(baseVec.unit(), 'm', 'Base unit m');

  const bool = new Data(true);
  assert.deepEqual(bool.asBaseUnit(), bool, 'Boolean unchanged');

  const str = new Data('test');
  assert.deepEqual(str.asBaseUnit(), str, 'String unchanged');
});

QUnit.test('asGivenUnit', function(assert) {
  const meter = new Data(1, 'm');
  const cm = meter.asGivenUnit('cm');
  assert.equal(cm.val(), 100, '1 m to 100 cm');
  assert.equal(cm.unit(), 'cm', 'Unit cm');

  const sec = new Data(3600, 's');
  const hour = sec.asGivenUnit('h');
  assert.equal(hour.val(), 1, '3600 s to 1 h');
  assert.equal(hour.unit(), 'h', 'Unit h');

  const vecM = new Data([1, 2], 'm');
  const vecCm = vecM.asGivenUnit('cm');
  assert.deepEqual(vecCm.val(), [100, 200], 'Vector m to cm');
  assert.equal(vecCm.unit(), 'cm', 'Unit cm');

  assert.throws(() => meter.asGivenUnit('s'), /Error/, 'Throws on incompatible units');
});

QUnit.test('asBaseUnit with compound units', function(assert) {
  const speed = new Data(10, 'km/h');
  const baseSpeed = speed.asBaseUnit();
  assert.ok(Math.abs(baseSpeed.val() - 2.77778) < 0.0001, '10 km/h to ≈2.77778 m/s');
  assert.equal(baseSpeed.unit(), 'm/s', 'Base unit m/s');
});