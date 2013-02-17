/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * Based on prtbfr.php by Gaetano Giunta
 *
 * See contributors list in README
 *
 * See license text in LICENSE file
 */

var _ = require('lodash');

var SimpleGPB = module.exports = {};

SimpleGPB.WIRETYPE_VARINT = 0;
SimpleGPB.WIRETYPE_FIXED64 = 1;
SimpleGPB.WIRETYPE_LENGTH_DELIMITED = 2;
SimpleGPB.WIRETYPE_START_GROUP = 3; // deprecated
SimpleGPB.WIRETYPE_END_GROUP = 4; // deprecated
SimpleGPB.WIRETYPE_FIXED32 = 5;

SimpleGPB.ELEMENT_REQUIRED = 'required';
SimpleGPB.ELEMENT_OPTIONAL = 'optional';
SimpleGPB.ELEMENT_REPEATED = 'repeated';

SimpleGPB.TYPE_DOUBLE = 1;
SimpleGPB.TYPE_FLOAT = 2;
SimpleGPB.TYPE_INT64 = 3;
SimpleGPB.TYPE_UINT64 = 4;
SimpleGPB.TYPE_INT32 = 5;
SimpleGPB.TYPE_FIXED64 = 6;
SimpleGPB.TYPE_FIXED32 = 7;
SimpleGPB.TYPE_BOOL = 8;
SimpleGPB.TYPE_STRING = 9;
SimpleGPB.TYPE_GROUP = 10;
SimpleGPB.TYPE_MESSAGE = 11;
SimpleGPB.TYPE_BYTES = 12;
SimpleGPB.TYPE_UINT32 = 13;
SimpleGPB.TYPE_ENUM = 14;
SimpleGPB.TYPE_SFIXED32 = 15;
SimpleGPB.TYPE_SFIXED64 = 16;
SimpleGPB.TYPE_SINT32 = 17;
SimpleGPB.TYPE_SINT64 = 18;
SimpleGPB.TYPE_UNKNOWN = -1;

SimpleGPB.encode = function (data, proto) {
  var result = '';

  for (var pos in proto) {
    if (proto.hasOwnProperty(pos)) {
      var def = proto[pos];
      var field = def[0];
      var type = def[1];
      var cardinality = (def.length >= 3) ? def[2] : SimpleGPB.ELEMENT_REQUIRED;

      switch (cardinality) {
        case SimpleGPB.ELEMENT_OPTIONAL:
          if (typeof struct[filed] !== 'undefined') {
            result += SimpleGPB.encode_value(struct[field], type, pos);
          }
          break;
        case SimpleGPB.ELEMENT_REPEATED:
          _.forOwn(struct[field], function (value) {
            result += SimpleGPB.encode_value(value, type, pos);
          });
          break;
        default: // SimpleGPB.ELEMENT_REQUIRED
          result += SimpleGPB.encode_value(struct[field], type, pos);
          break;
      }
    }
  }
};
