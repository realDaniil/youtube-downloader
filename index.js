import TelegramApi from 'node-telegram-bot-api'
import ytdl from 'ytdl-core'
import fs from 'fs'

const token = '6111868599:AAHUEv4-qUvSKb-QMO8zqpDJgFLdgfcpYUw'
const bot = new TelegramApi(token, { polling: true })
const gameOptions = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{ text: 'Видео 📹', callback_data: 'video' }, { text: 'Аудио 🔊', callback_data: 'audio' }]
    ]
  })
}

bot.setMyCommands([
  { command: '/start', description: 'Начало' },
])

const start = () => {
  let videoUrl
  bot.on('message', async msg => {
    const text = msg.text
    const chatId = msg.chat.id
    if (text === '/start') {
      return bot.sendMessage(chatId, `Привет, ${msg.from.first_name}👋

Отправь мне ссылку из YouTube и я скачаю видео или аудио!
      `)
    }
    if (ytdl.validateURL(text)) {
      videoUrl = text
      bot.sendMessage(chatId, 'Выберите тип файла:', gameOptions)
    } else {
      bot.sendMessage(chatId, 'Скиньте пожалуйста ссылку на ютуб видео')
    }
  })

  bot.on('callback_query', async msg => {
    const data = msg.data
    const chatId = msg.message.chat.id
    const videoInfo = await ytdl.getInfo(videoUrl)
    const fileName = videoInfo.videoDetails.title
    bot.deleteMessage(chatId, msg.message.message_id)
    const loadingMsg = await bot.sendMessage(chatId, 'Загрузка файла началась...')
    if (data === 'video') {
      const videoStream = ytdl(videoUrl, { filter: 'video', quality: 'lowest'})
      videoStream.pipe(fs.createWriteStream(fileName))
      videoStream.on('end', () => {
        bot.sendVideo(chatId, fileName).then(() => {
          fs.unlink(fileName, (err) => {
            if (err) console.error(err)
          })
          bot.deleteMessage(chatId, loadingMsg.message_id)
        })
      })
    } else if (data === 'audio') {
      const audioStream = ytdl(videoUrl, { filter: 'audio', quality: 'lowest' })
      audioStream.pipe(fs.createWriteStream(fileName))
      audioStream.on('end', () => {
        bot.sendAudio(chatId, fileName).then(() => {
          fs.unlink(fileName, (err) => {
            if (err) console.error(err)
          })
          bot.deleteMessage(chatId, loadingMsg.message_id)
        })
      })
    } else {
      bot.sendMessage(chatId, 'Не удалось получить ссылку на видео или аудио.')
    }
  })
  
  
}

start()