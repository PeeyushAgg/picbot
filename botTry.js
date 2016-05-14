var restify = require('restify');
var builder = require('botbuilder');
var request = require("request")
//create a bot
var bot = new builder.BotConnectorBot({appId: "picBot", appSecret: "123456", groupWelcomeMessage: "Welcome! Say hi!", userWelcomeMessage: "welcome new user! Say hi"});

var luis_base = "https://api.projectoxford.ai/luis/v1/application?id=3b88a8d3-89eb-47dc-80ae-255d10079430&subscription-key=abb33f41644e4bb99c5f4bca3438185b&q="
var bing_image_api = "https://bingapis.azure-api.net/api/v5/images/search?q=obama&count=10&offset=0&mkt=en-in&safeSearch=Moderate"
bot.add('/', new builder.CommandDialog()

    .matches("^look", builder.DialogAction.beginDialog("/look"))
    .matches("^reg", builder.DialogAction.beginDialog("/profile"))
    .matches("^quit", builder.DialogAction.endDialog())
    .onDefault(function (session) {

        if (!session.userData.name) {

            session.beginDialog("/profile");
        } else {

            session.send("Hello %s!", session.userData.name);
        }
    }
));

bot.add("/profile", [

    function (session) {

        builder.Prompts.text(session, "Hi! What is your name?");
    },

    function (session, results) {

        session.userData.name = results.response;
        session.beginDialog("/");
    }
]);

bot.add("/look", [

    function (session) {

        builder.Prompts.text(session, "What would you like to look for?");
                       },

    function (session, results){

        sentence = results.response;
        
        request(luis_base + sentence, function (error, response, body) {
            if (!error && response.statusCode == 200) {
            var content = JSON.parse(body);
            console.log(content);
            if (content["intents"][0]["intent"] === "GetImages")
            {
                if(content["entities"].length > 0){
                console.log(content["entities"][0]["entity"]);
                
                var options = {
                     host: 'https://bingapis.azure-api.net',
                     url: 'https://bingapis.azure-api.net/api/v5/images/search?q='+content["entities"][0]["entity"]+"&count=10&offset=0&mkt=en-in&safeSearch=Moderate",
                     method: 'GET',
                     headers: { "Ocp-Apim-Subscription-Key": "933b318b20b344bf880f548753de184e"},
                     
                            };
                
                
                
                
                    request(options, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                        var result = JSON.parse(body);
                        console.log(result);
                        var name = [];
                        var url = [];
                        var results = "";
                        for (var i = 0; i<10 ; i++)
                            {
                                name[i] = result["value"][i]["name"];
                                url[i] = result["value"][i]["contentUrl"];
                            }
                        
                        for (var i = 0; i<10 ; i++)
                            {
                                results += i+1 +". "+name[i] + ": " + url[i] + "\n";
                            }
                        session.send(results);
                        
                        
                        }
                        else{console.log(error);}
                        
                        })}
                
                else{
                    
                    
                    session.send("No entities detected");
                }
            }
             
        else {
            session.send("I have no idea what you said");
        }
        }
        
        session.endDialog();
    })
    }]);


//setup the restify server
var server = restify.createServer();
server.post('api/messages', bot.verifyBotFramework(), bot.listen());
server.listen(process.env.port || 3978, function () {

    console.log('%s listening to %s', server.name, server.url);
    })