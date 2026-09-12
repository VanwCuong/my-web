import { initBackground } from "./three-background.js";

try {
  initBackground();
} catch (err) {
  console.warn("Không khởi tạo được nền 3D:", err);
}

const themeToggle = document.getElementById("theme-toggle");
const storedTheme = localStorage.getItem("theme");
const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
const initialTheme = storedTheme || (prefersLight ? "light" : "dark");
document.documentElement.dataset.theme = initialTheme;

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});

const navToggle = document.getElementById("nav-toggle");
const navMenu = document.getElementById("nav-menu");

function closeNavMenu() {
  navMenu.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Mở menu");
}

navToggle.addEventListener("click", () => {
  const isOpen = navMenu.classList.contains("open");
  if (isOpen) {
    closeNavMenu();
    return;
  }

  navMenu.classList.add("open");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Đóng menu");
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    closeNavMenu();
  });
});

document.addEventListener("click", (event) => {
  const clickedToggle = event.target.closest("#nav-toggle");
  const clickedMenu = event.target.closest("#nav-menu");

  if (!clickedToggle && !clickedMenu && navMenu.classList.contains("open")) {
    closeNavMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navMenu.classList.contains("open")) {
    closeNavMenu();
    navToggle.focus();
  }
});

const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".nav__link");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((l) => {
          const active = l.getAttribute("href") === `#${entry.target.id}`;
          if (active) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      }
    });
  },
  { rootMargin: "-40% 0px -55% 0px" }
);
sections.forEach((s) => sectionObserver.observe(s));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const target = entry.target;

      if (entry.isIntersecting) {
        if (target.classList.contains("in-view")) return;

        const parent = target.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) => c.classList.contains("reveal"));
          const i = siblings.indexOf(target);
          if (i > 0) target.style.setProperty("--reveal-delay", Math.min(i * 80, 320) + "ms");
        }

        target.classList.add("in-view");
        return;
      }

      target.classList.remove("in-view");
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".reveal, .skill-card").forEach((el) => revealObserver.observe(el));

const sectionNavLinks = document.querySelectorAll(".vc-section-link");

function clearSectionNavHover() {
  sectionNavLinks.forEach((link) => {
    link.classList.remove("is-hovered", "is-dimmed");
  });
}

function updateSectionNavFocus(link) {
  if (!link) {
    clearSectionNavHover();
    return;
  }

  sectionNavLinks.forEach((item) => {
    const isActive = item === link;
    item.classList.toggle("is-hovered", isActive);
    item.classList.toggle("is-dimmed", !isActive);
  });
}

sectionNavLinks.forEach((link) => {
  link.addEventListener("pointerenter", () => updateSectionNavFocus(link));
  link.addEventListener("pointerleave", () => clearSectionNavHover());
  link.addEventListener("focus", () => updateSectionNavFocus(link));
  link.addEventListener("blur", () => clearSectionNavHover());
  link.addEventListener("click", () => updateSectionNavFocus(link));
});

window.addEventListener("wheel", () => {
  clearSectionNavHover();
}, { passive: true });

window.addEventListener("scroll", () => {
  clearSectionNavHover();
}, { passive: true });

window.addEventListener("pointermove", (event) => {
  const hoveredLink = document.elementFromPoint(event.clientX, event.clientY)?.closest(".vc-section-link");
  if (hoveredLink) {
    updateSectionNavFocus(hoveredLink);
  } else {
    clearSectionNavHover();
  }
}, { passive: true });

const toast = document.getElementById("toast");
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  requestAnimationFrame(() => toast.classList.add("visible"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => (toast.hidden = true), 300);
  }, 2600);
}

const EMAIL = "example@email.com";

document.getElementById("copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    showToast("Đã sao chép email: " + EMAIL);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = EMAIL;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    showToast("Đã sao chép email: " + EMAIL);
  }
});

const FORM_ENDPOINT = null;

const form = document.getElementById("contact-form");

function setError(input, errorEl, hasError) {
  input.setAttribute("aria-invalid", String(hasError));
  errorEl.hidden = !hasError;
  return !hasError;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const message = form.elements.message;

  const okName = setError(name, document.getElementById("e-name"), name.value.trim() === "");
  const okEmail = setError(
    email,
    document.getElementById("e-email"),
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
  );
  const okMsg = setError(
    message,
    document.getElementById("e-message"),
    message.value.trim().length < 10
  );

  if (!(okName && okEmail && okMsg)) {
    showToast("Vui lòng sửa các lỗi trong biểu mẫu.");
    return;
  }

  if (FORM_ENDPOINT) {
    try {
      const res = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: name.value.trim(),
          email: email.value.trim(),
          message: message.value.trim(),
        }),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      showToast("Đã gửi tin nhắn thành công. Cảm ơn bạn!");
      form.reset();
    } catch {
      showToast("Gửi thất bại. Vui lòng thử lại hoặc email trực tiếp.");
    }
  } else {
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.classList.add("is-loading");
    btn.textContent = "Đang gửi…";
    setTimeout(() => {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.textContent = "Gửi tin nhắn";
      showToast("Đã kiểm tra dữ liệu hợp lệ! (Demo — chưa kết nối máy chủ)");
      form.reset();
    }, 800);
  }
});

form.querySelectorAll("input, textarea").forEach((el) => {
  el.addEventListener("input", () => {
    el.removeAttribute("aria-invalid");
    const err = document.getElementById("e-" + el.name);
    if (err) err.hidden = true;
  });
});

document.getElementById("year").textContent = new Date().getFullYear();
