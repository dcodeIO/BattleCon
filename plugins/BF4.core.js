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
 * Loads the BF4 plugin.
 * @param {!BattleCon} bc BattleCon instance
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
        bc.exec("version", function(err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, /* game */ res[0], /* version */ res[1]);
        });
    };

    /**
     * Gets a list of available commands.
     * @param {function(Error, Array.<string>=)} callback Callback
     */
    bc.help = function(callback) {
        bc.exec("admin.help", function(err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, res);
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
            bc.exec("admin.eventsEnabled", function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, res[0] === "true");
            });
        } else { // Set and query
            bc.exec("admin.eventsEnabled "+(enabled ? "true" : "false"), function(err, res) {
                if (err) {
                    callback(err);
                    return;
                }
                bc.exec("admin.eventsEnabled", function(err, res) {
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
     * Gets a list of all players.
     * @param {function(Error, Array.<Object.<string,string>>=)} callback Callback
     */
    bc.listPlayers = function(callback) {
        bc.exec("admin.listPlayers all", function(err, res) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, bc.tabulate(res));
        });
    };
};
