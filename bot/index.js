import { Telegraf } from 'telegraf';
import dotenv from 'dotenv'
import fetch from 'node-fetch';
import schedule from "node-schedule";
dotenv.config()
const bot = new Telegraf(process.env.ACCESS_TOKEN);
let job;
const URL_GIF = 'https://api.giphy.com/v1/gifs/search?q=love&api_key=v1yeUoD3hXAnRRnc6ywNAJzZ1tKC4fei';
const URL_QUOTE = 'https://favqs.com/api/qotd';

const sendOptionsKeyboard = (ctx, bot, questionMessage) => {
    bot.telegram.sendMessage(ctx.chat.id, questionMessage, {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Да 😘', callback_data: 'yes' },
                    { text: 'Нет, еще', callback_data: 'no' },
                ]
            ],
        },
    })
}

bot.command( 'war', async message => {
    job = schedule.scheduleJob('* * * * * *', async () => {
        await findLoveGif(message);
    });
});

async function findLoveGif(message) {
    message.reply('Loading...🤔')
    const response = await fetch(URL_GIF);
    const data = await response.json();
    job.cancel()
    if (data.meta.status === 200) {
        try {
            await message.replyWithVideo(data.data[getRandomIntInclusive(0, data.data.length)].images.downsized_medium.url)
            sendOptionsKeyboard(message, bot, 'Понравилась гифка? 😀')
        } catch (error) {
            await message.reply('Не нашел гифки 🙄');
        }
    } else {
        await message.reply('Some problems 🤮');
    }
}

bot.on('callback_query', async (ctx) => {
    if (ctx.callbackQuery.data === 'yes') {
        console.log('ok')
    } else if (ctx.callbackQuery.data === 'no') {
        await findLoveGif(ctx)
    } else {

    }
});


function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

bot.command('break', message => {
    if (job) {
        job.cancel()
    }
});

// const job = cron.schedule("* * * * * *", run, {
//     scheduled: false,
//     timezone: "Europe/Moscow"
// });
//
// job.start();

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
    const response = await fetch("https://aws.random.cat/meow");
    //const data = await response.json();
    console.log('json', response)
    //return ctx.replyWithPhoto(json.file);
});

// Обработчик простого текста
bot.on("text", (ctx) => {
    return ctx.reply(ctx.message.text);
});

bot.help((ctx) => ctx.reply("Справка в процессе"));

bot.launch();