document.addEventListener("DOMContentLoaded", () => {
    const questionInput = document.getElementById("questionInput");
    const submitBtn = document.getElementById("submitBtn");
    const chatMessages = document.getElementById("chatMessages");
    const chatSection = document.getElementById("chatSection");
    const newChatBtn = document.getElementById("newChatBtn");
    const spinner = document.getElementById("spinner");
    const sendIcon = document.getElementById("sendIcon");
    const validationMsg = document.getElementById("validationMsg");
    const chatInputBar = document.getElementById("chatInputBar");
    const examModeButtons = document.querySelectorAll(".exam-mode-btn");

    const sidebarMenu = document.getElementById("sidebarMenu");
    const menuToggleBtn = document.getElementById("menuToggleBtn");
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");
    const themeToggle = document.getElementById("themeToggle");
    const sidebarProfileAvatar = document.getElementById("sidebarProfileAvatar");
    const sidebarProfileName = document.getElementById("sidebarProfileName");
    const sidebarProfileRole = document.getElementById("sidebarProfileRole");
    const sidebarLogoutBtn = document.getElementById("sidebarLogoutBtn");
    const historyList = document.getElementById("historyList");
    const topicsTodayCount = document.getElementById("topicsTodayCount");
    const questionsAskedCount = document.getElementById("questionsAskedCount");
    const bookFilterSelect = document.getElementById("bookFilterSelect");
    const booksIndexedStat = document.getElementById("booksIndexedStat");
    const pagesIndexedStat = document.getElementById("pagesIndexedStat");
    const chunksStoredStat = document.getElementById("chunksStoredStat");
    const lastIndexUpdateStat = document.getElementById("lastIndexUpdateStat");
    const dashboardQuestionsToday = document.getElementById("dashboardQuestionsToday");
    const dashboardTopicsToday = document.getElementById("dashboardTopicsToday");
    const dashboardStudyTime = document.getElementById("dashboardStudyTime");
    const dashboardMostTopic = document.getElementById("dashboardMostTopic");
    const dashboardBooksUsed = document.getElementById("dashboardBooksUsed");
    const topicProgressList = document.getElementById("topicProgressList");
    const revisionReminderList = document.getElementById("revisionReminderList");
    const recommendationsList = document.getElementById("recommendationsList");
    const bookmarkedAnswersList = document.getElementById("bookmarkedAnswersList");
    const favoriteQuestionsList = document.getElementById("favoriteQuestionsList");
    const sessionSummaryModal = document.getElementById("sessionSummaryModal");
    const sessionSummaryBody = document.getElementById("sessionSummaryBody");
    const continueSessionBtn = document.getElementById("continueSessionBtn");
    const confirmEndSessionBtn = document.getElementById("confirmEndSessionBtn");

    // Login screen elements
    const loginScreen = document.getElementById("loginScreen");
    const appContainer = document.getElementById("appContainer");
    const loginCard = document.getElementById("loginCard");
    const registerCard = document.getElementById("registerCard");
    const forgotCard = document.getElementById("forgotCard");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const forgotForm = document.getElementById("forgotForm");
    const loginError = document.getElementById("loginError");
    const registerError = document.getElementById("registerError");
    const forgotError = document.getElementById("forgotError");
    const forgotSuccess = document.getElementById("forgotSuccess");
    const regRole = document.getElementById("regRole");
    const regStudentExamSection = document.getElementById("regStudentExamSection");

    let conversation = [];
    let isLoading = false;
    let typingEl = null;

    const CONVERSATION_STORAGE_KEY = "nritya_conversation";
    const EXAM_MODE_STORAGE_KEY = "nritya_exam_mode";
    const BOOK_FILTER_STORAGE_KEY = "nritya_book_filter";
    const STUDY_PROGRESS_STORAGE_KEY = "nritya_study_progress";
    const STUDY_PROGRESS_DATE_KEY = "nritya_study_progress_date";
    const LEARNING_STATE_STORAGE_KEY = "nritya_learning_state";
    const BOOKMARKS_STORAGE_KEY = "nritya_bookmarks";
    const SESSION_START_STORAGE_KEY = "nritya_session_start";
    const COMPLETED_TOPICS_STORAGE_KEY = "nritya_completed_topics";
    const APP_VERSION_STORAGE_KEY = "nritya_app_version";
    const APP_VERSION = "6";
    const LEARNING_TOPICS = [
        "Bharatanatyam Basics",
        "Postures",
        "Mudras",
        "History",
        "Devadasi Tradition",
        "Natyashastra",
        "Abhinaya",
        "Theory Exams"
    ];
    const TOPIC_ALIASES = {
        "Bharatanatyam Basics": ["bharatanatyam", "basics", "nritta", "nritya", "natya"],
        "Postures": ["posture", "aramandi", "murumandi", "mandi", "stance"],
        "Mudras": ["mudra", "hasta", "hand gesture", "asamyuta", "samyuta"],
        "History": ["history", "origin", "temple", "tanjore", "revival"],
        "Devadasi Tradition": ["devadasi"],
        "Natyashastra": ["natyashastra", "bharata muni"],
        "Abhinaya": ["abhinaya", "bhava", "rasa", "expression"],
        "Theory Exams": ["exam", "marks", "viva", "definition", "notes"]
    };
    const DEFAULT_RELATED_QUESTIONS = [
        "Explain Aramandi.",
        "Explain Murumandi.",
        "Explain Devadasi tradition."
    ];
    const KNOWN_CHAPTERS = [
        "Prarambhik", "Praveshika", "Madhyama", "Visharad",
        "Arangetram", "Abhinaya", "Nritta", "Nritya", "Natya"
    ];
    const EXAM_MODES = {
        short: {
            label: "Short Answer",
            marks: "2 Marks",
            detail: "Write a concise 2-mark answer in 60-90 words.",
            sections: ["Definition", "Key point", "Conclusion"]
        },
        medium: {
            label: "Medium Answer",
            marks: "5 Marks",
            detail: "Write a focused 5-mark answer in 140-180 words.",
            sections: ["Definition", "Explanation", "Features", "Conclusion"]
        },
        long: {
            label: "Long Answer",
            marks: "10 Marks",
            detail: "Write a complete 10-mark answer in 260-350 words.",
            sections: ["Introduction", "Detailed Explanation", "Features", "Examples", "Conclusion"]
        },
        study: {
            label: "Detailed Study Mode",
            marks: "Study",
            detail: "Write detailed study material with clear exam-ready notes.",
            sections: ["Introduction", "Detailed Explanation", "Features", "Examples", "Conclusion"]
        }
    };

    function setInputBarVisible(visible) {
        chatInputBar.classList.toggle("hidden", !visible);
    }

    function showWorkspace() {
        const workspace = document.getElementById("workspace");
        navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("data-tab") === "ask"));
        tabContents.forEach((content) => content.classList.remove("active"));
        if (workspace) workspace.style.display = "";
        setInputBarVisible(true);
    }

    function switchTab(tabId) {
        sidebarMenu.classList.remove("open");

        const workspace = document.getElementById("workspace");

        // "Ask Question" = show workspace
        if (tabId === "ask") {
            showWorkspace();
            return;
        }

        // Show the selected tab view, hide workspace
        navItems.forEach((item) => item.classList.toggle("active", item.getAttribute("data-tab") === tabId));
        tabContents.forEach((content) => content.classList.toggle("active", content.id === `tabContent-${tabId}`));
        if (workspace) workspace.style.display = "none";
        setInputBarVisible(false);

        if (tabId === "history") renderHistory();
        if (tabId === "saved") renderSavedNotes();
    }

    navItems.forEach((item) => item.addEventListener("click", () => switchTab(item.getAttribute("data-tab"))));

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener("click", (event) => {
            event.stopPropagation();
            sidebarMenu.classList.toggle("open");
        });
    }

    document.addEventListener("click", (event) => {
        if (!sidebarMenu.contains(event.target) && !menuToggleBtn.contains(event.target)) {
            sidebarMenu.classList.remove("open");
        }
    });

    function initTheme() {
        const savedTheme = localStorage.getItem("nritya_theme") || "light";
        if (savedTheme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            themeToggle.checked = true;
        } else {
            document.documentElement.removeAttribute("data-theme");
            themeToggle.checked = false;
        }
    }

    themeToggle.addEventListener("change", () => {
        if (themeToggle.checked) {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("nritya_theme", "dark");
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("nritya_theme", "light");
        }
    });

    function formatRoleLabel(role) {
        const normalized = String(role || "student").toLowerCase();
        if (normalized === "admin") return "Admin";
        if (normalized === "teacher") return "Teacher";
        return "Student";
    }

    function renderSidebarProfile() {
        const role = formatRoleLabel(localStorage.getItem("nritya_admin_role") || "student");
        const username = localStorage.getItem("nritya_admin_username") || "";
        const displayName = localStorage.getItem("nritya_admin_full_name") || username || `${role} User`;
        if (sidebarProfileName) sidebarProfileName.textContent = displayName;
        if (sidebarProfileRole) sidebarProfileRole.textContent = role;
        if (sidebarProfileAvatar) {
            const initial = displayName.trim().charAt(0) || username.trim().charAt(0) || "U";
            sidebarProfileAvatar.textContent = initial.toUpperCase();
        }
    }

    function logoutUser() {
        localStorage.removeItem("nritya_admin_token");
        localStorage.removeItem("nritya_admin_role");
        localStorage.removeItem("nritya_admin_username");
        localStorage.removeItem("nritya_admin_full_name");
        localStorage.removeItem("nritya_student_profile");
        window.location.reload();
    }

    if (sidebarLogoutBtn) sidebarLogoutBtn.addEventListener("click", logoutUser);

    // ================= LOGIN SCREEN LOGIC =================

    function showLoginScreen() {
        if (loginScreen) loginScreen.classList.remove("hidden");
        if (appContainer) appContainer.classList.add("app-hidden");
    }

    function showApp() {
        if (loginScreen) loginScreen.classList.add("hidden");
        if (appContainer) appContainer.classList.remove("app-hidden");
    }

    function applyAppMigrations() {
        if (localStorage.getItem(APP_VERSION_STORAGE_KEY) === APP_VERSION) return;
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        localStorage.removeItem("nritya_history");
        localStorage.setItem(APP_VERSION_STORAGE_KEY, APP_VERSION);
    }

    function showLoginCard() {
        if (loginCard) loginCard.classList.remove("hidden");
        if (registerCard) registerCard.classList.add("hidden");
        if (forgotCard) forgotCard.classList.add("hidden");
        clearLoginErrors();
    }

    function showRegisterCard() {
        if (loginCard) loginCard.classList.add("hidden");
        if (registerCard) registerCard.classList.remove("hidden");
        if (forgotCard) forgotCard.classList.add("hidden");
        clearLoginErrors();
    }

    function showForgotCard() {
        if (loginCard) loginCard.classList.add("hidden");
        if (registerCard) registerCard.classList.add("hidden");
        if (forgotCard) forgotCard.classList.remove("hidden");
        clearLoginErrors();
    }

    function clearLoginErrors() {
        if (loginError) { loginError.textContent = ""; loginError.classList.add("hidden"); }
        if (registerError) { registerError.textContent = ""; registerError.classList.add("hidden"); }
        if (forgotError) { forgotError.textContent = ""; forgotError.classList.add("hidden"); }
        if (forgotSuccess) { forgotSuccess.textContent = ""; forgotSuccess.classList.add("hidden"); }
    }

    function showError(el, msg) {
        if (el) { el.textContent = msg; el.classList.remove("hidden"); }
    }

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : "";
    }

    function syncRegisterStudentFields() {
        const isStudent = !regRole || regRole.value === "student";
        if (regStudentExamSection) regStudentExamSection.classList.toggle("hidden", !isStudent);
        ["regExamLevel", "regExamBoard", "regExpectedExamDate", "regYearsTraining"].forEach((id) => {
            const field = document.getElementById(id);
            if (field) field.disabled = !isStudent;
        });
        ["regExamLevel", "regExamBoard"].forEach((id) => {
            const field = document.getElementById(id);
            if (field) field.required = isStudent;
        });
    }

    function onLoginSuccess(data) {
        localStorage.setItem("nritya_admin_token", data.token);
        localStorage.setItem("nritya_admin_role", data.role || "student");
        localStorage.setItem("nritya_admin_username", data.username || "");
        localStorage.setItem("nritya_admin_full_name", data.full_name || "");
        if (data.student_profile) {
            localStorage.setItem("nritya_student_profile", JSON.stringify(data.student_profile));
        }
        renderSidebarProfile();
        showApp();
    }

    // Card switcher buttons
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const showForgotBtn = document.getElementById("showForgotBtn");
    const showLoginFromRegBtn = document.getElementById("showLoginFromRegBtn");
    const showLoginFromForgotBtn = document.getElementById("showLoginFromForgotBtn");
    if (showRegisterBtn) showRegisterBtn.addEventListener("click", showRegisterCard);
    if (showForgotBtn) showForgotBtn.addEventListener("click", showForgotCard);
    if (showLoginFromRegBtn) showLoginFromRegBtn.addEventListener("click", showLoginCard);
    if (showLoginFromForgotBtn) showLoginFromForgotBtn.addEventListener("click", showLoginCard);
    if (regRole) regRole.addEventListener("change", syncRegisterStudentFields);
    syncRegisterStudentFields();

    // Login form submit
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearLoginErrors();
            const username = document.getElementById("loginUsername").value.trim();
            const password = document.getElementById("loginPassword").value;
            if (!username || !password) { showError(loginError, "Please fill in all fields."); return; }
            const btn = document.getElementById("loginSubmitBtn");
            btn.disabled = true;
            btn.textContent = "Signing in...";
            try {
                const res = await fetch("/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || "Invalid username or password.");
                }
                const data = await res.json();
                onLoginSuccess(data);
            } catch (err) {
                showError(loginError, err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "Sign In";
            }
        });
    }

    // Registration form submit
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearLoginErrors();
            const full_name = document.getElementById("regFullName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const username = document.getElementById("regUsername").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirm_password = document.getElementById("regConfirmPassword").value;
            const role = document.getElementById("regRole").value;
            const student_profile = role === "student" ? {
                exam_level: getValue("regExamLevel"),
                exam_board: getValue("regExamBoard"),
                expected_exam_date: getValue("regExpectedExamDate"),
                years_training: getValue("regYearsTraining"),
            } : {};
            if (!full_name || !email || !username || !password || !confirm_password) {
                showError(registerError, "Please fill in all fields."); return;
            }
            if (password !== confirm_password) {
                showError(registerError, "Passwords do not match."); return;
            }
            if (role === "student" && (!student_profile.exam_level || !student_profile.exam_board)) {
                showError(registerError, "Student examination level and board are required."); return;
            }
            const btn = document.getElementById("registerSubmitBtn");
            btn.disabled = true;
            btn.textContent = "Creating account...";
            try {
                const res = await fetch("/admin/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ full_name, email, username, password, confirm_password, role, student_profile }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || "Registration failed.");
                }
                // Auto-login after successful registration
                const loginRes = await fetch("/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });
                if (!loginRes.ok) throw new Error("Account created. Please sign in.");
                const data = await loginRes.json();
                onLoginSuccess(data);
            } catch (err) {
                showError(registerError, err.message);
                if (err.message.includes("Please sign in")) showLoginCard();
            } finally {
                btn.disabled = false;
                btn.textContent = "Create Account";
            }
        });
    }

    // Forgot password form submit
    if (forgotForm) {
        forgotForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearLoginErrors();
            const identifier = document.getElementById("forgotIdentifier").value.trim();
            if (!identifier) { showError(forgotError, "Please enter your username or email."); return; }
            const btn = document.getElementById("forgotSubmitBtn");
            btn.disabled = true;
            btn.textContent = "Recovering...";
            try {
                const res = await fetch("/admin/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ identifier }),
                });
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.detail || "No account found.");
                }
                const data = await res.json();
                if (forgotSuccess) {
                    forgotSuccess.textContent = data.message || "Recovery instructions sent. Contact an administrator.";
                    forgotSuccess.classList.remove("hidden");
                }
            } catch (err) {
                showError(forgotError, err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "Recover Account";
            }
        });
    }

    function getSelectedMode() {
        return localStorage.getItem(EXAM_MODE_STORAGE_KEY) || "short";
    }

    function setSelectedMode(mode) {
        localStorage.setItem(EXAM_MODE_STORAGE_KEY, mode);
        examModeButtons.forEach((button) => {
            button.classList.toggle("active", button.dataset.mode === mode);
        });
    }

    examModeButtons.forEach((button) => {
        button.addEventListener("click", () => setSelectedMode(button.dataset.mode));
    });

    function getSelectedBookFilter() {
        return localStorage.getItem(BOOK_FILTER_STORAGE_KEY) || "all";
    }

    function setSelectedBookFilter(bookFilter) {
        localStorage.setItem(BOOK_FILTER_STORAGE_KEY, bookFilter || "all");
        if (bookFilterSelect) bookFilterSelect.value = bookFilter || "all";
    }

    if (bookFilterSelect) {
        bookFilterSelect.addEventListener("change", () => setSelectedBookFilter(bookFilterSelect.value));
    }

    function formatIndexDate(value) {
        if (!value || value === "Unknown") return "Unknown";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    }

    async function loadKnowledgeStats() {
        try {
            const response = await fetch("/stats");
            if (!response.ok) throw new Error("Stats unavailable");
            const stats = await response.json();
            if (booksIndexedStat) booksIndexedStat.textContent = String(stats.books_indexed ?? "-");
            if (pagesIndexedStat) pagesIndexedStat.textContent = String(stats.total_pages_indexed ?? "-");
            if (chunksStoredStat) chunksStoredStat.textContent = String(stats.total_chunks_stored ?? "-");
            if (lastIndexUpdateStat) lastIndexUpdateStat.textContent = formatIndexDate(stats.last_index_update);
        } catch {
            if (booksIndexedStat) booksIndexedStat.textContent = "-";
            if (pagesIndexedStat) pagesIndexedStat.textContent = "-";
            if (chunksStoredStat) chunksStoredStat.textContent = "-";
            if (lastIndexUpdateStat) lastIndexUpdateStat.textContent = "Unavailable";
        }
    }

    async function loadBookOptions() {
        if (!bookFilterSelect) return;
        const selected = getSelectedBookFilter();
        try {
            const response = await fetch("/books");
            if (!response.ok) throw new Error("Books unavailable");
            const data = await response.json();
            const books = Array.isArray(data.books) && data.books.length
                ? data.books
                : [{ key: "all", label: "All Books" }];

            bookFilterSelect.innerHTML = books.map((book) => (
                `<option value="${escapeHtml(book.key)}">${escapeHtml(book.label)}</option>`
            )).join("");

            const validKeys = books.map((book) => book.key);
            setSelectedBookFilter(validKeys.includes(selected) ? selected : "all");
        } catch {
            setSelectedBookFilter(selected);
        }
    }

    function autoResizeInput() {
        questionInput.style.height = "auto";
        questionInput.style.height = `${Math.min(questionInput.scrollHeight, 120)}px`;
    }

    questionInput.addEventListener("input", () => {
        autoResizeInput();
        validationMsg.classList.add("hidden");
        chatInputBar.classList.remove("has-error");
    });

    questionInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    });

    submitBtn.addEventListener("click", handleSubmit);

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function extractChapter(answerText) {
        const chapterMatch = String(answerText).match(/chapter[:\s]+([A-Za-z]+)/i);
        if (chapterMatch) return chapterMatch[1];

        for (const chapter of KNOWN_CHAPTERS) {
            if (String(answerText).toLowerCase().includes(chapter.toLowerCase())) {
                return chapter;
            }
        }
        return null;
    }

    function getCurrentTimestamp() {
        return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    }

    function getTodayKey() {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");
        return `${now.getFullYear()}-${month}-${day}`;
    }

    function getStudyProgress() {
        const today = getTodayKey();
        const savedDate = localStorage.getItem(STUDY_PROGRESS_DATE_KEY);
        if (savedDate !== today) {
            const freshProgress = { topics: 0, questions: 0, studiedTopics: [] };
            localStorage.setItem(STUDY_PROGRESS_DATE_KEY, today);
            localStorage.setItem(STUDY_PROGRESS_STORAGE_KEY, JSON.stringify(freshProgress));
            return freshProgress;
        }

        try {
            const progress = JSON.parse(localStorage.getItem(STUDY_PROGRESS_STORAGE_KEY) || "{}");
            return {
                topics: Number(progress.topics) || 0,
                questions: Number(progress.questions) || 0,
                studiedTopics: Array.isArray(progress.studiedTopics) ? progress.studiedTopics : []
            };
        } catch {
            return { topics: 0, questions: 0, studiedTopics: [] };
        }
    }

    function saveStudyProgress(progress) {
        localStorage.setItem(STUDY_PROGRESS_DATE_KEY, getTodayKey());
        localStorage.setItem(STUDY_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
        renderStudyProgress();
    }

    function renderStudyProgress() {
        const progress = getStudyProgress();
        if (topicsTodayCount) topicsTodayCount.textContent = String(progress.topics);
        if (questionsAskedCount) questionsAskedCount.textContent = String(progress.questions);
    }

    function recordQuestionAsked() {
        const progress = getStudyProgress();
        progress.questions += 1;
        saveStudyProgress(progress);
    }

    function recordTopicStudied(question) {
        const progress = getStudyProgress();
        const topicKey = String(question || "").trim().toLowerCase();
        if (topicKey && !progress.studiedTopics.includes(topicKey)) {
            progress.studiedTopics.push(topicKey);
            progress.topics = progress.studiedTopics.length;
            saveStudyProgress(progress);
        }
    }

    function getSessionStartTime() {
        const existing = Number(localStorage.getItem(SESSION_START_STORAGE_KEY));
        if (existing) return existing;
        const now = Date.now();
        localStorage.setItem(SESSION_START_STORAGE_KEY, String(now));
        return now;
    }

    function getSessionMinutes() {
        return Math.max(1, Math.round((Date.now() - getSessionStartTime()) / 60000));
    }

    function classifyTopic(text) {
        const source = String(text || "").toLowerCase();
        for (const topic of LEARNING_TOPICS) {
            if ((TOPIC_ALIASES[topic] || []).some((alias) => source.includes(alias))) return topic;
        }
        return "Bharatanatyam Basics";
    }

    function getLearningState() {
        try {
            const state = JSON.parse(localStorage.getItem(LEARNING_STATE_STORAGE_KEY) || "{}");
            return {
                topicCounts: state.topicCounts || {},
                topicLastStudied: state.topicLastStudied || {},
                booksUsed: Array.isArray(state.booksUsed) ? state.booksUsed : [],
                totalStudyMinutes: Number(state.totalStudyMinutes) || 0,
                sessionQuestionCount: Number(state.sessionQuestionCount) || 0,
                sessionTopics: Array.isArray(state.sessionTopics) ? state.sessionTopics : []
            };
        } catch {
            return { topicCounts: {}, topicLastStudied: {}, booksUsed: [], totalStudyMinutes: 0, sessionQuestionCount: 0, sessionTopics: [] };
        }
    }

    function saveLearningState(state) {
        localStorage.setItem(LEARNING_STATE_STORAGE_KEY, JSON.stringify(state));
    }

    function getCompletedTopics() {
        try {
            const completed = JSON.parse(localStorage.getItem(COMPLETED_TOPICS_STORAGE_KEY) || "[]");
            return Array.isArray(completed) ? completed : [];
        } catch {
            return [];
        }
    }

    function saveCompletedTopics(completedTopics) {
        localStorage.setItem(COMPLETED_TOPICS_STORAGE_KEY, JSON.stringify(completedTopics));
    }

    function getTopicMastery(count) {
        if (count >= 6) return "Advanced";
        if (count >= 3) return "Intermediate";
        return "Beginner";
    }

    function getTopicProgressPercent(topic, count) {
        const completed = getCompletedTopics().includes(topic);
        if (completed) return 100;
        return Math.min(95, Math.max(8, count * 16));
    }

    function updateLearningAfterAnswer(question, answerText, metadata = {}) {
        const topic = classifyTopic(`${question} ${answerText}`);
        const state = getLearningState();
        const today = getTodayKey();
        state.topicCounts[topic] = (Number(state.topicCounts[topic]) || 0) + 1;
        state.topicLastStudied[topic] = today;
        state.sessionQuestionCount += 1;
        if (!state.sessionTopics.includes(topic)) state.sessionTopics.push(topic);

        const books = [];
        if (Array.isArray(metadata.sources)) {
            metadata.sources.forEach((source) => {
                const book = source.source_book || source.book_label;
                if (book) books.push(book);
            });
        }
        if (metadata.bookFilter && metadata.bookFilter !== "all") books.push(metadata.bookFilter.replace(/_/g, " "));
        state.booksUsed = [...new Set([...state.booksUsed, ...books])].slice(0, 12);
        saveLearningState(state);
        renderLearningDashboard();
    }

    function getMostStudiedTopic(state = getLearningState()) {
        const entries = Object.entries(state.topicCounts);
        if (entries.length === 0) return "Not started";
        return entries.sort((a, b) => b[1] - a[1])[0][0];
    }

    function getRevisionTopics(state = getLearningState()) {
        const today = getTodayKey();
        const staleTopics = LEARNING_TOPICS.filter((topic) => state.topicCounts[topic] && state.topicLastStudied[topic] !== today);
        const beginnerTopics = LEARNING_TOPICS.filter((topic) => getTopicMastery(Number(state.topicCounts[topic]) || 0) === "Beginner");
        return [...new Set([...staleTopics, ...beginnerTopics])].slice(0, 4);
    }

    function getRecommendedTopic(state = getLearningState()) {
        const leastStudied = LEARNING_TOPICS
            .map((topic) => ({ topic, count: Number(state.topicCounts[topic]) || 0 }))
            .sort((a, b) => a.count - b.count)[0];
        return leastStudied ? leastStudied.topic : "Bharatanatyam Basics";
    }

    function renderLearningDashboard() {
        const progress = getStudyProgress();
        const state = getLearningState();
        const displayedStudyMinutes = state.totalStudyMinutes + getSessionMinutes();

        if (dashboardQuestionsToday) dashboardQuestionsToday.textContent = String(progress.questions);
        if (dashboardTopicsToday) dashboardTopicsToday.textContent = String(progress.topics);
        if (dashboardStudyTime) dashboardStudyTime.textContent = `${displayedStudyMinutes} min`;
        if (dashboardMostTopic) dashboardMostTopic.textContent = getMostStudiedTopic(state);
        if (dashboardBooksUsed) dashboardBooksUsed.textContent = state.booksUsed.length ? state.booksUsed.join(", ") : "No books used yet";

        if (topicProgressList) {
            topicProgressList.innerHTML = LEARNING_TOPICS.map((topic) => {
                const count = Number(state.topicCounts[topic]) || 0;
                const percent = getTopicProgressPercent(topic, count);
                const mastery = getTopicMastery(count);
                const checked = getCompletedTopics().includes(topic) ? "checked" : "";
                return `
                    <div class="topic-progress-item">
                        <div class="topic-progress-head">
                            <label><input type="checkbox" class="topic-complete-toggle" data-topic="${escapeHtml(topic)}" ${checked}> ${escapeHtml(topic)}</label>
                            <span class="mastery-pill mastery-${mastery.toLowerCase()}">${mastery}</span>
                        </div>
                        <div class="progress-track"><span style="width: ${percent}%"></span></div>
                        <div class="topic-progress-meta">${percent}% complete · ${count} study pass${count === 1 ? "" : "es"}</div>
                    </div>
                `;
            }).join("");
        }

        if (revisionReminderList) {
            const revisionTopics = getRevisionTopics(state);
            const frequentTopic = getMostStudiedTopic(state);
            const weakAreas = LEARNING_TOPICS.filter((topic) => (Number(state.topicCounts[topic]) || 0) < 2).slice(0, 3);
            revisionReminderList.innerHTML = `
                ${buildLearningListItem("Topics needing revision", revisionTopics.length ? revisionTopics.join(", ") : "No revision backlog yet")}
                ${buildLearningListItem("Frequently asked topics", frequentTopic)}
                ${buildLearningListItem("Weak areas", weakAreas.join(", ") || "None detected yet")}
            `;
        }

        if (recommendationsList) {
            const nextTopic = getRecommendedTopic(state);
            const related = (TOPIC_ALIASES[nextTopic] || []).slice(0, 3).join(", ") || "Bharatanatyam theory";
            recommendationsList.innerHTML = `
                ${buildLearningListItem("Next topic to study", nextTopic)}
                ${buildLearningListItem("Related concepts", related)}
                ${buildLearningListItem("Recommended questions", getRecommendedQuestions(nextTopic).join(" "))}
            `;
        }
    }

    function buildLearningListItem(title, value) {
        return `<div class="learning-list-item"><span>${escapeHtml(title)}</span><strong>${escapeHtml(value)}</strong></div>`;
    }

    function getRecommendedQuestions(topic) {
        const map = {
            "Postures": ["Explain Aramandi.", "Differentiate Aramandi and Murumandi."],
            "Mudras": ["What are Asamyuta Hastas?", "Explain the use of mudras in Abhinaya."],
            "History": ["Explain the history of Bharatanatyam.", "What was the temple tradition?"],
            "Devadasi Tradition": ["What is the Devadasi tradition?", "How did Devadasis contribute to Bharatanatyam?"],
            "Natyashastra": ["What is Natyashastra?", "Explain Bharata Muni's contribution."],
            "Abhinaya": ["Explain the types of Abhinaya.", "What is the role of Bhava and Rasa?"],
            "Theory Exams": ["Write a 5-mark answer on Bharatanatyam.", "Prepare viva questions for Abhinaya."]
        };
        return map[topic] || ["Explain Bharatanatyam.", "Differentiate Nritta, Nritya and Natya."];
    }

    function getBookmarks() {
        try {
            const bookmarks = JSON.parse(localStorage.getItem(BOOKMARKS_STORAGE_KEY) || "[]");
            return Array.isArray(bookmarks) ? bookmarks : [];
        } catch {
            return [];
        }
    }

    function saveBookmarks(bookmarks) {
        localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(bookmarks));
    }

    function createBookmarkId(question, answer) {
        return btoa(unescape(encodeURIComponent(`${question}|${answer}`))).replace(/=+$/, "").slice(0, 32);
    }

    function isBookmarked(question, answer) {
        const id = createBookmarkId(question, answer);
        return getBookmarks().some((bookmark) => bookmark.id === id);
    }

    function toggleBookmark(question, answer, metadata = {}) {
        const id = createBookmarkId(question, answer);
        const bookmarks = getBookmarks();
        const existingIndex = bookmarks.findIndex((bookmark) => bookmark.id === id);
        if (existingIndex >= 0) {
            bookmarks.splice(existingIndex, 1);
            saveBookmarks(bookmarks);
            renderSavedNotes();
            return false;
        }

        bookmarks.unshift({
            id,
            question,
            answer,
            topic: classifyTopic(`${question} ${answer}`),
            mode: metadata.mode || getSelectedMode(),
            timestamp: getCurrentTimestamp(),
            date: getTodayKey()
        });
        saveBookmarks(bookmarks.slice(0, 50));
        renderSavedNotes();
        return true;
    }

    function renderSavedNotes() {
        const bookmarks = getBookmarks();
        if (bookmarkedAnswersList) {
            bookmarkedAnswersList.innerHTML = bookmarks.length
                ? bookmarks.map((bookmark) => `
                    <div class="saved-item">
                        <div class="saved-topic">${escapeHtml(bookmark.topic || "Bharatanatyam")}</div>
                        <div class="saved-question">${escapeHtml(bookmark.question)}</div>
                        <div class="saved-answer">${escapeHtml(bookmark.answer)}</div>
                        <button type="button" class="answer-action-btn" data-action="remove-bookmark" data-bookmark-id="${escapeHtml(bookmark.id)}">Remove</button>
                    </div>
                `).join("")
                : `<div class="history-empty">No bookmarked answers yet.</div>`;
        }

        if (favoriteQuestionsList) {
            const favoriteQuestions = [...new Set(bookmarks.map((bookmark) => bookmark.question))];
            favoriteQuestionsList.innerHTML = favoriteQuestions.length
                ? favoriteQuestions.map((question) => `
                    <button type="button" class="saved-question-btn related-question-btn" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>
                `).join("")
                : `<div class="history-empty">Favorite questions will appear here after bookmarking answers.</div>`;
        }
    }

    function renderSessionSummary() {
        const state = getLearningState();
        const sessionTopics = state.sessionTopics.length ? state.sessionTopics : getStudyProgress().studiedTopics;
        const learningScore = Math.min(100, (state.sessionQuestionCount * 12) + (sessionTopics.length * 8));
        if (!sessionSummaryBody) return;
        sessionSummaryBody.innerHTML = `
            <div class="session-summary-stat"><span>Questions asked</span><strong>${escapeHtml(state.sessionQuestionCount || 0)}</strong></div>
            <div class="session-summary-stat"><span>Topics covered</span><strong>${escapeHtml(sessionTopics.join(", ") || "No topics yet")}</strong></div>
            <div class="session-summary-stat"><span>Estimated learning achieved</span><strong>${learningScore}%</strong></div>
        `;
    }

    function showSessionSummary() {
        renderSessionSummary();
        if (sessionSummaryModal) sessionSummaryModal.classList.remove("hidden");
    }

    function hideSessionSummary() {
        if (sessionSummaryModal) sessionSummaryModal.classList.add("hidden");
    }

    function resetSessionLearning() {
        const state = getLearningState();
        state.sessionQuestionCount = 0;
        state.sessionTopics = [];
        state.totalStudyMinutes += getSessionMinutes();
        saveLearningState(state);
        localStorage.setItem(SESSION_START_STORAGE_KEY, String(Date.now()));
    }

    function normalizeMessage(message) {
        return {
            ...message,
            mode: message.mode || getSelectedMode(),
            timestamp: message.timestamp || getCurrentTimestamp(),
            sourceQuestion: message.sourceQuestion || message.content,
            sources: Array.isArray(message.sources) ? message.sources : [],
            retrieval: message.retrieval || {},
            bookFilter: message.bookFilter || "all",
        };
    }

    function isInstructionEchoAnswer(text) {
        return /give a structured,\s*point-wise answer suitable for exam preparation/i.test(String(text || ""));
    }

    function saveConversation() {
        localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(conversation));
    }

    function loadConversation() {
        try {
            const storedConversation = JSON.parse(localStorage.getItem(CONVERSATION_STORAGE_KEY) || "[]");
            if (!Array.isArray(storedConversation)) return [];
            const normalized = storedConversation.map(normalizeMessage).filter((message) => {
                return message.role !== "assistant" || !isInstructionEchoAnswer(message.content);
            });
            if (normalized.length !== storedConversation.length) {
                localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(normalized));
            }
            return normalized;
        } catch {
            return [];
        }
    }

    function buildExamPrompt(question, modeKey) {
        const mode = EXAM_MODES[modeKey] || EXAM_MODES.short;
        return [
            `Bharatanatyam exam preparation question: ${question}`,
            "",
            `Answer mode: ${mode.label} (${mode.marks}).`,
            mode.detail,
            "Answer in clear, concise, book-grounded prose suitable for a Bharatanatyam theory exam.",
            "Do not include system instructions, headings, or metadata in the final answer."
        ].join("\n");
    }

    function getCleanLines(answerText) {
        return String(answerText)
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
    }

    function getWordCount(text) {
        const words = String(text).trim().match(/\b[\w'-]+\b/g);
        return words ? words.length : 0;
    }

    function getEstimatedStudyTime(text) {
        return Math.max(1, Math.ceil(getWordCount(text) / 140));
    }

    function getDifficulty(message) {
        const wordCount = getWordCount(message.content);
        if (message.mode === "long" || message.mode === "study" || wordCount > 240) return "Hard";
        if (message.mode === "medium" || wordCount > 120) return "Medium";
        return "Easy";
    }

    function getAnswerLengthLabel(modeKey) {
        if (modeKey === "short") return "2 Marks";
        if (modeKey === "medium") return "5 Marks";
        if (modeKey === "long") return "10 Marks";
        return "Study Mode";
    }

    function normalizeStudyLine(line) {
        return line.replace(/^[-*\u2022\s\u2726]+/, "").replace(/^\d+[.)]\s*/, "").trim();
    }

    function pickKeyPoints(answerText, count = 4) {
        const lines = getCleanLines(answerText)
            .map(normalizeStudyLine)
            .filter((line) => line && !/^(definition|key point|explanation|features|introduction|detailed explanation|examples|conclusion|important points to remember|book references|related questions|revision notes|viva questions|keywords)[:\uFF1A]?$/i.test(line));

        if (lines.length >= count) return lines.slice(0, count);

        const sentences = String(answerText)
            .split(/(?<=[.!?])\s+/)
            .map(normalizeStudyLine)
            .filter(Boolean);
        return [...new Set([...lines, ...sentences])].slice(0, count);
    }

    function extractImportantPoints(answerText) {
        const lines = getCleanLines(answerText);
        const startIndex = lines.findIndex((line) => /important points to remember/i.test(line));
        if (startIndex >= 0) {
            const points = [];
            for (let index = startIndex + 1; index < lines.length; index += 1) {
                if (/^[A-Za-z ]+:$/.test(lines[index]) && points.length) break;
                const point = normalizeStudyLine(lines[index]);
                if (point) points.push(point);
                if (points.length === 4) break;
            }
            if (points.length) return points;
        }
        return pickKeyPoints(answerText, 4);
    }

    function extractKeywords(answerText, questionText = "") {
        const keywordBank = [
            "Bharatanatyam", "Devadasi Tradition", "Bhava", "Raga", "Tala", "Natya",
            "Nritta", "Nritya", "Abhinaya", "Mudra", "Adavu", "Aramandi",
            "Murumandi", "Hasta", "Lasya", "Tandava", "Natyashastra"
        ];
        const source = `${questionText} ${answerText}`;
        const found = keywordBank.filter((keyword) => new RegExp(`\\b${keyword.replace(/\s+/g, "\\s+")}\\b`, "i").test(source));

        const capitalizedTerms = (source.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [])
            .filter((term) => term.length > 3 && !/^(Answer|Definition|Important|Book|Related|Revision|Viva|Source|Chapter|Retrieved|Knowledge|Chunks)$/i.test(term))
            .slice(0, 6);

        const keywords = [...new Set([...found, ...capitalizedTerms, ...keywordBank.slice(0, 6)])];
        return keywords.slice(0, 8);
    }

    function buildRevisionNotes(answerText) {
        const points = pickKeyPoints(answerText, 5);
        if (points.length === 0) return ["Revise the definition, key features, and exam examples for this topic."];
        return points.map((point) => point.length > 145 ? `${point.slice(0, 142).trim()}...` : point);
    }

    function buildVivaQuestionsList(questionText, keywords) {
        const mainTopic = String(questionText || "this topic").replace(/[?!.]+$/, "");
        const primaryKeyword = keywords[0] || "Bharatanatyam";
        return [
            `What is ${mainTopic}?`,
            `Why is ${primaryKeyword} important in Bharatanatyam theory?`,
            `Name two important features related to ${primaryKeyword}.`,
            `How would you explain ${mainTopic} in a short viva answer?`,
            "Which term or concept should be remembered for exams?"
        ];
    }

    function buildListHtml(items) {
        return `
            <ul class="chat-bubble-list">
                ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
        `;
    }

    function createCollapsibleSection(title, bodyHtml, isOpen = false) {
        return `
            <details class="study-section" ${isOpen ? "open" : ""}>
                <summary>
                    <span>${escapeHtml(title)}</span>
                    <span class="study-section-icon" aria-hidden="true">+</span>
                </summary>
                <div class="study-section-body">${bodyHtml}</div>
            </details>
        `;
    }

    function createAnswerTabs(message, studyData) {
        return `
            <div class="answer-tabs" data-answer-tabs="${escapeHtml(message.id || "msg")}">
                <div class="answer-tab-panel active" data-answer-panel="exam" role="tabpanel">
                    ${formatAnswerContent(message.content)}
                </div>
            </div>
        `;
    }

    function formatAnswerContent(answerText) {
        const cleaned = String(answerText || "")
            .replace(/\r/g, "")
            .replace(/^\s*[-*•\u2022]\s*/gm, "")
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        if (!cleaned) return "<p class=\"chat-bubble-text\">No answer returned.</p>";

        const paragraphs = cleaned
            .split(/\n\s*\n/)
            .map((paragraph) => paragraph.trim())
            .filter(Boolean);

        if (paragraphs.length > 1) {
            return paragraphs.map((paragraph) => `<p class="chat-bubble-text">${escapeHtml(paragraph)}</p>`).join("");
        }

        return `<p class="chat-bubble-text">${escapeHtml(cleaned)}</p>`;
    }

    function buildBookReference(message) {
        const chapter = message.chapter || extractChapter(message.content);
        const sources = Array.isArray(message.sources) ? message.sources : [];
        const retrieval = message.retrieval || {};
        const sourceBooks = sources.length
            ? sources.map((source) => `<span class="chat-source-item">Source Book: ${escapeHtml(source.source_book || source.book_label || "Unknown source")}</span>`).join("")
            : `<span class="chat-source-item">Source Book: theory.pdf</span>`;
        const pageRefs = sources
            .flatMap((source) => Array.isArray(source.pages) ? source.pages : [])
            .filter((page, index, pages) => pages.indexOf(page) === index)
            .slice(0, 8);
        const pageHtml = pageRefs.length
            ? pageRefs.map((page) => `<span class="chat-source-item">Page ${escapeHtml(page)}</span>`).join("")
            : `<span class="chat-source-item">Page references unavailable</span>`;
        const booksUsed = Array.isArray(retrieval.books_used) && retrieval.books_used.length
            ? retrieval.books_used.join(", ")
            : "Retrieved context";
        const confidence = typeof retrieval.confidence_score === "number"
            ? `${Math.round(retrieval.confidence_score * 100)}%`
            : "Not available";
        const chunks = retrieval.chunks_retrieved ?? 4;
        const coverage = Math.max(0, Math.min(100, Number(retrieval.knowledge_coverage) || 0));
        const filledBars = Math.round(coverage / 10);
        const coverageBar = `${"█".repeat(filledBars)}${"░".repeat(10 - filledBars)}`;

        return `
            <div class="book-reference">
                <span class="chat-source-label">Source Books:</span>
                ${sourceBooks}
                <span class="chat-source-label">Page References:</span>
                ${pageHtml}
                <span class="chat-source-item">Chapter Name: ${escapeHtml(chapter || "Retrieved context")}</span>
                <span class="chat-source-item">Retrieved Knowledge Chunks: ${escapeHtml(chunks)} contextual chunks</span>
                <span class="chat-source-item">Books Used: ${escapeHtml(booksUsed)}</span>
                <span class="chat-source-item">Confidence Score: ${escapeHtml(confidence)}</span>
                <div class="coverage-meter" aria-label="Knowledge coverage ${coverage}%">
                    <span class="chat-source-label">Knowledge Coverage:</span>
                    <span class="coverage-bar">${coverageBar}</span>
                    <strong>${coverage}%</strong>
                </div>
            </div>
        `;
    }

    function buildImportantPoints(answerText) {
        if (/important points to remember/i.test(answerText)) return "";

        const points = getCleanLines(answerText)
            .map((line) => line.replace(/^[-*•\s✦]+/, "").trim())
            .filter(Boolean)
            .slice(0, 3);

        if (points.length === 0) return "";

        return `
            <div class="important-points">
                <h4 class="answer-section-heading">Important Points to Remember</h4>
                <ul class="chat-bubble-list">
                    ${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    function buildRelatedQuestions(answerText) {
        const related = [...DEFAULT_RELATED_QUESTIONS];
        if (/devadasi/i.test(answerText)) related.unshift("What is the role of Devadasis in Bharatanatyam?");
        if (/abhinaya/i.test(answerText)) related.unshift("Explain the types of Abhinaya.");
        if (/nritta|nritya|natya/i.test(answerText)) related.unshift("Differentiate between Nritta, Nritya and Natya.");

        return `
            <div class="related-questions">
                <span class="related-title">Related Questions:</span>
                <div class="related-question-list">
                    ${related.slice(0, 5).map((question) => `
                        <button type="button" class="related-question-btn" data-question="${escapeHtml(question)}">${escapeHtml(question)}</button>
                    `).join("")}
                </div>
            </div>
        `;
    }

    function createMessageMeta(timestamp) {
        return `<div class="chat-message-meta"><time>${escapeHtml(timestamp || getCurrentTimestamp())}</time></div>`;
    }

    function createUserBubble(text, timestamp, modeKey) {
        const mode = EXAM_MODES[modeKey] || EXAM_MODES.short;
        const wrapper = document.createElement("div");
        wrapper.className = "chat-message user";
        wrapper.innerHTML = `
            <div class="chat-bubble user">
                <span class="user-mode-pill">${escapeHtml(mode.label)} · ${escapeHtml(mode.marks)}</span>
                <p class="chat-bubble-text">${escapeHtml(text)}</p>
                ${createMessageMeta(timestamp)}
            </div>
        `;
        return wrapper;
    }

    function createAiBubble(message) {
        const chapter = message.chapter || extractChapter(message.content);
        const mode = EXAM_MODES[message.mode] || EXAM_MODES.short;
        const keywords = extractKeywords(message.content, message.sourceQuestion);
        const studyData = {
            importantPoints: extractImportantPoints(message.content),
            revisionNotes: buildRevisionNotes(message.content),
            vivaQuestions: buildVivaQuestionsList(message.sourceQuestion, keywords),
            keywords
        };
        const estimatedMinutes = getEstimatedStudyTime(message.content);
        const difficulty = getDifficulty(message);
        const answerLength = getAnswerLengthLabel(message.mode);
        const bookmarked = isBookmarked(message.sourceQuestion || "", message.content);
        const wrapper = document.createElement("div");
        wrapper.className = "chat-message ai";
        wrapper.innerHTML = `
            <div class="chat-avatar" aria-hidden="true">N</div>
            <div class="chat-bubble ai">
                <div class="assistant-heading-row">
                    <span class="chat-sender">Nritya.ai Exam Mentor</span>
                    <span class="assistant-mode-pill">${escapeHtml(mode.label)} · ${escapeHtml(mode.marks)}</span>
                </div>
                ${createMessageMeta(message.timestamp)}
                ${createAnswerTabs({ ...message, chapter }, studyData)}
                <div class="chat-actions">
                    <button type="button" class="answer-action-btn" data-action="copy" data-answer="${escapeHtml(message.content)}">Copy Answer</button>
                    <button type="button" class="answer-action-btn ${bookmarked ? "copied" : ""}" data-action="bookmark" data-question="${escapeHtml(message.sourceQuestion || "")}" data-answer="${escapeHtml(message.content)}" data-mode="${escapeHtml(message.mode || "short")}">${bookmarked ? "Bookmarked" : "Bookmark"}</button>
                </div>
            </div>
        `;
        return wrapper;
    }

    function createErrorBubble(timestamp, errorText = "") {
        const messageText = errorText || "Something went wrong while connecting to Nritya.ai. Please verify that the server is running and try again.";
        const wrapper = document.createElement("div");
        wrapper.className = "chat-message ai";
        wrapper.innerHTML = `
            <div class="chat-avatar" aria-hidden="true">N</div>
            <div class="chat-bubble ai error">
                <span class="chat-sender">Nritya.ai Exam Mentor</span>
                <p class="chat-bubble-text">${escapeHtml(messageText)}</p>
                ${createMessageMeta(timestamp)}
            </div>
        `;
        return wrapper;
    }

    function updateWelcomeVisibility() {
        const welcome = chatMessages.querySelector(".chat-welcome");
        if (welcome) welcome.classList.toggle("hidden", conversation.length > 0 || isLoading);
    }

    function scrollChatToBottom() {
        requestAnimationFrame(() => {
            chatSection.scrollIntoView({ behavior: "smooth", block: "end" });
            const lastMessage = chatMessages.lastElementChild;
            if (lastMessage) lastMessage.scrollIntoView({ behavior: "smooth", block: "end" });
        });
    }

    function appendUserMessage(text, modeKey) {
        const message = { role: "user", content: text, mode: modeKey, timestamp: getCurrentTimestamp() };
        conversation.push(message);
        saveConversation();
        recordQuestionAsked();
        chatMessages.appendChild(createUserBubble(message.content, message.timestamp, message.mode));
        updateWelcomeVisibility();
        scrollChatToBottom();
    }

    function appendAiMessage(answerText, modeKey, sourceQuestion, metadata = {}) {
        const message = {
            role: "assistant",
            content: answerText,
            chapter: extractChapter(answerText),
            mode: modeKey,
            sourceQuestion,
            sources: Array.isArray(metadata.sources) ? metadata.sources : [],
            retrieval: metadata.retrieval || {},
            bookFilter: metadata.bookFilter || getSelectedBookFilter(),
            timestamp: getCurrentTimestamp()
        };
        conversation.push(message);
        saveConversation();
        recordTopicStudied(sourceQuestion);
        updateLearningAfterAnswer(sourceQuestion, answerText, message);
        chatMessages.appendChild(createAiBubble(message));
        updateWelcomeVisibility();
        scrollChatToBottom();
    }

    function appendErrorMessage(modeKey, errorText = "") {
        const message = { role: "assistant", content: "__error__", errorText, mode: modeKey, timestamp: getCurrentTimestamp() };
        conversation.push(message);
        saveConversation();
        chatMessages.appendChild(createErrorBubble(message.timestamp, errorText));
        updateWelcomeVisibility();
        scrollChatToBottom();
    }

    function showTypingIndicator() {
        removeTypingIndicator();
        typingEl = document.createElement("div");
        typingEl.className = "chat-message ai typing-message";
        typingEl.id = "typingIndicator";
        typingEl.innerHTML = `
            <div class="chat-avatar" aria-hidden="true">N</div>
            <div class="chat-bubble ai typing-bubble">
                <span class="chat-sender">Nritya.ai Exam Mentor</span>
                <div class="typing-indicator">
                    <span class="typing-label">Nritya.ai is thinking...</span>
                    <span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingEl);
        updateWelcomeVisibility();
        scrollChatToBottom();
    }

    function removeTypingIndicator() {
        if (typingEl) {
            typingEl.remove();
            typingEl = null;
        }
        const existing = document.getElementById("typingIndicator");
        if (existing) existing.remove();
    }

    function renderConversation(messages) {
        chatMessages.innerHTML = "";
        if (messages.length === 0) {
            chatMessages.innerHTML = `
                <div class="chat-welcome" id="chatWelcome">
                    <div class="chat-welcome-icon" aria-hidden="true">✦</div>
                    <p class="chat-welcome-title">Welcome to Nritya.ai</p>
                    <p class="chat-welcome-text">Choose an exam mode and ask a Bharatanatyam theory question to begin.</p>
                </div>
            `;
            return;
        }

        messages.forEach((msg) => {
            if (msg.role === "user") {
                chatMessages.appendChild(createUserBubble(msg.content, msg.timestamp, msg.mode));
            } else if (msg.content === "__error__") {
                chatMessages.appendChild(createErrorBubble(msg.timestamp, msg.errorText || ""));
            } else {
                chatMessages.appendChild(createAiBubble(msg));
            }
        });
        scrollChatToBottom();
    }

    function startNewChat(force = false) {
        if (isLoading) return;
        if (!force && conversation.length > 0) {
            showSessionSummary();
            return;
        }
        conversation = [];
        localStorage.removeItem(CONVERSATION_STORAGE_KEY);
        renderConversation([]);
        questionInput.value = "";
        autoResizeInput();
        validationMsg.classList.add("hidden");
        chatInputBar.classList.remove("has-error");
        updateWelcomeVisibility();
        questionInput.focus();
    }

    newChatBtn.addEventListener("click", () => startNewChat());

    function setLoading(loading) {
        isLoading = loading;
        submitBtn.disabled = loading;
        submitBtn.setAttribute("aria-busy", loading ? "true" : "false");
        questionInput.disabled = loading;
        newChatBtn.disabled = loading;
        examModeButtons.forEach((button) => { button.disabled = loading; });
        spinner.classList.toggle("hidden", !loading);
        sendIcon.classList.toggle("hidden", loading);
        chatInputBar.classList.toggle("is-loading", loading);

        if (loading) showTypingIndicator();
        else removeTypingIndicator();
    }

    async function sendQuestion(displayQuestion, options = {}) {
        const modeKey = options.mode || getSelectedMode();
        const apiQuestion = options.apiQuestion || displayQuestion;
        const bookFilter = options.bookFilter || getSelectedBookFilter();
        appendUserMessage(displayQuestion, modeKey);
        setLoading(true);

        try {
            const response = await fetch("/ask", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: apiQuestion, book_filter: bookFilter, mode: modeKey }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                throw new Error(error.detail || "Request failed");
            }

            const data = await response.json();
            const metadata = {
                sources: data.sources || [],
                retrieval: data.retrieval || {},
                bookFilter
            };
            appendAiMessage(data.answer, modeKey, options.sourceQuestion || displayQuestion, metadata);
            saveToHistory(displayQuestion, data.answer, modeKey, metadata);
        } catch (error) {
            appendErrorMessage(modeKey, error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit() {
        const question = questionInput.value.trim();
        if (!question) {
            validationMsg.classList.remove("hidden");
            chatInputBar.classList.add("has-error");
            questionInput.focus();
            return;
        }

        questionInput.value = "";
        autoResizeInput();
        validationMsg.classList.add("hidden");
        chatInputBar.classList.remove("has-error");
        await sendQuestion(question);
    }

    function downloadTextFile(filename, content, mimeType = "text/plain") {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    }

    function escapePdfText(text) {
        return String(text).replace(/[^\x20-\x7E\n]/g, "").replace(/[\\()]/g, "\\$&");
    }

    function buildSimplePdf(text) {
        const lines = escapePdfText(text).split(/\r?\n/).flatMap((line) => {
            const chunks = [];
            for (let index = 0; index < line.length; index += 85) chunks.push(line.slice(index, index + 85));
            return chunks.length ? chunks : [""];
        }).slice(0, 45);
        const content = `BT /F1 11 Tf 50 780 Td 14 TL ${lines.map((line) => `(${line}) Tj T*`).join(" ")} ET`;
        const objects = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            `<< /Length ${content.length} >>\nstream\n${content}\nendstream`
        ];
        let pdf = "%PDF-1.4\n";
        const offsets = [0];
        objects.forEach((object, index) => {
            offsets.push(pdf.length);
            pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        });
        const xref = pdf.length;
        pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        offsets.slice(1).forEach((offset) => {
            pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
        });
        pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
        return pdf;
    }

    chatMessages.addEventListener("click", async (event) => {
        const tabButton = event.target.closest(".answer-tab");
        if (tabButton) {
            const tabsRoot = tabButton.closest(".answer-tabs");
            const targetPanel = tabButton.dataset.answerTab;
            tabsRoot.querySelectorAll(".answer-tab").forEach((button) => {
                const isActive = button === tabButton;
                button.classList.toggle("active", isActive);
                button.setAttribute("aria-selected", isActive ? "true" : "false");
            });
            tabsRoot.querySelectorAll(".answer-tab-panel").forEach((panel) => {
                panel.classList.toggle("active", panel.dataset.answerPanel === targetPanel);
            });
            return;
        }

        const relatedButton = event.target.closest(".related-question-btn");
        if (relatedButton && !isLoading) {
            await sendQuestion(relatedButton.dataset.question || relatedButton.textContent.trim());
            return;
        }

        const actionButton = event.target.closest(".answer-action-btn");
        if (!actionButton || isLoading) return;

        const answerText = actionButton.dataset.answer || "";
        const action = actionButton.dataset.action;

        if (action === "copy") {
            try {
                await navigator.clipboard.writeText(answerText);
                actionButton.classList.add("copied");
                actionButton.textContent = "Copied";
                setTimeout(() => {
                    actionButton.classList.remove("copied");
                    actionButton.textContent = "Copy Answer";
                }, 1600);
            } catch {
                actionButton.textContent = "Copy failed";
            }
            return;
        }

        if (action === "txt") {
            downloadTextFile("nritya-answer.txt", answerText);
            return;
        }

        if (action === "pdf") {
            downloadTextFile("nritya-answer.pdf", buildSimplePdf(answerText), "application/pdf");
            return;
        }

        if (action === "bookmark") {
            const bookmarked = toggleBookmark(actionButton.dataset.question || "", answerText, {
                mode: actionButton.dataset.mode || getSelectedMode()
            });
            actionButton.classList.toggle("copied", bookmarked);
            actionButton.textContent = bookmarked ? "Bookmarked" : "Bookmark";
            return;
        }

        if (action === "open-tab") {
            const tabsRoot = actionButton.closest(".chat-bubble").querySelector(".answer-tabs");
            const targetTab = tabsRoot.querySelector(`[data-answer-tab="${actionButton.dataset.tabTarget}"]`);
            if (targetTab) targetTab.click();
        }
    });

    document.addEventListener("click", async (event) => {
        const completionToggle = event.target.closest(".topic-complete-toggle");
        if (completionToggle) {
            const completed = getCompletedTopics();
            const topic = completionToggle.dataset.topic;
            const nextCompleted = completionToggle.checked
                ? [...new Set([...completed, topic])]
                : completed.filter((item) => item !== topic);
            saveCompletedTopics(nextCompleted);
            renderLearningDashboard();
            return;
        }

        const removeBookmarkBtn = event.target.closest('[data-action="remove-bookmark"]');
        if (removeBookmarkBtn) {
            const bookmarks = getBookmarks().filter((bookmark) => bookmark.id !== removeBookmarkBtn.dataset.bookmarkId);
            saveBookmarks(bookmarks);
            renderSavedNotes();
            renderConversation(conversation);
            return;
        }

        const savedQuestionBtn = event.target.closest("#favoriteQuestionsList .related-question-btn");
        if (savedQuestionBtn && !isLoading) {
            switchTab("home");
            await sendQuestion(savedQuestionBtn.dataset.question || savedQuestionBtn.textContent.trim());
        }
    });

    if (continueSessionBtn) continueSessionBtn.addEventListener("click", hideSessionSummary);
    if (confirmEndSessionBtn) {
        confirmEndSessionBtn.addEventListener("click", () => {
            hideSessionSummary();
            resetSessionLearning();
            startNewChat(true);
            renderLearningDashboard();
        });
    }

    function getHistory() {
        const history = JSON.parse(localStorage.getItem("nritya_history")) || [];
        if (!Array.isArray(history)) return [];
        const cleanedHistory = history.filter((item) => !isInstructionEchoAnswer(item.answer));
        if (cleanedHistory.length !== history.length) {
            localStorage.setItem("nritya_history", JSON.stringify(cleanedHistory));
        }
        return cleanedHistory;
    }

    function saveToHistory(question, answer, modeKey, metadata = {}) {
        let history = getHistory();
        if (history.length > 0 && history[0].question === question) return;

        history.unshift({
            question,
            answer,
            mode: modeKey,
            sources: metadata.sources || [],
            retrieval: metadata.retrieval || {},
            bookFilter: metadata.bookFilter || getSelectedBookFilter(),
            timestamp: getCurrentTimestamp()
        });
        if (history.length > 20) history.pop();
        localStorage.setItem("nritya_history", JSON.stringify(history));
    }

    function renderHistory() {
        const history = getHistory();
        historyList.innerHTML = "";

        if (history.length === 0) {
            historyList.innerHTML = `<div class="history-empty">No questions asked yet. Answers will be logged here.</div>`;
            return;
        }

        history.forEach((item) => {
            const mode = EXAM_MODES[item.mode] || EXAM_MODES.short;
            const card = document.createElement("div");
            card.className = "history-item";
            card.innerHTML = `
                <div class="history-q">${escapeHtml(item.question)}</div>
                <div class="history-a">${escapeHtml(item.answer)}</div>
                <div class="history-meta">
                    <span class="char-counter">${escapeHtml(mode.label)} · ${escapeHtml(item.timestamp || "")}</span>
                </div>
            `;

            card.addEventListener("click", () => {
                switchTab("home");
                conversation = [
                    { role: "user", content: item.question, mode: item.mode || "short", timestamp: item.timestamp || getCurrentTimestamp() },
                    {
                        role: "assistant",
                        content: item.answer,
                        chapter: extractChapter(item.answer),
                        mode: item.mode || "short",
                        sourceQuestion: item.question,
                        sources: item.sources || [],
                        retrieval: item.retrieval || {},
                        bookFilter: item.bookFilter || "all",
                        timestamp: item.timestamp || getCurrentTimestamp()
                    },
                ];
                saveConversation();
                renderConversation(conversation);
                chatSection.scrollIntoView({ behavior: "smooth", block: "start" });
            });

            historyList.appendChild(card);
        });
    }

    // ================= AUTH GATING & INITIALIZATION =================
    initTheme();
    applyAppMigrations();

    const isLoggedIn = !!localStorage.getItem("nritya_admin_token");
    if (isLoggedIn) {
        showApp();
        renderSidebarProfile();
        renderStudyProgress();
        setSelectedMode(getSelectedMode());
        setSelectedBookFilter(getSelectedBookFilter());
        loadBookOptions();
        loadKnowledgeStats();
        getSessionStartTime();
        renderLearningDashboard();
        renderSavedNotes();
        autoResizeInput();
        setInputBarVisible(true);
        conversation = loadConversation();
        renderConversation(conversation);
    } else {
        showLoginScreen();
    }
});
