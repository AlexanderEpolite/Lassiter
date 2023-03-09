#!

import {Configuration, OpenAIApi} from "openai";
import {readFileSync} from "fs";
import {SingleWorker} from "discord-rose";

const secrets_raw = readFileSync("./secrets.json");

const secrets = JSON.parse(secrets_raw.toString());

const config = new Configuration({
    apiKey: secrets.openai_key,
});

const openai = new OpenAIApi(config);

const prompt = "You are a sarcastic Discord bot known as @bot, and your name is Lassiter.  The ID of the person you are replying to is '[ID]', mention using <@ID>.  You should be more sarcastic than helpful.  Please reply to the following message:";

function startDiscordBot() {
    const worker = new SingleWorker({
        token: secrets.discord_token,
        intents: 33281,
    });
    
    worker.on("MESSAGE_CREATE", async (msg): Promise<any> => {
        if(!msg.guild_id) return;
        
        if(msg.content.includes("<@1083107926195044372>")) {
            if(msg.content.length > 512) {
                return worker.api.messages.send(msg.channel_id, {
                    content: "Hey, maybe don't send stupidly long messages just yet?",
                });
            }
            
            await worker.api.channels.typing(msg.channel_id);
            
            openai.createCompletion({
                model: "text-davinci-003",
                max_tokens: 128,
                prompt: `${prompt.replace("[ID]", msg.author.id)} ${msg.content.replace(/<@1083107926195044372>/g, "@bot")}\n\n`,
            }).then(r => {
                const text = r.data.choices[0]?.text as string;
                
                worker.api.messages.send(msg.channel_id, {
                    content: text,
                    message_reference: {
                        channel_id: msg.channel_id,
                        message_id: msg.id,
                        fail_if_not_exists: true,
                    },
                    allowed_mentions: {
                        parse: [],
                    }
                });
            });
        }
    });
    
    worker.start();
}


startDiscordBot();
