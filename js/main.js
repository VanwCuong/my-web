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

navToggle.addEventListener("click", () => {
  const open = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  });
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

const finePointer = window.matchMedia("(pointer: fine)").matches;
const noMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (finePointer && !noMotion) {
  document.documentElement.classList.add("custom-cursor");
  const cursorDot = document.createElement("div");
  const cursorRing = document.createElement("div");
  cursorDot.className = "cursor-dot";
  cursorRing.className = "cursor-ring";
  cursorDot.setAttribute("aria-hidden", "true");
  cursorRing.setAttribute("aria-hidden", "true");
  document.body.append(cursorDot, cursorRing);

  let cx = innerWidth / 2, cy = innerHeight / 2, rgx = cx, rgy = cy, cursorOn = false;
  window.addEventListener("pointermove", (e) => {
    cx = e.clientX; cy = e.clientY;
    if (!cursorOn) {
      cursorOn = true;
      cursorDot.classList.add("on");
      cursorRing.classList.add("on");
    }
  }, { passive: true });
  window.addEventListener("pointerdown", () => cursorRing.classList.add("down"));
  window.addEventListener("pointerup", () => cursorRing.classList.remove("down"));
  window.addEventListener("pointerover", (e) => {
    const el = e.target;
    const isField = !!(el.closest && el.closest("input, textarea"));
    const isInteractive = !!(el.closest && el.closest("a, button, [role='button'], .skill-card, .project-card"));
    cursorRing.classList.toggle("hover", isInteractive && !isField);
    cursorRing.classList.toggle("off", isField);
    cursorDot.classList.toggle("off", isField);
  }, { passive: true });

  (function cursorLoop() {
    rgx += (cx - rgx) * 0.16;
    rgy += (cy - rgy) * 0.16;
    cursorDot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate(${rgx}px, ${rgy}px) translate(-50%, -50%)`;
    requestAnimationFrame(cursorLoop);
  })();

  document.querySelectorAll(".btn--primary, .btn--ghost, .socials a, .theme-toggle").forEach((el) => {
    const strength = 12;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${(dx / r.width) * strength}px, ${(dy / r.height) * strength}px)`;
    });
    el.addEventListener("pointerleave", () => { el.style.transform = ""; });
  });

  document.querySelectorAll(".project-card, .stat-box, .hero__frame").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--gx", px * 100 + "%");
      card.style.setProperty("--gy", py * 100 + "%");
      card.style.setProperty("--rx", (py - 0.5) * -8 + "deg");
      card.style.setProperty("--ry", (px - 0.5) * 8 + "deg");
      card.style.transform = `perspective(1000px) rotateX(${(py - 0.5) * -8}deg) rotateY(${(px - 0.5) * 8}deg) translateY(-3px)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.style.transform = "";
    });
  });
}

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
