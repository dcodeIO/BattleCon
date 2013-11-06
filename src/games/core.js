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

var crypto = require("crypto");

/**
 * Loads the core (Frostbyte) plugin.
 * @param {!BattleCon} bc
 */
module.exports = function(bc) {

    // Enable events
    bc.on("login", function() {
        bc.eventsEnabled(true, function(err, enabled) {});
    });

    // Process events
    bc.on("event", function(msg) {
        var evt = msg.data[0].replace(/\.on[A-Z]/, function(s) { return "."+s.charAt(3).toLowerCase(); }).toLowerCase();
        this.emit(evt, msg.data.slice(1));
    });

    /**
     * Gets the server's version.
     * @param {function(Error, string=, string=)} callback Callback
     */
    bc.version = function(callback) {
        bc.exec(["version"], function(err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, /* game */ res[0], /* version */ res[1]);
        });
    };

    /**
     * Gets / sets if events are enabled.
     * @param {boolean|function(Error, boolean=)} enabled true to enable, false to disable
     * @param {function(Error, boolean=)} callback Callback
     */
    bc.eventsEnabled = function(enabled, callback) {
        if (typeof enabled === 'function') {
            callback = enabled;
            enabled = null;
        }
        if (typeof enabled !== 'boolean') { // Just query
            bc.exec(["admin.eventsEnabled"], function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, res[0] === "true");
            });
        } else { // Set and query
            bc.exec(["admin.eventsEnabled", enabled ? "true" : "false"], function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                bc.exec(["admin.eventsEnabled"], function(err, res) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, res[0] === "true");
                });
            });
        }
    };

    /**
     * Gets the list of players.
     * @param {function(Error, Array.<Object.<string,string>>=)} callback Callback
     */
    bc.listPlayers = function(callback) {
        bc.exec(["listPlayers", "all"], function(err, res) { // BF4-like
            if (err) {
                bc.exec(["listPlayers"], function(err2, res2) { // Possible fallback
                    if (err2) {
                        callback(err);
                        return;
                    }
                    callback(null, bc.tabulate(res2));
                });
                return;
            }
            callback(null, bc.tabulate(res));
        });
    };

    /**
     * Gets information about the server.
     * @param {function(Error, Array.<string>=)} callback Callback
     */
    bc.serverInfo = function(callback) {
        bc.exec(["serverInfo"], function(err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, res);
        });
    };

    /**
     * Logs in.
     * @param {function(Error)=} callback Callback
     */
    bc.login = function(callback) {
        this.exec(["login.hashed"], function(err, res) {
            if (err) {
                this.sock.end();
                this.emit("error", err);
                if (callback) callback(err);
                return;
            }
            var md = crypto.createHash("md5");
            md.update(res[0], "hex");
            md.update(this.pass, "utf8");
            this.exec(["login.hashed", md.digest("hex").toUpperCase()], function(err) {
                if (err) {
                    this.sock.end();
                    this.emit("error", err);
                    if (callback) callback(err);
                    return;
                }
                this.loggedIn = true;
                this.emit("login");
                if (callback) callback(null);
            }.bind(this));
        }.bind(this));
    };

    /**
     * Logs out.
     * @param {function(Error)=} callback Callback
     */
    bc.logout = function(callback) {
        this.exec(["logout"], function(err) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            if (callback) callback(null);
        });
    };

    /**
     * Ends the session.
     * @param {function(Error)=} callback Callback
     */
    bc.quit = function(callback) {
        bc.exec(["quit"], function(err, res) {
            if (err) {
                if (callback) callback(err);
                return;
            }
            if (callback) callback(null);
        });
    };
};
