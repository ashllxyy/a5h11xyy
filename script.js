lucide.createIcons();

const myAtropos = Atropos({
    el: '.my-atropos',
    activeOffset: 40,
    shadowScale: 0,
    rotateXMax: 7,
    rotateYMax: 7,
});

// ==========================================
// TAB & CONTENT SWITCHING LOGIC
// ==========================================

const switchTabContent = (currentId, nextId) => {
    const current = document.getElementById(currentId);
    const next = document.getElementById(nextId);

    if (!current || !next) return;

    // 1. Animate out the current tab's items
    animateSceneOut(current);

    // 2. Wait for transition to finish
    setTimeout(() => {
        resetSceneAnimations(current);
        current.style.display = 'none'; // Hide old content entirely

        next.style.display = 'block'; // Unhide new content
        next.getBoundingClientRect(); // Force browser reflow

        // 3. Animate in the new tab's items
        requestAnimationFrame(() => {
            animateScene(next);
        });
    }, 400);
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

    // Enforce initial display: none on inactive tabs to prevent visual glitches
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


// ==========================================
// ACTIVITIES LOADING
// ==========================================

let ACTIVITIES = [];

const loadActivities = async () => {
    const res = await fetch('activities.json');
    ACTIVITIES = await res.json();

    const container = document.getElementById('activity-list');
    if (!container) return;

    container.innerHTML = ACTIVITIES.map(item => {
        return `
          <div data-animate-1>
              <div 
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
          </div>
        `;
    }).join('');

    lucide.createIcons();
    setupItemClicks();

    // Fix: If activities load *after* the initial page load, we need to animate them manually.
    // Check if the container is currently visible before animating.
    if (container.offsetWidth > 0 || container.offsetHeight > 0) {
        requestAnimationFrame(() => {
            animateScene(container);
        });
    }
};

const loadProjects = async () => {
    const response = await fetch("projects.json");
    const projects = await response.json();

    const container = document.getElementById("projects-list");

    container.innerHTML = "";

    projects.forEach(project => {
        const tagsHtml = (project.tags || [])
            .map(tag => `
                <div
                    class="project-tag"
                    style="background: ${tag.color}; color: white;"
                >
                    ${tag.name}
                </div>
            `)
            .join("");

        container.insertAdjacentHTML(
            "beforeend",
            `
            <div data-animate-2>
                <div class="project-item vflex gap-2">
                    <div class="project-title">
                        <i data-lucide="circle" class="dot"></i>
                        <span>${project.title}</span>
                    </div>

                    <div class="project-tags">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
            `
        );
    });

    lucide.createIcons();
    setupItemClicks();

    if (container.offsetWidth > 0 || container.offsetHeight > 0) {
        requestAnimationFrame(() => {
            animateScene(container);
        });
    }
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

// ==========================================
// GROUPED ANIMATION SYSTEM CONFIG & LOGIC
// ==========================================

const ANIMATE_CONFIG = {
    'default': { limit: 10, stepMs: 100 }, 
    '1': { limit: 30, stepMs: 50 },       
    '2': { limit: 4, stepMs: 100 },        
};

const getAnimatedGroups = (scene) => {
    const allElements = scene.querySelectorAll('*');
    const groups = {};

    allElements.forEach(el => {
        // Core Fix: Ignore elements inside hidden tabs by checking their bounding box
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

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
            
            // Add class directly to the element
            requestAnimationFrame(() => {
                el.classList.remove('animated-out');
                el.classList.add('animated-in');
            });
        });
    });
};

const animateSceneOut = (scene) => {
    const groups = getAnimatedGroups(scene);

    Object.keys(groups).forEach(groupKey => {
        const items = Array.from(groups[groupKey]);
        const config = ANIMATE_CONFIG[groupKey] || ANIMATE_CONFIG['default'];
        const limit = config.limit ?? 10;
        const stepMs = config.stepMs ?? 150; 

        items.reverse().forEach((el, index) => {
            const staggerIndex = Math.min(index, limit - 1);
            el.style.transitionDelay = `${staggerIndex * stepMs}ms`;
            
            // Apply exit class directly to the element
            requestAnimationFrame(() => {
                el.classList.remove('animated-in');
                el.classList.add('animated-out');
            });
        });
    });
};

const resetSceneAnimations = (scene) => {
    const groups = getAnimatedGroups(scene);
    Object.values(groups).flat().forEach(el => {
        el.style.transitionDelay = '0ms';
        el.classList.remove('animated-in', 'animated-out');
    });
};

// Initialize home scene
window.addEventListener('load', () => {
    const home = document.getElementById('scene-home');
    if (!home) return;

    requestAnimationFrame(() => {
        animateScene(home);
    });
});

// ==========================================
// SCENE SWITCHING LOGIC (For Dynamic Pages)
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
            <div class="header">
                <i data-lucide="${data.icon}" class="icon"></i>
                <h1>${details.title} <span class="sub-heading">[${data.type}]</span></h1>
                <div class="divider"></div>
            </div>
            <div class="vflex">
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
