function showTab(tab) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const buttons = document.querySelectorAll('.tab-btn');

    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    buttons.forEach(btn => btn.classList.remove('active'));

    if (tab === 'login') {
        loginForm.style.display = 'block';
        buttons[0].classList.add('active');
    } else {
        signupForm.style.display = 'block';
        buttons[1].classList.add('active');
    }
}

async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    const email = username + "@ecoaudit.com";

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (error) {
        document.getElementById('auth-message').textContent = "Invalid username or password.";
    } else {
        // Redirect admin to admin panel, others to dashboard
        if (username === 'ecoadmin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

async function signup() {
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;

    // Create fake email from username behind the scenes
    const email = username + "@ecoaudit.com";

    const { error } = await db.auth.signUp({
        email,
        password,
        options: {
            data: { username }
        }
    });

    if (error) {
        document.getElementById('auth-message').textContent = error.message;
    } else {
        document.getElementById('auth-message').textContent = 
            "Account created! You can now login.";
    }
}
