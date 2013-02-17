/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

/*global describe, it*/

var assert = require("assert");

var node_pinba = require('../');

describe('node-pinba', function () {
  it('should export PinbaRequest', function () {
    assert.ok(typeof node_pinba.PinbaRequest === 'function');
  });
});
