// tests/test_pubsub.js

import { PubSub } from '../js/pubsub.js'

QUnit.module('PubSub', function(hooks) {
  let pubsub;

  hooks.beforeEach(function() {
    pubsub = new PubSub();
  });

  QUnit.test('constructor initializes topics as empty object', function(assert) {
    assert.deepEqual(pubsub.topics, {}, 'topics should be an empty object');
  });

  QUnit.test('subscribe adds function to new topic', function(assert) {
    const func = () => {};
    pubsub.subscribe('test', func);
    assert.deepEqual(pubsub.topics['test'], [func], 'function should be added to the topic');
  });

  QUnit.test('subscribe adds multiple functions to same topic', function(assert) {
    const func1 = () => {};
    const func2 = () => {};
    pubsub.subscribe('test', func1);
    pubsub.subscribe('test', func2);
    assert.deepEqual(pubsub.topics['test'], [func1, func2], 'both functions should be added');
  });

  QUnit.test('publish does nothing if no subscribers', function(assert) {
    const done = assert.async();
    let called = false;
    pubsub.publish('test', 'message');
    setTimeout(() => {
      assert.false(called, 'no function should be called');
      done();
    }, 10);
  });

  QUnit.test('publish calls subscribers asynchronously with message', function(assert) {
    const done = assert.async();
    const message = { data: 'test' };
    let received;
    const func = (msg) => {
      received = msg;
    };
    pubsub.subscribe('test', func);

    pubsub.publish('test', message);

    assert.strictEqual(received, undefined, 'should not be called synchronously');

    setTimeout(() => {
      assert.strictEqual(received, message, 'should receive the message asynchronously');
      done();
    }, 10);
  });

  QUnit.test('publish calls multiple subscribers', function(assert) {
    const done = assert.async();
    let count = 0;
    const func1 = () => { count++; };
    const func2 = () => { count++; };
    pubsub.subscribe('test', func1);
    pubsub.subscribe('test', func2);

    pubsub.publish('test', 'message');

    setTimeout(() => {
      assert.strictEqual(count, 2, 'both functions should be called');
      done();
    }, 10);
  });

  QUnit.test('publish on different topic does not call subscribers', function(assert) {
    const done = assert.async();
    let called = false;
    const func = () => { called = true; };
    pubsub.subscribe('test1', func);

    pubsub.publish('test2', 'message');

    setTimeout(() => {
      assert.false(called, 'function should not be called');
      done();
    }, 10);
  });

  QUnit.test('DOMContentLoaded attaches pubsub to table', function(assert) {
    const done = assert.async();

    // Mock the table
    const table = document.createElement('table');
    table.id = 'main-sheet';
    document.body.appendChild(table);

    // Trigger DOMContentLoaded
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);

    setTimeout(() => {
      assert.ok(table.pubsub instanceof PubSub, 'pubsub should be attached to the table');
      document.body.removeChild(table);
      done();
    }, 10);
  });
});