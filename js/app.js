/**
 * AI 公益中转站导航 - 核心应用逻辑 (4卡一行极简版)
 * 纯原生现代化 ES6+ 编写，轻量高效，零外部依赖
 */

(function () {
  'use strict';

  // ===== 全局状态 =====
  let SITES = [];
  let CONFIG = {};
  let currentFilter = 'all';
  let searchQuery = '';
  let currentSort = 'recommend';

  // ===== DOM 元素引用 =====
  const els = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    globalNoticeBar: document.getElementById('globalNoticeBar'),
    globalNoticeText: document.getElementById('globalNoticeText'),
    noticeModal: document.getElementById('noticeModal'),
    modalTitle: document.getElementById('modalNoticeTitle'),
    modalBody: document.getElementById('modalNoticeBody'),
    heroStats: document.getElementById('heroStats'),
    filterTabs: document.getElementById('filterTabs'),
    searchInput: document.getElementById('searchInput'),
    searchClearBtn: document.getElementById('searchClearBtn'),
    sortSelect: document.getElementById('sortSelect'),
    cardsContainer: document.getElementById('cardsContainer'),
    emptyState: document.getElementById('emptyState'),
    toastContainer: document.getElementById('toastContainer'),
    backToTopBtn: document.getElementById('backToTopBtn'),
    clientGuideTabs: document.getElementById('clientGuideTabs'),
    clientGuideContent: document.getElementById('clientGuideContent'),
    faqAccordion: document.getElementById('faqAccordion')
  };

  // ===== 初始化启动 =====
  async function init() {
    initTheme();
    await loadData();
    bindEvents();
    renderAll();
    checkNoticeModal();
  }

  // ===== 数据加载 =====
  async function loadData() {
    CONFIG = window.DEFAULT_CONFIG || {};
    SITES = window.DEFAULT_SITES || [];

    try {
      const res = await fetch('data/sites.json');
      if (res.ok) {
        const json = await res.json();
        if (json.config) CONFIG = json.config;
        if (json.sites && Array.isArray(json.sites)) SITES = json.sites;
      }
    } catch (e) {
      console.log('Using embedded default data (running in local/offline mode)');
    }
  }

  // ===== 主题切换 =====
  function initTheme() {
    const savedTheme = localStorage.getItem('theme_preference') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme_preference', nextTheme);
    updateThemeIcon(nextTheme);
    showToast(`已切换至 ${nextTheme === 'dark' ? '🌙 深色极客' : '☀️ 浅色明亮'} 模式`);
  }

  function updateThemeIcon(theme) {
    if (!els.themeToggleBtn) return;
    els.themeToggleBtn.innerHTML = theme === 'dark' ? '🌙' : '☀️';
    els.themeToggleBtn.setAttribute('title', theme === 'dark' ? '切换为浅色模式' : '切换为深色模式');
  }

  // ===== 统计看板渲染 =====
  function renderStats() {
    if (!els.heroStats) return;

    const totalSites = SITES.length;
    const activeSites = SITES.filter(s => s.status !== 'inactive').length;
    const totalBonusVal = SITES.reduce((sum, s) => sum + (Number(s.bonusValue) || 0), 0);
    const totalDailyVal = SITES.reduce((sum, s) => sum + (Number(s.dailyValue) || 0), 0);

    els.heroStats.innerHTML = `
      <div class="stat-card">
        <div class="stat-value primary">${totalSites}</div>
        <div class="stat-label">精选中转站</div>
      </div>
      <div class="stat-card">
        <div class="stat-value success">${activeSites}</div>
        <div class="stat-label">100% 极速可用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value warning">$${totalBonusVal}+</div>
        <div class="stat-label">累计白嫖启动金</div>
      </div>
      <div class="stat-card">
        <div class="stat-value purple">$${totalDailyVal}+/天</div>
        <div class="stat-label">每日签到送额</div>
      </div>
    `;
  }

  // ===== 标签与筛选器渲染 =====
  function renderFilterTabs() {
    if (!els.filterTabs) return;

    const tabs = [
      { key: 'all', label: '🔥 全部精选' },
      { key: 'gpt-5-6', label: '⚡ gpt-5.6-sol' },
      { key: 'claude-5', label: '👑 claude-opus-5' },
      { key: 'coding', label: '🛠️ 1:1无虚标/编程' },
      { key: 'daily', label: '🎁 每日签到' }
    ];

    els.filterTabs.innerHTML = tabs.map(tab => {
      let count = 0;
      if (tab.key === 'all') {
        count = SITES.length;
      } else if (tab.key === 'gpt-5-6') {
        count = SITES.filter(s => hasTagOrModel(s, 'gpt-5.6')).length;
      } else if (tab.key === 'claude-5') {
        count = SITES.filter(s => hasTagOrModel(s, 'claude-opus-5') || hasTagOrModel(s, 'claude-5')).length;
      } else if (tab.key === 'coding') {
        count = SITES.filter(s => hasTagOrModel(s, '1:1') || hasTagOrModel(s, '编程') || hasTagOrModel(s, '开发')).length;
      } else if (tab.key === 'daily') {
        count = SITES.filter(s => hasTagOrModel(s, '每日签到') || s.dailyValue > 0).length;
      }

      const isActive = currentFilter === tab.key ? 'active' : '';
      return `
        <button class="filter-tab ${isActive}" data-filter="${tab.key}">
          <span>${tab.label}</span>
          <span class="filter-tab-count">${count}</span>
        </button>
      `;
    }).join('');

    els.filterTabs.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        renderFilterTabs();
        renderCards();
      });
    });
  }

  function hasTagOrModel(site, keyword) {
    const kw = keyword.toLowerCase();
    const tagMatch = (site.tags || []).some(t => t.toLowerCase().includes(kw));
    const modelMatch = (site.models || []).some(m => m.toLowerCase().includes(kw));
    const descMatch = (site.desc || '').toLowerCase().includes(kw);
    return tagMatch || modelMatch || descMatch;
  }

  // ===== 卡片列表过滤与排序 =====
  function getFilteredAndSortedSites() {
    let list = [...SITES];

    if (currentFilter === 'gpt-5-6') {
      list = list.filter(s => hasTagOrModel(s, 'gpt-5.6'));
    } else if (currentFilter === 'claude-5') {
      list = list.filter(s => hasTagOrModel(s, 'claude-opus-5') || hasTagOrModel(s, 'claude-5'));
    } else if (currentFilter === 'coding') {
      list = list.filter(s => hasTagOrModel(s, '1:1') || hasTagOrModel(s, '编程') || hasTagOrModel(s, '开发'));
    } else if (currentFilter === 'daily') {
      list = list.filter(s => hasTagOrModel(s, '每日签到') || s.dailyValue > 0);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const descMatch = (s.desc || '').toLowerCase().includes(q);
        const domainMatch = (s.domain || '').toLowerCase().includes(q);
        const recommendMatch = (s.recommend || '').toLowerCase().includes(q);
        const codeMatch = (s.affCode || '').toLowerCase().includes(q);
        const tagsMatch = (s.tags || []).some(t => t.toLowerCase().includes(q));
        const modelsMatch = (s.models || []).some(m => m.toLowerCase().includes(q));
        return nameMatch || descMatch || domainMatch || recommendMatch || codeMatch || tagsMatch || modelsMatch;
      });
    }

    list.sort((a, b) => {
      if (a.status === 'inactive' && b.status !== 'inactive') return 1;
      if (a.status !== 'inactive' && b.status === 'inactive') return -1;

      switch (currentSort) {
        case 'recommend':
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          if (a.urgent && !b.urgent) return -1;
          if (!a.urgent && b.urgent) return 1;
          return (b.bonusValue || 0) - (a.bonusValue || 0);

        case 'bonus-desc':
          return (b.bonusValue || 0) - (a.bonusValue || 0);

        case 'daily-desc':
          return (b.dailyValue || 0) - (a.dailyValue || 0);

        case 'date-desc':
          return (b.date || '').localeCompare(a.date || '');

        default:
          return 0;
      }
    });

    return list;
  }

  // ===== 卡片渲染 =====
  function renderCards() {
    if (!els.cardsContainer) return;

    const list = getFilteredAndSortedSites();

    if (list.length === 0) {
      els.cardsContainer.innerHTML = '';
      if (els.emptyState) els.emptyState.style.display = 'block';
      return;
    }

    if (els.emptyState) els.emptyState.style.display = 'none';

    els.cardsContainer.innerHTML = list.map(site => {
      const icon = site.icon || '⚡';
      const colorGradient = site.color || 'linear-gradient(135deg, #6366f1, #38bdf8)';
      const tags = (site.tags || []).map(t => `<span class="card-tag-pill">${escapeHtml(t)}</span>`).join('');
      
      const modelsHtml = (site.models || []).map(m => {
        const isFlagship = m.includes('gpt-5.6') || m.includes('claude-opus-5');
        return `<span class="model-pill ${isFlagship ? 'highlight' : ''}">✨ ${escapeHtml(m)}</span>`;
      }).join('');

      const badgeHtml = site.badge 
        ? `<span class="card-top-badge">${escapeHtml(site.badge)}</span>` 
        : (site.pinned ? `<span class="card-top-badge">⭐ 置顶力荐</span>` : '');

      const isNew = checkIsNew(site.date);
      const newBadgeHtml = isNew ? `<span class="card-new-badge">NEW</span>` : '';

      return `
        <article class="site-card ${site.pinned ? 'pinned' : ''} ${site.urgent ? 'is-urgent' : ''}">
          <div class="card-badges-wrapper">
            ${newBadgeHtml}
            ${badgeHtml}
          </div>

          <div>
            <div class="card-header">
              <div class="card-icon-box" style="background: ${colorGradient};">
                ${icon}
              </div>
              <div class="card-title-group">
                <div class="card-site-name">
                  <span>${escapeHtml(site.name)}</span>
                </div>
                <span class="card-domain-tag">${escapeHtml(site.domain || '')}</span>
              </div>
            </div>

            <!-- 支持的旗舰模型 -->
            <div class="card-model-strip">
              ${modelsHtml}
            </div>

            <p class="card-desc">${escapeHtml(site.desc || '优质高可用公益中转站')}</p>

            ${site.recommend ? `
              <div class="card-recommend-box ${site.urgent ? 'urgent-quote' : ''}">
                ${escapeHtml(site.recommend)}
              </div>
            ` : ''}

            <div class="card-tags-cloud">
              ${tags}
            </div>

            <!-- 福利拆解展示 -->
            <div class="reward-breakdown-grid">
              <div class="reward-cell">
                <span class="reward-cell-label">注册即赠</span>
                <span class="reward-cell-value highlight-cyan" title="${escapeHtml(site.registerBonus || '$0')}">${escapeHtml(site.registerBonus || '$0')}</span>
              </div>
              <div class="reward-cell">
                <span class="reward-cell-label">专属加赠</span>
                <span class="reward-cell-value highlight-amber" title="${escapeHtml(site.inviteBonus || '赠送')}">${escapeHtml(site.inviteBonus || '赠送')}</span>
              </div>
              <div class="reward-cell">
                <span class="reward-cell-label">每日签到</span>
                <span class="reward-cell-value highlight-green" title="${escapeHtml(site.dailyBonus || '有')}">${escapeHtml(site.dailyBonus || '有')}</span>
              </div>
            </div>
          </div>

          <!-- 卡片操作底部 -->
          <div class="card-actions-row">
            <a 
              href="${escapeHtml(site.link)}" 
              target="_blank" 
              rel="noopener noreferrer" 
              class="btn-primary-jump ${site.urgent ? 'urgent-glow' : ''}"
              onclick="window.handleDirectJump('${escapeHtml(site.affCode || '')}', '${escapeHtml(site.name)}')"
              title="直达注册页面"
            >
              <span>🚀 直达领福利</span>
            </a>

            ${site.affCode ? `
              <button 
                class="btn-icon-copy" 
                onclick="window.copyInviteCode('${escapeHtml(site.affCode)}', '${escapeHtml(site.name)}')" 
                title="复制邀请码: ${escapeHtml(site.affCode)}"
              >
                📋
              </button>
            ` : ''}

            <button 
              class="btn-icon-copy" 
              onclick="window.copyInviteLink('${escapeHtml(site.link)}', '${escapeHtml(site.name)}')" 
              title="复制专属注册链接"
            >
              🔗
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function checkIsNew(dateStr) {
    if (!dateStr) return false;
    const itemDate = new Date(dateStr);
    const now = new Date();
    const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  }

  // ===== 客户端配置教程 Tab 逻辑 =====
  const CLIENT_GUIDES = {
    cherry: {
      name: "Cherry Studio",
      steps: [
        { title: "下载并打开 Cherry Studio", desc: "前往 Cherry Studio 官网下载安装对应系统客户端并运行。" },
        { title: "进入设置 -> 模型服务", desc: "点击左下角「设置」图标，进入「模型服务」面板添加 OpenAI 协议服务商。" },
        { title: "填入 Base URL 接口地址", desc: "填入中转站提供的接口地址（例如：<code>https://gorouter.app/v1</code> 或 <code>https://api.agentrouter.org/v1</code>）。" },
        { title: "配置 API Key 与旗舰模型", desc: "填入你在中转站生成的 <code>sk-xxxx</code> 密钥，添加 <code>gpt-5.6-sol</code>、<code>claude-opus-5</code>、<code>deepseek-r1</code> 即可极速对话！" }
      ]
    },
    nextchat: {
      name: "NextChat (ChatGPT-Next-Web)",
      steps: [
        { title: "打开 NextChat 设置", desc: "点击网页或客户端左下角 ⚙️ 设置图标。" },
        { title: "配置自定义接口地址", desc: "在「模型服务商」选择 OpenAI，接口地址填入对应中转站 Base URL（带 <code>https://</code>）。" },
        { title: "填入 API Key 令牌", desc: "填入你的 <code>sk-xxxx</code> 密钥，在自定义模型栏输入 <code>gpt-5.6-sol</code> 或 <code>claude-opus-5</code>。" }
      ]
    },
    cursor: {
      name: "Cursor / VS Code / Claude Code",
      steps: [
        { title: "进入 Cursor 设置面板", desc: "按 <code>Ctrl + ,</code> 或右上角齿轮进入 Settings -> Models。" },
        { title: "开启 OpenAI Base URL 覆盖", desc: "开启 Override OpenAI Base URL，填入 GoRouter 极速中转地址（例如：<code>https://gorouter.app/v1</code>）。" },
        { title: "填入 API Key 并验证模型", desc: "填入中转站 Key，点击 Verify 验证，添加 <code>gpt-5.6-sol</code>、<code>claude-opus-5</code> 享受丝滑秒级编程辅助！" }
      ]
    },
    chatbox: {
      name: "Chatbox",
      steps: [
        { title: "打开 Chatbox 设置", desc: "点击左下角设置图标进入「模型设置」。" },
        { title: "选择 OpenAI API 模式", desc: "在 AI 模型提供商下拉菜单中选择「OpenAI API」。" },
        { title: "配置 API 域名与密钥", desc: "API 域名填入中转站地址，API 密钥填入你的 <code>sk-xxxx</code> 密钥，点击保存即可开始对话。" }
      ]
    }
  };

  function renderClientGuides(activeKey = 'cherry') {
    if (!els.clientGuideTabs || !els.clientGuideContent) return;

    els.clientGuideTabs.innerHTML = Object.keys(CLIENT_GUIDES).map(key => `
      <button class="client-tab-btn ${key === activeKey ? 'active' : ''}" data-client="${key}">
        ${CLIENT_GUIDES[key].name}
      </button>
    `).join('');

    els.clientGuideTabs.querySelectorAll('.client-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renderClientGuides(btn.dataset.client);
      });
    });

    const guide = CLIENT_GUIDES[activeKey];
    els.clientGuideContent.innerHTML = `
      <div style="margin-bottom: 16px; font-weight: 700; color: var(--accent-cyan);">
        👉 ${guide.name} 3 步极速接入指南
      </div>
      ${guide.steps.map((step, idx) => `
        <div class="guide-step-row">
          <div class="step-number">${idx + 1}</div>
          <div class="step-details">
            <div class="step-title">${step.title}</div>
            <div class="step-text">${step.desc}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  // ===== FAQ 手风琴 =====
  function initFAQ() {
    if (!els.faqAccordion) return;
    const items = els.faqAccordion.querySelectorAll('.faq-item');
    items.forEach(item => {
      const q = item.querySelector('.faq-question');
      if (q) {
        q.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          items.forEach(i => i.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });
      }
    });
  }

  // ===== 公告弹窗逻辑 =====
  function checkNoticeModal() {
    if (!CONFIG.noticeContent) return;
    const currentVer = CONFIG.noticeVersion || 2;
    const dismissedVer = parseInt(localStorage.getItem('notice_dismissed_version') || '0', 10);

    if (currentVer > dismissedVer) {
      window.showNoticeModal();
    }
  }

  window.showNoticeModal = function () {
    if (!els.noticeModal) return;
    if (els.modalTitle) els.modalTitle.textContent = CONFIG.noticeTitle || '📢 站内福利公告';
    if (els.modalBody) {
      els.modalBody.innerHTML = (CONFIG.noticeContent || '')
        .split('\n')
        .map(line => `<p>${escapeHtml(line)}</p>`)
        .join('');
    }
    els.noticeModal.style.display = 'flex';
  };

  window.closeNoticeModal = function (permanent = false) {
    if (!els.noticeModal) return;
    els.noticeModal.style.display = 'none';
    if (permanent) {
      localStorage.setItem('notice_dismissed_version', String(CONFIG.noticeVersion || 2));
      showToast('已设为不再自动弹出');
    }
  };

  // ===== 剪贴板复制 & 直达辅助 =====
  window.handleDirectJump = function (code, name) {
    if (code) {
      try {
        navigator.clipboard.writeText(code);
        showToast(`🎉 已自动为您复制 ${name} 专属邀请码：${code}`);
      } catch (e) {
        fallbackCopy(code);
      }
    }
  };

  window.copyInviteCode = async function (code, name) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`🎉 已成功复制 ${name} 专属邀请码：${code}`);
    } catch (e) {
      fallbackCopy(code);
      showToast(`🎉 已复制邀请码：${code}`);
    }
  };

  window.copyInviteLink = async function (link, name) {
    try {
      await navigator.clipboard.writeText(link);
      showToast(`🔗 已复制 ${name} 专属带码注册链接`);
    } catch (e) {
      fallbackCopy(link);
      showToast(`🔗 已复制注册链接`);
    }
  };

  function fallbackCopy(text) {
    const input = document.createElement('textarea');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  }

  // ===== Toast 消息弹窗 =====
  function showToast(msg) {
    if (!els.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>✨</span> <span>${escapeHtml(msg)}</span>`;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ===== 事件监听 =====
  function bindEvents() {
    if (els.themeToggleBtn) {
      els.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    if (els.searchInput) {
      els.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (els.searchClearBtn) {
          els.searchClearBtn.style.display = searchQuery ? 'block' : 'none';
        }
        renderCards();
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== els.searchInput) {
          e.preventDefault();
          els.searchInput.focus();
        }
      });
    }

    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener('click', () => {
        searchQuery = '';
        els.searchInput.value = '';
        els.searchClearBtn.style.display = 'none';
        renderCards();
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderCards();
      });
    }

    if (els.backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
          els.backToTopBtn.classList.add('visible');
        } else {
          els.backToTopBtn.classList.remove('visible');
        }
      });

      els.backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // ===== 全量渲染 =====
  function renderAll() {
    renderStats();
    renderFilterTabs();
    renderCards();
    renderClientGuides('cherry');
    initFAQ();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
