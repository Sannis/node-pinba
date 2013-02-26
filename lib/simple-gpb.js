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

SimpleGPB.encode = function (buffer, offset, data, proto) {
  var length = 0;

  _.forOwn(proto, function (field_definition, field_position) {
    var field_name = field_definition[0];
    var field_type = field_definition[1];
    var field_cardinality = (field_definition.length >= 3) ? field_definition[2] : SimpleGPB.ELEMENT_REQUIRED;

    switch (field_cardinality) {
      case SimpleGPB.ELEMENT_OPTIONAL:
        if (typeof data[field_name] !== 'undefined') {
          length += SimpleGPB.encode_value(buffer, offset + length, data[field_name], field_type, field_position);
        }
        break;
      case SimpleGPB.ELEMENT_REPEATED:
        _.forOwn(data[field_name], function (value) {
          length += SimpleGPB.encode_value(buffer, offset + length, value, field_type, field_position);
        });
        break;
      default: // SimpleGPB.ELEMENT_REQUIRED
        if (typeof data[field_name] === 'undefined') {
          throw new Error("SimpleGPB: No required filed '" + field_name + "' in data");
        }
        length += SimpleGPB.encode_value(buffer, offset + length, data[field_name], field_type, field_position);
        break;
    }
  });

  return length;
};

SimpleGPB.wiretype = function (type) {
  switch (type) {
    case SimpleGPB.TYPE_STRING:
    case SimpleGPB.TYPE_BYTES:
    case SimpleGPB.TYPE_MESSAGE:
      return SimpleGPB.WIRETYPE_LENGTH_DELIMITED;
    case SimpleGPB.TYPE_FIXED64:
    case SimpleGPB.TYPE_SFIXED64:
    case SimpleGPB.TYPE_DOUBLE:
      return SimpleGPB.WIRETYPE_FIXED64;
    case SimpleGPB.TYPE_FIXED32:
    case SimpleGPB.TYPE_SFIXED32:
    case SimpleGPB.TYPE_FLOAT:
      return SimpleGPB.WIRETYPE_FIXED32;
    case SimpleGPB.TYPE_INT32:
    case SimpleGPB.TYPE_INT64:
    case SimpleGPB.TYPE_UINT32:
    case SimpleGPB.TYPE_UINT64:
    case SimpleGPB.TYPE_SINT32:
    case SimpleGPB.TYPE_SINT64:
    case SimpleGPB.TYPE_BOOL:
    case SimpleGPB.TYPE_ENUM:
    default: // Unknown fields just return the reported wire type
      return SimpleGPB.WIRETYPE_VARINT;
  }
};

SimpleGPB.encode_value = function (buffer, offset, value, type, position) {
  var wiretype = SimpleGPB.wiretype(type);
  var length = SimpleGPB.encode_varint(buffer, offset, (position << 3) | wiretype);

  switch (type) {
    case SimpleGPB.TYPE_INT64:
    case SimpleGPB.TYPE_UINT64:
    case SimpleGPB.TYPE_INT32:
    case SimpleGPB.TYPE_UINT32:
      value = ~~value;
      length += SimpleGPB.encode_varint(buffer, offset + length, value);
      break;
    case SimpleGPB.TYPE_BOOL: // casting bools to integers is correct
      value = value ? 1 : 0;
      length += SimpleGPB.encode_varint(buffer, offset + length, value);
      break;
    case SimpleGPB.TYPE_SINT32: // ZigZag
    case SimpleGPB.TYPE_SINT64: // ZigZag
      value = ~~value;
      value = (value >> 1) ^ (-(value & 1));
      length += SimpleGPB.encode_varint(buffer, offset + length, value);
      break;
    default:
      throw new Error("SimpleGPB: Not yet implemented");
      break;
  }

  return length;
};

SimpleGPB.encode_varint = function (buffer, offset, value) {
  if (value < 0) {
    // TODO: Check docs
    throw new Error("SimpleGPB: value '" + value + "' is negative");
  }

  if (value < 128) {
    buffer.writeUInt8(value, offset);
    return 1;
  }

  var length = 0;
  var last_written = 0;
  while (value !== 0) {
    last_written = 0x80 | (value & 0x7f);
    buffer.writeUInt8(last_written, offset + length);
    value = value >> 7;
    length++;
  }
  buffer.writeUInt8(last_written & 0x7f, offset + length - 1);

  return length;
};
