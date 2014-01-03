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

var _ = require('lodash');

var Pinba = require('../');

describe('pinba', function () {
  it('should export Request class', function () {
    assert.ok(typeof Pinba.Request === 'function');
  });

  describe('PinbaRequest', function () {
    describe('methods', function () {
      var methods = [
        'setHostname',
        'setServerName',
        'setScriptName',
        'setSchema',
        'setPinbaServer',
        'setPinbaPort',
        'tagSet',
        'tagGet',
        'tagDelete',
        'tagsGet',
        'timerStart',
        'timerStop',
        'timerAdd',
        'timerDelete',
        'timerTagsMerge',
        'timerTagsReplace',
        'timerDataMerge',
        'timerDataReplace',
        'timerGetInfo',
        'timersStop',
        'getInfo',
        'getGPBMessageData',
        'flush'
      ];
      _.forEach(methods, function (method) {
        var r = new Pinba.Request();
        it('should have method ' + method + '()', function () {
          assert.ok(typeof r[method] === 'function');
        });
      });
    });

    describe('settings', function () {
      it('should support parameters', function () {
        var r = new Pinba.Request({
          hostname:     'HOSTNAME',
          server_name:  'SERVER_NAME',
          script_name:  'SCRIPT_NAME',
          schema:       'SCHEMA',
          pinba_server: 'PINBA_SERVER',
          pinba_port:   'PINBA_PORT'
        });

        assert.deepEqual(
          [
            r.hostname,
            r.server_name,
            r.script_name,
            r.schema,
            r.pinba_server,
            r.pinba_port
          ],
          [
            'HOSTNAME',
            'SERVER_NAME',
            'SCRIPT_NAME',
            'SCHEMA',
            'PINBA_SERVER',
            'PINBA_PORT'
          ]
        );
      });

      it('that may be changed through setters', function () {
        var r = new Pinba.Request();

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');
        r.setPinbaServer('PINBA_SERVER');
        r.setPinbaPort('PINBA_PORT');

        assert.deepEqual(
          [
            r.hostname,
            r.server_name,
            r.script_name,
            r.schema,
            r.pinba_server,
            r.pinba_port
          ],
          [
            'HOSTNAME',
            'SERVER_NAME',
            'SCRIPT_NAME',
            'SCHEMA',
            'PINBA_SERVER',
            'PINBA_PORT'
          ]
        );
      });
    });

    describe('tags', function () {
      it('should by properly generated [tagSet+tagGet]', function () {
        var r = new Pinba.Request();

        r.tagSet('tag1', 'value');

        assert.equal(r.tagGet('tag1'), 'value', "Right tag value");
      });

      it('may be replaced [tagSet+tagSet+tagGet]', function () {
        var r = new Pinba.Request();

        r.tagSet('tag1', 'value1');
        r.tagSet('tag1', 'value2');

        assert.equal(r.tagGet('tag1'), 'value2', "Right tag value");
      });

      it('may be deleted [tagSet+tagDelete+tagGet]', function () {
        var r = new Pinba.Request();

        r.tagSet('tag1', 'value1');
        r.tagDelete('tag1');

        assert.ok(typeof r.tagGet('tag1') == 'undefined', "Undefined tag");
      });

      it('have multi-get [tagSet+tagSet+tagsGet]', function () {
        var r = new Pinba.Request();

        r.tagSet('tag1', 'value1');
        r.tagSet('tag2', 'value2');

        assert.deepEqual(
          r.tagsGet(),
          {
            'tag1': 'value1',
            'tag2': 'value2'
          }
        );
      });
    });

    describe('timers', function () {
      it('should by properly generated [timerStart+timerStop]', function (done) {
        var r = new Pinba.Request();
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

      it('should properly return info [timerStart+timerStop+timerGetInfo]', function (done) {
        var r = new Pinba.Request();
        var timer = r.timerStart();
        setTimeout(function () {
          r.timerStop(timer);

          var info = r.timerGetInfo(timer);

          assert.ok(!info.started, "Stopped");

          assert.ok(info.value * 1000 < 102, "Less than 102");
          assert.ok(info.value * 1000 > 98, "Greater than 98");

          done();
        }, 100);
      });

      it('should properly return info [timerAdd+timerGetInfo]', function () {
        var r = new Pinba.Request();
        var timer = r.timerAdd({tag: 'tagValue'}, 0.100);

        var info = r.timerGetInfo(timer);

        assert.ok(!info.started, "Stopped");

        assert.ok(info.value * 1000 < 102, "Less than 102");
        assert.ok(info.value * 1000 > 98, "Greater than 98");

        assert.deepEqual(info.tags, {tag: 'tagValue'}, "Correct tags");
      });

      it('may be deleted [timerDelete]', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerAdd({tag1: 'tag1value'}, 0.100);
        var timer2 = r.timerAdd({tag2: 'tag2value'}, 0.100);

        r.timerDelete(timer1);

        assert.deepEqual(_.keys(r.timers), [timer2]);
      });

      it('should properly works with tags [timerTagsMerge+timerTagsReplace]', function () {
        var r = new Pinba.Request();
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

      it('should properly works with data [timerDataMerge+timerDataReplace]', function () {
        var r = new Pinba.Request();
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

    describe('and finally', function () {
      it('getInfo() should return request info', function () {
        var r = new Pinba.Request();

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.tagSet('tag1', 'value1');
        r.tagSet('tag2', 'value2');
        r.tagSet('tag3', 'value2');

        r.timerAdd({tag1: 'value1'}, 0.1);
        r.timerAdd({tag2: 'value1'}, 0.2);
        r.timerAdd({tag3: 'value2'}, 0.3);

        var info = r.getInfo();

        delete info.mem_peak_usage;
        delete info.req_time;
        delete info.ru_utime;
        delete info.ru_stime;
        delete info.doc_size;

        assert.deepEqual(
          info,
          {
            hostname:       'HOSTNAME',
            server_name:    'SERVER_NAME',
            script_name:    'SCRIPT_NAME',
            schema:         'SCHEMA',
            req_count:      1,
            timers:         [
              {
                value: 0.1,
                started: false,
                tags: {tag1: 'value1'},
                data: undefined
              },
              {
                value: 0.2,
                started: false,
                tags: {tag2: 'value1'},
                data: undefined
              },
              {
                value: 0.3,
                started: false,
                tags: {tag3: 'value2'},
                data: undefined
              }
            ],
            tags:           {
              tag1: 'value1',
              tag2: 'value2',
              tag3: 'value2'
            }
          }
        );
      });

      it('getGPBMessageData() should return GPB message data', function () {
        var r = new Pinba.Request();

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.tagSet('tag1', 'value1');
        r.tagSet('tag2', 'value2');
        r.tagSet('tag3', 'value2');

        r.timerAdd({tag1: 'value1'}, 0.1);
        r.timerAdd({tag2: 'value1'}, 0.2);
        r.timerAdd({tag3: 'value2'}, 0.3);

        var data = r.getGPBMessageData();

        delete data.request_time;
        delete data.document_size;
        delete data.memory_peak;
        delete data.ru_utime;
        delete data.ru_stime;
        delete data.status;
        delete data.memory_footprint;

        assert.deepEqual(
          data,
          {
            hostname:       'HOSTNAME',
            server_name:    'SERVER_NAME',
            script_name:    'SCRIPT_NAME',
            schema:         'SCHEMA',

            request_count:    1,

            tag_name:         [0, 2, 4],
            tag_value:        [1, 3, 3],

            dictionary:       [
              'tag1',
              'value1',
              'tag2',
              'value2',
              'tag3'
            ]
          }
        );
      });
    });
  });
});
