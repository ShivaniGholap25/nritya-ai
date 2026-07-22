document.addEventListener("DOMContentLoaded", () => {
    const loginPanel = document.getElementById("loginPanel");
    const adminApp = document.getElementById("adminApp");
    const loginBtn = document.getElementById("loginBtn");
    const registerBtn = document.getElementById("registerBtn");
    const forgotBtn = document.getElementById("forgotBtn");
    const logoutBtn = document.getElementById("logoutBtn");
    const loginMessage = document.getElementById("loginMessage");
    const registerMessage = document.getElementById("registerMessage");
    const forgotMessage = document.getElementById("forgotMessage");
    const roleLabel = document.getElementById("roleLabel");
    const uploadBtn = document.getElementById("uploadBtn");
    const uploadMessage = document.getElementById("uploadMessage");
    const backupMessage = document.getElementById("backupMessage");
    const booksTableBody = document.getElementById("booksTableBody");
    const analyticsList = document.getElementById("analyticsList");

    const state = {
        token: localStorage.getItem("nritya_admin_token") || "",
        role: localStorage.getItem("nritya_admin_role") || "",
    };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function escapeHtml(text) {
        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function authHeaders(extra = {}) {
        return { ...extra, Authorization: `Bearer ${state.token}` };
    }

    async function apiFetch(url, options = {}) {
        const response = await fetch(url, {
            ...options,
            headers: authHeaders(options.headers || {}),
        });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Request failed" }));
            throw new Error(error.detail || "Request failed");
        }
        return response;
    }

    function setMessage(element, text, isError = false) {
        if (!element) return;
        element.textContent = text;
        element.classList.toggle("error", isError);
    }

    function showAuthScreen(screenId) {
        document.querySelectorAll(".auth-screen").forEach((screen) => {
            screen.classList.toggle("active", screen.id === screenId);
        });
        [loginMessage, registerMessage, forgotMessage].forEach((element) => setMessage(element, ""));
    }

    function getInputValue(id) {
        return document.getElementById(id).value.trim();
    }

    function setStudentSectionVisibility() {
        const isStudent = document.getElementById("registerRole").value === "student";
        document.getElementById("studentExamSection").classList.toggle("hidden", !isStudent);
    }

    function showApp() {
        loginPanel.classList.add("hidden");
        adminApp.classList.remove("hidden");
        roleLabel.textContent = `${state.role.toUpperCase()} access`;
        document.querySelectorAll(".admin-only").forEach((element) => {
            element.disabled = state.role !== "admin";
            element.classList.toggle("hidden", state.role !== "admin");
        });
        refreshAdminData();
    }

    function showLogin() {
        adminApp.classList.add("hidden");
        loginPanel.classList.remove("hidden");
        showAuthScreen("loginScreen");
    }

    async function login() {
        const username = document.getElementById("adminUsername").value.trim();
        const password = document.getElementById("adminPassword").value;
        setMessage(loginMessage, "Signing in...");
        try {
            const response = await fetch("/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            if (!response.ok) throw new Error("Invalid username or password");
            const data = await response.json();
            state.token = data.token;
            state.role = data.role;
            localStorage.setItem("nritya_admin_token", state.token);
            localStorage.setItem("nritya_admin_role", state.role);
            localStorage.setItem("nritya_admin_username", data.username || username);
            localStorage.setItem("nritya_admin_full_name", data.full_name || data.username || username);
            setMessage(loginMessage, "");
            if (state.role === "student") {
                localStorage.setItem("nritya_student_profile", JSON.stringify(data.student_profile || {}));
                setMessage(loginMessage, "Student login successful. Opening the student app...");
                window.location.href = "/";
                return;
            }
            showApp();
        } catch (error) {
            setMessage(loginMessage, error.message, true);
        }
    }

    function validateRegistration(payload) {
        if (!payload.full_name || !payload.email || !payload.username || !payload.password || !payload.confirm_password || !payload.role) {
            return "All required fields must be completed.";
        }
        if (!emailPattern.test(payload.email)) return "Enter a valid email address.";
        if (payload.password !== payload.confirm_password) return "Password and confirm password must match.";
        if (payload.role === "student" && (!payload.student_profile.exam_level || !payload.student_profile.exam_board)) {
            return "Student examination level and board are required.";
        }
        return "";
    }

    async function registerAccount() {
        const role = getInputValue("registerRole");
        const payload = {
            full_name: getInputValue("registerFullName"),
            email: getInputValue("registerEmail"),
            username: getInputValue("registerUsername"),
            password: document.getElementById("registerPassword").value,
            confirm_password: document.getElementById("registerConfirmPassword").value,
            role,
            student_profile: role === "student" ? {
                exam_level: getInputValue("examLevel"),
                exam_board: getInputValue("examBoard"),
                expected_exam_date: getInputValue("expectedExamDate"),
                years_training: getInputValue("yearsTraining"),
            } : {},
        };

        const validationError = validateRegistration(payload);
        if (validationError) {
            setMessage(registerMessage, validationError, true);
            return;
        }

        setMessage(registerMessage, "Creating account...");
        registerBtn.disabled = true;
        try {
            const response = await fetch("/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || "Registration failed");
            setMessage(registerMessage, "Account created. You can now log in.");
            document.getElementById("adminUsername").value = payload.username;
            setTimeout(() => showAuthScreen("loginScreen"), 900);
        } catch (error) {
            setMessage(registerMessage, error.message, true);
        } finally {
            registerBtn.disabled = false;
        }
    }

    async function recoverAccount() {
        const identifier = getInputValue("forgotIdentifier");
        if (!identifier) {
            setMessage(forgotMessage, "Enter your username or email address.", true);
            return;
        }
        setMessage(forgotMessage, "Looking up account...");
        forgotBtn.disabled = true;
        try {
            const response = await fetch("/admin/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ identifier }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.detail || "Recovery failed");
            setMessage(forgotMessage, data.message || "Recovery request created.");
        } catch (error) {
            setMessage(forgotMessage, error.message, true);
        } finally {
            forgotBtn.disabled = false;
        }
    }

    function logout() {
        localStorage.removeItem("nritya_admin_token");
        localStorage.removeItem("nritya_admin_role");
        localStorage.removeItem("nritya_admin_username");
        localStorage.removeItem("nritya_admin_full_name");
        localStorage.removeItem("nritya_student_profile");
        state.token = "";
        state.role = "";
        showLogin();
    }

    async function refreshAdminData() {
        await Promise.all([loadSummary(), loadBooks(), loadAnalytics()]);
    }

    async function loadSummary() {
        const response = await apiFetch("/admin/summary");
        const data = await response.json();
        document.getElementById("adminBooksStat").textContent = data.total_books_indexed;
        document.getElementById("adminPagesStat").textContent = data.total_pages_indexed;
        document.getElementById("adminChunksStat").textContent = data.total_chunks;
        document.getElementById("adminQuestionsStat").textContent = data.total_questions_asked;
        document.getElementById("adminTopicsStat").textContent = data.most_searched_topics.map((item) => `${item.label} (${item.count})`).join(", ") || "None yet";
        document.getElementById("adminUpdateStat").textContent = data.last_database_update || "Unknown";
    }

    function categorySelect(book, categories) {
        return `
            <select class="book-category-select" data-book-id="${escapeHtml(book.id)}" ${state.role !== "admin" ? "disabled" : ""}>
                ${categories.map((category) => `
                    <option value="${escapeHtml(category)}" ${category === book.category ? "selected" : ""}>${escapeHtml(category)}</option>
                `).join("")}
            </select>
        `;
    }

    async function loadBooks() {
        const response = await apiFetch("/admin/books");
        const data = await response.json();
        booksTableBody.innerHTML = data.books.length ? data.books.map((book) => `
            <tr>
                <td>${escapeHtml(book.name)}</td>
                <td>${categorySelect(book, data.categories)}</td>
                <td>${escapeHtml(book.pages || 0)}</td>
                <td>${escapeHtml(book.chunks || 0)}</td>
                <td>${escapeHtml(book.upload_date || "Unknown")}</td>
                <td><span class="status-pill">${escapeHtml(book.status || "Pending")}</span></td>
                <td>
                    <div class="table-actions">
                        <button type="button" data-action="view" data-book-id="${escapeHtml(book.id)}">View</button>
                        <button type="button" data-action="reindex" data-book-id="${escapeHtml(book.id)}" ${state.role !== "admin" ? "disabled" : ""}>Reindex</button>
                        <button type="button" data-action="delete" data-book-id="${escapeHtml(book.id)}" ${state.role !== "admin" ? "disabled" : ""}>Delete</button>
                    </div>
                </td>
            </tr>
        `).join("") : `<tr><td colspan="7">No indexed books yet.</td></tr>`;
    }

    async function loadAnalytics() {
        const response = await apiFetch("/admin/analytics");
        const data = await response.json();
        analyticsList.innerHTML = `
            ${analyticsBlock("Most Asked Questions", data.most_asked_questions)}
            ${analyticsBlock("Frequently Studied Topics", data.frequently_studied_topics)}
            ${analyticsBlock("Popular Books", data.popular_books)}
            ${analyticsBlock("Daily Usage Trends", data.daily_usage_trends.map((item) => ({ label: item.date, count: item.count })))}
        `;
    }

    function analyticsBlock(title, items) {
        const body = items && items.length
            ? items.map((item) => `<span>${escapeHtml(item.label)} <strong>${escapeHtml(item.count)}</strong></span>`).join("")
            : "<span>No data yet</span>";
        return `<div class="analytics-block"><h3>${escapeHtml(title)}</h3>${body}</div>`;
    }

    async function uploadMaterial() {
        const fileInput = document.getElementById("materialFile");
        const category = document.getElementById("materialCategory").value;
        if (!fileInput.files.length) {
            setMessage(uploadMessage, "Choose a PDF, TXT, or DOCX file first.", true);
            return;
        }
        const form = new FormData();
        form.append("file", fileInput.files[0]);
        form.append("category", category);
        setMessage(uploadMessage, "Uploading and rebuilding FAISS index...");
        uploadBtn.disabled = true;
        try {
            await apiFetch("/admin/upload", { method: "POST", body: form });
            setMessage(uploadMessage, "Upload processed and index updated.");
            fileInput.value = "";
            await refreshAdminData();
        } catch (error) {
            setMessage(uploadMessage, error.message, true);
        } finally {
            uploadBtn.disabled = false;
        }
    }

    async function handleTableClick(event) {
        const button = event.target.closest("button[data-action]");
        if (!button) return;
        const action = button.dataset.action;
        const bookId = button.dataset.bookId;
        try {
            if (action === "view") {
                const response = await apiFetch(`/admin/books/${bookId}/view`);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(url), 30000);
                return;
            }
            if (action === "reindex") {
                setMessage(uploadMessage, "Reindexing knowledge base...");
                await apiFetch(`/admin/books/${bookId}/reindex`, { method: "POST" });
                setMessage(uploadMessage, "Book reindexed.");
            }
            if (action === "delete") {
                if (!confirm("Delete this book and rebuild the index?")) return;
                await apiFetch(`/admin/books/${bookId}`, { method: "DELETE" });
                setMessage(uploadMessage, "Book deleted.");
            }
            await refreshAdminData();
        } catch (error) {
            setMessage(uploadMessage, error.message, true);
        }
    }

    async function handleCategoryChange(event) {
        const select = event.target.closest(".book-category-select");
        if (!select) return;
        try {
            await apiFetch(`/admin/books/${select.dataset.bookId}/category`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category: select.value }),
            });
            setMessage(uploadMessage, "Category updated. Reindex to apply metadata changes.");
        } catch (error) {
            setMessage(uploadMessage, error.message, true);
        }
    }

    async function backup() {
        try {
            const response = await apiFetch("/admin/backup", { method: "POST" });
            const data = await response.json();
            setMessage(backupMessage, `Backup created: ${data.backup}`);
        } catch (error) {
            setMessage(backupMessage, error.message, true);
        }
    }

    async function exportIndex() {
        try {
            const response = await apiFetch("/admin/export");
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "nritya-faiss-backup.zip";
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            setMessage(backupMessage, error.message, true);
        }
    }

    async function importIndex() {
        const fileInput = document.getElementById("importFile");
        if (!fileInput.files.length) {
            setMessage(backupMessage, "Choose a backup zip first.", true);
            return;
        }
        const form = new FormData();
        form.append("file", fileInput.files[0]);
        try {
            await apiFetch("/admin/import", { method: "POST", body: form });
            setMessage(backupMessage, "Backup restored. Knowledge base refreshed.");
            fileInput.value = "";
            await refreshAdminData();
        } catch (error) {
            setMessage(backupMessage, error.message, true);
        }
    }

    loginBtn.addEventListener("click", login);
    registerBtn.addEventListener("click", registerAccount);
    forgotBtn.addEventListener("click", recoverAccount);
    logoutBtn.addEventListener("click", logout);
    document.getElementById("showRegisterBtn").addEventListener("click", () => showAuthScreen("registerScreen"));
    document.getElementById("showForgotBtn").addEventListener("click", () => showAuthScreen("forgotScreen"));
    document.getElementById("backToLoginFromRegisterBtn").addEventListener("click", () => showAuthScreen("loginScreen"));
    document.getElementById("backToLoginFromForgotBtn").addEventListener("click", () => showAuthScreen("loginScreen"));
    document.getElementById("registerRole").addEventListener("change", setStudentSectionVisibility);
    uploadBtn.addEventListener("click", uploadMaterial);
    booksTableBody.addEventListener("click", handleTableClick);
    booksTableBody.addEventListener("change", handleCategoryChange);
    document.getElementById("backupBtn").addEventListener("click", backup);
    document.getElementById("exportBtn").addEventListener("click", exportIndex);
    document.getElementById("importBtn").addEventListener("click", importIndex);
    document.getElementById("reindexAllBtn").addEventListener("click", async () => {
        setMessage(uploadMessage, "Reindexing all books...");
        try {
            await apiFetch("/admin/reindex", { method: "POST" });
            setMessage(uploadMessage, "All books reindexed.");
            await refreshAdminData();
        } catch (error) {
            setMessage(uploadMessage, error.message, true);
        }
    });

    setStudentSectionVisibility();
    if (state.token && state.role !== "student") showApp();
    else showLogin();
});
