var BattleCon = require("./src/BattleCon.js"),
    config = require("./config.json"),
    bc = new BattleCon(config.host, config.port, config.pass).use("BF4");

bc.on("connect", function() {
    console.log("# Connected");
});

bc.on("login", function() {
    console.log("# Logged in");
    
    bc.version(function(err, game, version) {
        if (err) return;
        console.log("Server is running "+game+", version "+version);
    });
    
    bc.help(function(err, commands) {
        if (err) return;
        console.log("There are "+commands.length+" available commands:");
        console.log(commands);
    });
    
    bc.listPlayers(function(err, players) {
        console.log("There are "+players.length+" connected players:");
        for (var i=0; i<players.length; i++) {
            console.log(players[i]);
        }
    });
    
    bc.serverInfo(function(err, info) {
        console.log("Info:", info);
    });
    
    bc.on("event", function(msg) {
        console.log("Event:", msg);
    });
});

bc.on("close", function() {
    console.log("# Disconnected.");
});

bc.on("error", function(err) {
    console.log("# Error: "+err.message, err.stack);
});

bc.connect();
