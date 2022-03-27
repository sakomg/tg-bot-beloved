import { Telegraf } from 'telegraf'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import schedule from 'node-schedule'
import express from 'express'
import { EMOJI } from './emoji.js'
const expressApp = express()
dotenv.config()
const bot = new Telegraf(process.env.ACCESS_TOKEN)
const URL_GIF = `https://api.giphy.com/v1/gifs/search?q=love&api_key=${process.env.GIF_TOKEN}`
const URL_LOVE_QUOTE = 'https://api.paperquotes.com/apiv1/quotes/?tags=love,life'
let job

const port = process.env.PORT || 3000
expressApp.get('/', (req, res) => {
    res.send('Hello World!')
})
expressApp.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

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
        {
            command: '/process',
            description: 'Just only process'
        },
        {
            command: '/run',
            description: 'Start send gif and quotes'
        },
    ])
})

bot.start((ctx) => ctx.reply('Welcome'))

const sendOptionsKeyboard = async (ctx, bot, questionMessage) => {
    await bot.telegram.sendMessage(ctx.chat.id, questionMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Да 😘', callback_data: 'yes' },
                    { text: 'Нет, еще', callback_data: 'no' },
                    { text: 'Кота!', callback_data: 'cat' },
                ]
            ],
        },
    })
}

bot.command( 'run', async message => {
    message.reply(`Бот запущен!`);
    const rule = new schedule.RecurrenceRule()
    settingRule(rule)
    job = schedule.scheduleJob(rule, async () => {
        await findLoveGif(message)
    })
})

function settingRule(rule) {
    rule.hour = process.env.HOUR
    rule.minute = process.env.MINUTE
    rule.tz = 'Etc/UTC';
}

bot.command('process', async message => {
    await findLoveGif(message)
})

async function findLoveGif(message) {
    message.reply(`Доброе утро ${EMOJI[getRandomIntInclusive(0, EMOJI.length)]}`)
    const response = await fetch(URL_GIF);
    const data = await response.json();
    if (data.meta.status === 200) {
        try {
            await message.replyWithVideo(data.data[getRandomIntInclusive(0, data.data.length)].images.downsized_medium.url)
        } catch (error) {
            await message.reply('Не нашел гифки 🙄');
        }
        try {
            await findLoveQuote(message)
        } catch (error) {
            await message.reply('Не нашел фразы 🙄');
        }
        try {
            await sendOptionsKeyboard(message, bot, 'Понравилась гифка? 😀')
        } catch (error) {
            await message.reply('Кнопки гг 🙄');
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
        message.reply('Бот остановлен 🤐')
    }
});

bot.command("who", (ctx) => {
    const { id, username, first_name, last_name } = ctx.from;
    return ctx.replyWithMarkdown(`Кто ты в телеграмме:
*id* : ${id}
*username* : ${username}
*Имя* : ${first_name}
*Фамилия* : ${last_name}
*chatId* : ${ctx.chat.id}`);
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
            return ctx.reply('Сервер перегружен. Пробуй еще');
        }
    } catch (error) {
        console.error(error)
    }
}

bot.on("text", (ctx) => {
    return ctx.reply(`${ctx.message.text} не поддерживается 😔`);
});

bot.on('callback_query', async (ctx) => {
    if (ctx.callbackQuery.data === 'yes') {
        ctx.reply('Хорошего дня 💜');
    } else if (ctx.callbackQuery.data === 'no') {
        await findLoveGif(ctx)
    } else if (ctx.callbackQuery.data === 'cat') {
        await findCat(ctx)
    } else {
        console.log('callback_query error')
    }
});

bot.help((ctx) => ctx.reply("Справка в процессе"));

bot.launch();