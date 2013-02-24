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

  describe('PinbaRequest', function () {
    var r = new node_pinba.PinbaRequest();
    it('should have method setHostname()', function () {
      assert.ok(typeof r.setHostname === 'function');
    });
    it('should have method setServerName()', function () {
      assert.ok(typeof r.setServerName === 'function');
    });
    it('should have method setScriptName()', function () {
      assert.ok(typeof r.setScriptName === 'function');
    });
    it('should have method setPinbaServer()', function () {
      assert.ok(typeof r.setPinbaServer === 'function');
    });
    it('should have method setPinbaPort()', function () {
      assert.ok(typeof r.setPinbaPort === 'function');
    });
    it('should have method timerStart()', function () {
      assert.ok(typeof r.timerStart === 'function');
    });
    it('should have method timerStop()', function () {
      assert.ok(typeof r.timerStop === 'function');
    });
    it('should have method timerAdd()', function () {
      assert.ok(typeof r.timerAdd === 'function');
    });
    it('should have method timerDelete()', function () {
      assert.ok(typeof r.timerDelete === 'function');
    });
    it('should have method timerTagsMerge()', function () {
      assert.ok(typeof r.timerTagsMerge === 'function');
    });
    it('should have method timerTagsReplace()', function () {
      assert.ok(typeof r.timerTagsReplace === 'function');
    });
    it('should have method timerDataMerge()', function () {
      assert.ok(typeof r.timerDataMerge === 'function');
    });
    it('should have method timerDataReplace()', function () {
      assert.ok(typeof r.timerDataReplace === 'function');
    });
    it('should have method timerGetInfo()', function () {
      assert.ok(typeof r.timerGetInfo === 'function');
    });
    it('should have method timersStop()', function () {
      assert.ok(typeof r.timersStop === 'function');
    });
    it('should have method getInfo()', function () {
      assert.ok(typeof r.getInfo === 'function');
    });
    it('should have method flush()', function () {
      assert.ok(typeof r.flush === 'function');
    });

    describe('timers', function () {
      it('should by properly generated', function (done) {
        var r = new node_pinba.PinbaRequest();
        var timer1 = r.timerStart();
        setTimeout(function () {
          r.timerStop(timer1);

          var timer2 = r.timerStart();
          setTimeout(function () {
            r.timerStop(timer2);

            assert.ok(typeof r.timers['1'] === 'object');
            assert.ok(typeof r.timers['2'] === 'object');
            assert.ok(typeof r.timers['3'] === 'undefined');

            done();
          }, 100);
        }, 100);
      });

      it('should properly return info', function (done) {
        var r = new node_pinba.PinbaRequest();
        var timer = r.timerStart();
        setTimeout(function () {
          r.timerStop(timer);

          var info = r.timerGetInfo(timer);

          assert.ok(!info.started, "Stopped");

          assert.ok(info.value * 1000 < 101, "Less than 101");
          assert.ok(info.value * 1000 > 99, "Greater than 99");

          done();
        }, 100);
      });

      it('should properly works with tags', function () {
        var r = new node_pinba.PinbaRequest();
        var timer1 = r.timerStart({tag1: 'tag1value'});
        var timer2 = r.timerStart({tag2: 'tag2value'});

        r.timerTagsMerge(timer1, {tag1: 'tag1valueMerged', tag3: 'tag3value'});
        r.timerTagsMerge(timer2, {tag4: 'tag4value'});

        var info1 = r.timerGetInfo(timer1);
        assert.deepEqual(info1.tags, {tag1: 'tag1valueMerged', tag3:'tag3value'}, "Tags merged");

        var info2 = r.timerGetInfo(timer2);
        assert.deepEqual(info2.tags, {tag2: 'tag2value', tag4: 'tag4value'}, "Tags merged");

        r.timerTagsReplace(timer1, {tag3: 'tag3valueReplaced', tag4: 'tag4valueReplaced'});
        info1 = r.timerGetInfo(timer1);
        assert.deepEqual(info1.tags, {tag3: 'tag3valueReplaced', tag4: 'tag4valueReplaced'}, "Tags replaced");
      });

      it('should properly works with data', function () {
        var r = new node_pinba.PinbaRequest();
        var timer1 = r.timerStart({}, {data1: 'data1value'});
        var timer2 = r.timerStart({}, {data2: 'data2value'});

        r.timerDataMerge(timer1, {data1: 'data1valueReplaced', data3: 'data3value'});
        r.timerDataMerge(timer2, {data4: 'data4value'});

        var info1 = r.timerGetInfo(timer1);
        assert.deepEqual(info1.data, {data1: 'data1valueReplaced', data3: 'data3value'}, "Data merged");

        var info2 = r.timerGetInfo(timer2);
        assert.deepEqual(info2.data, {data2: 'data2value', data4: 'data4value'}, "Data merged");

        r.timerDataReplace(timer1, {data3: 'data3valueReplaced', data4: 'data4valueReplaced'});
        info1 = r.timerGetInfo(timer1);
        assert.deepEqual(info1.data, {data3: 'data3valueReplaced', data4: 'data4valueReplaced'}, "Data replaced");
      });
    });
  });
});
