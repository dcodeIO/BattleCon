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
 * Loads the BF (common) module.
 * @param {!BattleCon} bc
 */
module.exports = function(bc) {
    
    // Extends core
    bc.use("core");
    
    // Parse events
    bc.on("event", function(msg) {
        switch (msg.data[0]) {
            case "player.onJoin":
                bc.emit("player.join", /* name */ msg.data[1], /* uid */ msg.data[2]);
                break;
            case "player.onAuthenticated":
                bc.emit("player.authenticated", /* name */ msg.data[1]);
                break;
            case "player.onLeave":
                bc.emit("player.leave", /* name */ msg.data[1], /* info */ bc.tabulate(msg.data, 2)[0]);
                break;
            case "player.onSpawn":
                bc.emit("player.spawn", /* name */ msg.data[1], /* team */ parseInt(msg[2], 10));
                break;
            case "player.onSquadChange":
                bc.emit("player.squadChange", /* name */ msg.data[1], /* team */ parseInt(msg.data[2], 10), /* squad */ parseInt(msg.data[3], 10));
                break;
            case "player.onTeamChange":
                bc.emit("player.teamChange", /* name */ msg.data[1], /* team */ parseInt(msg.data[2], 10), /* squad */ parseInt(msg.data[3], 10));
                break;
            case "player.onKill":
                bc.emit("player.kill", /* killer */ msg.data[1], /* victim */ msg.data[2], /* weapon */ msg.data[3], /* headshot */ msg.data[4] === "true");
                break;
            case "player.onChat":
                bc.emit("player.chat", /* name */ msg.data[1], /* text */ msg.data[2], /* player subset */ msg.data.slice(3));
                break;
            case "server.onLevelLoaded":
                bc.emit("server.levelLoaded", /* name */ msg.data[1], /* mode name */ msg.data[2], /* round no. */ parseInt(msg.data[3], 10), /* of total rounds */ parseInt(msg.data[4], 10));
                break;
            case "server.onRoundOver":
                bc.emit("server.roundOver", /* winning team */ parseInt(msg.data[1], 10));
                break;
            case "server.onRoundOverPlayers":
                bc.emit("server.roundOverPlayers", /* players */ bc.tabulate(msg.data, 1));
                break;
            case "server.onRoundOverTeamScores":
                var n = parseInt(msg.data[1], 10), // # scores
                    scores = [];
                for (var i=2; i<2+n; i++) {
                    scores.push(parseFloat(msg.data[i]));
                }
                bc.emit("server.roundOverTeamScores", /* scores array */ scores, /* target score */ parseInt(msg.data[i], 10));
                break;
        }
    });
    
};
