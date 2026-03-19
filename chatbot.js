document.addEventListener("DOMContentLoaded", function () {
    const chatBox = document.querySelector(".chat-box");
    const welcomeScreen = document.getElementById("welcome-screen");
    const startButton = document.getElementById("start-chatting");
    const clearChatButtonSidebar = document.getElementById("clear-chat-sidebar");
    const settingsButtonSidebar = document.getElementById("settings-button");
    const aboutButtonSidebar = document.getElementById("about-button");
    const sidebarToggle = document.querySelector(".sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const fileAttachButton = document.querySelector(".file-attach");
    const fileInput = document.getElementById("file-upload");
    const inputArea = document.getElementById("input-area");
    const inputPlaceholder = document.getElementById("input-placeholder");
    const userInput = document.getElementById("user-input");
    const sendButton = document.getElementById("send-button");

    let attachedFile = null;

    const chatHistoryKey = "medical_study_assistant_history";
    const firstMessageKey = "medical_study_assistant_first_message";
    const GEMINI_API_KEY = "API KEY CONFIDENTIAL"; // Replace with your actual API key
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const medicalKeywords = ["anatomy", "physiology", "pathology", "pharmacology", "diagnosis", "treatment", "symptoms", "disease", "syndrome", "bacteria", "virus", "cell", "gene", "muscle", "bone", "nerve", "heart", "lung", "kidney", "liver", "brain"];

    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem(chatHistoryKey)) || [];
        if (history.length > 0) {
            history.forEach(msg => addMessage(msg.text, msg.sender, false));
            chatBox.classList.add("has-messages");
            showInputSection();
        } else {
            chatBox.classList.remove("has-messages");
            welcomeScreen.style.display = "flex";
            hideInputSection();
        }
        scrollToBottom();
    }

    function storeChat(userInput, botResponse) {
        let history = JSON.parse(localStorage.getItem(chatHistoryKey)) || [];
        if (!localStorage.getItem(firstMessageKey)) {
            localStorage.setItem(firstMessageKey, userInput);
        }
        history.push({ text: userInput, sender: "user" });
        history.push({ text: botResponse, sender: "bot" });
        localStorage.setItem(chatHistoryKey, JSON.stringify(history));
    }

    function getFirstMessage() {
        return localStorage.getItem(firstMessageKey) || "I don't remember the first question.";
    }

    function getChatHistoryForContext() {
        let history = JSON.parse(localStorage.getItem(chatHistoryKey)) || [];
        const recentHistory = history.slice(-6);
        return recentHistory.map(entry => `${entry.sender}: ${entry.text}`).join("\n");
    }

    function handleSpecialQueries(userMessage) {
        const lowerCaseMessage = userMessage.toLowerCase();
        if (lowerCaseMessage.includes("first question i asked")) {
            return `The first question you asked was: "${getFirstMessage()}".`;
        }
        return null;
    }

    async function fetchGeminiResponse(userMessage) {
        const typingIndicator = showTypingIndicator();

        let specialResponse = handleSpecialQueries(userMessage);
        if (specialResponse) {
            removeTypingIndicator(typingIndicator);
            addMessage(specialResponse, "bot");
            return;
        }

        let chatContext = getChatHistoryForContext();
        const systemMessage = `You are a helpful medical tutor. When a user asks about a medical topic, provide a concise summary of the topic followed by 5 multiple-choice questions (MCQs) related to the summary. Each MCQ should have four options (A, B, C, D) and clearly indicate the correct answer. If the user asks a question outside of medical topics, gently inform them that you can only assist with medical learning.`;

        const prompt = `${systemMessage}\n\nPrevious conversation:\n${chatContext}\nUser: ${userMessage}\n\nResponse:`;

        try {
            const response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            removeTypingIndicator(typingIndicator);
            const data = await response.json();

            if (data.candidates && data.candidates.length > 0) {
                const botReply = data.candidates[0]?.content?.parts?.[0]?.text || "I couldn't find information on that topic. Please try a different query.";
                addMessage(botReply, "bot");
                storeChat(userMessage, botReply);
            } else {
                addMessage("I couldn't process that medical query. Please try again.", "bot");
            }
        } catch (error) {
            removeTypingIndicator(typingIndicator);
            addMessage("Oops! Something went wrong while fetching the medical information. Please try again later.", "bot");
            console.error("Gemini API Error:", error);
        }
    }

    function clearChatHistory() {
        localStorage.removeItem(chatHistoryKey);
        localStorage.removeItem(firstMessageKey);
        chatBox.innerHTML = "";
        chatBox.classList.remove("has-messages");
        welcomeScreen.style.display = "flex";
        hideInputSection();
        startButton.addEventListener("click", handleStartChatting);
        handleStartChatting();
    }

    function showSettings() {
        alert("Settings functionality will be implemented here (e.g., adjust difficulty of MCQs).");
        toggleSidebar();
    }

    function showAbout() {
        alert("About this Medical Study Assistant.\n\nThis assistant is designed to help you learn medical concepts through summaries and practice questions.\n\nDeveloped By:\nNippun 12309292\nTanishka Soni 12319510");
        toggleSidebar();
    }

    function addMessage(content, sender = "user", save = true) {
        if (!content.trim()) return;

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender === "user" ? "user-message" : "bot-message");
        messageDiv.innerHTML = content.replace(/\n/g, '<br>'); // Allow line breaks in messages

        chatBox.appendChild(messageDiv);
        chatBox.classList.add("has-messages");
        scrollToBottom();

        if (save && sender === "bot") {
            storeChat(userInput.value, content);
        }
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement("div");
        typingDiv.classList.add("message", "bot-message", "typing");
        typingDiv.innerText = "Fetching medical information and generating questions...";
        chatBox.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }

    function removeTypingIndicator(indicator) {
        if (indicator && indicator.parentNode === chatBox) {
            chatBox.removeChild(indicator);
            scrollToBottom();
        }
    }

    function sendMessage() {
        const messageText = userInput.value.trim();
        if (messageText === "") return;

        addMessage(messageText, "user");
        userInput.value = "";
        fetchGeminiResponse(messageText);
    }

    function scrollToBottom() {
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function toggleSidebar() {
        sidebar.classList.toggle("collapsed");
    }

    function showInputSection() {
        inputPlaceholder.classList.add("hidden-input");
        userInput.classList.remove("hidden-input");
        sendButton.classList.remove("hidden-input");
        welcomeScreen.style.display = "none";
        userInput.focus();
    }

    function hideInputSection() {
        inputPlaceholder.classList.remove("hidden-input");
        userInput.classList.add("hidden-input");
        sendButton.classList.add("hidden-input");
    }

    function handleStartChatting() {
        showInputSection();
    }

    startButton.addEventListener("click", handleStartChatting);
    sendButton.addEventListener("click", sendMessage);
    userInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            sendMessage();
        }
    });

    sidebarToggle.addEventListener("click", toggleSidebar);
    clearChatButtonSidebar.addEventListener("click", clearChatHistory);
    settingsButtonSidebar.addEventListener("click", showSettings);
    aboutButtonSidebar.addEventListener("click", showAbout);

    fileAttachButton.addEventListener("click", () => {
        alert("File attachment is not relevant for this Medical Study Assistant.");
    });

    fileInput.addEventListener("change", (event) => {
        alert("File upload is not supported for medical queries.");
    });

    const exampleQueryItems = document.querySelectorAll(".example-queries li");
    exampleQueryItems.forEach(item => {
        item.addEventListener("click", () => {
            userInput.value = item.innerText;
            showInputSection();
            sendMessage();
        });
    });

    loadChatHistory();
});
