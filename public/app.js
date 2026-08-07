document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch CV Data from Backend API
    fetchData();

    // 2. Setup Reveal Observer
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Animate counters inside revealed elements
                const counters = entry.target.querySelectorAll('.counter');
                counters.forEach(counter => {
                    if (!counter.classList.contains('counted')) {
                        const target = +counter.getAttribute('data-target');
                        animateCounter(counter, target);
                        counter.classList.add('counted');
                    }
                });
                
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    function initReveals() {
        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }

    // 3. Counter Animation
    function animateCounter(el, target) {
        let start = 0;
        const duration = 1800;
        const stepTime = 30;
        const steps = Math.ceil(duration / stepTime);
        const increment = target / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
                el.innerText = target;
                clearInterval(timer);
            } else {
                el.innerText = Math.floor(start);
            }
        }, stepTime);
    }

    // 4. Parallax Hero Effect
    const heroText = document.getElementById('parallax-hero');
    if (heroText) {
        document.addEventListener('mousemove', (e) => {
            const x = (window.innerWidth / 2 - e.pageX) / 45;
            const y = (window.innerHeight / 2 - e.pageY) / 45;
            heroText.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // 5. Modal Logic
    const modal = document.getElementById('contact-modal');
    const openBtns = [document.getElementById('nav-connect-btn'), document.getElementById('hero-connect-btn')];
    const closeBtn = document.getElementById('close-modal');
    const backdrop = document.getElementById('modal-backdrop');

    const openModal = () => {
        if(modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeModal = () => {
        if(modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    openBtns.forEach(btn => {
        if(btn) btn.addEventListener('click', openModal);
    });
    
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);

    // 5b. Experience Modal Logic
    const expModal = document.getElementById('experience-modal');
    const closeExpModalBtn = document.getElementById('close-exp-modal');
    const expBackdrop = document.getElementById('exp-modal-backdrop');

    const openExpModal = (exp) => {
        if (!expModal) return;

        document.getElementById('exp-modal-period').innerText = exp.period || '';
        document.getElementById('exp-modal-location').innerText = exp.location || '';
        document.getElementById('exp-modal-company').innerText = exp.company || '';
        document.getElementById('exp-modal-role').innerText = exp.role || '';
        document.getElementById('exp-modal-description').innerText = exp.description || '';

        // Metrics
        const metricsContainer = document.getElementById('exp-modal-metrics-container');
        const metricsGrid = document.getElementById('exp-modal-metrics');
        if (exp.metrics && exp.metrics.length) {
            metricsContainer.classList.remove('hidden');
            metricsGrid.innerHTML = exp.metrics.map(m => `
                <div class="glass-panel p-3.5 rounded-xl border border-white/10 text-center bg-white/5">
                    <div class="font-display-lg text-lg md:text-xl font-bold text-secondary-fixed">${m.value}</div>
                    <div class="text-[11px] text-on-surface-variant uppercase tracking-wider mt-1 font-medium">${m.label}</div>
                </div>
            `).join('');
        } else {
            metricsContainer.classList.add('hidden');
        }

        // Responsibilities
        const respContainer = document.getElementById('exp-modal-responsibilities-container');
        const respList = document.getElementById('exp-modal-responsibilities');
        if (exp.responsibilities && exp.responsibilities.length) {
            respContainer.classList.remove('hidden');
            respList.innerHTML = exp.responsibilities.map(r => `
                <li class="flex items-start space-x-2.5">
                    <span class="material-symbols-outlined text-tertiary-container text-lg shrink-0 mt-0.5" data-icon="check_circle">check_circle</span>
                    <span class="leading-relaxed">${r}</span>
                </li>
            `).join('');
        } else {
            respContainer.classList.add('hidden');
        }

        // Achievements
        const achContainer = document.getElementById('exp-modal-achievements-container');
        const achList = document.getElementById('exp-modal-achievements');
        if (exp.achievements && exp.achievements.length) {
            achContainer.classList.remove('hidden');
            achList.innerHTML = exp.achievements.map(a => `
                <li class="flex items-start space-x-2.5">
                    <span class="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5" data-icon="stars">stars</span>
                    <span class="leading-relaxed">${a}</span>
                </li>
            `).join('');
        } else {
            achContainer.classList.add('hidden');
        }

        expModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeExpModal = () => {
        if (expModal) {
            expModal.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    if (closeExpModalBtn) closeExpModalBtn.addEventListener('click', closeExpModal);
    if (expBackdrop) expBackdrop.addEventListener('click', closeExpModal);

    // Escape key listener for closing open modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeExpModal();
        }
    });

    // Contact Form Ingestion via Backend API
    const contactForm = document.getElementById('contact-form');
    const contactAlert = document.getElementById('contact-alert');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('form-name').value;
            const email = document.getElementById('form-email').value;
            const message = document.getElementById('form-message').value;
            const submitBtn = document.getElementById('form-submit-btn');

            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending...';

            try {
                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });
                const result = await res.json();

                if (result.success) {
                    contactAlert.className = 'mb-4 p-3 rounded-lg text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 block';
                    contactAlert.innerText = result.message;
                    contactForm.reset();
                    setTimeout(() => {
                        closeModal();
                        contactAlert.className = 'hidden';
                    }, 2500);
                } else {
                    contactAlert.className = 'mb-4 p-3 rounded-lg text-sm bg-rose-500/20 text-rose-300 border border-rose-500/40 block';
                    contactAlert.innerText = result.error || 'Failed to submit request.';
                }
            } catch (err) {
                contactAlert.className = 'mb-4 p-3 rounded-lg text-sm bg-rose-500/20 text-rose-300 border border-rose-500/40 block';
                contactAlert.innerText = 'Server error. Please try again later.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Send Message';
            }
        });
    }

    // Hero initial animation
    setTimeout(() => {
        if(heroText) heroText.classList.add('reveal', 'active');
    }, 100);

    // 6. Data Fetcher & Renderer
    async function fetchData() {
        try {
            const res = await fetch('/api/all');
            const { success, data } = await res.json();
            if (success) {
                renderProfile(data.profile);
                renderMetrics(data.metrics);
                renderExperience(data.experience);
                renderEducation(data.education);
                renderSkills(data.skills);
                initReveals();
            }
        } catch (err) {
            console.error('Failed to load portfolio data:', err);
            initReveals();
        }
    }

    function renderProfile(profile) {
        if (!profile) return;
        const summaryEl = document.getElementById('hero-summary');
        if (summaryEl) summaryEl.innerText = profile.summary;
    }

    function renderMetrics(metrics) {
        if (!metrics || !metrics.length) return;
        const grid = document.getElementById('metrics-grid');
        if (!grid) return;

        const colorClasses = [
            { text: 'text-primary', blurBg: 'bg-primary/20 group-hover:bg-primary/40' },
            { text: 'text-secondary-fixed', blurBg: 'bg-secondary-fixed/20 group-hover:bg-secondary-fixed/40' },
            { text: 'text-tertiary-container', blurBg: 'bg-tertiary-container/20 group-hover:bg-tertiary-container/40' }
        ];

        grid.innerHTML = metrics.map((m, idx) => {
            const style = colorClasses[idx % colorClasses.length];
            return `
                <div class="glass-panel rounded-xl p-8 text-center relative overflow-hidden group">
                    <div class="absolute -top-10 -right-10 w-32 h-32 ${style.blurBg} rounded-full blur-2xl transition-all duration-500"></div>
                    <div class="flex items-center justify-center font-display-lg text-display-lg ${style.text} mb-2">
                        ${m.prefix ? `<span>${m.prefix}</span>` : ''}
                        <span class="counter" data-target="${m.value}">0</span>
                        <span class="font-headline-md">${m.unit}</span>
                    </div>
                    <div class="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mt-2">${m.label}</div>
                </div>
            `;
        }).join('');
    }

    function renderExperience(experience) {
        if (!experience || !experience.length) return;
        const timeline = document.getElementById('experience-timeline');
        if (!timeline) return;

        const badgeColors = ['bg-primary shadow-[0_0_15px_rgba(242,202,80,0.6)]', 'bg-secondary-fixed shadow-[0_0_15px_rgba(0,251,251,0.6)]', 'bg-tertiary-container shadow-[0_0_15px_rgba(151,176,255,0.6)]'];
        const textColors = ['text-primary', 'text-secondary-fixed', 'text-tertiary-container'];

        timeline.innerHTML = experience.map((exp, idx) => {
            const dotStyle = badgeColors[idx % badgeColors.length];
            const textStyle = textColors[idx % textColors.length];
            const previewAchievements = exp.achievements ? exp.achievements.slice(0, 2).map(a => `<li class="mb-1 text-sm text-on-surface-variant/90 flex items-start space-x-2"><span class="text-primary font-bold">•</span><span>${a}</span></li>`).join('') : '';

            return `
                <div class="relative reveal">
                    <div class="absolute -left-[41px] top-1 w-5 h-5 rounded-full ${dotStyle}"></div>
                    <div class="exp-card glass-panel rounded-xl p-6 md:p-8 cursor-pointer border border-white/10 hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_35px_-10px_rgba(242,202,80,0.2)] group" data-exp-idx="${idx}">
                        <div class="flex flex-wrap justify-between items-center mb-2 gap-2">
                            <span class="font-label-md text-label-md ${textStyle} font-bold">${exp.period}</span>
                            <span class="text-xs text-on-surface-variant bg-white/5 px-3 py-1 rounded-full border border-white/10 flex items-center space-x-1">
                                <span class="material-symbols-outlined text-xs" data-icon="location_on">location_on</span>
                                <span>${exp.location}</span>
                            </span>
                        </div>
                        <h3 class="font-headline-md text-xl font-bold text-white group-hover:text-primary transition-colors flex items-center justify-between">
                            <span>${exp.company}</span>
                            <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary group-hover:translate-x-1 transition-all text-xl opacity-80" data-icon="open_in_new">open_in_new</span>
                        </h3>
                        <div class="text-sm font-semibold text-secondary-fixed mb-4">${exp.role}</div>
                        <p class="text-on-surface-variant text-sm mb-4 leading-relaxed">${exp.description}</p>
                        ${previewAchievements ? `<ul class="mt-3 space-y-1.5 border-t border-white/10 pt-3 mb-4">${previewAchievements}</ul>` : ''}
                        <div class="inline-flex items-center space-x-2 text-xs text-secondary-fixed font-bold group-hover:text-primary transition-colors pt-2 border-t border-white/5 w-full justify-between">
                            <span>Click to view key metrics, responsibilities & full achievements</span>
                            <span class="material-symbols-outlined text-base group-hover:translate-x-1.5 transition-transform" data-icon="arrow_forward">arrow_forward</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click listeners to experience cards
        const cards = timeline.querySelectorAll('.exp-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const expIdx = parseInt(card.getAttribute('data-exp-idx'), 10);
                if (!isNaN(expIdx) && experience[expIdx]) {
                    openExpModal(experience[expIdx]);
                }
            });
        });
    }

    function renderEducation(education) {
        if (!education || !education.length) return;
        const grid = document.getElementById('education-grid');
        if (!grid) return;

        grid.innerHTML = education.map((edu, idx) => `
            <div class="glass-panel rounded-xl p-6 relative overflow-hidden group">
                <div class="flex items-center space-x-3 mb-3">
                    <span class="material-symbols-outlined text-primary" data-icon="school">school</span>
                    <span class="font-label-md text-xs text-primary font-bold uppercase tracking-wider">${edu.year}</span>
                </div>
                <h3 class="font-headline-md text-lg font-bold text-white mb-1">${edu.institution}</h3>
                <p class="text-sm text-on-surface-variant">${edu.degree}</p>
            </div>
        `).join('');
    }

    function renderSkills(skills) {
        if (!skills || !skills.length) return;
        const grid = document.getElementById('skills-grid');
        if (!grid) return;

        const dots = [
            'bg-secondary-fixed shadow-[0_0_5px_rgba(0,251,251,0.8)]',
            'bg-primary shadow-[0_0_5px_rgba(242,202,80,0.8)]',
            'bg-tertiary-container shadow-[0_0_5px_rgba(151,176,255,0.8)]'
        ];

        grid.innerHTML = skills.map((skill, idx) => `
            <div class="skill-item glass-panel p-4 rounded-lg flex items-center justify-between transition-all duration-300" data-langs="${skill.languages.join(',')}">
                <div>
                    <span class="font-label-md text-white font-medium block text-sm">${skill.name}</span>
                    <span class="text-[11px] text-on-surface-variant/70 uppercase tracking-wider">${skill.category}</span>
                </div>
                <div class="w-2.5 h-2.5 rounded-full ${dots[idx % dots.length]}"></div>
            </div>
        `).join('');

        setupSkillsFilter();
    }

    function setupSkillsFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const skillItems = document.querySelectorAll('.skill-item');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => {
                    b.classList.remove('border-secondary-fixed/50', 'text-secondary-fixed');
                    b.classList.add('border-white/10', 'text-on-surface-variant');
                });
                btn.classList.add('border-secondary-fixed/50', 'text-secondary-fixed');
                btn.classList.remove('border-white/10', 'text-on-surface-variant');

                const lang = btn.getAttribute('data-lang');

                skillItems.forEach(skill => {
                    const langs = skill.getAttribute('data-langs').split(',');
                    if (lang === 'all' || langs.includes(lang)) {
                        skill.style.display = 'flex';
                        setTimeout(() => { skill.style.opacity = '1'; skill.style.transform = 'scale(1)'; }, 50);
                    } else {
                        skill.style.opacity = '0';
                        skill.style.transform = 'scale(0.9)';
                        setTimeout(() => { skill.style.display = 'none'; }, 200);
                    }
                });
            });
        });
    }
});
