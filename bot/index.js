import { Telegraf } from 'telegraf';
import {} from 'dotenv/config';
import fetch from 'node-fetch';
import schedule from 'node-schedule';
import express from 'express';
import { EMOJI } from './emoji.js';
const expressApp = express();
const bot = new Telegraf(process.env.ACCESS_TOKEN);
const URL_GIF = `https://api.giphy.com/v1/gifs/search?q=love&api_key=${process.env.GIF_TOKEN}`;
const URL_LOVE_QUOTE = 'https://api.paperquotes.com/apiv1/quotes/?tags=love,life';
let job;

const port = process.env.PORT || 3000

expressApp.listen(port, () => console.log(`Listening on port ${port}`));

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

bot.settings(async (ctx) => {
    await ctx.setMyCommands([
        {
            command: '/break',
            description: 'Stop send gif and quotes'
        },
        {
            command: '/who',
            description: 'Info about user'
        },
        {
            command: '/cat',
            description: 'Get photo random cat'
        },
    ])
})

const sendOptionsKeyboard = async (ctx, bot, questionMessage) => {
    await bot.telegram.sendMessage(ctx.chat.id, questionMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Yes 😘', callback_data: 'yes' },
                    { text: 'No', callback_data: 'no' },
                    { text: 'Cat!', callback_data: 'cat' },
                ]
            ],
        },
    })
}

function run(message) {
    const rule = new schedule.RecurrenceRule();
    rule.hour = parseInt(process.env.HOUR);
    rule.minute = parseInt(process.env.MINUTE);
    rule.tz = 'Europe/Minsk';
    findLoveGif(message);
    job = schedule.scheduleJob(rule, function() {
        findLoveGif(message)
    });
    console.log('scheduled', job)
}

async function findLoveGif(message) {
    message.reply(`Good morning ${EMOJI[getRandomIntInclusive(0, EMOJI.length)]}`)
    const response = await fetch(URL_GIF);
    const data = await response.json();
    if (data.meta.status === 200) {
        try {
            await message.replyWithVideo(data.data[getRandomIntInclusive(0, data.data.length)].images.downsized_medium.url)
        } catch (error) {
            await message.reply('Not found gif 🙄');
        }
        try {
            await findLoveQuote(message)
        } catch (error) {
            await message.reply('Not found phrase 🙄');
        }
        try {
            await sendOptionsKeyboard(message, bot, 'Did you like the gif? 😀')
        } catch (error) {
            await message.reply('Keyboard failure 🙄');
        }
    } else {
        await message.reply('Some problems 🤮');
    }
}

async function findLoveQuote(message) {
    const response = await fetch(URL_LOVE_QUOTE, {
        headers: {
            Authorization: `Token ${process.env.PAPER_TOKEN}`
        }
    });
    const data = await response.json();
    await message.reply(data.results[getRandomIntInclusive(0, data.results.length)].quote)
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

bot.command('break', message => {
    if (job) {
        job.cancel()
        message.reply('Bot stoped 🤐')
    }
});

bot.command("who", (ctx) => {
    const { id, username, first_name, last_name } = ctx.from;
    return ctx.replyWithMarkdown(`Who?:
*Id* : ${id}
*Username* : ${username}
*First Name* : ${first_name}
*Last Name* : ${last_name}
*Chat Id* : ${ctx.chat.id}`);
});

bot.command("cat", async (ctx) => {
    await findCat(ctx)
});

async function findCat(ctx) {
    const response = await fetch("https://aws.random.cat/meow");
    try {
        if (response.status === 200) {
            const data = await response.json();
            return ctx.replyWithPhoto(data.file);
        } else {
            return ctx.reply('The server is overloaded. Try again');
        }
    } catch (error) {
        console.error(error)
    }
}

bot.start((ctx) => {
    run(ctx);
})

bot.on("text", (ctx) => {
    return ctx.reply(`${ctx.message.text} not supported 😔`);
});

bot.on('callback_query', async (ctx) => {
    if (ctx.callbackQuery.data === 'yes') {
        ctx.reply('Have a good day 💜');
    } else if (ctx.callbackQuery.data === 'no') {
        await findLoveGif(ctx)
    } else if (ctx.callbackQuery.data === 'cat') {
        await findCat(ctx)
    } else {
        console.log('callback_query error')
    }
});

bot.help((ctx) => ctx.reply("Help in progress"));

bot.launch();