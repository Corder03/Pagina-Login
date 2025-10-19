const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Conexão com MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/auth_system'; // Altere para sua URL do MongoDB

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('✅ Conectado ao MongoDB');
})
.catch((error) => {
    console.error('❌ Erro ao conectar com MongoDB:', error);
    process.exit(1);
});

// Schema do Usuário
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Model do Usuário
const User = mongoose.model('User', userSchema);

// Rota principal - Serve o HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota para dashboard - REDIRECIONAMENTO CORRETO
app.get('/dashboard', (req, res) => {
    res.redirect(302, 'https://corder03.github.io/Golira/');
});

// API Routes - LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('📥 Tentativa de login:', username);
        
        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username e password são obrigatórios' 
            });
        }
        
        // Buscar usuário no MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }
        
        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Senha inválida' 
            });
        }
        
        // Gerar token
        const token = jwt.sign(
            { userId: user._id, username: user.username }, 
            'SEGREDO_JWT_SECRETO', 
            { expiresIn: '24h' }
        );
        
        console.log('✅ Login bem-sucedido:', username);
        
        res.json({
            success: true,
            message: `Bem-vindo de volta, ${username}!`,
            redirectUrl: 'https://corder03.github.io/Golira/', // URL direta do dashboard
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email 
            },
            token
        });
        
    } catch (error) {
        console.error('❌ Erro no login:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// API Routes - REGISTRO
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        console.log('📥 Tentativa de registro:', username, email);
        
        // Validações
        if (!username || !email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Todos os campos são obrigatórios' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'A senha deve ter pelo menos 6 caracteres' 
            });
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Por favor, insira um email válido' 
            });
        }
        
        // Verificar se usuário já existe no MongoDB
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'Usuário ou email já cadastrado' 
            });
        }
        
        // Criptografar senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Criar usuário no MongoDB
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });
        
        await newUser.save();
        console.log('✅ Usuário registrado:', username);
        
        // Gerar token automaticamente
        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username }, 
            'SEGREDO_JWT_SECRETO', 
            { expiresIn: '24h' }
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Conta criada com sucesso!',
            redirectUrl: 'https://corder03.github.io/Golira/', // URL direta do dashboard
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email
            },
            token
        });
        
    } catch (error) {
        console.error('❌ Erro no registro:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token de acesso necessário' 
        });
    }

    jwt.verify(token, 'SEGREDO_JWT_SECRETO', (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Token inválido' 
            });
        }
        req.user = user;
        next();
    });
};

// Rota protegida - Perfil do usuário
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Usuário não encontrado' 
            });
        }
        
        res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno do servidor' 
        });
    }
});

// Rota para verificar saúde da API
app.get('/api/health', async (req, res) => {
    try {
        const usersCount = await User.countDocuments();
        res.json({ 
            success: true, 
            message: 'API está funcionando!',
            database: 'MongoDB',
            usersCount,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao conectar com o banco de dados' 
        });
    }
});

// Rota para listar usuários (apenas para debug)
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json({ 
            success: true, 
            users 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao buscar usuários' 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/users`);
    console.log(`🗄️  Conectando ao MongoDB: ${MONGODB_URI}`);
});