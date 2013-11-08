var BattleCon = require("./src/BattleCon.js"),
    config = require("./config.json"),
    repl = require("repl"),
    bc = new BattleCon(config.host, config.port, config.pass).use("BF4");

bc.on("connect", function() {
    console.log("# Connected to "+bc.host+":"+bc.port);
});

bc.on("login", function() {
    console.log("# Login successful");
});

bc.on("ready", function() {
    
    // Execute raw commands:
    
    bc.exec("version", function(err, msg) {
        console.log("# Server is running "+msg[0]+", version "+msg[1]);
    });
    
    // Execute module commands (core.js):
    
    bc.serverInfo(function(err, info) {
        console.log("Server info:", info);
    });
    
    bc.listPlayers(function(err, players) {
        console.log("There are "+players.length+" connected players:");
        for (var i=0; i<players.length; i++) {
            console.log(players[i]);
        }
    });
    
    // Handle raw events:
    
    bc.on("event", function(msg) {
        console.log("# "+msg.data.join(' '));
    });
    
    // Handle module events (BF.js):
    
    bc.on("player.join", function(name, guid) {
        console.log("# Player joined: "+name+" ("+guid+")");
    });
    
    bc.on("player.leave", function(name, info) {
        console.log("# Player left: "+name+" ("+info.guid+")");
    });
    
    bc.on("player.chat", function(name, text, subset) {
        console.log("# "+name+" -> "+subset.join(' ')+": "+text);
    });
});

bc.on("close", function() {
    console.log("# Disconnected.");
});

bc.on("error", function(err) {
    console.log("# Error: "+err.message, err.stack);
});

bc.connect(); // Connects and logs in
