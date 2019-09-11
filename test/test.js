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

var sinon = require("sinon");

var Pinba = require(process.env.LIB_COV ? '../lib-cov/pinba' : '../lib/pinba');

describe('Pinba', function () {
  var constants = [
    'FLUSH_ONLY_STOPPED_TIMERS',
    'FLUSH_RESET_DATA',
    'GET_ONLY_STOPPED_TIMERS'
  ];
  _.forEach(constants, function (constant) {
    it('should export ' + constant + ' constant', function () {
      assert.ok(constant in Pinba);
    });
  });

  it('should export Request class', function () {
    assert.ok(typeof Pinba.Request === 'function');
  });

  describe('Request', function () {
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
        'timersGet',
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

        assert.deepStrictEqual(
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

        assert.deepStrictEqual(
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

        assert.equal(r.tagGet('tag1'), null, "Right tag value before set");

        r.tagSet('tag1', 'value');

        assert.equal(r.tagGet('tag1'), 'value', "Right tag value after set");
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

        assert.deepStrictEqual(
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

          assert.ok(info.value * 1000 < 110, "Less than 105");
          assert.ok(info.value * 1000 > 90, "Greater than 95");

          done();
        }, 100);
      });

      it('should properly return info [timerAdd+timerGetInfo]', function () {
        var r = new Pinba.Request();
        var timer = r.timerAdd({tag: 'tagValue'}, 0.100);

        var info = r.timerGetInfo(timer);

        assert.ok(!info.started, "Stopped");

        assert.ok(info.value * 1000 < 110, "Less than 105");
        assert.ok(info.value * 1000 > 90, "Greater than 95");

        assert.deepStrictEqual(info.tags, {tag: 'tagValue'}, "Correct tags");
      });

      it('may be deleted [timerDelete]', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerAdd({tag1: 'tag1value'}, 0.1);
        var timer2 = r.timerAdd({tag2: 'tag2value'}, 0.1);

        r.timerDelete(timer1);

        assert.deepStrictEqual(_.keys(r.timers), [timer2]);
      });

      it('should properly works with tags [timerTagsMerge+timerTagsReplace]', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerStart({tag1: 'tag1value'});
        var timer2 = r.timerStart({tag2: 'tag2value'});

        r.timerTagsMerge(timer1, {tag1: 'tag1valueMerged', tag3: 'tag3value'});
        r.timerTagsMerge(timer2, {tag4: 'tag4value'});

        var info1 = r.timerGetInfo(timer1);
        assert.deepStrictEqual(info1.tags, {tag1: 'tag1valueMerged', tag3:'tag3value'}, "Tags merged");

        var info2 = r.timerGetInfo(timer2);
        assert.deepStrictEqual(info2.tags, {tag2: 'tag2value', tag4: 'tag4value'}, "Tags merged");

        r.timerTagsReplace(timer1, {tag3: 'tag3valueReplaced', tag4: 'tag4valueReplaced'});
        info1 = r.timerGetInfo(timer1);
        assert.deepStrictEqual(info1.tags, {tag3: 'tag3valueReplaced', tag4: 'tag4valueReplaced'}, "Tags replaced");
      });

      it('should properly works with data [timerDataMerge+timerDataReplace]', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerStart({}, {data1: 'data1value'});
        var timer2 = r.timerStart({}, {data2: 'data2value'});

        r.timerDataMerge(timer1, {data1: 'data1valueReplaced', data3: 'data3value'});
        r.timerDataMerge(timer2, {data4: 'data4value'});

        var info1 = r.timerGetInfo(timer1);
        assert.deepStrictEqual(info1.data, {data1: 'data1valueReplaced', data3: 'data3value'}, "Data merged");

        var info2 = r.timerGetInfo(timer2);
        assert.deepStrictEqual(info2.data, {data2: 'data2value', data4: 'data4value'}, "Data merged");

        r.timerDataReplace(timer1, {data3: 'data3valueReplaced', data4: 'data4valueReplaced'});
        info1 = r.timerGetInfo(timer1);
        assert.deepStrictEqual(info1.data, {data3: 'data3valueReplaced', data4: 'data4valueReplaced'}, "Data replaced");
      });

      it('timersStop() should stop all remaining timers', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerStart({}, {data1: 'data1value'});
        var timer2 = r.timerStart({}, {data2: 'data2value'});

        r.timerStop(timer1);

        r.timersStop();

        var info2 = r.timerGetInfo(timer2);
        assert.equal(info2.started, false, "timer2 stopped");
      });

      it('timersGet() should return timers', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerStart({}, {data1: 'data1value'});
        var timer2 = r.timerStart({}, {data2: 'data2value'});

        r.timerStop(timer1);

        var timers = r.timersGet();
        assert.deepStrictEqual(timers, [timer1, timer2]);
      });

      it('timersGet() should support GET_ONLY_STOPPED_TIMERS flag', function () {
        var r = new Pinba.Request(), timers;
        var timer1 = r.timerStart({}, {data1: 'data1value'});
        var timer2 = r.timerStart({}, {data2: 'data2value'});

        r.timerStop(timer1);

        timers = r.timersGet(Pinba.GET_ONLY_STOPPED_TIMERS);
        assert.deepStrictEqual(timers, [timer1]);

        r.timerStop(timer2);

        timers = r.timersGet(Pinba.GET_ONLY_STOPPED_TIMERS);
        assert.deepStrictEqual(timers, [timer1, timer2]);
      });

      it('cannot stop already stopped timer [timerStop]', function () {
        var r = new Pinba.Request();
        var timer1 = r.timerStart({}, {data1: 'data1value'});

        r.timerStop(timer1);

        assert.throws(r.timerStop.bind(r, timer1), Error, "Pinba: Cannot stop already stopped timer");
      });

      it('cannot stop nonexistent timer [timerStop]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerStop.bind(r, timer1), Error, "Pinba: Cannot stop nonexistent timer");
      });

      it('cannot delete nonexistent timer [timerDelete]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerDelete.bind(r, timer1), Error, "Pinba: Cannot delete nonexistent timer");
      });

      it('cannot modify nonexistent timer [timerTagsMerge]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerTagsMerge.bind(r, timer1, {}), Error, "Pinba: Cannot modify nonexistent timer");
      });

      it('cannot modify nonexistent timer [timerTagsReplace]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerTagsReplace.bind(r, timer1, {}), Error, "Pinba: Cannot modify nonexistent timer");
      });

      it('cannot modify nonexistent timer [timerDataMerge]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerDataMerge.bind(r, timer1, {}), Error, "Pinba: Cannot modify nonexistent timer");
      });

      it('cannot modify nonexistent timer [timerDataReplace]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerDataReplace.bind(r, timer1, {}), Error, "Pinba: Cannot modify nonexistent timer");
      });

      it('cannot get info for nonexistent timer [timerGetInfo]', function () {
        var r = new Pinba.Request();
        var timer1 = 1;

        assert.throws(r.timerGetInfo.bind(r, timer1), Error, "Pinba: Cannot get info for nonexistent timer");
      });
    });

    describe('and finally', function () {
      it('getInfo() should return request info', function () {
        var r = new Pinba.Request();

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.setRequestTime(0.5);

        r.tagSet('tag1', 'value1');
        r.tagSet('tag2', 'value2');
        r.tagSet('tag3', 'value2');

        r.timerAdd({tag1: 'value1'}, 0.1);
        r.timerAdd({tag2: 'value1'}, 0.2);
        r.timerAdd({tag3: 'value2'}, 0.3);

        var info = r.getInfo();

        delete info.ru_utime;
        delete info.ru_stime;

        assert.deepStrictEqual(
          info,
          {
            hostname:       'HOSTNAME',
            server_name:    'SERVER_NAME',
            script_name:    'SCRIPT_NAME',
            schema:         'SCHEMA',
            req_count:      1,
            req_time:       0.5,
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

        r.setRequestTime(0.5);

        r.tagSet('tag1', 'value1');
        r.tagSet('tag2', 'value2');
        r.tagSet('tag3', 'value2');
        r.tagSet('value1', 'tag3');

        r.timerAdd({tag1: 'value1'}, 0.1);
        r.timerAdd({tag2: 'value1'}, 0.2);
        r.timerAdd({tag3: 'value2'}, 0.3);

        r.timerAdd({tag3: 'value2'}, 0.4);

        r.timerAdd({tag1: 'value1', tag3: 'value2'}, 0.8);

        // to check that getGPBMessageData returns only stopped timers
        r.timerStart({tag1: 'value1', tag3: 'value2'});

        var data = r.getGPBMessageData();

        delete data.memory_peak;
        delete data.document_size;
        delete data.status;
        delete data.ru_utime;
        delete data.ru_stime;

        var expected_data = {
          hostname:       'HOSTNAME',
          server_name:    'SERVER_NAME',
          script_name:    'SCRIPT_NAME',
          schema:         'SCHEMA',

          request_count:    1,
          request_time:     0.5,

          tag_name:         [0, 2, 4, 1],
          tag_value:        [1, 3, 3, 4],

          timer_hit_count:  [1, 1, 2, 1],
          timer_value:      [0.1, 0.2, 0.7, 0.8],
          timer_tag_count:  [1, 1, 1, 2],
          timer_tag_name:   [0, 2, 4, 0, 4],
          timer_tag_value:  [1, 1, 3, 1, 3],

          dictionary:       [
            'tag1',
            'value1',
            'tag2',
            'value2',
            'tag3'
          ]
        };

        assert.deepStrictEqual(expected_data.tag_name, data.tag_name);
        assert.deepStrictEqual(expected_data.tag_value, data.tag_value);

        assert.deepStrictEqual(expected_data.timer_hit_count, data.timer_hit_count);
        assert.deepStrictEqual(expected_data.timer_value, data.timer_value);
        assert.deepStrictEqual(expected_data.timer_tag_count, data.timer_tag_count);
        assert.deepStrictEqual(expected_data.timer_tag_name, data.timer_tag_name);
        assert.deepStrictEqual(expected_data.timer_tag_value, data.timer_tag_value);

        assert.deepStrictEqual(expected_data, data);
      });

      it('flush() should call protobuf builder and dgram methods', function () {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_spy = sinon.spy(ProtoBufPinbaRequest, "fromObject");

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_on_spy = sinon.spy();
        var socket_send_spy = sinon.spy();
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on:   socket_on_spy,
          send: socket_send_spy
        });
        // End

        var r = new Pinba.Request(), data;

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.flush();

        assert.deepStrictEqual({}, r.timers);

        assert.ok(request_verify_spy.calledOnce);
        assert.ok(request_fromObject_spy.calledOnce);

        var expected_data = {
          hostname:       'HOSTNAME',
          server_name:    'SERVER_NAME',
          script_name:    'SCRIPT_NAME',
          schema:         'SCHEMA',

          request_count:    1,

          tag_name:         [],
          tag_value:        [],

          timer_hit_count:  [],
          timer_value:      [],
          timer_tag_count:  [],
          timer_tag_name:   [],
          timer_tag_value:  [],

          dictionary:       []
        };

        data = request_verify_spy.firstCall.args[0];

        delete data.request_time;
        delete data.memory_peak;
        delete data.document_size;
        delete data.status;
        delete data.ru_utime;
        delete data.ru_stime;

        assert.deepStrictEqual(expected_data, data);

        assert.ok(socket_create_stub.calledOnce);
        assert.ok(socket_on_spy.calledOnce);
        assert.ok(socket_send_spy.calledOnce);

        // Stubs
        request_verify_spy.restore();
        request_fromObject_spy.restore();
        socket_create_stub.restore();
        // End
      });

      it('flush() should support request data overriding', function () {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_spy = sinon.spy(ProtoBufPinbaRequest, "fromObject");

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_on_spy = sinon.spy();
        var socket_send_spy = sinon.spy();
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on:   socket_on_spy,
          send: socket_send_spy
        });
        // End

        var r = new Pinba.Request(), data;

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.flush({
          data: {
            script_name: 'SCRIPT_NAME2',
            schema:      'SCHEMA2'
          }
        });

        assert.deepStrictEqual({}, r.timers);

        assert.ok(socket_create_stub.calledOnce);
        assert.ok(socket_on_spy.calledOnce);
        assert.ok(socket_send_spy.calledOnce);

        var expected_data = {
          hostname:       'HOSTNAME',
          server_name:    'SERVER_NAME',
          script_name:    'SCRIPT_NAME2',
          schema:         'SCHEMA2',

          request_count:    1,

          tag_name:         [],
          tag_value:        [],

          timer_hit_count:  [],
          timer_value:      [],
          timer_tag_count:  [],
          timer_tag_name:   [],
          timer_tag_value:  [],

          dictionary:       []
        };

        data = request_verify_spy.firstCall.args[0];

        delete data.request_time;
        delete data.memory_peak;
        delete data.document_size;
        delete data.status;
        delete data.ru_utime;
        delete data.ru_stime;

        assert.deepStrictEqual(expected_data, data);

        // Stubs
        request_verify_spy.restore();
        request_fromObject_spy.restore();
        socket_create_stub.restore();
        // End
      });

      it('flush() should support FLUSH_ONLY_STOPPED_TIMERS flag', function () {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_spy = sinon.spy(ProtoBufPinbaRequest, "fromObject");

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_on_spy = sinon.spy();
        var socket_send_spy = sinon.spy();
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on:   socket_on_spy,
          send: socket_send_spy
        });
        // End

        var r = new Pinba.Request(), data;

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        // One started timer
        r.timerStart({tag1: 'tag1value'});
        // One stopped timer
        r.timerAdd({tag2: 'tag1value'}, 0.3);

        r.flush({
          flags: Pinba.FLUSH_ONLY_STOPPED_TIMERS
        });

        assert.deepStrictEqual({}, r.timers);

        assert.ok(socket_create_stub.calledOnce);
        assert.ok(socket_on_spy.calledOnce);
        assert.ok(socket_send_spy.calledOnce);

        var expected_data = {
          hostname:       'HOSTNAME',
          server_name:    'SERVER_NAME',
          script_name:    'SCRIPT_NAME',
          schema:         'SCHEMA',

          request_count:    1,

          tag_name:         [],
          tag_value:        [],

          timer_hit_count:  [1],
          timer_value:      [0.3],
          timer_tag_count:  [1],
          timer_tag_name:   [0],
          timer_tag_value:  [1],

          dictionary:       ['tag2', 'tag1value']
        };

        data = request_verify_spy.firstCall.args[0];

        delete data.request_time;
        delete data.memory_peak;
        delete data.document_size;
        delete data.status;
        delete data.ru_utime;
        delete data.ru_stime;

        assert.deepStrictEqual(expected_data, data);

        // Stubs
        request_verify_spy.restore();
        request_fromObject_spy.restore();
        socket_create_stub.restore();
        // End
      });

      it('flush() should support FLUSH_RESET_DATA flag', function () {
        // Stubs
        var process_hrtime_stub = sinon.stub(process, "hrtime");
        process_hrtime_stub.returns(1234);

        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_spy = sinon.spy(ProtoBufPinbaRequest, "fromObject");

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_on_spy = sinon.spy();
        var socket_send_spy = sinon.spy();
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on:   socket_on_spy,
          send: socket_send_spy
        });
        // End

        var r = new Pinba.Request(), data;

        r.setHostname('HOSTNAME');
        r.setServerName('SERVER_NAME');
        r.setScriptName('SCRIPT_NAME');
        r.setSchema('SCHEMA');

        r.flush({
          flags: Pinba.FLUSH_RESET_DATA
        });

        assert.deepStrictEqual({}, r.timers);

        assert.equal(1234, r.start);

        assert.ok(socket_create_stub.calledOnce);
        assert.ok(socket_on_spy.calledOnce);
        assert.ok(socket_send_spy.calledOnce);

        var expected_data = {
          hostname:       'HOSTNAME',
          server_name:    'SERVER_NAME',
          script_name:    'SCRIPT_NAME',
          schema:         'SCHEMA',

          request_count:    1,

          tag_name:         [],
          tag_value:        [],

          timer_hit_count:  [],
          timer_value:      [],
          timer_tag_count:  [],
          timer_tag_name:   [],
          timer_tag_value:  [],

          dictionary:       []
        };

        data = request_verify_spy.firstCall.args[0];

        delete data.request_time;
        delete data.memory_peak;
        delete data.document_size;
        delete data.status;
        delete data.ru_utime;
        delete data.ru_stime;

        assert.deepStrictEqual(expected_data, data);

        // Stubs
        process.hrtime.restore();
        request_verify_spy.restore();
        request_fromObject_spy.restore();
        socket_create_stub.restore();
        // End
      });

      it('flush() should call callback on success', function (done) {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_spy = sinon.spy(ProtoBufPinbaRequest, "fromObject");

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_on_spy = sinon.spy();
        var socket_send_spy = function (b, o, l, p, s, cb) {
          cb(false, l);
        };
        var socket_close_spy = sinon.spy();
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on:    socket_on_spy,
          send:  socket_send_spy,
          close: socket_close_spy
        });
        // End

        var r = new Pinba.Request();

        r.flush(function () {
          assert.deepStrictEqual({}, r.timers);

          assert.ok(socket_create_stub.calledOnce);
          assert.ok(socket_on_spy.calledOnce);
          assert.ok(socket_close_spy.calledOnce);

          // Stubs
          request_verify_spy.restore();
          request_fromObject_spy.restore();
          socket_create_stub.restore();
          // End

          done();
        });
      });

      it('flush() should throw error if protobuf builder throws error', function (done) {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_stub = sinon.stub(ProtoBufPinbaRequest, "fromObject");
        request_fromObject_stub.throws();

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({});
        // End

        var r = new Pinba.Request();

        assert.throws(r.flush.bind(r), Error);

        assert.deepStrictEqual({}, r.timers);

        assert.ok(!socket_create_stub.called);

        // Stubs
        request_verify_spy.restore();
        request_fromObject_stub.restore();
        socket_create_stub.restore();
        // End

        done();
      });

      it('flush() should call callback if protobuf builder throws error', function (done) {
        // Stubs
        var ProtoBufPinbaRequest = Pinba.getProtoBufPinbaRequest();

        var request_verify_spy = sinon.stub(ProtoBufPinbaRequest, "verify");
        var request_fromObject_stub = sinon.stub(ProtoBufPinbaRequest, "fromObject");
        request_fromObject_stub.throws();

        var buffer = Buffer.from("smth");
        // TODO: check this call
        //var writer_finish_stub = sinon.stub(ProtoBufPinbaRequest.prototype, "finish");
        //writer_finish_stub.returns(buffer);

        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({});
        // End

        var r = new Pinba.Request();

        r.flush(function (err) {
          assert.ok(err instanceof Error);

          assert.deepStrictEqual({}, r.timers);

          assert.ok(!socket_create_stub.called);

          // Stubs
          request_verify_spy.restore();
          request_fromObject_stub.restore();
          socket_create_stub.restore();
          // End

          done();
        });
      });

      it('flush() must verify message before sending', function () {
        var validData = {
          hostname: 'hostname',
          server_name: 'server_name',
          script_name: 'script_name',
          schema: 'schema'
        };
        var socket_create_stub = sinon.stub(require('dgram'), "createSocket");
        socket_create_stub.returns({
          on: noop,
          send: noop
        });

        try {
          checkMessageVerification(validData, null);
          checkMessageVerification(Object.assign({}, validData, {hostname: 42}), 'hostname');
          checkMessageVerification(Object.assign({}, validData, {server_name: 42}), 'server_name');
          checkMessageVerification(Object.assign({}, validData, {script_name: 42}), 'script_name');
          checkMessageVerification(Object.assign({}, validData, {schema: 42}), 'schema');
        } finally {
          socket_create_stub.restore();
        }

        function checkMessageVerification(data, invalidFieldName) {
          var error = null;

          try {
            (new Pinba.Request(data)).flush();
          } catch (err) {
            error = err;
          } finally {
            if (invalidFieldName) {
              assert.ok(error instanceof Error,
                  'Verification error is missing');
              assert.ok(error.message.indexOf(invalidFieldName + ':') === 0,
                  'Verification error message must refer on invalid field name');
            } else {
              assert.strictEqual(error, null, 'Got unexpected verification error');
            }
          }
        }

        function noop() {}
      });
    });
  });
});
