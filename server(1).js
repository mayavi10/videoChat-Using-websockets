
var  WebSocket= require('ws').Server;

var fss=require('fs');
var pirateKey=fss.readFileSync("vedochat.key","utf-8");
var certificate=fss.readFileSync("vedochat.cert","utf-8");
var credentials={key:pirateKey,cert:certificate};
var t=require('express');
var app=t();
var https=require('https');
var site = "Hello WORLD";
fss.readFile('kk.html', function (err, data) {
    if (err) {
        console.log(err);
    }
    else {
        site = data;
    }


});
var httpsServer=https.createServer(credentials,function (res,req) {
    req.writeHead(200);
    req.write(site.toString());
    req.end();

});
httpsServer.listen(9994,"localhost");
var wss=new WebSocket({server:httpsServer});

var users={};
var pairs={};
wss.on("connection",function(connection){
    console.log("User New Connected");
    //console.log(connection);
    connection.on('message',function(message){
        var response=JSON.parse(message);
        console.log(message);
        if(response.type === "register")
        {createNewConnection(response.username,connection)
        }
        else if(response.type==="pairing")
        {getPairing(response,connection);
        }
        else if(response.type==="offer")
        {offer(response,connection);

        }
        else if(response.type ==="answer")
        {
            console.log("Sending answer to ",response.replyfor);
            var description=response.ansdes;
            var relayanswer={type:"answer",desc:description};
                users[response.replyfor].send(JSON.stringify(relayanswer));
        }
        else if(response.type==="ice")
        {users[response.target].send(message);

        }


    });
    connection.on('close',function  () {
        console.log(connection.readyState);
        for(var x in users){console.log(x);
            if(users[x]===connection){delete users[x]; console.log("user dissconnected",x);}}
        console.log("Client Discconet");

    });

});


function  createNewConnection(user,connect) {

    var reguser=false;
    for( var x in users)
    {if(user === x)
    {reguser=true;
      }
    }
    if(reguser){
        var reply={type:"register",executed:"Fail",user:user};
        connect.send(JSON.stringify(reply));
         console.log("Same username already Present= ",user);}
    else{users[user]=connect;
        var reply={type:"register",executed:"Success",user:user};
            connect.send(JSON.stringify(reply));
        console.log("New user added with name",user);
            }
}
function  getPairing(data,connect) {
if(data.pairstatus ==null)
    {   var rotuser = data.rootUser;
    var othruser = data.otheruser;
    var user1flag = 0;
    var user2flag = 0;
    for (var x in users) {
        if (x === rotuser) {
            user1flag = 1;
        }
        if (x === othruser) {
            user2flag = 1;
        }
    }
    if (user1flag === 0) {
        console.log("USer 1 not found");
    }
    if (user2flag === 0) {
        console.log("USer 2 not found");
    }
    if (user1flag === 1 && user2flag === 1) {
        var temp1 = {rootuser: rotuser, connection: users[rotuser]};
        var temp2 = {otheruser: othruser, connection: users[othruser]};
        var t = {sender: temp1, reciever: temp2};
        //var reply={type:"pairing",rootuser:users[rootuser],otheruser:users[otheruser]}
        var pairid = rotuser + othruser;
        console.log("Pair rootuser", t.sender.rootuser);
        console.log("Pair remoteuser", t.reciever.otheruser);

        pairs[pairid] = t;
        var reply_sender = {type: "pairing", executed: "Success", user: t.reciever.otheruser};
        var reply_reciever = {type: "pairing", executed: "Success", user: t.sender.rootuser};

        pairs[pairid].reciever.connection.send(JSON.stringify(reply_reciever));
        t.sender.connection.send(JSON.stringify(reply_sender));

    }

}
}
function  offer(data,connect){
    var offeringuser=data.sender;

    var remoteuser=data.reciever;
    var description=data.desdata;
    var relayoffer={type:"offer",sender:offeringuser,descrip:description}
    var relay=JSON.stringify(relayoffer);
    users[remoteuser].send(relay);
}