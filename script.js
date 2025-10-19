// Script.js

// Elementos DOM
const container = document.querySelector('.form-container');
const registerBtn = document.querySelector('.register-btn');
const loginBtn = document.querySelector('.login-btn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const messageDiv = document.getElementById('message');
const toggleLoginPassword = document.getElementById('toggleLoginPassword');
const toggleRegisterPassword = document.getElementById('toggleRegisterPassword');
const loginPassword = document.getElementById('loginPassword');
const registerPassword = document.getElementById('registerPassword');
const confirmPassword = document.getElementById('confirmPassword');
const passwordStrength = document.getElementById('passwordStrength');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');

// Estado da aplicação
let currentUser = null;
const API_BASE_URL = 'http://localhost:3000/api';

// Limpar dados de autenticação ao carregar a página
window.addEventListener('load', () => {
    // Remover token e dados do usuário do localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    currentUser = null;
    
    // Limpar formulários
    loginForm.reset();
    registerForm.reset();
    passwordStrength.className = 'password-strength';
    
    showMessage('Faça login para acessar sua conta', 'success');
});

// Alternar entre login e registro
registerBtn.addEventListener('click', () => {
    container.classList.add('active');
    showMessage('Preencha os dados para criar sua conta', 'success');
});

loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
    showMessage('Faça login para acessar sua conta', 'success');
});

// Mostrar/ocultar senha
toggleLoginPassword.addEventListener('click', () => {
    togglePasswordVisibility(loginPassword, toggleLoginPassword);
});

toggleRegisterPassword.addEventListener('click', () => {
    togglePasswordVisibility(registerPassword, toggleRegisterPassword);
});

function togglePasswordVisibility(passwordField, toggleButton) {
    const icon = toggleButton.querySelector('i');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        icon.classList.replace('bx-hide', 'bx-show');
    } else {
        passwordField.type = 'password';
        icon.classList.replace('bx-show', 'bx-hide');
    }
}

// Verificar força da senha
registerPassword.addEventListener('input', () => {
    checkPasswordStrength(registerPassword.value);
});

function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    passwordStrength.className = 'password-strength';
    if (password.length > 0) {
        if (strength < 2) {
            passwordStrength.classList.add('strength-weak');
        } else if (strength < 4) {
            passwordStrength.classList.add('strength-medium');
        } else {
            passwordStrength.classList.add('strength-strong');
        }
    }
}

// Validação de formulários
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleLogin();
});

registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleRegister();
});

// Função de login atualizada para usar a API
async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        showMessage('Por favor, preencha todos os campos', 'error');
        shakeElement(loginForm);
        return;
    }
    
    loginButton.disabled = true;
    loginButton.textContent = 'Entrando...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            
            // Salvar token e dados do usuário (apenas para a sessão atual)
            // Não usaremos localStorage para persistência entre sessões
            sessionStorage.setItem('token', data.token);
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            currentUser = data.user;
            
            // Redirecionar para a URL externa especificada
            setTimeout(() => {
                window.location.href = data.redirectUrl || 'https://corder03.github.io/Golira/';
            }, 1500);
            
        } else {
            showMessage(data.message, 'error');
            shakeElement(loginForm);
            loginButton.disabled = false;
            loginButton.textContent = 'Login';
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        showMessage('Erro de conexão com o servidor', 'error');
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

// Função de registro atualizada para usar a API
async function handleRegister() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (!username || !email || !password || !confirm) {
        showMessage('Por favor, preencha todos os campos', 'error');
        shakeElement(registerForm);
        return;
    }
    
    if (password !== confirm) {
        showMessage('As senhas não coincidem', 'error');
        shakeElement(registerForm);
        return;
    }
    
    if (password.length < 6) {
        showMessage('A senha deve ter pelo menos 6 caracteres', 'error');
        shakeElement(registerForm);
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage('Por favor, insira um email válido', 'error');
        shakeElement(registerForm);
        return;
    }
    
    registerButton.disabled = true;
    registerButton.textContent = 'Registrando...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showMessage(data.message, 'success');
            
            // Alternar para o formulário de login após registro
            setTimeout(() => {
                container.classList.remove('active');
                registerForm.reset();
                passwordStrength.className = 'password-strength';
                registerButton.disabled = false;
                registerButton.textContent = 'Registrar';
            }, 2000);
            
        } else {
            showMessage(data.message, 'error');
            shakeElement(registerForm);
            registerButton.disabled = false;
            registerButton.textContent = 'Registrar';
        }
        
    } catch (error) {
        console.error('Erro no registro:', error);
        showMessage('Erro de conexão com o servidor', 'error');
        registerButton.disabled = false;
        registerButton.textContent = 'Registrar';
    }
}

// Recuperação de senha (simplificada)
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = prompt('Digite seu email para recuperar a senha:');
    
    if (email) {
        showMessage(`Instruções de recuperação enviadas para ${email}`, 'success');
    }
});

// Função para mostrar mensagens
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.opacity = '1';
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
    }, 3000);
}

// Função para animação de shake (erro)
function shakeElement(element) {
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        element.style.animation = '';
    }, 500);
}

// Validação em tempo real
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
        validateField(input);
    });
    
    input.addEventListener('input', () => {
        input.classList.remove('error', 'success');
    });
});

function validateField(field) {
    if (field.value.trim() === '') {
        field.classList.add('error');
        return false;
    } else {
        if (field.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value.trim())) {
                field.classList.add('error');
                return false;
            }
        }
        
        if (field.id === 'confirmPassword' && field.value !== registerPassword.value) {
            field.classList.add('error');
            return false;
        }
        
        field.classList.add('success');
        return true;
    }
}

// Prevenir envio do formulário ao pressionar Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const activeForm = container.classList.contains('active') ? registerForm : loginForm;
        if (activeForm.contains(document.activeElement)) {
            e.preventDefault();
            if (activeForm === loginForm) {
                handleLogin();
            } else {
                handleRegister();
            }
        }
    }
});