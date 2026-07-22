lucide.createIcons();

const myAtropos = Atropos({
    el: '.my-atropos',
    activeOffset: 40,
    shadowScale: 0,
    rotateXMax: 7,
    rotateYMax: 7,
});

const ANIMATE_CONFIG = {
    'default': { stepMs: 100 }, 
    '1': { stepMs: 50 },        
    '2': { stepMs: 150 },        
};

const entryQueues = {};
const queueTimers = {};

const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const el = entry.target;
        const groupAttr = Array.from(el.attributes).find(a => a.name.startsWith('data-animate'));
        const groupKey = groupAttr ? (groupAttr.name === 'data-animate' ? 'default' : groupAttr.name.replace('data-animate-', '')) : 'default';
        
        if (!entryQueues[groupKey]) entryQueues[groupKey] = [];

        if (entry.isIntersecting) {
            entryQueues[groupKey].push(el);
            
            if (!queueTimers[groupKey]) {
                queueTimers[groupKey] = setTimeout(() => {
                    const items = [...entryQueues[groupKey]];
                    entryQueues[groupKey] = [];
                    queueTimers[groupKey] = null;
                    
                    const stepMs = ANIMATE_CONFIG[groupKey]?.stepMs || 100;
                    items.forEach((itemEl, index) => {
                        itemEl.style.transitionDelay = `${index * stepMs}ms`;
                        requestAnimationFrame(() => {
                            itemEl.classList.remove('animated-out');
                            itemEl.classList.add('animated-in');
                        });
                    });
                }, 10); 
            }
        } else {
            el.style.transitionDelay = '0ms';
            el.classList.remove('animated-in');
            el.classList.add('animated-out');
        }
    });
}, { threshold: 0.1 }); 

const observeAnimations = (container) => {
    const animatedElements = container.querySelectorAll('[data-animate], [data-animate-1], [data-animate-2], [data-animate-3], [data-animate-4], [data-animate-5]');
    animatedElements.forEach(el => {
        el.classList.add('animated-out'); 
        scrollObserver.observe(el);
    });
};

const performExitAnimation = (container, callback) => {
    const visibleItems = Array.from(container.querySelectorAll('.animated-in'));
    
    if (visibleItems.length === 0) {
        callback();
        return;
    }

    visibleItems.reverse().forEach((el, index) => {
        el.style.transitionDelay = `${index * 30}ms`;
        requestAnimationFrame(() => {
            el.classList.remove('animated-in');
            el.classList.add('animated-out');
        });
    });

    const maxWaitTime = (visibleItems.length - 1) * 30 + 400;
    setTimeout(callback, maxWaitTime);
};


const switchTabContent = (currentId, nextId) => {
    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);
    if (!current || !next) return;

    performExitAnimation(current, () => {
        current.style.display = 'none'; 
        next.style.display = 'block'; 
    });
};

const allTabGroups = document.querySelectorAll('.tabs');

allTabGroups.forEach(tabsContainer => {
    const tabs = tabsContainer.querySelectorAll('.tab');
    const underline = tabsContainer.querySelector('.underline');

    const moveUnderline = (el) => {
        const rect = el.getBoundingClientRect();
        const parentRect = tabsContainer.getBoundingClientRect();
        const padding = 8;
        underline.style.width = rect.width + padding + 'px';
        underline.style.left = rect.left - parentRect.left - padding / 2 + 'px';
    }

    const activeTab = tabsContainer.querySelector('.tab.active');
    if (activeTab) moveUnderline(activeTab);

    tabs.forEach(tab => {
        if (!tab.classList.contains('active') && tab.dataset.target) {
            const targetEl = document.getElementById(tab.dataset.target);
            if (targetEl) targetEl.style.display = 'none';
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActiveTab = tabsContainer.querySelector('.tab.active');
            if (currentActiveTab === tab) return; 

            const currentTargetId = currentActiveTab?.dataset.target;
            const nextTargetId = tab.dataset.target;

            currentActiveTab?.classList.remove('active');
            tab.classList.add('active');
            moveUnderline(tab);

            if (currentTargetId && nextTargetId) {
                switchTabContent(currentTargetId, nextTargetId);
            }
        });
    });

    window.addEventListener('resize', () => {
        const active = tabsContainer.querySelector('.tab.active');
        if (active) moveUnderline(active);
    });
});

const loadActivities = async () => {
    const res = await fetch('activities.json');
    const activities = await res.json();

    const container = document.getElementById('activity-list');
    if (!container) return;

    container.innerHTML = activities.map(item => {
        return `
          <div data-animate-1>
              <div class="hflex activity-item align-center primary gap-2" data-id="${item.id}">
                  <i data-lucide="${item.icon}" class="content-icon"></i>
                  <div class="info hflex between">
                      <div class="title primary">${item.title}</div>
                      <div class="date secondary">
                          <span class="date-text">${item.date}</span>
                          <span class="hover-hint">click <i data-lucide="mouse-left" class="hint-icon"></i> to open</span>
                      </div>
                  </div>
              </div>
          </div>
        `;
    }).join('');

    lucide.createIcons();
    setupItemClicks();
    observeAnimations(container);
};

const loadProjects = async () => {
    const response = await fetch("projects.json");
    const projects = await response.json();

    const container = document.getElementById("projects-list");
    if (!container) return;
    container.innerHTML = "";

    projects.forEach(project => {
        const tagsHtml = (project.tags || []).map(tag => `
            <div class="project-tag" style="background: ${tag.color}; color: white;">${tag.name}</div>
        `).join("");

        container.insertAdjacentHTML("beforeend", `
            <div data-animate-2>
                <div class="project-item vflex gap-2">
                    <div class="project-title">
                        <i data-lucide="circle" class="dot"></i>
                        <span>${project.title}</span>
                    </div>
                    <div class="project-tags">${tagsHtml}</div>
                </div>
            </div>
        `);
    });

    lucide.createIcons();
    observeAnimations(container);
}

loadActivities();
loadProjects();

const setupItemClicks = () => {
    const items = document.querySelectorAll('.activity-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const id = item.dataset.id;
            const data = ACTIVITIES.find(a => a.id === id);
            if (!data) return;
            openDynamicScene(data);
        });
    });
}

window.addEventListener('load', () => {
    const home = document.getElementById('scene-home');
    if (home) observeAnimations(home);
});

const switchScene = (currentId, nextId) => {
    if (currentId === nextId) return;

    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);

    current.classList.add('exit');
    
    performExitAnimation(current, () => {
        current.classList.remove('active', 'exit');

        if (nextId === 'scene-home' && currentId !== 'scene-home') {
            current.remove();
        }

        next.classList.add('active');
        next.classList.add('enter');
        
        setTimeout(() => {
            next.classList.remove('enter');
        }, 400);
    });
}

const openDynamicScene = (data) => {
    const sceneRoot = document.querySelector('.scene-root');
    const current = document.querySelector('.scene.active');
    if (!current) return;

    const sceneId = `scene-${data.id}`;
    const details = data.details || {};

    const existing = document.getElementById(sceneId);
    if (existing) {
        switchScene(current.id, sceneId);
        return;
    }
    
    const newScene = document.createElement('div');
    newScene.className = 'scene';
    newScene.id = sceneId;

    newScene.innerHTML = `
        <div class="container">
            <div class="header" data-animate-1>
                <i data-lucide="${data.icon}" class="icon"></i>
                <h1>${details.title} <span class="sub-heading">[${data.type}]</span></h1>
                <div class="divider"></div>
            </div>
            <div class="vflex">
                <span data-animate-1 class="project-read-details"><span class="bold">${data.date} </span> | ${data['read-time'] || '1 min read'}</span>
                <div data-animate-1 class="project-content">${details.content || "Coming soon"}</div>
                <div class="divider"></div>
                <div data-animate-1 class="hflex back-btn">
                    <i data-lucide="arrow-left" class="back-btn-icon"></i>
                    <span>go home</span>
                </div>
            </div>
        </div>
    `;

    sceneRoot.appendChild(newScene);

    newScene.querySelector('.back-btn').addEventListener('click', () => {
        switchScene(sceneId, 'scene-home');
    });
    
    lucide.createIcons();
    observeAnimations(newScene);
    switchScene(current.id, sceneId);
}
