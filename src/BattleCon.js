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

var events = require("events"),
    net = require("net"),
    crypto = require("crypto"),
    Message = require("./BattleCon/Message.js");

/**
 * Constructs a new BattleCon instance.
 * @exports BattleCon
 * @param {string} host Hostname or IP
 * @param {number} port Port
 * @param {string} pass RCON password
 * @constructor
 * @extends events.EventEmitter
 */
var BattleCon = function(host, port, pass) {
    events.EventEmitter.call(this);

    // Connection parameters
    this.host = host;
    this.port = port;
    this.pass = pass;

    // Connection state
    this.loggedIn = false;
    this.sock = null;
    this.id = 0x3fffffff;
    this.buf = new Buffer(0);
    this.cbs = {};
};

// Event                   | Meaning
// ------------------------|-----------------------
// connect                 | Connection established
// login                   | Successfully logged in
// close                   | Connection closed
// error                   | Error caught
// event                   | Raw server event

/**
 * @alias {BattleCon.Message}
 */
BattleCon.Message = Message;

// Extends EventEmitter
BattleCon.prototype = Object.create(events.EventEmitter.prototype);

/**
 * Loads a plugin.
 * @param {string|function(BattleCon)} plugin Plugin to use
 */
BattleCon.prototype.use = function(plugin) {
    if (typeof plugin === 'function') {
        plugin(this);
        return true;
    } else {

    }
};

/**
 * Connects and logs in to the server.
 */
BattleCon.prototype.connect = function() {
    if (this.sock !== null) return;
    this.sock = new net.Socket();
    this.sock.on("error", this.emit.bind(this, "error"));
    this.sock.on("close", function() {
        this.emit("close");
        this.sock = null;
    }.bind(this));
    this.sock.connect(this.port, this.host, function() {
        this.emit("connect");
        this.sock.on("data", this._gather.bind(this));
        
        // Log in
        this.exec("login.hashed", function(err, res) {
            if (err) {
                this.sock.end();
                this.sock = null;
                this.emit("error", err);
                return;
            }
            var md = crypto.createHash("md5");
            md.update(res[0], "hex");
            md.update(this.pass, "utf8");
            this.exec("login.hashed "+md.digest("hex").toUpperCase(), function(err, res) {
                if (err) {
                    this.sock.end();
                    this.sock = null;
                    this.emit("error", err);
                    return;
                }
                this.loggedIn = true;
                this.emit("login");
            }.bind(this));
        }.bind(this));
    }.bind(this));
};

/**
 * Disconnects from the server.
 */
BattleCon.prototype.disconnect = function() {
    if (this.sock !== null) {
        this.sock.end();
    }
};

/**
 * Gathers more data.
 * @param {!Buffer} chunk Chunk of data
 * @private
 */
BattleCon.prototype._gather = function(chunk) {
    this.buf = Buffer.concat([this.buf, chunk]);
    do {
        if (this.buf.length < 8) return;
        var size = this.buf.readUInt32LE(4);
        if (this.buf.length < size) return;
        var data = this.buf.slice(0, size);
        this.buf = this.buf.slice(size, this.buf.length);
        try {
            this._process(Message.decode(data));
        } catch (err) {
            this.emit("error", err);
        }
    } while (true);
};

/**
 * Processes the next message.
 * @param {!Message} msg Message
 * @private
 */
BattleCon.prototype._process = function(msg) {
    if (msg.data.length == 0) {
        this.emit("error", "empty message received");
        return;
    }

    // If not logged in, check the result
    if (msg.isFromServer()) { // Handle event (transforms punkBuster.onMessage to punkbuster.message etc.)
        this.emit("event", msg); // Raw event
        console.log("event", msg);
    } else { // Lookup the callback
        if (this.cbs.hasOwnProperty("cb"+msg.id)) {
            var callback = this.cbs["cb"+msg.id];
            delete this.cbs["cb"+msg.id];
            if (msg.data[0] === "OK") {
                callback(null, msg.data.slice(1));
            } else {
                callback(new Error(msg.data.join(' ')));
            }
        } else {
            console.log("no cb:", msg);
        }
    }
};

/**
 * Executes a command.
 * @param {string|!Array.<string>} command Command
 * @param {function(Error, Message=)=} callback Callback
 */
BattleCon.prototype.exec = function(command, callback) {
    var msg = new Message(this.id, 0, command);
    if (typeof callback === 'function') {
        this.cbs["cb"+this.id] = callback;
    }
    this.sock.write(msg.encode());
    this.id = (this.id+1)&0x3fffffff;
};

/**
 * Tabulates a result containing columns and rows.
 * @param {!Array.<string>} res
 * @returns {!Array.<Object.<string,string>>}
 */
BattleCon.tabulate = function(res) {
    var nColumns = parseInt(res[0], 10),
        columns = [];
    for (var i=1; i<=nColumns; i++) {
        columns.push(res[i]);
    }
    var nRows = parseInt(res[i], 10),
        rows = [];
    for (var n=0; n<nRows; n++) {
        var row = {};
        for (var j=0; j<columns.length; j++) {
            row[columns[j]] = res[++i];
        }
        rows.push(row);
    }
    rows.columns = columns;
    return rows;
};

/**
 * Tabulates a result containing columns and rows.
 * @function
 * @param {!Array.<string>} res
 * @returns {!Array.<Object.<string,string>>}
 */
BattleCon.prototype.tabulate = BattleCon.tabulate;

module.exports = BattleCon;
