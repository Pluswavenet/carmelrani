// Login Logic
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('login-error');
const submitBtn = loginForm.querySelector('.submit-btn');

// Check if already logged in
auth.onAuthStateChanged(user => {
    if (user) {
        window.location.href = 'admin.html';
    }
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) return;

    // Loading state
    submitBtn.disabled = true;
    submitBtn.textContent = "Verifying...";
    errorMsg.classList.add('hidden');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Success - Redirect happens automatically via listener
            submitBtn.textContent = "Success!";
            window.location.href = 'admin.html';
        })
        .catch((error) => {
            console.error("Login failed:", error);
            submitBtn.disabled = false;
            submitBtn.textContent = "Sign In";

            // Show error
            errorMsg.textContent = getFriendlyErrorMessage(error.code);
            errorMsg.classList.remove('hidden');
        });
});

function getFriendlyErrorMessage(code) {
    switch (code) {
        case 'auth/invalid-credential':
            return "Incorrect email or password.";
        case 'auth/user-not-found':
            return "No admin account found with this email.";
        case 'auth/wrong-password':
            return "Incorrect password.";
        case 'auth/too-many-requests':
            return "Too many failed attempts. Please try again later.";
        default:
            return "Login failed. Please check your connection.";
    }
}
