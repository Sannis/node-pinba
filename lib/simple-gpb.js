/*!
 * Copyright by Oleg Efimov
 * and other node-pinba contributors
 *
 * Based on prtbfr.php by Gaetano Giunta
 * @see https://github.com/gggeek/pinba_php/blob/master/lib/prtbfr.php
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

SimpleGPB.encode = function (data, proto, buffer) {
  _.forOwn(proto, function (field_definition, field_position) {
    var field_name = field_definition[0];
    var field_type = field_definition[1];
    var field_cardinality = (field_definition.length >= 3) ? field_definition[2] : SimpleGPB.ELEMENT_REQUIRED;

    switch (field_cardinality) {
      case SimpleGPB.ELEMENT_OPTIONAL:
        if (typeof data[field_name] !== 'undefined') {
          SimpleGPB.encode_value(data[field_name], field_type, field_position, buffer);
        }
        break;
      case SimpleGPB.ELEMENT_REPEATED:
        _.forOwn(data[field_name], function (value) {
          SimpleGPB.encode_value(value, field_type, field_position, buffer);
        });
        break;
      default: // SimpleGPB.ELEMENT_REQUIRED
        if (typeof data[field_name] === 'undefined') {
          throw new Error("SimpleGPB: No required filed '" + field_name + "' in data");
        }
        SimpleGPB.encode_value(data[field_name], field_type, field_position, buffer);
        break;
    }
  });
};
