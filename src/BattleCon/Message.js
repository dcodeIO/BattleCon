/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * Constructs a new BattleCon Message.
 * @exports BattleCon.Message
 * @param {number} id Sequence id
 * @param {number} flags Flags
 * @param {string|!Array.<string>} data Data
 * @constructor
 */
var Message = function(id, flags, data) {
    this.id = id & 0x3fffffff;
    this.flags = flags & 0x3;
    this.data = typeof data === 'string' ? data.split(' ') : data;
};

/**
 * Message flags.
 * @type {!Object.<string,number>}
 */
Message.FLAGS = {};

/**
 * Message is a response.
 * @type {number}
 * @const
 */
Message.FLAGS.RESPONSE = 0x01;

/**
 * Message originated from the server.
 * @type {number}
 * @const
 */
Message.FLAGS.FROMSERVER = 0x02;

/**
 * Encodes the Message.
 * @returns {!Buffer}
 */
Message.prototype.encode = function() {
    // First of all, construct the data part
    var data = [],
        dataLength = 0;
    for (var i=0; i<this.data.length; i++) {
        var word = new Buffer(this.data[i], "utf8");
        var part = new Buffer(word.length+5);
        part.writeUInt32LE(word.length, 0);
        word.copy(part, 4);
        part.writeUInt8(0x00, part.length-1);
        data.push(part);
        dataLength += part.length;
    }
    // Then build the packet
    var pack = new Buffer(dataLength+12);
    pack.writeUInt32LE(((this.flags << 30) & 0xC0000000) | (this.id & 0x3fffffff), 0); // Header
    pack.writeUInt32LE(pack.length, 4); // Overall packet size
    pack.writeUInt32LE(data.length, 8); // Data count
    Buffer.concat(data).copy(pack, 12); // Data
    return pack;
};

/**
 * Tests if this message is a response.
 * @returns {boolean}
 */
Message.prototype.isResponse = function() {
    return (this.flags & Message.FLAGS.RESPONSE) === Message.FLAGS.RESPONSE;
};

/**
 * Tests if the message originated from the server.
 * @returns {boolean}
 */
Message.prototype.isFromServer = function() {
    return (this.flags & Message.FLAGS.FROMSERVER) === Message.FLAGS.FROMSERVER;
};

/**
 * Decodes a Message.
 * @param {!Buffer} pack Buffer to decode
 * @returns {!Message}
 * @throws {Error} If the buffer cannot be decoded
 */
Message.decode = function(pack) {
    var head = pack.readUInt32LE(0),
        id = head & 0x3fffffff,
        flags = (head >> 30) & 0x3,
        dataLength = pack.readUInt32LE(8),
        data = [],
        offset = 12;
    for (var i=0; i<dataLength; i++) {
        var len = pack.readUInt32LE(offset);
        offset += 4;
        data.push(pack.slice(offset, offset+len).toString("utf8"));
        offset += len+1;
    }    
    return new Message(id, flags, data);
};

module.exports = Message;
