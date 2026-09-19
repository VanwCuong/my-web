import { initBackground } from './three-background.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Three.js particle background
    try {
        initBackground();
    } catch (e) {
        console.error('Failed to init background:', e);
    }

    // 2. Scroll Progress Bar Update
    const scrollProgressBar = document.getElementById('scroll-progress');
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight > 0 && scrollProgressBar) {
            const progress = (scrollTop / docHeight) * 100;
            scrollProgressBar.style.width = `${progress}%`;
        }
    });

    // 3. Card Dynamic Radial Spotlight Mousemove Handler
    const cards = document.querySelectorAll('.liquid-glass-card, .service-card, .pricing-card, .trust-item');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });

    // 4. Theme Toggle (Dark & Light Mode with localStorage & Icon Sync)
    const themeBtn = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.theme-toggle__sun');
    const moonIcon = document.querySelector('.theme-toggle__moon');
    
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (theme === 'light') {
            if (sunIcon) sunIcon.style.display = 'block';
            if (moonIcon) moonIcon.style.display = 'none';
        } else {
            if (sunIcon) sunIcon.style.display = 'none';
            if (moonIcon) moonIcon.style.display = 'block';
        }
    };

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // 5. Mobile Navigation Menu Toggle & Link Click Close
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav__link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('open');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('open');
                navToggle.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
                navMenu.classList.remove('open');
                navToggle.classList.remove('open');
            }
        });
    }

    // 6. Scroll Reveal Intersection Observer
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealElements.forEach(el => revealObserver.observe(el));

    // 7. Active Section Navigation Observer
    const sections = document.querySelectorAll('section[id]');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, { rootMargin: '-40% 0px -50% 0px' });

    sections.forEach(sec => sectionObserver.observe(sec));

    // 8. Toast Notification Helper
    const showToast = (message) => {
        let toast = document.getElementById('toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast';
            toast.className = 'toast';
            document.body.appendChild(toast);
        }
        
        toast.innerText = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // 9. Copy Email Helper
    const btnCopyEmail = document.getElementById('btn-copy-email');
    const emailVal = document.getElementById('email-val');

    if (btnCopyEmail && emailVal) {
        btnCopyEmail.addEventListener('click', (e) => {
            e.preventDefault();
            const textToCopy = emailVal.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast('✓ Đã sao chép Email thành công!');
            }).catch(() => {
                showToast('Sao chép email thất bại!');
            });
        });
    }

    // 10. FAQ Accordion Handler
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question');
        if (btn) {
            btn.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // 11. Counter Animation on Scroll
    const statVals = document.querySelectorAll('.stat-card__val[data-target]');
    const statObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-target'), 10);
                let current = 0;
                const increment = Math.ceil(target / 40);
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        entry.target.innerText = `${target}+`;
                        clearInterval(timer);
                    } else {
                        entry.target.innerText = `${current}+`;
                    }
                }, 30);
                statObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statVals.forEach(val => statObserver.observe(val));

    // 12. Interactive Contact Form Submission Demo
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btnSubmit = contactForm.querySelector('button[type="submit"]');
            const originalText = btnSubmit.innerHTML;
            btnSubmit.innerHTML = '<span>Đang gửi yêu cầu...</span>';
            btnSubmit.disabled = true;

            setTimeout(() => {
                btnSubmit.innerHTML = originalText;
                btnSubmit.disabled = false;
                contactForm.reset();
                showToast('✓ Yêu cầu hỗ trợ đã được gửi thành công! Tôi sẽ liên hệ Zalo ngay.');
            }, 1200);
        });
    }
});
