// Example based on Johnny-Five: https://github.com/rwaldron/johnny-five/wiki/Servo
var raspi = require("raspi-io");
var five = require("johnny-five");
var meshblu = require("meshblu");
var meshbluJSON = require("./meshblu.json");
var fs = require("fs");

// Specifies how you want your message payload to be passed
// from Octoblu to your device
var MESSAGE_SCHEMA = {
  type: "object",
  properties: {
    peripheral: {
      type: "object",
      properties: {
        digital : {
          type: "string",
          title: "digital pin",
          enum: ["11", "13", "15", "7", "3", "5"],
          required: false
        },
        servo: {
          type: "string",
          enum: ["PWM0", "PWM1"],
          required: false
        }
      }
    },
    digitalWrite: {
      type: "object",
      title: "Digital Write",
      properties:  {
        enable: {
          type: "boolean",
          title: "enable digitalWrite",
          required: false
        },
        state: {
          type: "string",
          enum: ["high", "low"],
          required: false
        }
      }
    },
    to: {
      type: "object",
      title: "Servo To",
      properties: {
        enable:{
          type: "boolean",
          title: "enable to",
          required: false
        },
        value: {
          type: "number",
          required: false
        }
      }
    },
    sweep: {
      type: "object",
      title: "Servo Sweep",
      properties: {
        enable:{
          type: "boolean",
          title: "enable sweep",
          required: false
        },
        min: {
          type: "number",
          required: false
        },
        max: {
          type: "number",
          required: false
        },
        interval: {
          type: "number",
          required: false
        },
        step: {
          type: "number",
          required: false
        }
      }
    }
  }
};

var conn = meshblu.createConnection({
  "uuid": meshbluJSON.uuid,
  "token": meshbluJSON.token,
  "server": "meshblu.octoblu.com", // optional- defaults to ws://meshblu.octoblu.com
  "port": 80  // optional- defaults to 80
});

conn.on("notReady", function(data) {
  console.log('UUID FAILED AUTHENTICATION!');
  console.log('not ready', data);

  // Register a device
  conn.register({
    "type": "rpi-servo"
  }, function (data) {
    console.log('registered device', data);
    meshbluJSON.uuid = data.uuid;
    meshbluJSON.token = data.token;
    fs.writeFile('meshblu.json', JSON.stringify(meshbluJSON), function(err) {
      if(err) return;
    });

  // Login to SkyNet to fire onready event
  conn.authenticate({
    "uuid": data.uuid,
    "token": data.token
    }, function (data) {
      console.log('authenticating', data);
    });
  });
});

// Wait for connection to be ready to send/receive messages
conn.on('ready', function(data) {
  console.log('ready event', data);

  conn.update({
    "uuid": meshbluJSON.uuid,
    "token": meshbluJSON.token,
    "messageSchema": MESSAGE_SCHEMA
  });

// Initialize johnny five board
// and specify that it's using raspi-io
  var board = new five.Board({
    io: new raspi()
  });

// Wait for the board to be ready for message passing
// board-specific code
  board.on('ready', function() {
    // Initialize servos on pin 1 & 24 (Physical pins 12 and 34, respectively)
    // https://github.com/bryan-m-hughes/raspi-io/wiki
    var p0 = new five.Led(0);
    var p2 = new five.Led(2);
    var p3 = new five.Led(3);
    var p7 = new five.Led(7);
    var p8 = new five.Led(8);
    var p9 = new five.Led(9);
    var servo = new five.Servo(1);
    var servo2 = new five.Servo(24);




    this.pinMode(12, five.Pin.INPUT);
    this.pinMode(13, five.Pin.INPUT);
    this.pinMode(14, five.Pin.INPUT);
    this.pinMode(4, five.Pin.INPUT);
    this.pinMode(5, five.Pin.INPUT);
    this.pinMode(21, five.Pin.INPUT);

    // Handles incoming Octoblu messages
    conn.on('message', function(data) {
     console.log('message received');
     console.log(data);

     // Let's extract the payload
     var payload = data.payload;

    /* Manipulate the servos based on the message passed
       from an Octoblu/Meshblu generic device node
       example:
      {
        "servo": "PWM0",
        "value": 180
      }
    */
    //checks the pin number from 'enum' in peripheral.digital, then sends it high or low
    if(payload.digitalWrite.enable){
      switch(payload.peripheral.digital){
        case "11":
          if(payload.digitalWrite.state == "high"){
            p0.on();
          }else{
            p0.off();
          }
          break;
        case "13":
          if(payload.digitalWrite.state == "high"){
            p2.on();
          }else{
            p2.off();
          }
          break;
        case "15":
          if(payload.digitalWrite.state == "high"){
            p3.on();
          }else{
            p3.off();
          }
          break;
        case "7":
          if(payload.digitalWrite.state == "high"){
            p7.on();
          }else{
            p7.off();
          }
          break;
        case "3":
          if(payload.digitalWrite.state == "high"){
            p8.on();
          }else{
            p8.off();
          }
          break;
        case "5":
          if(payload.digitalWrite.state == "high"){
            p9.on();
          }else{
            p9.off();
          }
          break;
      }
    }
    //checking if the enable is set for JUST the 'to' function, then sends it values
    if(payload.to.enable && !payload.sweep.enable){
       if(payload.peripheral.servo == "PWM0"){
         servo.stop();
         servo.to(payload.to.value);
       } else if(payload.peripheral.servo == "PWM1") {
         servo2.stop();
         servo2.to(payload.to.value);
       }
    //checking if the enable is set for JUST the 'sweep' function, then sends it values
    } else if(payload.sweep.enable && !payload.to.enable){
      if(payload.peripheral.servo == "PWM0"){
        servo.sweep({
          range: [payload.sweep.min, payload.sweep.max],
          interval: payload.sweep.interval,
          step: payload.sweep.step
        });
      } else if(payload.peripheral.servo == "PWM1") {
        servo2.sweep({
          range: [payload.sweep.min, payload.sweep.max],
          interval: payload.sweep.interval,
          step: payload.sweep.step
        });
      }
    }
  }); // end Meshblu connection onMessage

// begin sensor stuff



 var v0, v1, v2, v3, v4, v5;
  this.digitalRead(12, function(value) {
    v0 = value;
  });

  this.digitalRead(13, function(value) {
    v1 = value;
  });

  this.digitalRead(14, function(value) {
    v2 = value;
  });

  this.digitalRead(4, function(value) {
    v3 = value;
  });

  this.digitalRead(5, function(value) {
    v4 = value;
  });
  this.digitalRead(21, function(value) {
    v5 = value;
  });



 setInterval(function(){



    conn.message({
      "devices": "*",
      "payload": {
        digitalread : {
        "p19": v0,
        "p21": v1,
        "p23": v2,
        "p16": v3,
        "p18": v4,
        "p29": v5 }
      }
    });

  },400);

//end sensor stuff
 }); // end johnny-five board onReady
}); // end Meshblu connection onReady
