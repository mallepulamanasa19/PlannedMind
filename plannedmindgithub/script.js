
"use strict";

// ==========================================
// 1. GET HTML ELEMENTS
// ==========================================

const taskForm = document.getElementById("taskForm");
const taskList = document.getElementById("taskList");
const themeSelect = document.getElementById("themeSelect");

const generatePlanButton = document.getElementById("generatePlan");
const enableRemindersButton = document.getElementById("enableReminders");
const reminderStatus = document.getElementById("reminderStatus");

// ==========================================
// 2. LOAD AND SAVE TASKS
// ==========================================

function loadTasks() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("studyTasks") || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved.filter(function (task) {
            return task &&
                typeof task.name === "string" &&
                typeof task.subject === "string";
        }).map(function (task) {
            return {
                ...task,
                id: task.id || (
                    Date.now().toString() +
                    Math.random().toString(16).slice(2)
                ),
                type: task.type || "Subject Study",
                duration: Number(task.duration) || 60,
                priority: task.priority || "Medium",
                reminderTime: task.reminderTime || "",
                completed: Boolean(task.completed),
                reminderSentDate: task.reminderSentDate || ""
            };
        });
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

let tasks = loadTasks();

function saveTasks() {
    try {
        localStorage.setItem("studyTasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        alert("Your tasks could not be saved. Check browser storage.");
        return false;
    }
}

// ==========================================
// 3. DASHBOARD STATISTICS
// ==========================================

function updateDashboard() {
    const total = tasks.length;

    const completed = tasks.filter(function (task) {
        return task.completed;
    }).length;

    const pending = total - completed;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    const totalElement = document.getElementById("totalTasks");
    const completedElement = document.getElementById("completedTasks");
    const pendingElement = document.getElementById("pendingTasks");
    const percentageElement = document.getElementById("progressPercent");
    const progressBar = document.getElementById("progressBar");

    if (totalElement) totalElement.textContent = total;
    if (completedElement) completedElement.textContent = completed;
    if (pendingElement) pendingElement.textContent = pending;
    if (percentageElement) percentageElement.textContent = percentage + "%";

    if (progressBar) {
        progressBar.style.width = percentage + "%";
    }
}

// ==========================================
// 4. THEME SELECTION
// ==========================================


/* Lavender theme only */
document.body.dataset.theme = "lavender";

// ==========================================
// 5. DISPLAY SAVED TASKS
// ==========================================

function renderTasks() {
    if (!taskList) return;

    taskList.replaceChildren();

    if (tasks.length === 0) {
        const emptyMessage = document.createElement("li");
        emptyMessage.textContent =
            "No study tasks yet. Add your first task above! 📚";

        taskList.appendChild(emptyMessage);
        updateDashboard();
        return;
    }

    tasks.forEach(function (task) {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const details = document.createElement("div");
        details.className = "task-details";

        const title = document.createElement("strong");
        title.className = "task-title";
        title.textContent = task.name;

        const info = document.createElement("p");
        info.textContent =
            "Subject: " + task.subject +
            " | Type: " + task.type;

        const deadline = document.createElement("p");
        deadline.textContent =
            "Deadline: " + (task.dueDate || "Not set") +
            " | Duration: " + task.duration + " minutes";

        const priority = document.createElement("p");
        priority.textContent =
            "Priority: " + task.priority +
            (task.reminderTime
                ? " | Daily reminder: " + task.reminderTime
                : "");

        details.append(title, info, deadline, priority);

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const completeButton = document.createElement("button");
        completeButton.type = "button";
        completeButton.textContent =
            task.completed ? "Undo" : "Complete";

        completeButton.addEventListener("click", function () {
            task.completed = !task.completed;

            if (saveTasks()) {
                renderTasks();
            }
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function () {
            if (!confirm("Delete this study task?")) return;

            tasks = tasks.filter(function (savedTask) {
                return savedTask.id !== task.id;
            });

            if (saveTasks()) {
                renderTasks();
            }
        });

        actions.append(completeButton, deleteButton);
        item.append(details, actions);
        taskList.appendChild(item);
    });

    updateDashboard();
}

// ==========================================
// 6. ADD A NEW STUDY TASK
// ==========================================

if (taskForm) {
    taskForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("taskName").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const type = document.getElementById("taskType").value;
        const dueDate = document.getElementById("dueDate").value;
        const duration = Number(
            document.getElementById("duration").value
        );
        const priority = document.getElementById("priority").value;
        const reminderTime =
            document.getElementById("reminderTime").value;

        if (!name || !subject || !dueDate) {
            alert("Please fill in the task name, subject and deadline.");
            return;
        }

        if (!Number.isFinite(duration) || duration < 15 || duration > 600) {
            alert("Study duration must be between 15 and 600 minutes.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(dueDate + "T00:00:00");

        if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
            alert("Please choose today or a future deadline.");
            return;
        }

        const task = {
            id: Date.now().toString() +
                Math.random().toString(16).slice(2),
            name: name,
            subject: subject,
            type: type,
            dueDate: dueDate,
            duration: duration,
            priority: priority,
            reminderTime: reminderTime,
            completed: false,
            reminderSentDate: ""
        };

        tasks.push(task);

        if (saveTasks()) {
            renderTasks();
            taskForm.reset();

            document.getElementById("duration").value = 60;
            document.getElementById("priority").value = "Medium";

            alert("Task saved successfully! 📚");
        } else {
            tasks.pop();
        }
    });
}

// ==========================================
// 7. GENERATE A STUDY PLAN
// ==========================================

if (generatePlanButton) {
    generatePlanButton.addEventListener("click", function () {
        const hours = Number(
            document.getElementById("studyHours").value
        );

        const planType =
            document.getElementById("planType").value;

        const startTime =
            document.getElementById("studyStart").value || "17:00";

        const breakMinutes = Number(
            document.getElementById("breakMinutes").value
        );

        const output =
            document.getElementById("studyPlanOutput");

        output.replaceChildren();

        if (!Number.isInteger(hours) || hours < 1 || hours > 12) {
            output.textContent = "Enter between 1 and 12 study hours.";
            return;
        }

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        function formatDate(date) {
            return [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, "0"),
                String(date.getDate()).padStart(2, "0")
            ].join("-");
        }

        const todayString = formatDate(now);
        const weekEnd = new Date(now);
        weekEnd.setDate(now.getDate() + 6);
        const weekEndString = formatDate(weekEnd);

        let selectedTasks = tasks.filter(function (task) {
            if (task.completed || !task.dueDate) return false;

            if (planType === "daily") {
                return task.dueDate <= todayString;
            }

            return task.dueDate <= weekEndString;
        });

        const priorityRank = {
            High: 0,
            Medium: 1,
            Low: 2
        };

        selectedTasks.sort(function (a, b) {
            if (planType === "urgent") {
                const difference =
                    (priorityRank[a.priority] ?? 1) -
                    (priorityRank[b.priority] ?? 1);

                if (difference !== 0) return difference;
            }

            return a.dueDate.localeCompare(b.dueDate);
        });

        if (selectedTasks.length === 0) {
            output.textContent =
                "No matching pending tasks. Add tasks with deadlines first.";
            return;
        }

        const heading = document.createElement("h3");

        heading.textContent =
            planType === "daily"
                ? "Today's Study Plan"
                : planType === "weekly"
                    ? "Weekly Study Plan"
                    : "Deadline Priority Plan";

        output.appendChild(heading);

        let currentMinutes =
            Number(startTime.split(":")[0]) * 60 +
            Number(startTime.split(":")[1]);

        const availableMinutes = hours * 60;
        let usedMinutes = 0;
        let plannedCount = 0;

        function formatTime(minutes) {
            const hour = Math.floor(minutes / 60) % 24;
            const minute = minutes % 60;
            const suffix = hour >= 12 ? "PM" : "AM";

            return (
                (hour % 12 || 12) + ":" +
                String(minute).padStart(2, "0") + " " + suffix
            );
        }

        selectedTasks.forEach(function (task) {
            if (usedMinutes >= availableMinutes) return;

            const duration = Math.min(
                Number(task.duration) || 60,
                availableMinutes - usedMinutes
            );

            const card = document.createElement("div");
            card.className = "plan-item";

            const title = document.createElement("h3");
            title.textContent = task.name;

            const details = document.createElement("p");
            details.textContent =
                task.subject + " • " + task.type +
                " • " + task.priority + " priority";

            const session = document.createElement("p");
            session.textContent =
                formatTime(currentMinutes) + " – " +
                formatTime(currentMinutes + duration) +
                " (" + duration + " minutes)";

            const deadline = document.createElement("p");
            deadline.textContent = "Deadline: " + task.dueDate;

            card.append(title, details, session, deadline);
            output.appendChild(card);

            usedMinutes += duration;
            currentMinutes += duration + breakMinutes;
            plannedCount++;
        });

        const note = document.createElement("p");
        note.className = "plan-message";
        note.textContent =
            plannedCount + " task(s) scheduled. " +
            "Review the remaining tasks and adjust your schedule as needed.";

        output.appendChild(note);
    });
}

// ==========================================
// 8. DAILY BROWSER STUDY REMINDERS
// ==========================================

function getTodayString() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function checkStudyReminders() {
    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;

    const now = new Date();

    const currentTime =
        String(now.getHours()).padStart(2, "0") + ":" +
        String(now.getMinutes()).padStart(2, "0");

    const today = getTodayString();
    let changed = false;

    tasks.forEach(function (task) {
        if (
            task.completed ||
            !task.reminderTime ||
            task.reminderTime !== currentTime ||
            task.reminderSentDate === today
        ) {
            return;
        }

        new Notification("PlannedMind Study Reminder 📚", {
            body: "Time to study " + task.subject + ": " + task.name
        });

        task.reminderSentDate = today;
        changed = true;
    });

    if (changed) saveTasks();
}

if (enableRemindersButton) {
    enableRemindersButton.addEventListener("click", async function () {
        if (!("Notification" in window)) {
            if (reminderStatus) {
                reminderStatus.textContent =
                    "Your browser does not support notifications.";
            }
            return;
        }

        try {
            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {
                if (reminderStatus) {
                    reminderStatus.textContent =
                        "Reminders enabled. Keep PlannedMind open for reminders.";
                }

                checkStudyReminders();
            } else if (reminderStatus) {
                reminderStatus.textContent =
                    "Notifications are disabled. Allow them in browser settings.";
            }
        } catch (error) {
            console.error("Notification permission error:", error);

            if (reminderStatus) {
                reminderStatus.textContent =
                    "Could not enable notifications in this browser.";
            }
        }
    });
}

// Check reminders periodically while the page is open.
checkStudyReminders();
setInterval(checkStudyReminders, 20000);

// ==========================================
// 9. INITIAL PAGE LOAD
// ==========================================

renderTasks();
