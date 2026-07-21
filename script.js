lucide.createIcons();

const myAtropos = Atropos({
    el: '.my-atropos',
    activeOffset: 40,
    shadowScale: 0,
    rotateXMax: 7,
    rotateYMax: 7,
});

const allTabGroups = document.querySelectorAll('.tabs');

window.addEventListener('load', () => {
    const home = document.getElementById('scene-home');
    if (!home) return;

    requestAnimationFrame(() => {
        animateScene(home);
    });
});

allTabGroups.forEach(tabsContainer => {
    const tabs = tabsContainer.querySelectorAll('.tab');
    const underline = tabsContainer.querySelector('.underline');

    const moveUnderline = (el) => {
        const rect = el.getBoundingClientRect();
        const parentRect = tabsContainer.getBoundingClientRect();

        const padding = 8;

        underline.style.width = rect.width + padding + 'px';
        underline.style.left =
            rect.left - parentRect.left - padding / 2 + 'px';
    }

    const activeTab = tabsContainer.querySelector('.tab.active');
    if (activeTab) moveUnderline(activeTab);

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabsContainer.querySelector('.tab.active')?.classList.remove('active');
            tab.classList.add('active');
            moveUnderline(tab);
        });
    });

    window.addEventListener('resize', () => {
        const active = tabsContainer.querySelector('.tab.active');
        if (active) moveUnderline(active);
    });
});


let ACTIVITIES = [];

const loadActivities = async () => {
    const res = await fetch('activities.json');
    ACTIVITIES = await res.json();

    const container = document.getElementById('activity-list');

    container.innerHTML = ACTIVITIES.map(item => {
        return `
        <div 
            data-animate-1
            class="hflex activity-item align-center primary gap-2"
            data-id="${item.id}"
        >
            <i data-lucide="${item.icon}" class="content-icon"></i>
            
            <div class="info hflex between">
                <div class="title primary">${item.title}</div>
                
                <div class="date secondary">
                    <span class="date-text">${item.date}</span>
                    <span class="hover-hint">
                        click 
                        <i data-lucide="mouse-left" class="hint-icon"></i>
                        to open
                    </span>
                </div>
            </div>
        </div>
        `;
    }).join('');

    lucide.createIcons();
    setupItemClicks();
};

loadActivities();

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

// ==========================================
// GROUPED ANIMATION SYSTEM CONFIG & LOGIC
// ==========================================

const ANIMATE_CONFIG = {
    'default': { limit: 10, stepMs: 100 },
    '1': { limit: 10, stepMs: 100 },
    '2': { limit: 4, stepMs: 200 },
};

// Finds and categorizes all animated elements into groups based on data attributes
const getAnimatedGroups = (scene) => {
    const allElements = scene.querySelectorAll('*');
    const groups = {};

    allElements.forEach(el => {
        for (const attr of el.attributes) {
            if (attr.name === 'data-animate' || attr.name.startsWith('data-animate-')) {
                const groupKey = attr.name === 'data-animate' ? 'default' : attr.name.replace('data-animate-', '');
                
                if (!groups[groupKey]) groups[groupKey] = [];
                groups[groupKey].push(el);
                break;
            }
        }
    });

    return groups;
};

const animateScene = (scene) => {
    const groups = getAnimatedGroups(scene);

    Object.keys(groups).forEach(groupKey => {
        const items = groups[groupKey];
        const config = ANIMATE_CONFIG[groupKey] || ANIMATE_CONFIG['default'];
        const limit = config.limit ?? 10;
        const stepMs = config.stepMs ?? 200;

        items.forEach((el, index) => {
            const staggerIndex = Math.min(index, limit - 1);
            el.style.transitionDelay = `${staggerIndex * stepMs}ms`;
        });
    });

    scene.classList.add('animate-in');
};

const animateSceneOut = (scene) => {
    const groups = getAnimatedGroups(scene);

    Object.keys(groups).forEach(groupKey => {
        const items = Array.from(groups[groupKey]);
        const config = ANIMATE_CONFIG[groupKey] || ANIMATE_CONFIG['default'];
        const limit = config.limit ?? 10;
        const stepMs = config.stepMs ?? 150; // slightly faster exit step

        items.reverse().forEach((el, index) => {
            const staggerIndex = Math.min(index, limit - 1);
            el.style.transitionDelay = `${staggerIndex * stepMs}ms`;
        });
    });

    scene.classList.add('animate-out');
};

const resetSceneAnimations = (scene) => {
    const groups = getAnimatedGroups(scene);

    Object.values(groups).flat().forEach(el => {
        el.style.transitionDelay = '0ms';
    });

    scene.classList.remove('animate-in', 'animate-out');
};

// ==========================================
// SCENE SWITCHING LOGIC
// ==========================================

const switchScene = (currentId, nextId) => {
    if (currentId === nextId) return;

    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);

    animateSceneOut(current);
    current.classList.add('exit');

    setTimeout(() => {
        resetSceneAnimations(current);

        current.classList.remove('active', 'exit');

        if (nextId === 'scene-home' && currentId !== 'scene-home') {
            current.remove();
        }

        next.classList.add('active');

        next.getBoundingClientRect();

        requestAnimationFrame(() => {
            animateScene(next);
        });

        next.classList.add('enter');

        setTimeout(() => {
            next.classList.remove('enter');
        }, 400);

    }, 400);
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

    newScene.innerHTML =
        `
        <div class="container">
            <div class="vflex">
                <i data-lucide="${data.icon}" class="icon title-icon"></i>
                <h1>${details.title} <span class="sub-heading">[${data.type}]</span></h1>
                <div class="divider"></div>
                <span class="project-read-details"><span class="bold">${data.date} </span> | ${data['read-time'] || '1 min read'}</span>
                <div class="project-content">${details.content || "Coming soon"}</div>
                <div class="divider"></div>
                <div class="hflex back-btn">
                    <i data-lucide="arrow-left" class="back-btn-icon"></i>
                    <span>
                        go home 
                    </span>
                </div>
            </div>
        </div>
    `;

    sceneRoot.appendChild(newScene);

    newScene.querySelector('.back-btn').addEventListener('click', () => {
        switchScene(sceneId, 'scene-home');
    });
    lucide.createIcons();
    switchScene(current.id, sceneId);
}
