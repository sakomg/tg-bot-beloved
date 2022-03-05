import { Telegraf } from 'telegraf';
import dotenv from 'dotenv'
import fetch from 'node-fetch';
dotenv.config()
const bot = new Telegraf("5140473444:AAE1MYt254Wwc2Tvf-jOmzIYn1Ddf5SGB-k");

// Обработчик начала диалога с ботом
bot.start((ctx) =>
    ctx.reply(
        `Приветствую, ${
            ctx.from.first_name ? ctx.from.first_name : "хороший человек"
        }! Набери /help и увидишь, что я могу.`
    )
);

// Обработчик команды /help
bot.help((ctx) => ctx.reply("Справка в процессе"));

// Обработчик команды /whoami
bot.command("whoami", (ctx) => {
    const { id, username, first_name, last_name } = ctx.from;
    return ctx.replyWithMarkdown(`Кто ты в телеграмме:
*id* : ${id}
*username* : ${username}
*Имя* : ${first_name}
*Фамилия* : ${last_name}
*chatId* : ${ctx.chat.id}`);
});

bot.command("photo", async (ctx) => {
    const response = await fetch("https://aws.random.cat/meow");
    const data = await response.json();
    return ctx.replyWithPhoto(data.file);
});

// Обработчик простого текста
bot.on("text", (ctx) => {
    return ctx.reply(ctx.message.text);
});

// Запуск бота
bot.launch();