/**
 * AI 公益中转站导航 - 核心应用逻辑
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

  // ===== 数据加载 (支持 fetch 与本地变量双重保险) =====
  async function loadData() {
    // 默认使用 window 中的 fallback 数据
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

  // ===== 主题切换 (深色 / 浅色) =====
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
        <div class="stat-label">收录精选站点</div>
      </div>
      <div class="stat-card">
        <div class="stat-value success">${activeSites}</div>
        <div class="stat-label">100% 稳定可用</div>
      </div>
      <div class="stat-card">
        <div class="stat-value warning">$${totalBonusVal}+</div>
        <div class="stat-label">累计可领额度</div>
      </div>
      <div class="stat-card">
        <div class="stat-value purple">$${totalDailyVal}+/天</div>
        <div class="stat-label">每日签到领额</div>
      </div>
    `;
  }

  // ===== 标签与筛选器渲染 =====
  function renderFilterTabs() {
    if (!els.filterTabs) return;

    const tabs = [
      { key: 'all', label: '🔥 全部推荐' },
      { key: 'daily', label: '⚡ 每日签到' },
      { key: 'high-bonus', label: '💰 豪华大额度' },
      { key: 'coding', label: '💻 编程/开发' },
      { key: 'multimodal', label: '🔮 生图/多模态' }
    ];

    els.filterTabs.innerHTML = tabs.map(tab => {
      let count = 0;
      if (tab.key === 'all') {
        count = SITES.length;
      } else if (tab.key === 'daily') {
        count = SITES.filter(s => hasTag(s, '每日签到') || s.dailyValue > 0).length;
      } else if (tab.key === 'high-bonus') {
        count = SITES.filter(s => (s.bonusValue || 0) >= 120).length;
      } else if (tab.key === 'coding') {
        count = SITES.filter(s => hasTag(s, '编程') || hasTag(s, '开发') || hasTag(s, '低延迟')).length;
      } else if (tab.key === 'multimodal') {
        count = SITES.filter(s => hasTag(s, '生图') || hasTag(s, '多模态')).length;
      }

      const isActive = currentFilter === tab.key ? 'active' : '';
      return `
        <button class="filter-tab ${isActive}" data-filter="${tab.key}">
          <span>${tab.label}</span>
          <span class="filter-tab-count">${count}</span>
        </button>
      `;
    }).join('');

    // 绑定点击事件
    els.filterTabs.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        renderFilterTabs();
        renderCards();
      });
    });
  }

  // 辅助函数：判断是否有某标签
  function hasTag(site, keyword) {
    if (!site.tags || !Array.isArray(site.tags)) return false;
    return site.tags.some(t => t.includes(keyword));
  }

  // ===== 卡片列表过滤与排序 =====
  function getFilteredAndSortedSites() {
    let list = [...SITES];

    // 1. 标签过滤
    if (currentFilter === 'daily') {
      list = list.filter(s => hasTag(s, '每日签到') || s.dailyValue > 0);
    } else if (currentFilter === 'high-bonus') {
      list = list.filter(s => (s.bonusValue || 0) >= 120);
    } else if (currentFilter === 'coding') {
      list = list.filter(s => hasTag(s, '编程') || hasTag(s, '开发') || hasTag(s, '低延迟'));
    } else if (currentFilter === 'multimodal') {
      list = list.filter(s => hasTag(s, '生图') || hasTag(s, '多模态'));
    }

    // 2. 搜索关键词过滤
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const descMatch = (s.desc || '').toLowerCase().includes(q);
        const domainMatch = (s.domain || '').toLowerCase().includes(q);
        const recommendMatch = (s.recommend || '').toLowerCase().includes(q);
        const codeMatch = (s.affCode || '').toLowerCase().includes(q);
        const tagsMatch = (s.tags || []).some(t => t.toLowerCase().includes(q));
        return nameMatch || descMatch || domainMatch || recommendMatch || codeMatch || tagsMatch;
      });
    }

    // 3. 排序规则
    list.sort((a, b) => {
      // 失效站点始终沉底
      if (a.status === 'inactive' && b.status !== 'inactive') return 1;
      if (a.status !== 'inactive' && b.status === 'inactive') return -1;

      switch (currentSort) {
        case 'recommend':
          // 置顶优先 -> 加急优先 -> 奖励额度降序
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
      const isActive = site.status !== 'inactive';
      const icon = site.icon || '🚀';
      const colorGradient = site.color || 'linear-gradient(135deg, #6366f1, #38bdf8)';
      const tags = (site.tags || []).map(t => `<span class="card-tag-pill">${escapeHtml(t)}</span>`).join('');
      
      const badgeHtml = site.badge 
        ? `<span class="card-top-badge">${escapeHtml(site.badge)}</span>` 
        : (site.pinned ? `<span class="card-top-badge">⭐ 置顶推荐</span>` : '');

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

            <p class="card-desc">${escapeHtml(site.desc || '优质高可用公益中转站')}</p>

            ${site.recommend ? `
              <div class="card-recommend-box">
                <strong>💡 站长点评：</strong>${escapeHtml(site.recommend)}
              </div>
            ` : ''}

            <div class="card-tags-cloud">
              ${tags}
            </div>

            <!-- 福利拆解展示 -->
            <div class="reward-breakdown-grid">
              <div class="reward-cell">
                <span class="reward-cell-label">注册即赠</span>
                <span class="reward-cell-value highlight-cyan">${escapeHtml(site.registerBonus || '$0')}</span>
              </div>
              <div class="reward-cell">
                <span class="reward-cell-label">专属邀请加赠</span>
                <span class="reward-cell-value highlight-amber">${escapeHtml(site.inviteBonus || '赠送')}</span>
              </div>
              <div class="reward-cell">
                <span class="reward-cell-label">每日签到</span>
                <span class="reward-cell-value highlight-green">${escapeHtml(site.dailyBonus || '有')}</span>
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
              title="直达注册页面"
            >
              <span>🚀 立即直达领福利</span>
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
        { title: "下载并安装 Cherry Studio", desc: "前往 Cherry Studio 官网下载对应系统客户端并打开。" },
        { title: "进入设置 -> 模型服务", desc: "在左侧菜单点击「设置」，选择「模型服务」配置面板。" },
        { title: "选择 OpenAI 兼容协议", desc: "添加自定义服务商，API 基础地址 (Base URL) 填入对应中转站提供的接口地址（例如：<code>https://api.agentrouter.org/v1</code>）。" },
        { title: "填入 API Key 并测试", desc: "将你在中转站「个人中心/令牌管理」中创建的 <code>sk-xxxx</code> 填入，点击连接测试即可畅享全模型！" }
      ]
    },
    nextchat: {
      name: "NextChat (ChatGPT-Next-Web)",
      steps: [
        { title: "打开 NextChat 设置", desc: "点击网页或客户端左下角 ⚙️ 设置图标。" },
        { title: "配置自定义接口地址", desc: "在「模型服务商」选择 OpenAI，接口地址填入中转站 Base URL（需带 <code>https://</code>）。" },
        { title: "填入 API Key 令牌", desc: "填入你在中转站生成的 API Key，在自定义模型输入你想使用的模型名称（如 <code>gpt-4o</code>、<code>claude-3-7-sonnet</code>、<code>deepseek-r1</code>）。" }
      ]
    },
    chatbox: {
      name: "Chatbox",
      steps: [
        { title: "打开 Chatbox 设置", desc: "点击左下角设置图标进入「模型设置」。" },
        { title: "选择 OpenAI API 模式", desc: "在 AI 模型提供商下拉菜单中选择「OpenAI API」。" },
        { title: "配置 API 域名与密钥", desc: "API 域名填入中转站地址，API 密钥填入你的 <code>sk-xxxx</code> 密钥，点击保存即可开始对话。" }
      ]
    },
    cursor: {
      name: "Cursor / VS Code / Claude Code",
      steps: [
        { title: "进入 Cursor 设置面板", desc: "按 <code>Ctrl + ,</code> 或右上角齿轮进入 Settings -> Models。" },
        { title: "开启 OpenAI API Key Override", desc: "开启 Override OpenAI Base URL，填入中转站 Base URL（例如：<code>https://gorouter.app/v1</code>）。" },
        { title: "填入 API Key 并添加模型", desc: "填入对应中转站 Key，点击 Verify 进行验证，输入你想用的模型即可在编程中极速调用！" }
      ]
    }
  };

  function renderClientGuides(activeKey = 'cherry') {
    if (!els.clientGuideTabs || !els.clientGuideContent) return;

    // 渲染 Tabs
    els.clientGuideTabs.innerHTML = Object.keys(CLIENT_GUIDES).map(key => `
      <button class="client-tab-btn ${key === activeKey ? 'active' : ''}" data-client="${key}">
        ${CLIENT_GUIDES[key].name}
      </button>
    `).join('');

    // 绑定 Tab 点击
    els.clientGuideTabs.querySelectorAll('.client-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renderClientGuides(btn.dataset.client);
      });
    });

    // 渲染内容
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

  // ===== FAQ 手风琴逻辑 =====
  function initFAQ() {
    if (!els.faqAccordion) return;
    const items = els.faqAccordion.querySelectorAll('.faq-item');
    items.forEach(item => {
      const q = item.querySelector('.faq-question');
      if (q) {
        q.addEventListener('click', () => {
          const isOpen = item.classList.contains('open');
          // 单开模式
          items.forEach(i => i.classList.remove('open'));
          if (!isOpen) item.classList.add('open');
        });
      }
    });
  }

  // ===== 公告弹窗逻辑 =====
  function checkNoticeModal() {
    if (!CONFIG.noticeContent) return;
    const currentVer = CONFIG.noticeVersion || 1;
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
      localStorage.setItem('notice_dismissed_version', String(CONFIG.noticeVersion || 1));
      showToast('已设为不再自动弹出');
    }
  };

  // ===== 剪贴板复制工具 =====
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

  // ===== HTML 转义防止 XSS =====
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
  }

  // ===== 事件监听绑定 =====
  function bindEvents() {
    // 主题切换
    if (els.themeToggleBtn) {
      els.themeToggleBtn.addEventListener('click', toggleTheme);
    }

    // 搜索输入
    if (els.searchInput) {
      els.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (els.searchClearBtn) {
          els.searchClearBtn.style.display = searchQuery ? 'block' : 'none';
        }
        renderCards();
      });

      // 快捷键 / 聚焦搜索
      window.addEventListener('keydown', (e) => {
        if (e.key === '/' && document.activeElement !== els.searchInput) {
          e.preventDefault();
          els.searchInput.focus();
        }
      });
    }

    // 清空搜索
    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener('click', () => {
        searchQuery = '';
        els.searchInput.value = '';
        els.searchClearBtn.style.display = 'none';
        renderCards();
      });
    }

    // 排序切换
    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderCards();
      });
    }

    // 返回顶部
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

  // ===== 全量渲染入口 =====
  function renderAll() {
    renderStats();
    renderFilterTabs();
    renderCards();
    renderClientGuides('cherry');
    initFAQ();
  }

  // DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
