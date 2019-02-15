var five = require("johnny-five");
var mqtt = require("mqtt");

var intervalSensors  = 3 * (60*1000); 
var inTopics = 'Armario/Relays/#';
var responseTopic = 'response_to_client';
var relayPins = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
var relays = [];

myBoard = new five.Board();
myBoard.on("ready", function () {


    var soil = new five.Sensor("a1");
    
    var dht22 = new five.Multi({
        controller: "DHT22_I2C_NANO_BACKPACK",
        pin: 11,
    });
    
    relayPins.forEach(pinNumber => {
        relays[pinNumber] = five.Relay(pinNumber);
    });

    var options = { host: "localhost", port: "1883" };

    var client = mqtt.connect(options);
    client.on('connect', function () {
        client.subscribe(inTopics);

        setInterval(informarSensores, intervalSensors);
    });



    client.on('message', (topic, payload) => {
        //'Armario/Relays/#';
        let pinNumber = parseInt(topic.split("/")[2]);
        if (!relays[pinNumber])
            return;

        var message = payload.toString();

        if (message === "1")
            relays[pinNumber].open();
        else if (message === "0")
            relays[pinNumber].close();
    });

    function informarSensores{
        client.publish("Armario/Temperatura",dht22.thermometer.celsius);
        client.publish("Armario/Humedad",dht22.hygrometer.relativeHumidity);
        client.publish("Armario/HumedadSuelo",soil.value);
    }
});
