var five = require("johnny-five");
var mqtt = require("mqtt");

var intervalSensors = 3 * (60 * 1000);
var inTopics = 'Armario/Relay/#';

var soilPin = "a1";
var relayPins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
var relays = {};
var buttonPins = [12, 13];
var buttons = {};


myBoard = new five.Board();
myBoard.on("ready", function () {

    var soil = new five.Sensor(soilPin);

    var dht22 = new five.Multi({
        controller: "DHT22_I2C_NANO_BACKPACK",
        pin: 11,
    });

    buttonPins.forEach(pinNumber => {
        buttons[pinNumber] = five.Button(pinNumber);
    });

    relayPins.forEach(pinNumber => {
        relays[pinNumber] = five.Relay(pinNumber);
    });

    var options = { host: "localhost", port: "1883" };

    var client = mqtt.connect(options);
    client.on('connect', function () {
        client.subscribe(inTopics);
        informarSensores();
        setInterval(informarSensores, intervalSensors);
    });

    const events = ["hold", "press", "up"];
    for (const key in buttons) {
        const button = buttons[key];
        events.forEach(event => {
            button.on(event, () => {
                client.publish("Armario/Boton/" + event + "/" + this.pin, this.downValue);
            });
        });
    }

    client.on('message', (topic, payload) => {
        if (topic.startsWith("Armario/Relay/")) {
            let pinNumber = topic.split("/")[2];
            
            if (!relays.hasOwnPropery(pinNumber)){
                return;
            }
            
            if (payload == "1"){
                relays[pinNumber].on();
            } else {
                relays[pinNumber].off();
            }
        }

    });
    function informarSensores() {
        client.publish("Armario/Temperatura", dht22.thermometer.celsius);
        client.publish("Armario/Humedad", dht22.hygrometer.relativeHumidity);
        client.publish("Armario/HumedadSuelo", soil.value);
    }

});
