// Theme Manager: Dark Mode, Light Mode, and System Preference

const THEME_STORAGE_KEY = "gg_cal_theme"; // "light", "dark", "system"

// Get stored theme or default to "system"
function getStoredTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "system";
}

// Check if system prefers dark mode
function isSystemDarkMode() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// Apply theme to document <html> element
function applyTheme(theme) {
  const root = document.documentElement;
  const targetTheme = theme || getStoredTheme();

  if (targetTheme === "dark") {
    root.classList.add("dark");
  } else if (targetTheme === "light") {
    root.classList.remove("dark");
  } else {
    // "system"
    if (isSystemDarkMode()) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  updateThemeUI(targetTheme);
}

// Set theme and save to localStorage
function setTheme(theme) {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  closeThemeMenu();

  const labels = {
    light: "Chế độ Sáng 🌞",
    dark: "Chế độ Tối 🌙",
    system: "Theo Hệ Thống 💻"
  };
  if (typeof showToast === "function") {
    showToast(`Đã chuyển sang ${labels[theme] || theme}`);
  }
}

// Toggle between light and dark (or cycle)
function toggleTheme() {
  const current = getStoredTheme();
  if (current === "light") {
    setTheme("dark");
  } else if (current === "dark") {
    setTheme("system");
  } else {
    setTheme("light");
  }
}

// Update Theme Switcher Button UI & Dropdown Active State
function updateThemeUI(activeTheme) {
  const current = activeTheme || getStoredTheme();
  const isDarkApplied = document.documentElement.classList.contains("dark");

  // Update header button icon & label
  const btnIcon = document.getElementById("theme-btn-icon");
  const btnLabel = document.getElementById("theme-btn-label");

  if (btnIcon) {
    if (current === "dark") {
      btnIcon.className = "fa-solid fa-moon text-indigo-400";
    } else if (current === "light") {
      btnIcon.className = "fa-solid fa-sun text-amber-500";
    } else {
      btnIcon.className = "fa-solid fa-circle-half-stroke text-indigo-500";
    }
  }

  if (btnLabel) {
    if (current === "dark") btnLabel.innerText = "Tối";
    else if (current === "light") btnLabel.innerText = "Sáng";
    else btnLabel.innerText = "Hệ thống";
  }

  // Update checkmarks in dropdown menu
  ["light", "dark", "system"].forEach(t => {
    const item = document.getElementById(`theme-opt-${t}`);
    const check = document.getElementById(`theme-check-${t}`);
    if (item && check) {
      if (t === current) {
        item.classList.add("bg-indigo-50", "dark:bg-indigo-950/60", "text-indigo-600", "dark:text-indigo-400", "font-bold");
        item.classList.remove("text-slate-700", "dark:text-slate-300");
        check.classList.remove("hidden");
      } else {
        item.classList.remove("bg-indigo-50", "dark:bg-indigo-950/60", "text-indigo-600", "dark:text-indigo-400", "font-bold");
        item.classList.add("text-slate-700", "dark:text-slate-300");
        check.classList.add("hidden");
      }
    }
  });
}

// Toggle theme dropdown menu
function toggleThemeMenu() {
  const menu = document.getElementById("theme-dropdown");
  if (menu) menu.classList.toggle("hidden");
}

function closeThemeMenu() {
  const menu = document.getElementById("theme-dropdown");
  if (menu) menu.classList.add("hidden");
}

// Initialize theme listeners
function initTheme() {
  // Apply initial theme
  applyTheme(getStoredTheme());

  // Listen to OS system preference changes
  if (window.matchMedia) {
    const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    try {
      colorSchemeQuery.addEventListener("change", () => {
        if (getStoredTheme() === "system") {
          applyTheme("system");
        }
      });
    } catch (e) {
      // Fallback for older browsers
      colorSchemeQuery.addListener(() => {
        if (getStoredTheme() === "system") {
          applyTheme("system");
        }
      });
    }
  }

  // Close theme dropdown when clicking outside
  document.addEventListener("click", (e) => {
    const menu = document.getElementById("theme-dropdown");
    const btn = document.getElementById("btn-theme-menu");
    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
      menu.classList.add("hidden");
    }
  });
}

// Immediate execution to prevent FOUC
(function() {
  const current = localStorage.getItem(THEME_STORAGE_KEY) || "system";
  if (current === "dark" || (current === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
})();
