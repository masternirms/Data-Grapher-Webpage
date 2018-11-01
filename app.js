/*
    MOSQUITO DETECTOR SERVER PROGRAM
                                      */

//Adds dependencies needed for Mosquito (mqtt broker), MongoDB and socketIO.
var mqtt = require('mqtt')
var client  = mqtt.connect('tcp://localhost:1883')
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var express = require('express')
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

//Provide the absolute path to the dist directory.
app.use(express.static('./dist'));

//On get request send 'index.html' page as a response.
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});

//Connects the MOSQUITTO broker to the 'iot_data' mqtt topic.
client.on('connect', function () {
	client.subscribe('iot_data')
});

//Connects to the MongoDB client and creates the database "iot_database".
MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("iot_database");

  //Pulls out messages from the "iot_data" topic and adds it to an object named messageObject.
	client.on('message', function (topic, message) {
		//console.log(message.toString())
		var messageObject = {
					 message: message.toString()
			 };

    //Creates a collection titled "data" in "iot_database" and adds the messages pulled up by the previous module.
		dbo.collection("data").insertOne(messageObject, function(err, res) {
	    if (err) throw err;
	    console.log("Message (" + message.toString() + ") inserted into database.");
	  });
	});
});

//Uses socketIO and Mosquitto to pull out the messages from "iot_data" and pass it on to the webclient
//along with the timestamp of the message.
io.on('connection', function (socket) {
    var strData;
    client.on('message', function(topic, message) {
      var data = message.toString();
      var dataInt = parseInt(data);
      //var x = new Date(message.timestamp);
      //var formatted =  (x.getHours()) + ':' + (x.getMinutes()) + ':' + (x.getSeconds()) + ':' + (x.getMilliseconds());
      strData = {"label": Math.floor(Date.now() / 1000),
                 "value": dataInt
              }
      socket.emit('news', strData);
    })
})

//Server listening on port 3000
server.listen(3000, function() {
   console.log('listening on *:3000');
   //You can access the webclient at http://localhost:3000.
});
