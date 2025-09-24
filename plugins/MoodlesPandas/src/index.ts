import { logger } from "@vendetta";
import commands from "@vendetta/commands"
import Settings from "./Settings";
import { findByProps, findByStoreName } from '@vendetta/metro';


let unregisterCommand;

const UserStore = findByStoreName('UserStore');



export default {
    onLoad: () => {
        unregisterCommand = commands.registerCommand({
            name: "redpanda",
            displayName: "Red Panda",
            displayDescription: "send random red panda",
            description: "random panda",
            options: [{
                name: "user",
                description: "The user(or their id) to be mentioned",
                type: 6, // USER type
                required: false,
                displayName: "user",
                displayDescription: "The user(or their id) to be mentioned"
            }],
            execute: executeCommand,
            applicationId: "-1",
            inputType: 1,
            type: 1
        });

        async function fetchPanda() {
            const response = await fetch(`https://redpanda.bwlok.dev/random`);
            return await response.json();
        }

        async function executeCommand(args, context) {
            let message = "";
            if (args.length > 0) {
                message = `<@${await UserStore.getUser(args[0].value).id}>\n`
            }
            const petpetResult = await fetchPanda();
            return { content: message.concat(petpetResult.url) };
        }

    },
    onUnload: () => {
        unregisterCommand();
    }//,
    //settings: Settings,
}