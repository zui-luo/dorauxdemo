/* =========================================================================
   合并原型 · Step 1
   - A 的多视图导航 + Sender 三方案 + 演示标注
   - B 的剧本驱动 + 执行时间线 + 产出卡片 + PPT 预览
   - 桥接：进会话页自动播剧本、切换 B 方案重播、资料面板折叠
   ========================================================================= */


/* =========================================================================
   1. 全局工具 & 状态
   ========================================================================= */
function $(id) { return document.getElementById(id); }
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

let currentVariant = 'menu';        // A 的 Sender 方案
let currentBVariant = 'default';     // B 的对话方案
let activeSenderContext = 'hero';
let pendingAssetType = 'bi';
let pendingAssetLabel = '';
let conversationReturnView = 'dora';
let currentConversationType = 'smart-data';
let currentModuleView = 'dora';
let hasScenarioBooted = false;
let resultStreamToken = 0;
let scenarioTimers = [];
let scenarioStartedAt = 0;
let waitTimerId = null;
let carouselIntervalId = null;
let actionCount = 0;
let nodeCounter = 0;
let currentPreviewFile = null;
let currentPreviewHtmlMode = 'desktop';
let currentPreviewImageScale = 1;
let currentPreviewImageRotation = 0;
let currentPreviewPdfZoom = 100;
let currentPreviewPdfFit = 'fit-width';
let currentPreviewPdfOrientation = 'vertical';
let currentSourceTrace = null;
let preserveTraceTitle = false;

const libraryFileState = {
  status: 'neverSaved',
  hasDuplicateName: true,
  savedVersion: 0,
  sessionVersion: 1
};

const FILE_ACTIONS = {
  input: {
    frbiDashboard: ['quote', 'open'],
    frbiFvs: ['quote', 'open'],
    excel: ['quote', 'open', 'download'],
    source: ['quote', 'open', 'download']
  },
  output: {
    normal: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    skill: ['quote', 'saveBackend', 'share', 'open'],
    ppt: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    html: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    md: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    image: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    pdf: ['quote', 'saveLibrary', 'share', 'open', 'download'],
    docx: ['quote', 'download'],
    source: ['quote', 'download']
  }
};

const FILE_LABELS = {
  input: '输入',
  output: '输出'
};

const FILE_DEFS = {
  input: [
    { id: 'input-frbi-dashboard', source: 'input', type: 'frbiDashboard', ext: 'BI', name: '客户仪表板', meta: 'FRBI · 仪表板 · 只读引用', icon: 'BI', iconClass: 'bi', clickKind: 'html', clickName: '客户仪表板' },
    { id: 'input-frbi-fvs', source: 'input', type: 'frbiFvs', ext: 'FVS', name: '分析主题.fvs', meta: 'FRBI · 模型指标集 · 不支持存资料库', icon: 'FVS', iconClass: 'skill', clickKind: 'json', clickName: '分析主题.fvs' },
    { id: 'input-source-doc', source: 'input', type: 'source', ext: 'TXT', name: '销售预测规则说明.txt', meta: '24 KB · 其他类输入', icon: 'TXT', iconClass: 'md', clickKind: 'source', clickName: '销售预测规则说明.txt' },
    { id: 'input-excel', source: 'input', type: 'excel', ext: 'XLSX', name: '客户反馈明细.xlsx', meta: '161.17 KB · 用户上传', icon: 'XLSX', iconClass: 'xlsx', clickKind: 'xlsx', clickName: '客户反馈明细.xlsx' }
  ],
  output: [
    { id: 'output-skill', source: 'output', type: 'skill', ext: 'SKILL', name: '客户反馈分析技能', meta: '技能 · Agent 自动生成', icon: 'SKILL', iconClass: 'skill', clickKind: 'skill', clickName: '客户反馈分析技能' },
    { id: 'output-ppt', source: 'output', type: 'ppt', ext: 'PPTX', name: '客户反馈分析汇报.pptx', meta: '2.4 MB · Agent 产出', icon: 'PPTX', iconClass: 'pptx', clickKind: 'pptx', clickName: '客户反馈分析汇报.pptx' },
    { id: 'output-docx', source: 'output', type: 'docx', ext: 'DOCX', name: '反馈分析报告.docx', meta: '320 KB · 给管理层 · Agent 产出', icon: 'DOCX', iconClass: 'docx', clickKind: 'docx', clickName: '反馈分析报告.docx' },
    { id: 'output-pdf', source: 'output', type: 'pdf', ext: 'PDF', name: '反馈分析报告.pdf', meta: '480 KB · 归档版 · Agent 产出', icon: 'PDF', iconClass: 'pdf', clickKind: 'pdf', clickName: '反馈分析报告.pdf' },
    { id: 'output-md', source: 'output', type: 'md', ext: 'MD', name: '反馈分析报告.md', meta: '12 KB · Agent 产出', icon: 'MD', iconClass: 'md', clickKind: 'md', clickName: '反馈分析报告.md' },
    { id: 'output-html', source: 'output', type: 'html', ext: 'HTML', name: '反馈分布看板.html', meta: '24 KB · 可交互 · Agent 产出', icon: 'HTML', iconClass: 'html', clickKind: 'html', clickName: '反馈分布看板.html' },
    { id: 'output-xlsx', source: 'output', type: 'source', ext: 'XLSX', name: '反馈分类结果.xlsx', meta: '186 KB · 清洗后数据 · Agent 产出', icon: 'XLSX', iconClass: 'xlsx', clickKind: 'xlsx', clickName: '反馈分类结果.xlsx' },
    { id: 'output-csv', source: 'output', type: 'source', ext: 'CSV', name: '反馈分类明细.csv', meta: '142 KB · 1,247 行 · Agent 产出', icon: 'CSV', iconClass: 'csv', clickKind: 'csv', clickName: '反馈分类明细.csv' },
    { id: 'output-json', source: 'output', type: 'source', ext: 'JSON', name: 'analysis_result.json', meta: '38 KB · 结构化结果 · Agent 产出', icon: 'JSON', iconClass: 'json', clickKind: 'json', clickName: 'analysis_result.json' },
    { id: 'output-img', source: 'output', type: 'image', ext: 'PNG', name: '反馈分布图组（3 张）', meta: '1.8 MB · Agent 产出', icon: 'PNG', iconClass: 'imgs', clickKind: 'imgs', clickName: '反馈分布图组' },
    { id: 'output-zip', source: 'output', type: 'source', ext: 'ZIP', name: '完整交付包.zip', meta: '5.2 MB · 包含全部产物 · Agent 产出', icon: 'ZIP', iconClass: 'zip', clickKind: 'zip', clickName: '完整交付包.zip' }
  ]
};

const FILE_PANEL_STATE = {
  input: FILE_DEFS.input.map(item => ({ ...item })),
  output: FILE_DEFS.output.map(item => ({ ...item })),
  savedAssets: []
};

const INITIAL_LIBRARY_ASSET = {
  name: '销售预测系统.html',
  source: '来自会话文件快照',
  icon: 'HTML',
  typeClass: 'html'
};

const DETAIL_LIBRARY_ASSET = {
  name: '销售预测系统.html',
  source: '来自资料详情另存副本',
  icon: 'HTML',
  typeClass: 'html'
};

function getFileActions(source, type) {
  const sourceActions = FILE_ACTIONS[source];
  if (!sourceActions) return [];
  return sourceActions[type] || sourceActions.normal || [];
}

function buildFileActionButton(action, file) {
  if (action === 'quote') {
    return `<button class="btn-attach" onclick="event.stopPropagation(); addFileToConversation('${file.clickName}')">引用</button>`;
  }
  if (action === 'open') {
    return `<button class="file-icon-action" title="新窗口打开" onclick="event.stopPropagation(); openFileInNewWindow('${file.clickKind}', '${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7v7"/><path d="M13 3L7 9"/><path d="M4 5H3v8h8v-1"/></svg></button>`;
  }
  if (action === 'download') {
    return `<button class="file-icon-action" title="下载" onclick="event.stopPropagation(); downloadFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v8"/><path d="M5 8l3 3 3-3"/><path d="M3 13.5h10"/></svg></button>`;
  }
  if (action === 'share') {
    return `<button class="file-icon-action" title="分享" onclick="event.stopPropagation(); shareFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 4.5L6.7 6.3"/><path d="M10.5 11.5L6.7 9.7"/><path d="M4.5 9.5a1.5 1.5 0 1 0 0-3"/><path d="M11.5 4.5a1.5 1.5 0 1 0 0 3"/><path d="M11.5 11.5a1.5 1.5 0 1 0 0-3"/></svg></button>`;
  }
  if (action === 'saveLibrary') {
    if (file.savedToLibrary) {
      return `<button class="library-state-btn is-compact is-saved" disabled onclick="event.stopPropagation()">已存入资料库</button>`;
    }
    return `<button class="library-state-btn is-compact" onclick="event.stopPropagation(); handleOutputLibrarySave('${file.clickName}')">存入资料库</button>`;
  }
  if (action === 'saveBackend') {
    return `<button class="library-state-btn is-compact" onclick="event.stopPropagation(); saveSkillToBackend('${file.clickName}')">另存到后台</button>`;
  }
  return '';
}

function renderFileRow(file) {
  const actions = getFileActions(file.source, file.type);
  const actionHtml = actions.map(action => buildFileActionButton(action, file)).join('');
  const openAttr = `onclick="handleFileRowClick('${file.id}')"`;
  return `
    <div class="file-row" data-source="${file.source}" data-filetype="${file.type}" ${openAttr}>
      <div class="file-icon ${file.iconClass}">${file.icon}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${file.meta}</div>
      </div>
      <div class="file-actions">${actionHtml}</div>
    </div>`;
}

function findFileById(fileId) {
  return [...FILE_PANEL_STATE.input, ...FILE_PANEL_STATE.output].find(file => file.id === fileId);
}

function handleFileRowClick(fileId) {
  const file = findFileById(fileId);
  if (!file) return;
  if (file.source === 'input') {
    openFileInNewWindow(file.clickKind, file.clickName);
    return;
  }
  openPreview(file.clickKind, file.clickName);
}

function renderFilePanel() {
  const inputList = $('filesListMaterials');
  const outputList = $('filesListOutputs');
  if (inputList) inputList.innerHTML = FILE_PANEL_STATE.input.map(renderFileRow).join('');
  if (outputList) outputList.innerHTML = FILE_PANEL_STATE.output.map(renderFileRow).join('');
  const materialsCount = $('materialsCount');
  if (materialsCount) materialsCount.textContent = String(FILE_PANEL_STATE.input.length);
  const outputsCount = $('outputsCount');
  if (outputsCount) outputsCount.textContent = String(FILE_PANEL_STATE.output.length);
}

function getPreviewFile(fileName) {
  return [...FILE_PANEL_STATE.input, ...FILE_PANEL_STATE.output].find(file => file.clickName === fileName || file.name === fileName) || null;
}

function renderPreviewToolbarActions(file) {
  const actionWrap = $('previewActions');
  if (!actionWrap) return;
  if (!file) {
    actionWrap.innerHTML = '';
    return;
  }
  actionWrap.innerHTML = getFileActions(file.source, file.type).map(action => buildFileActionButton(action, file)).join('');
}

function renderPreviewModeTools(file, mode) {
  const tools = $('previewModeTools');
  if (!tools) return;
  if (!file) {
    tools.innerHTML = '';
    return;
  }
  if (mode === 'ppt') {
    tools.innerHTML = `
      <button class="preview-tool-btn">风格</button>
      <button class="preview-tool-btn">演示者备注</button>
    `;
    return;
  }
  if (mode === 'html') {
    tools.innerHTML = `
      <div class="preview-tool-group">
        <button class="preview-tool-btn is-active" data-html-mode="desktop" onclick="setHtmlPreviewMode('desktop')">电脑</button>
        <button class="preview-tool-btn" data-html-mode="mobile" onclick="setHtmlPreviewMode('mobile')">手机</button>
      </div>
      <button class="preview-tool-btn" onclick="refreshHtmlPreview()">刷新</button>
    `;
    return;
  }
  if (mode === 'md') {
    tools.innerHTML = `<button class="preview-tool-btn">风格</button>`;
    return;
  }
  if (mode === 'image') {
    tools.innerHTML = `
      <button class="preview-tool-btn" onclick="zoomPreviewImage(1.15)">放大</button>
      <button class="preview-tool-btn" onclick="zoomPreviewImage(0.87)">缩小</button>
      <button class="preview-tool-btn" onclick="rotatePreviewImage()">旋转</button>
    `;
    return;
  }
  if (mode === 'pdf') {
    tools.innerHTML = `
      <button class="preview-tool-btn">目录</button>
      <button class="preview-tool-btn">跳页</button>
      <button class="preview-tool-btn" onclick="zoomPreviewPdf(10)">放大</button>
      <button class="preview-tool-btn" onclick="zoomPreviewPdf(-10)">缩小</button>
      <button class="preview-tool-btn" onclick="togglePdfFitMode()">适应</button>
      <button class="preview-tool-btn" onclick="togglePdfOrientation()">方向</button>
    `;
    return;
  }
  tools.innerHTML = '';
}

function renderPreviewBody(file, mode) {
  const slideList = $('slideList');
  const slideCanvas = $('slideCanvas');
  const slideNotes = document.querySelector('.slide-notes');
  if (!slideList || !slideCanvas) return;
  slideList.innerHTML = '';
  slideCanvas.classList.remove('is-fading');
  if (slideNotes) {
    slideNotes.hidden = mode !== 'ppt';
    slideNotes.textContent = mode === 'ppt' ? '点击添加演示者备注' : '';
  }
  if (!file) {
    slideCanvas.innerHTML = `<div class="preview-empty-state"><div class="preview-empty-title">未选择文件</div><div class="preview-empty-copy">请选择一个会话文件来查看预览。</div></div>`;
    return;
  }
  if (mode === 'ppt') {
    renderAllSlides();
    return;
  }
  if (mode === 'skill') {
    slideCanvas.innerHTML = `
      <div class="preview-empty-state">
        <div class="preview-empty-title">技能文件</div>
        <div class="preview-empty-copy">${file.savedToBackend ? '已另存到后台，可继续回填提示词到 sender。' : '可选择另存到后台，并回填提示词到 sender。'}</div>
        <button class="preview-empty-action" onclick="fillSkillPromptToSender()">回填提示词到 sender</button>
      </div>`;
    return;
  }
  if (mode === 'html') {
    slideCanvas.innerHTML = `
      <div class="html-preview-frame ${currentPreviewHtmlMode}">
        <div class="html-preview-device">
          <div class="html-preview-address">https://preview.local/${file.clickName}</div>
          <div class="html-preview-content">
            <div class="html-preview-kpi">反馈总量 1,247</div>
            <div class="html-preview-chart"></div>
            <div class="html-preview-grid">
              <div class="html-preview-card">物流配送 42%</div>
              <div class="html-preview-card">客户服务 28%</div>
              <div class="html-preview-card">产品质量 18%</div>
            </div>
          </div>
        </div>
      </div>`;
    return;
  }
  if (mode === 'md') {
    slideCanvas.innerHTML = `
      <div class="md-preview">
        <div class="md-preview-title">${file.name}</div>
        <div class="md-preview-body">
          <p>本报告仅支持风格切换，不支持正文编辑。</p>
          <p>适合快速浏览、引用和继续沉淀到资料库。</p>
        </div>
      </div>`;
    return;
  }
  if (mode === 'image') {
    slideCanvas.innerHTML = `
      <div class="image-preview-shell">
        <div class="image-preview-canvas" style="transform: scale(${currentPreviewImageScale}) rotate(${currentPreviewImageRotation}deg);">
          <div class="image-preview-placeholder">图片组预览</div>
        </div>
      </div>`;
    return;
  }
  if (mode === 'pdf') {
    slideCanvas.innerHTML = `
      <div class="pdf-reader-shell ${currentPreviewPdfOrientation}">
        <div class="pdf-reader-toolbar">
          <span>目录 · 第 1 / 8 页</span>
          <span>缩放 ${currentPreviewPdfZoom}%</span>
          <span>${currentPreviewPdfFit === 'fit-width' ? '适应宽度' : '适应页面'} · ${currentPreviewPdfOrientation === 'vertical' ? '纵向' : '横向'}</span>
        </div>
        <div class="pdf-reader-page">
          <div class="pdf-page-title">反馈分析报告</div>
          <div class="pdf-page-line"></div>
          <div class="pdf-page-line short"></div>
          <div class="pdf-page-chart"></div>
        </div>
      </div>`;
    return;
  }
  const unsupportedCopy = file.source === 'output'
    ? '该类型暂不支持预览，当前仅支持引用和下载。'
    : '输入文件不支持存入资料库，可引用到对话；其他类文件还可下载。';
  slideCanvas.innerHTML = `
    <div class="preview-empty-state">
      <div class="preview-empty-title">暂不支持预览</div>
      <div class="preview-empty-copy">${unsupportedCopy}</div>
    </div>`;
}

function renderPreviewFrame(file) {
  const mode = getPreviewMode(file?.clickKind);
  renderPreviewToolbarActions(file);
  renderPreviewModeTools(file, mode);
  renderPreviewBody(file, mode);
}

function setHtmlPreviewMode(mode) {
  currentPreviewHtmlMode = mode;
  const file = currentPreviewFile;
  if (!file) return;
  renderPreviewFrame(file);
}

function refreshHtmlPreview() {
  const file = currentPreviewFile;
  if (!file) return;
  renderPreviewFrame(file);
  showToast('HTML 预览已刷新');
}

function zoomPreviewImage(multiplier) {
  currentPreviewImageScale = Math.max(0.5, Math.min(2.4, Math.round((currentPreviewImageScale * multiplier) * 100) / 100));
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function rotatePreviewImage() {
  currentPreviewImageRotation = (currentPreviewImageRotation + 90) % 360;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function zoomPreviewPdf(delta) {
  currentPreviewPdfZoom = Math.max(50, Math.min(180, currentPreviewPdfZoom + delta));
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function togglePdfFitMode() {
  currentPreviewPdfFit = currentPreviewPdfFit === 'fit-width' ? 'fit-page' : 'fit-width';
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function togglePdfOrientation() {
  currentPreviewPdfOrientation = currentPreviewPdfOrientation === 'vertical' ? 'horizontal' : 'vertical';
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

// chatBody 是 B 对话区的滚动容器
const chatBody = $('chatBody');
function scrollToBottom() {
  if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
}

const moduleState = {
  dora: { page: 'home' },
  experts: { page: 'list', conversationType: 'smart-data' },
  space: { page: 'home' }
};

const expertUnreadItems = [
  { type: 'smart-data', label: '智能问数', summary: '经营指标归因分析', count: 2, latest: '本周经营指标归因分析' },
  { type: 'report', label: '智能报告', summary: '报告生成任务已完成', count: 1, latest: '经营分析PPT生成' }
];

const conversationConfigs = {
  dora: {
    returnView: 'dora',
    sidebarCollapsed: true,
    sideAgent: 'Dora',
    title: 'Dora 会话',
    subtitle: '全能助手 · 通用任务',
    history: 'ROI 同比环比拆解',
    userText: '帮我计算ROI与同比环比，拆解增长驱动因素',
    agentName: 'Dora'
  },
  'smart-data': {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '智能问数',
    title: '智能问数会话',
    subtitle: '专家 Agent · 指标归因与经营分析',
    history: '经营指标归因分析',
    userText: '帮我分析本月销售额下滑的主要原因，并拆到区域和产品线。',
    agentName: '智能问数'
  },
  report: {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '智能报告',
    title: '智能报告会话',
    subtitle: '专家 Agent · 报告与PPT生成',
    history: '经营分析PPT生成',
    userText: '把这次经营分析结果整理成一份适合汇报的 PPT。',
    agentName: '智能报告'
  },
  analysis: {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '经营分析助手',
    title: '经营分析助手会话',
    subtitle: '专家 Agent · 经营诊断',
    history: '经营健康度诊断',
    userText: '帮我看一下本季度经营表现，找出增长和风险点。',
    agentName: '经营分析助手'
  },
  modeling: {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '数据建模顾问',
    title: '数据建模顾问会话',
    subtitle: '专家 Agent · 指标和模型设计',
    history: '销售分析模型设计',
    userText: '帮我梳理销售分析需要哪些指标、维度和口径。',
    agentName: '数据建模顾问'
  },
  finance: {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '财务小助手',
    title: '财务小助手会话',
    subtitle: '专家 Agent · 财务分析',
    history: '费用结构异常分析',
    userText: '帮我分析本月费用结构是否有异常。',
    agentName: '财务小助手'
  },
  marketing: {
    returnView: 'experts',
    sidebarCollapsed: false,
    sideAgent: '营销策略助手',
    title: '营销策略助手会话',
    subtitle: '专家 Agent · 客户分层与活动复盘',
    history: '营销活动复盘',
    userText: '帮我复盘这次营销活动，看看哪些客户群体转化最好。',
    agentName: '营销策略助手'
  }
};

const agentSwitchOptions = [
  { type: 'smart-data', logo: 'S', name: '智能问数', desc: '指标归因与经营分析' },
  { type: 'report', logo: 'R', name: '智能报告', desc: '报告、PPT 与结构化结论' },
  { type: 'analysis', logo: 'A', name: '经营分析助手', desc: '经营表现诊断与风险识别' },
  { type: 'modeling', logo: 'D', name: '数据建模顾问', desc: '指标、维度、口径和模型设计' },
  { type: 'finance', logo: 'F', name: '财务小助手', desc: '预算、费用结构与异常波动' },
  { type: 'marketing', logo: 'M', name: '营销策略助手', desc: '客户分层与活动复盘' }
];


/* =========================================================================
   2. 顶部方案切换 (A 的 Sender 方案 + B 的对话方案)
   ========================================================================= */
function switchVariant(id, el) {
  currentVariant = id;
  document.body.dataset.senderVariant = id;
  document.querySelectorAll('#variantGroupA .v-tab').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');
}

function switchBVariant(id, el, opts = {}) {
  const previousVariant = currentBVariant;
  currentBVariant = id;
  document.body.dataset.variant = id;
  document.querySelectorAll('#variantGroupB .v-tab-b').forEach(tab => tab.classList.remove('active'));
  if (el) el.classList.add('active');
  if (isProcessTopLikeVariant()) scrollToBottom();
  if (!opts.skipReplay && hasScenarioBooted && previousVariant !== id) {
    if ($('view-conversation').classList.contains('active')) {
      playScenario();
    }
  }
}

function isProcessTopLikeVariant() {
  return currentBVariant === 'process-top' || currentBVariant === 'product-live' || currentBVariant === 'muted-process';
}
function shouldStreamResult() {
  return currentBVariant === 'product-live' || currentBVariant === 'muted-process';
}
function isLiveOutputVariant() {
  return currentBVariant === 'product-live' || currentBVariant === 'muted-process';
}

function toggleVariantGroups(showB) {
  $('variantGroupA').style.display = showB ? 'none' : 'flex';
  $('variantGroupB').style.display = showB ? 'flex' : 'none';
}


/* =========================================================================
   3. A 的 Sender 三方案 (菜单/平铺/堆叠)
   ========================================================================= */
function toggleSenderMenu(context) {
  activeSenderContext = context;
  const menu = $(context + 'SenderMenu');
  if (!menu) return;
  const isOpen = menu.classList.contains('open');
  document.querySelectorAll('.sender-menu').forEach(item => item.classList.remove('open'));
  if (!isOpen) menu.classList.add('open');
}

function openSenderMenu(context) {
  activeSenderContext = context;
  document.querySelectorAll('.sender-menu').forEach(item => item.classList.remove('open'));
  const menu = $(context + 'SenderMenu');
  if (menu) menu.classList.add('open');
}

function closeSenderMenus() {
  document.querySelectorAll('.sender-menu').forEach(item => item.classList.remove('open'));
}

function openLocalUpload(context) {
  activeSenderContext = context;
  closeSenderMenus();
  $('localFileInput').click();
}

function openAssetModal(type) {
  pendingAssetType = type;
  pendingAssetLabel = type === 'bi' ? 'BI demo_门店销售表' : 'FR demo_地区看板';
  const mask = $('assetModal');
  if (!mask) return;
  const modal = mask.querySelector('.modal');
  modal.dataset.source = type;
  $('assetModalTitle').textContent = type === 'bi' ? '添加 FineBI 资产' : '添加 FineReport 资产';
  $('assetModalTagText').textContent = pendingAssetLabel;
  mask.classList.add('open');
  closeSenderMenus();
}
// 保留旧名作为别名, 既有 HTML 上的 onclick="openAssetPicker(...)" 全部走新逻辑
function openAssetPicker(type) { openAssetModal(type); }

function closeAssetModal() {
  const mask = $('assetModal');
  if (mask) mask.classList.remove('open');
}
function closeAssetPicker() { closeAssetModal(); }

function addSenderFileChip(context, kind, label, tone) {
  const row = $(context + 'SenderFiles');
  if (!row) return;
  const chip = document.createElement('div');
  chip.className = 'sender-file-chip';
  chip.innerHTML = `<span class="sender-file-icon" style="background:${tone === 'purple' ? '#7C5CFF' : tone === 'teal' ? '#1DB6A0' : '#6D94FF'}">${kind}</span><span>${label}</span>`;
  row.appendChild(chip);
  row.classList.add('has-file');
}

function confirmAssetModal() {
  const context = activeSenderContext || 'hero';
  addSenderFileChip(context, pendingAssetType === 'bi' ? 'BI' : 'FR', pendingAssetLabel, pendingAssetType === 'bi' ? 'blue' : 'purple');
  closeAssetModal();
  showToast(`已添加 ${pendingAssetType === 'bi' ? 'FineBI' : 'FineReport'} 资产`);
}
function confirmAssetPicker() { confirmAssetModal(); }

function getFileKind(fileName) {
  const lowerName = (fileName || '').toLowerCase();
  if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx')) return { kind: 'PPT', tone: 'purple' };
  if (lowerName.endsWith('.xls') || lowerName.endsWith('.xlsx') || lowerName.endsWith('.csv')) return { kind: 'XLSX', tone: 'teal' };
  if (lowerName.endsWith('.md')) return { kind: 'MD', tone: 'blue' };
  if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx')) return { kind: 'DOCX', tone: 'blue' };
  if (lowerName.endsWith('.html') || lowerName.endsWith('.htm')) return { kind: 'HTML', tone: 'blue' };
  return { kind: 'FILE', tone: 'blue' };
}

$('localFileInput').addEventListener('change', event => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  files.forEach(file => {
    const fileKind = getFileKind(file.name);
    addSenderFileChip(activeSenderContext || 'hero', fileKind.kind, file.name, fileKind.tone);
  });
  showToast(`已添加 ${files.length} 个本地文件`);
  event.target.value = '';
});


/* =========================================================================
   4. 视图切换 + Rail
   ========================================================================= */
function setRailActive(view) {
  document.querySelectorAll('.rail-tab').forEach(tab => tab.classList.toggle('active', tab.dataset.view === view));
}

function showSurface(surfaceId) {
  document.querySelectorAll('.surface').forEach(surface => surface.classList.remove('active'));
  $(surfaceId).classList.add('active');
  // 进入会话页时显示 B 的方案；离开时显示 A 的方案
  const inConversation = surfaceId === 'view-conversation';
  toggleVariantGroups(inConversation);
  // 进入会话页时自动播放剧本
  if (inConversation && hasScenarioBooted) {
    playScenario();
  }
}

function switchView(view) {
  currentModuleView = view;
  setRailActive(view);
  if (view === 'experts' && moduleState.experts.page === 'conversation') {
    showSurface('view-conversation');
    return;
  }
  showSurface('view-' + view);
  closeSourcePopover();
}

function openUnreadExpert(type) {
  const config = conversationConfigs[type] || conversationConfigs['smart-data'];
  applyConversationConfig(type, config, 'experts');
  moduleState.experts.page = 'conversation';
  moduleState.experts.conversationType = type;
  selectConversationEntry('expert', 'new', $('expertNewConversation'));
}

function clearExpertUnread(type) {
  const item = expertUnreadItems.find(entry => entry.type === type);
  if (item) item.count = 0;
  refreshExpertUnreadState();
}

function refreshExpertUnreadState() {
  const activeItems = expertUnreadItems.filter(item => item.count > 0);
  const totalCount = activeItems.reduce((sum, item) => sum + item.count, 0);
  const expertTab = document.querySelector('.rail-tab[data-view="experts"]');
  const expertWrap = $('expertRailWrap');
  if (expertTab) {
    expertTab.classList.toggle('has-unread', totalCount > 0);
    expertTab.dataset.unread = totalCount > 0 ? String(totalCount) : '';
  }
  if (expertWrap) expertWrap.classList.toggle('has-popover', totalCount > 0);
  const popover = $('expertUnreadPopover');
  if (popover) {
    const popList = popover.querySelector('.rail-tab-popover-list');
    const popHead = popover.querySelector('.rail-tab-popover-head .unread-count');
    if (popHead) {
      popHead.textContent = totalCount > 0 ? String(totalCount) : '';
      popHead.style.display = totalCount > 0 ? '' : 'none';
    }
    if (popList) {
      popList.innerHTML = activeItems.map(item => `
        <button class="rail-tab-popover-item" onclick="openUnreadExpert('${item.type}')">
          <strong>${item.label}</strong>
          <span>${item.summary} · ${item.count} 条新消息</span>
          <span class="unread-count">${item.count}</span>
        </button>
      `).join('');
    }
  }
}


/* =========================================================================
   5. 会话页 (进入/退出/Agent 切换)
   ========================================================================= */
function openConversation(type) {
  if (type === 'dora') {
    startDoraConversationFlow();
    return;
  }
  const config = conversationConfigs[type] || conversationConfigs.dora;
  applyConversationConfig(type, config, config.returnView);
  moduleState.experts.page = 'conversation';
  moduleState.experts.conversationType = type;
  selectConversationEntry('expert', 'new', $('expertNewConversation'));
}

function applyConversationConfig(type, config, activeRailView) {
  currentConversationType = type || 'smart-data';
  conversationReturnView = config.returnView;
  const isDoraConversation = currentConversationType === 'dora';
  $('conversationSideAgent').textContent = config.sideAgent;
  $('conversationTitle').textContent = config.title;
  $('conversationSubtitle').textContent = config.subtitle;
  if (!currentSourceTrace) $('conversationHistoryTitle').textContent = config.history;
  $('conversationUserText').textContent = config.userText;
  $('conversationAgentName').textContent = config.agentName || config.sideAgent;
  $('conversationPage').classList.toggle('sidebar-collapsed', Boolean(config.sidebarCollapsed));
  $('conversationPage').classList.toggle('dora-mode', isDoraConversation);
  const backBtn = document.querySelector('.conversation-back-btn');
  if (backBtn) backBtn.style.display = isDoraConversation ? 'none' : '';
  const switchBtn = $('agentSwitchButton');
  if (switchBtn) switchBtn.style.display = isDoraConversation ? 'none' : '';
  const spacer = document.querySelector('.agent-switch-spacer');
  if (spacer) spacer.style.display = isDoraConversation ? 'none' : '';
  $('conversationInput').value = '';
  closeAgentSwitch();
  if (!isDoraConversation) renderAgentSwitchList('');
  currentModuleView = activeRailView;
  if (activeRailView === 'experts') {
    moduleState.experts.page = 'conversation';
    moduleState.experts.conversationType = currentConversationType;
  }
  if (activeRailView === 'dora') {
    moduleState.dora.page = 'conversation';
  }
  syncConversationTracePill();
  syncConversationHistoryTitle();
  setRailActive(activeRailView);
  showSurface('view-conversation');
}

function startDoraConversationFlow() {
  const title = '计算ROI与同比环比拆解';
  const config = {
    ...conversationConfigs.dora,
    sidebarCollapsed: false,
    history: title,
    userText: '帮我计算ROI与同比环比，拆解增长驱动因素'
  };
  const doraHistory = $('doraLatestHistory');
  if (doraHistory) doraHistory.textContent = title;
  selectConversationEntry('dora', 'history', doraHistory);
  applyConversationConfig('dora', config, 'dora');
  $('conversationPage').classList.remove('sidebar-collapsed');
  if (!preserveTraceTitle && !currentSourceTrace) $('conversationHistoryTitle').textContent = title;
  selectConversationEntry('expert', 'history', $('conversationHistoryTitle'));
}

function showDoraNewConversation() {
  moduleState.dora.page = 'home';
  selectConversationEntry('dora', 'new', $('doraNewConversation'));
  switchView('dora');
  toggleDoraSidebar(true);
}

function handleConversationNewClick(target) {
  if (currentConversationType === 'dora') {
    selectConversationEntry('expert', 'new', target);
    showDoraNewConversation();
    return;
  }
  selectConversationEntry('expert', 'new', target);
}

function toggleAgentSwitch(event) {
  event.stopPropagation();
  const popover = $('agentSwitchPopover');
  const nextOpen = !popover.classList.contains('open');
  if (nextOpen) {
    $('agentSwitchSearch').value = '';
    renderAgentSwitchList('');
    popover.classList.add('open');
    setTimeout(() => $('agentSwitchSearch').focus(), 0);
    return;
  }
  closeAgentSwitch();
}

function closeAgentSwitch() {
  if ($('agentSwitchPopover')) $('agentSwitchPopover').classList.remove('open');
}

function filterAgentSwitchList(keyword) {
  renderAgentSwitchList(keyword);
}

function renderAgentSwitchList(keyword) {
  const list = $('agentSwitchList');
  if (!list) return;
  const normalizedKeyword = (keyword || '').trim().toLowerCase();
  const matchedOptions = agentSwitchOptions.filter(option => {
    const text = `${option.name} ${option.desc}`.toLowerCase();
    return text.includes(normalizedKeyword);
  });
  list.innerHTML = matchedOptions.map(option => `
    <button class="agent-switch-item ${option.type === currentConversationType ? 'active' : ''}" onclick="selectAgentFromSwitch('${option.type}')">
      <span class="agent-logo">${option.logo}</span>
      <span class="agent-switch-copy">
        <span class="agent-switch-name">${option.name}</span>
        <span class="agent-switch-desc">${option.desc}</span>
      </span>
    </button>
  `).join('');
  $('agentSwitchEmpty').classList.toggle('visible', matchedOptions.length === 0);
}

function selectAgentFromSwitch(type) {
  openConversation(type);
  closeAgentSwitch();
}

function backFromConversation() {
  if (conversationReturnView === 'experts') {
    moduleState.experts.page = 'list';
  }
  switchView(conversationReturnView);
}

function expandConversationSidebar() {
  $('conversationPage').classList.remove('sidebar-collapsed');
}

function toggleDoraSidebar(open) {
  const workspace = $('doraWorkspace');
  workspace.classList.toggle('sidebar-open', typeof open === 'boolean' ? open : !workspace.classList.contains('sidebar-open'));
}

function selectConversationEntry(scope, type, target) {
  const newButton = scope === 'dora' ? $('doraNewConversation') : $('expertNewConversation');
  const historySelector = scope === 'dora' ? '.dora-side-history button' : '.conversation-history button';
  if (newButton) newButton.classList.toggle('active', type === 'new');
  document.querySelectorAll(historySelector).forEach(item => item.classList.remove('active'));
  if (type === 'history' && target) {
    target.classList.add('active');
    if (scope === 'expert' && target.classList.contains('has-unread')) {
      target.classList.remove('has-unread');
      target.dataset.unread = '';
      clearExpertUnread(currentConversationType);
    }
  }
}

// 新增：右侧资料面板折叠/展开
function toggleFilesPanel() {
  $('conversationPage').classList.toggle('files-collapsed');
}


/* =========================================================================
   6. 资源库 / 资料详情页
   ========================================================================= */
function openAssetDetail() {
  switchView('space');
  moduleState.space.page = 'detail';
  $('spaceHome').style.display = 'none';
  $('assetDetail').classList.add('active');
  expandChat();
}

function closeAssetDetail() {
  moduleState.space.page = 'home';
  $('spaceHome').style.display = '';
  $('assetDetail').classList.remove('active');
  $('versionMenu').classList.remove('open');
  closeSourcePopover();
}

function toggleVersionMenu(event) {
  event.stopPropagation();
  $('versionMenu').classList.toggle('open');
}

function showSourceHint(event) {
  event.stopPropagation();
  $('sourcePopover').classList.add('open');
}

function openSourceDialog() { $('sourcePopover').classList.add('open'); }
function closeSourcePopover() { if ($('sourcePopover')) $('sourcePopover').classList.remove('open'); }

function collapseChat() {
  $('detailChat').classList.add('collapsed');
  $('previewPane').classList.add('full');
  $('floatingDora').classList.add('visible');
}

function expandChat() {
  $('detailChat').classList.remove('collapsed');
  $('previewPane').classList.remove('full');
  $('floatingDora').classList.remove('visible');
}

function getLibraryButtonView() {
  if (libraryFileState.status === 'savedClean') {
    return { text: '已存入资料库', disabled: true, dirty: false };
  }
  if (libraryFileState.status === 'savedDirty') {
    return { text: '存入资料库', disabled: false, dirty: true };
  }
  return { text: '存入资料库', disabled: false, dirty: false };
}

function syncLibraryStateButtons() {
  const view = getLibraryButtonView();
  ['chatFileLibraryBtn', 'panelFileLibraryBtn'].forEach(id => {
    const btn = $(id);
    if (!btn) return;
    btn.textContent = view.text;
    btn.disabled = view.disabled;
    btn.classList.toggle('is-saved', view.disabled);
    btn.classList.toggle('is-dirty', view.dirty);
    btn.title = view.dirty ? '会话文件已有更新，点击同步最新快照到资料库' : '将当前会话文件快照存入资料库';
  });
  const savedAsset = $('savedFromSessionAsset');
  if (savedAsset) savedAsset.classList.toggle('visible', libraryFileState.status === 'savedClean' || libraryFileState.status === 'savedDirty');
  syncDetailSaveCopyButton();
}

function syncDetailSaveCopyButton() {
  const btn = $('detailSaveCopyBtn');
  if (!btn) return;
  const isSaved = libraryFileState.status === 'savedClean' || libraryFileState.status === 'savedDirty';
  const isDirty = libraryFileState.status === 'savedDirty';
  btn.textContent = isDirty ? '同步到资料库' : isSaved ? '已存入资料库' : '存入资料库';
  btn.classList.toggle('is-saved', isSaved && !isDirty);
  btn.classList.toggle('is-dirty', isDirty);
  btn.disabled = isSaved && !isDirty;
  btn.title = isDirty ? '当前资料有更新，点击同步最新副本' : isSaved ? '当前资料已存入资料库' : '将当前资料存入资料库';
}

function updateSavedAssetCard(asset) {
  const savedAsset = $('savedFromSessionAsset');
  if (!savedAsset) return;
  if (!asset) {
    savedAsset.classList.remove('visible');
    return;
  }
  const icon = savedAsset.querySelector('.asset-name .file-badge');
  const name = savedAsset.querySelector('.asset-name span:last-child');
  const source = savedAsset.querySelector('.asset-foot span:first-child');
  if (icon) {
    icon.className = `file-badge ${asset.typeClass || 'html'}`;
    icon.textContent = asset.icon || 'FILE';
  }
  if (name) name.textContent = asset.name;
  if (source) source.textContent = asset.source;
  savedAsset.classList.add('visible');
}

function setSavedLibraryAsset(asset) {
  FILE_PANEL_STATE.savedAssets = [asset];
  updateSavedAssetCard(asset);
}

function clearSavedLibraryAssets() {
  FILE_PANEL_STATE.savedAssets = [];
  FILE_PANEL_STATE.output.forEach(file => {
    file.savedToLibrary = false;
  });
  updateSavedAssetCard(null);
  renderFilePanel();
  if (currentPreviewFile?.source === 'output') {
    currentPreviewFile = getPreviewFile(currentPreviewFile.clickName || currentPreviewFile.name);
    renderPreviewFrame(currentPreviewFile);
  }
}

function handleLibraryStateButton(event) {
  event.stopPropagation();
  if (libraryFileState.status === 'savedClean') return;
  if (libraryFileState.status === 'savedDirty') {
    saveLibrarySnapshot('sync');
    return;
  }
  if (libraryFileState.hasDuplicateName) {
    libraryFileState.status = 'duplicate';
    openLibraryPopconfirm();
    return;
  }
  saveLibrarySnapshot('new');
}

function openLibraryPopconfirm() {
  const pop = $('libraryPopconfirm');
  if (pop) pop.classList.add('open');
}

function closeLibraryPopconfirm() {
  const pop = $('libraryPopconfirm');
  if (pop) pop.classList.remove('open');
}

function saveLibrarySnapshot(mode) {
  libraryFileState.status = 'savedClean';
  libraryFileState.savedVersion = libraryFileState.sessionVersion;
  libraryFileState.hasDuplicateName = false;
  closeLibraryPopconfirm();
  syncLibraryStateButtons();
  setSavedLibraryAsset(INITIAL_LIBRARY_ASSET);
  const copy = mode === 'sync' ? '已同步会话文件的最新快照到资料库' : mode === 'overwrite' ? '已覆盖存入资料库快照' : '已另存新文件到资料库';
  showToast(copy);
}

function saveLibrarySnapshotAsNew() {
  saveLibrarySnapshot('new');
}

function overwriteLibrarySnapshot() {
  saveLibrarySnapshot('overwrite');
}

function markSessionFileDirty() {
  libraryFileState.sessionVersion += 1;
  libraryFileState.status = libraryFileState.savedVersion > 0 ? 'savedDirty' : 'neverSaved';
  syncLibraryStateButtons();
  showToast('会话文件已更新，资料库快照不会自动同步');
}

function deleteLibrarySnapshot() {
  libraryFileState.status = 'neverSaved';
  libraryFileState.savedVersion = 0;
  clearSavedLibraryAssets();
  syncLibraryStateButtons();
  clearSourceTraceContext();
  showToast('资料库副本已删除，会话文件仍保留');
}

function showCitationSource(label) {
  currentSourceTrace = {
    type: 'citation',
    label,
    conversation: '客户反馈归因分析'
  };
  switchView('space');
  openAssetDetail();
  syncSourceTraceContext();
  toggleAssetHistoryMode(true);
  showToast(`已追溯引用来源：${label}`);
}

function citation(label, index) {
  return `<button class="citation-mark" onclick="showCitationSource('${label}')">[${index}]</button>`;
}

function saveDetailCopyToLibrary() {
  libraryFileState.status = 'savedClean';
  libraryFileState.savedVersion = libraryFileState.sessionVersion;
  libraryFileState.hasDuplicateName = false;
  setSavedLibraryAsset(DETAIL_LIBRARY_ASSET);
  syncLibraryStateButtons();
  showToast('已将当前资料版本存入资料库');
}

function syncSourceTraceContext() {
  const bar = $('sourceContextBar');
  const text = $('sourceContextText');
  const detailTitle = $('detailChatTitle');
  if (!bar || !text) return;
  if (!currentSourceTrace) {
    bar.hidden = true;
    text.textContent = '';
    if (detailTitle) detailTitle.textContent = '会话标题XXXXXX';
    return;
  }
  bar.hidden = false;
  text.textContent = currentSourceTrace.type === 'citation'
    ? `引用来源：${currentSourceTrace.label} · ${currentSourceTrace.conversation}`
    : `来源会话：${currentSourceTrace.conversation} · ${currentSourceTrace.label}`;
  if (detailTitle) detailTitle.textContent = currentSourceTrace.conversation;
  syncConversationTracePill();
}

function clearSourceTraceContext() {
  currentSourceTrace = null;
  syncSourceTraceContext();
  syncConversationTracePill();
  const config = conversationConfigs[currentConversationType] || conversationConfigs.dora;
  const title = $('conversationHistoryTitle');
  if (title) title.textContent = config.history;
}

function syncConversationTracePill() {
  const pill = $('conversationTracePill');
  if (!pill) return;
  if (!currentSourceTrace) {
    pill.hidden = true;
    pill.textContent = '';
    return;
  }
  pill.hidden = false;
  pill.textContent = currentSourceTrace.type === 'citation'
    ? `来源：${currentSourceTrace.label}`
    : `来源会话：${currentSourceTrace.conversation}`;
}

function toggleAssetHistoryMode(forceOpen) {
  const panel = $('assetHistoryPanel');
  const btn = document.querySelector('.history-filter-btn');
  if (!panel) return;
  panel.classList.toggle('open', typeof forceOpen === 'boolean' ? forceOpen : !panel.classList.contains('open'));
  if (btn) btn.classList.toggle('is-active', panel.classList.contains('open'));
}

function openSourceConversationFromAsset(conversation = '销售预测系统规则调整', label = '销售预测系统.html') {
  currentSourceTrace = {
    type: 'conversation',
    label,
    conversation
  };
  preserveTraceTitle = true;
  syncSourceTraceContext();
  syncConversationHistoryTitle();
  showToast(`已切换到来源会话：${conversation}`);
  openConversation('dora');
  preserveTraceTitle = false;
}

function syncConversationHistoryTitle() {
  const title = $('conversationHistoryTitle');
  if (!title || !currentSourceTrace) return;
  title.textContent = currentSourceTrace.type === 'citation'
    ? `来源引用：${currentSourceTrace.label}`
    : currentSourceTrace.conversation;
}

function addFileToConversation(fileName) {
  addSenderFileChip('conversation', 'REF', fileName, 'blue');
  showToast(`已引用 ${fileName}`);
}

function openFileInNewWindow(kind, fileName) {
  openPreview(kind, fileName);
  showToast(`已在新窗口打开 ${fileName}`);
}

function downloadFile(fileName) {
  showToast(`开始下载 ${fileName}`);
}

function shareFile(fileName) {
  showToast(`已生成 ${fileName} 的分享链接`);
}

function handleOutputLibrarySave(fileName) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (!file) return;
  file.savedToLibrary = true;
  setSavedLibraryAsset({
    name: file.name,
    source: '来自会话输出',
    icon: file.ext,
    typeClass: file.iconClass === 'pptx' ? 'ppt' : file.iconClass
  });
  renderFilePanel();
  if (currentPreviewFile && (currentPreviewFile.clickName === file.clickName || currentPreviewFile.name === file.name)) {
    currentPreviewFile = file;
    renderPreviewFrame(file);
  }
  showToast(`已将 ${file.name} 存入资料库`);
}

function saveSkillToBackend(fileName) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (file) file.savedToBackend = true;
  renderFilePanel();
  if (file && currentPreviewFile && (currentPreviewFile.clickName === file.clickName || currentPreviewFile.name === file.name)) {
    currentPreviewFile = file;
    renderPreviewFrame(file);
  }
  showToast(`已将 ${fileName} 另存到后台`);
}

function fillSkillPromptToSender() {
  const input = $('conversationInput');
  if (!input) return;
  input.value = '使用「客户反馈分析技能」分析新的客户反馈文件，并输出分类结果和汇报建议。';
  $('conversationSendBtn').classList.add('is-active');
  input.focus();
  showToast('已回填技能提示词到输入框');
}


/* =========================================================================
   7. Toast
   ========================================================================= */
let toastTimer = null;
function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}


/* =========================================================================
   8. 演示标注 (1-17) tooltip
   ========================================================================= */
function toggleDemoMode(el) {
  document.body.classList.toggle('demo-mode');
  el.classList.toggle('active');
  if (!document.body.classList.contains('demo-mode')) hideChangeTooltip();
}

let activeChangeMarker = null;
function hideChangeTooltip() {
  activeChangeMarker = null;
  const layer = $('change-tooltip-layer');
  const bubble = $('change-tooltip-bubble');
  if (!layer || !bubble) return;
  layer.classList.remove('open');
  bubble.textContent = '';
}
function getChangeTooltipPlacement(marker) {
  if (!marker) return 'right';
  if (marker.dataset.changePlacement) return marker.dataset.changePlacement;
  if (marker.classList.contains('tooltip-left')) return 'left';
  if (marker.classList.contains('tooltip-top')) return 'top';
  return 'right';
}
function syncChangeTooltipPosition() {
  if (!activeChangeMarker || !document.body.classList.contains('demo-mode')) {
    hideChangeTooltip();
    return;
  }
  const bubble = $('change-tooltip-bubble');
  if (!bubble) return;
  const markerRect = activeChangeMarker.getBoundingClientRect();
  bubble.style.left = '0px';
  bubble.style.top = '0px';
  const bubbleRect = bubble.getBoundingClientRect();
  const gap = 12;
  const pad = 12;
  const placement = getChangeTooltipPlacement(activeChangeMarker);
  let left = markerRect.right + gap;
  let top = markerRect.top + markerRect.height / 2 - bubbleRect.height / 2;
  if (placement === 'left') {
    left = markerRect.left - bubbleRect.width - gap;
    if (left < pad) left = markerRect.right + gap;
  }
  if (placement === 'top') {
    left = markerRect.left + markerRect.width / 2 - bubbleRect.width / 2;
    top = markerRect.top - bubbleRect.height - gap;
    if (top < pad) top = markerRect.bottom + gap;
  }
  if (left + bubbleRect.width > window.innerWidth - pad) left = window.innerWidth - bubbleRect.width - pad;
  if (left < pad) left = pad;
  if (top + bubbleRect.height > window.innerHeight - pad) top = window.innerHeight - bubbleRect.height - pad;
  if (top < pad) top = pad;
  bubble.style.left = Math.round(left) + 'px';
  bubble.style.top = Math.round(top) + 'px';
}
function showChangeTooltip(marker) {
  if (!marker || !document.body.classList.contains('demo-mode')) return;
  const text = marker.dataset.changeTooltip || '';
  const layer = $('change-tooltip-layer');
  const bubble = $('change-tooltip-bubble');
  if (!text || !layer || !bubble) return;
  activeChangeMarker = marker;
  bubble.textContent = text;
  layer.classList.add('open');
  syncChangeTooltipPosition();
}


/* =========================================================================
   9. B 的剧本驱动 — 工具函数
   ========================================================================= */
function clearScenario() {
  scenarioTimers.forEach(clearTimeout); scenarioTimers = [];
  if (waitTimerId) { clearInterval(waitTimerId); waitTimerId = null; }
  if (carouselIntervalId) { clearInterval(carouselIntervalId); carouselIntervalId = null; }
}
function at(ms, fn) { scenarioTimers.push(setTimeout(fn, ms)); }

async function setResult(html, opts = {}) {
  const slot = $('resultSlot');
  const { isFinal = false } = opts;
  const stream = opts.stream ?? shouldStreamResult();
  const token = ++resultStreamToken;
  if (!slot.classList.contains('is-empty')) { slot.classList.add('is-fading'); await sleep(280); }
  else { slot.classList.remove('is-empty'); }
  slot.classList.toggle('is-final', isFinal);
  slot.classList.toggle('is-interim', !isFinal);
  if (token !== resultStreamToken) return;
  if (!stream) {
    slot.innerHTML = html;
    void slot.offsetWidth;
    slot.classList.remove('is-fading');
    scrollToBottom();
    return;
  }
  const streamText = html
    .replace(/<(br|\/p|\/div|\/li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  slot.textContent = '';
  void slot.offsetWidth;
  slot.classList.remove('is-fading');
  for (const char of streamText) {
    if (token !== resultStreamToken) return;
    slot.textContent += char;
    followStreamingReply();
    await sleep(12);
  }
  if (token !== resultStreamToken) return;
  slot.innerHTML = html;
  void slot.offsetWidth;
  slot.classList.remove('is-fading');
  scrollToBottom();
}

function followStreamingReply() {
  if (isProcessTopLikeVariant()) scrollToBottom();
}

async function setExecTitle(text) {
  const el = $('execTitle');
  el.classList.add('is-fading'); await sleep(220);
  el.textContent = text; el.classList.remove('is-fading');
}

function addActionNode({ stage, title, detail, files, code }) {
  actionCount += 1; nodeCounter += 1;
  const id = 'node-' + nodeCounter;
  const li = document.createElement('li');
  li.className = 'exec-node is-running'; li.id = id;
  const stageHtml = stage ? `<span class="stage-tag ${stage.cls}">${stage.label}</span>` : '';
  let body = `<div class="exec-node-title"><span class="title-text">${title}</span>${stageHtml}</div>`;
  if (detail) body += `<div class="exec-node-detail">${detail}</div>`;
  if (files && files.length) {
    body += `<div class="exec-node-files">` +
      files.map(f => {
        const cls = (f.kind ? ' is-' + f.kind : '') + (f.role ? ' role-' + f.role : '');
        return `<span class="exec-file-pill${cls}">${f.name || f}</span>`;
      }).join('') +
      `</div>`;
  }
  if (code !== undefined) body += `<pre class="exec-code" id="${id}-code"><span class="cursor"></span></pre>`;
  li.innerHTML = `<span class="exec-dot"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6.5l2 2 4-5"/></svg></span>` + body;
  $('execTimeline').appendChild(li);
  requestAnimationFrame(() => li.classList.add('is-visible'));
  scrollExecToBottom();
  followStreamingReply();
  return id;
}

function completeNode(id) {
  const li = $(id); if (!li) return;
  li.classList.remove('is-running'); li.classList.add('is-done');
  const cur = li.querySelector('.exec-code .cursor'); if (cur) cur.remove();
}

async function appendCode(id, lines, perLineDelay = 260) {
  const codeEl = $(id + '-code'); if (!codeEl) return;
  for (const line of lines) {
    codeEl.insertBefore(document.createTextNode(line + '\n'), codeEl.querySelector('.cursor'));
    codeEl.scrollTop = codeEl.scrollHeight;
    followStreamingReply();
    await sleep(perLineDelay);
  }
}

function scrollExecToBottom() {
  const body = document.querySelector('.exec-body');
  if (body) body.scrollTop = body.scrollHeight;
}

const CAROUSEL_MSGS = ['正在深度分析数据...','即将得出关键结论...','已为您加速处理中...','Agent 仍在持续工作中...'];

function showWaitLine() {
  const el = $('waitLine');
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-visible'));
  if (waitTimerId) return;
  waitTimerId = setInterval(() => {
    const elapsed = Math.floor((Date.now() - scenarioStartedAt) / 1000);
    $('waitTime').textContent = elapsed + 's';
  }, 250);
}
function hideWaitLine() {
  const el = $('waitLine');
  el.classList.remove('is-visible');
  if (waitTimerId) { clearInterval(waitTimerId); waitTimerId = null; }
  setTimeout(() => { el.hidden = true; }, 300);
}
function clearWaitText() {
  $('waitText').hidden = true; $('waitText').textContent = '';
  $('waitCarousel').hidden = true;
  if (carouselIntervalId) { clearInterval(carouselIntervalId); carouselIntervalId = null; }
}
function setWaitText(text) {
  $('waitText').hidden = false; $('waitText').textContent = text;
  $('waitCarousel').hidden = true;
  if (carouselIntervalId) { clearInterval(carouselIntervalId); carouselIntervalId = null; }
}
function setWaitCarousel() {
  $('waitText').hidden = true;
  const carousel = $('waitCarousel'), track = $('waitCarouselTrack');
  track.innerHTML = CAROUSEL_MSGS.concat(CAROUSEL_MSGS[0]).map(m => `<span>${m}</span>`).join('');
  carousel.hidden = false;
  let idx = 0; track.style.transform = 'translateY(0)';
  if (carouselIntervalId) clearInterval(carouselIntervalId);
  carouselIntervalId = setInterval(() => {
    idx += 1;
    track.style.transform = `translateY(-${idx * 18}px)`;
    if (idx >= CAROUSEL_MSGS.length) {
      setTimeout(() => {
        track.style.transition = 'none'; track.style.transform = 'translateY(0)'; idx = 0;
        requestAnimationFrame(() => track.style.transition = '');
      }, 380);
    }
  }, 2200);
}

function togglePanel() { $('execPanel').classList.toggle('is-collapsed'); }
function foldPanelWithSummary(secondsUsed) {
  setExecTitle(`已完成 ${actionCount} 个动作 · 耗时 ${secondsUsed} 秒`);
  $('execPanel').classList.add('is-collapsed');
}


/* =========================================================================
   10. GenUI Dashboard (iframe srcdoc)
   ========================================================================= */
const GENUI_DASHBOARD_SRC = `<!doctype html><html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:-apple-system,"PingFang SC",sans-serif;padding:20px;color:#091640;background:#fff;font-size:13px;}
.dash{display:flex;gap:24px;align-items:center;}
.pie-wrap{position:relative;width:140px;height:140px;flex-shrink:0;}
.pie{width:140px;height:140px;border-radius:50%;background:conic-gradient(#2562FF 0% 42%,#6FB9FF 42% 70%,#B4D0FF 70% 88%,#E6E8ED 88% 100%);transition:transform 240ms;}
.pie:hover{transform:scale(1.04);}
.pie::after{content:'';position:absolute;inset:34px;background:#fff;border-radius:50%;box-shadow:inset 0 0 0 1px #F0F1F5;}
.center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.center .num{font-size:22px;font-weight:600;color:#091640;}
.center .lbl{font-size:11px;color:#5D6581;margin-top:2px;}
.legend{flex:1;display:flex;flex-direction:column;gap:12px;}
.row{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:6px;transition:background 120ms;}
.row:hover{background:#F7F8FA;}
.dot{width:10px;height:10px;border-radius:2px;flex-shrink:0;}
.row .name{flex:1;color:#222D53;}
.row .val{font-weight:600;color:#091640;}
.foot{margin-top:18px;padding-top:14px;border-top:1px solid #F0F1F5;font-size:12px;color:#5D6581;}
</style></head><body>
<div class="dash">
  <div class="pie-wrap"><div class="pie"></div><div class="center"><div class="num">1,247</div><div class="lbl">总反馈</div></div></div>
  <div class="legend">
    <div class="row"><span class="dot" style="background:#2562FF"></span><span class="name">物流配送</span><span class="val">42%</span></div>
    <div class="row"><span class="dot" style="background:#6FB9FF"></span><span class="name">客户服务</span><span class="val">28%</span></div>
    <div class="row"><span class="dot" style="background:#B4D0FF"></span><span class="name">产品质量</span><span class="val">18%</span></div>
    <div class="row"><span class="dot" style="background:#E6E8ED"></span><span class="name">其他</span><span class="val">12%</span></div>
  </div>
</div>
<div class="foot">数据来源：客户反馈明细.xlsx</div>
</body></html>`;


/* =========================================================================
   11. Chart Slot + GenUI Slot
   ========================================================================= */
function buildChartFrameHTML() {
  return `
    <div class="chart-frame">
      <div class="chart-rule-bar">
        <span class="chart-rule-label">图表生成规则：</span>
        <span>筛选出了</span>
        <span class="rule-pill field">反馈日期</span>
        <span class="rule-pill value">2025/04/01 00:00:00 ~ 2025/06/30 23:59:59</span>
        <span>的</span>
        <span class="rule-pill field">反馈数</span>
        <span class="rule-pill op">求和</span>
        <span class="rule-pill op">降序排列</span>
        <span class="sep">·</span>
        <span class="rule-pill field">反馈数排名</span>
        <span class="rule-pill op">求和</span>
        <span class="rule-pill op">升序排列</span>
        <span>，并按</span>
        <span class="rule-pill dim">客户名称</span>
        <span>分组</span>
      </div>
      <table class="chart-table">
        <thead><tr><th>客户名称</th><th>反馈数</th><th>反馈数排名</th></tr></thead>
        <tbody>
          <tr><td>张涛</td><td>142</td><td>1</td></tr>
          <tr><td>陶丹</td><td>98</td><td>2</td></tr>
          <tr><td>孔杰</td><td>76</td><td>3</td></tr>
          <tr><td>姜丽</td><td>58</td><td>4</td></tr>
          <tr><td>曹丹</td><td>45</td><td>5</td></tr>
        </tbody>
      </table>
      <div class="chart-foot">
        <span class="total">共 <span class="num">25</span> 条</span>
        <div class="pager">
          <button title="上一页">‹</button>
          <span class="page-num">1</span>
          <span>/ 3</span>
          <button title="下一页">›</button>
        </div>
      </div>
    </div>
  `;
}

function renderChart(nodeId) {
  const frameHTML = buildChartFrameHTML();
  const slot = $('chartSlot');
  slot.hidden = false;
  slot.innerHTML = `<div class="chart-header">Top 反馈客户排名<span class="sub">2025 Q2 · 按反馈数降序</span></div>${frameHTML}`;
  requestAnimationFrame(() => slot.classList.add('is-visible'));

  if (nodeId) {
    const node = document.getElementById(nodeId);
    if (node) {
      let wrap = node.querySelector('.node-chart-wrap');
      if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'node-chart-wrap';
        node.appendChild(wrap);
      }
      wrap.innerHTML = frameHTML;
    }
  }
  scrollToBottom();
}

function collapseChart(nodeId) {
  const slot = $('chartSlot');
  if (!slot || slot.hidden) return;

  slot.classList.add('is-collapsing');
  slot.classList.remove('is-visible');

  if (nodeId) {
    const node = document.getElementById(nodeId);
    if (node) {
      const wrap = node.querySelector('.node-chart-wrap');
      if (wrap) {
        requestAnimationFrame(() => wrap.classList.add('is-visible'));
        setTimeout(scrollExecToBottom, 320);
      }
    }
  }

  setTimeout(() => {
    slot.hidden = true;
    slot.classList.remove('is-collapsing');
    slot.innerHTML = '';
  }, 600);
}

function renderInScenarioGenUI() {
  const slot = $('genuiSlot');
  slot.hidden = false;
  slot.innerHTML = `<div class="genui-header">客户反馈问题分布<span class="genui-sub">悬停可查看各类细分占比</span></div><iframe class="genui-frame" sandbox="allow-same-origin"></iframe>`;
  const iframe = slot.querySelector('iframe');
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    try { iframe.style.height = (iframe.contentDocument.body.scrollHeight + 40) + 'px'; } catch (e) {}
    requestAnimationFrame(() => slot.classList.add('is-visible'));
    scrollToBottom();
  };
  iframe.addEventListener('load', reveal);
  iframe.srcdoc = GENUI_DASHBOARD_SRC;
  setTimeout(reveal, 900);
}

async function showLeadPill(text, holdMs = 1400) {
  const wrap = document.createElement('div');
  wrap.className = 'lead-pill';
  wrap.innerHTML = `
    <svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 5L14 7.5 9.5 9 8 14l-1.5-5L2 7.5 6.5 6z"/></svg>
    <span>${text}</span>
    <span class="dots"><span></span><span></span><span></span></span>
  `;
  $('agentReply').insertBefore(wrap, $('execPanel'));
  requestAnimationFrame(() => wrap.classList.add('is-visible'));
  scrollToBottom();
  await sleep(holdMs);
  wrap.classList.add('is-fading');
  wrap.classList.remove('is-visible');
  setTimeout(() => wrap.remove(), 320);
}


/* =========================================================================
   12. Output Cards
   ========================================================================= */
function buildPreviewContent(it) {
  if (it.loading) {
    return `<div class="output-loading-copy"><span class="ring"></span><span>${it.loadingLabel || '正在生成中'}</span></div>`;
  }
  if (it.type === 'skill') {
    return `<span class="prev-icon-big"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3v5l-2 2"/><path d="M9 5l4 4-2.5 2.5L7 8"/><path d="M5.5 10.5L4 12l2 2 1.5-1.5"/></svg></span>`;
  }
  if (it.type === 'pptx') return `<span class="ext-badge">PPTX</span>`;
  if (it.type === 'md') {
    return `<div class="md-line hash"># 客户反馈分析</div><div class="md-line bullet">物流配送 42%</div><div class="md-line bullet">客户服务 28%</div><div class="md-line dim">## 改进建议...</div>`;
  }
  if (it.type === 'html') {
    return `<div class="mini-html"><div class="mini-pie"></div><div class="mini-lines"><span></span><span></span><span></span></div></div>`;
  }
  if (it.type === 'images') {
    return `<div class="prev-stack"><div class="prev-stack-img">图 1</div><div class="prev-stack-img">图 2</div><div class="prev-stack-img">+${it.count - 2}</div></div>`;
  }
  if (it.type === 'docx') {
    return `<div class="doc-h"></div><div class="doc-l"></div><div class="doc-l"></div><div class="doc-l"></div><div class="doc-l"></div><div class="doc-l"></div>`;
  }
  if (it.type === 'pdf') return `<span class="ext-badge">PDF</span>`;
  if (it.type === 'xlsx') {
    return `<div class="grid-mini">` +
      Array.from({ length: 16 }).map(() => `<span></span>`).join('') +
      `</div>`;
  }
  if (it.type === 'csv') {
    return `<div class="csv-line head">客户,反馈类型,满意度,日期</div>` +
      `<div class="csv-line">A001,物流配送,3,05-12</div>` +
      `<div class="csv-line">A002,客户服务,2,05-12</div>` +
      `<div class="csv-line">A003,产品质量,4,05-13</div>` +
      `<div class="csv-line">A004,物流配送,3,05-13</div>` +
      `<div class="csv-line">...</div>`;
  }
  if (it.type === 'json') {
    return `<div class="j-line brace">{</div>` +
      `<div class="j-line indent"><span class="key">"total":</span> 1247,</div>` +
      `<div class="j-line indent"><span class="key">"categories":</span> [</div>` +
      `<div class="j-line indent">&nbsp;&nbsp;{"name":"物流",...},</div>` +
      `<div class="j-line indent">&nbsp;&nbsp;{"name":"客服",...}</div>` +
      `<div class="j-line brace">}</div>`;
  }
  if (it.type === 'zip') {
    return `<div class="zip-icon"></div>`;
  }
  return '';
}

function buildOutputCard(it) {
  const card = document.createElement('div');
  card.className = 'output-card' + (it.loading ? ' is-loading' : '');
  if (it.onClick) card.onclick = it.onClick;
  const titleAttr = it.desc ? `title="${it.name} — ${it.desc}"` : `title="${it.name}"`;
  card.innerHTML = `
    <div class="output-preview ${it.type}${it.loading ? ' loading' : ''}">${buildPreviewContent(it)}</div>
    <div class="output-meta">
      <div class="output-name" ${titleAttr}>${it.name}</div>
      <div class="output-sub${it.loading ? ' loading-note' : ''}">${it.sub || ''}</div>
    </div>`;
  return card;
}

function getPreviewMode(kind) {
  if (kind === 'pptx') return 'ppt';
  if (kind === 'html') return 'html';
  if (kind === 'md') return 'md';
  if (kind === 'imgs') return 'image';
  if (kind === 'pdf') return 'pdf';
  if (kind === 'skill') return 'skill';
  return 'generic';
}

async function renderOutputs(items, opts = {}) {
  const {
    titleText = `本次为您准备了 <span class="count">${items.length}</span> 个产物`,
    subText = '按使用场景分组，可直接取用或 @ 引用到后续对话',
    animate = true
  } = opts;
  const wrap = $('outputsSection');
  wrap.hidden = false;
  wrap.innerHTML = `<div class="outputs-title">${titleText}<span class="sub">${subText}</span></div><div class="outputs-cards" id="outputsCards"></div>`;
  requestAnimationFrame(() => wrap.classList.add('is-visible'));
  const cards = $('outputsCards');
  for (const it of items) {
    const card = buildOutputCard(it);
    if (animate) {
      card.style.opacity = '0';
      card.style.transform = 'translateY(8px)';
    }
    cards.appendChild(card);
    if (animate) {
      requestAnimationFrame(() => {
        card.style.transition = 'opacity 320ms ease, transform 320ms ease';
        card.style.opacity = '1';
        card.style.transform = '';
      });
    }
    scrollToBottom();
    if (animate) await sleep(450);
  }
}


/* =========================================================================
   13. PPT 预览
   ========================================================================= */
const PPT_SLIDES = [
  { title: '客户反馈分析汇报', sub: 'Q2 季度 · 1,247 条反馈', kind: 'cover' },
  { title: '本季度概览', bullets: ['总反馈 1,247 条', '满意度 3.6（环比 -0.3）', '识别 3 类主要问题'] },
  { title: '物流配送（42%）', bullets: ['配送延迟 60%', '包装破损 40%', 'Top 投诉地区：华南'] },
  { title: '客户服务（28%）', bullets: ['响应慢 55%', '态度问题 45%'] },
  { title: '产品质量（18%）', bullets: ['外观瑕疵 68%', '功能问题 32%'] },
  { title: '满意度趋势', sub: '近 4 季度环比下降 -0.3，需重点关注', kind: 'light' },
  { title: 'Top 反馈客户', sub: '识别 12 个高影响力客户' },
  { title: '改进建议与行动项', bullets: ['物流端 SLA 复盘', '客服培训', '质检流程升级'] }
];
let currentSlideIdx = 0, pptSlidesAdded = 0;

function openPreview(kind, filename, opts = {}) {
  const pane = $('paneFiles');
  if (!pane) return;
  const mode = getPreviewMode(kind);
  currentPreviewFile = getPreviewFile(filename);
  pane.classList.add('is-preview-mode');
  $('previewIcon').className = `file-icon ${kind}`;
  $('previewIcon').textContent = (kind || 'FILE').toUpperCase();
  $('previewFilename').textContent = filename;
  if (mode === 'ppt') {
    if (opts.progressive) {
      renderPreviewToolbarActions(currentPreviewFile || { clickKind: kind, clickName: filename, name: filename, source: 'output', type: 'ppt' });
      renderPreviewModeTools(currentPreviewFile || { clickKind: kind, clickName: filename, name: filename, source: 'output', type: 'ppt' }, mode);
      resetPptPreview();
      return;
    }
    renderPreviewFrame(currentPreviewFile || { clickKind: kind, clickName: filename, name: filename, source: 'output', type: 'ppt' });
    renderAllSlides();
    return;
  }
  renderPreviewFrame(currentPreviewFile || { clickKind: kind, clickName: filename, name: filename, source: 'output', type: 'source' });
}
function closePreview() { $('paneFiles').classList.remove('is-preview-mode'); }
function buildSlideThumb(slide, index) {
  const thumb = document.createElement('div');
  thumb.className = 'slide-thumb' + (index === currentSlideIdx ? ' is-active' : '');
  thumb.onclick = () => selectSlide(index);
  thumb.innerHTML = `<span class="slide-thumb-num">${index + 1}</span><div class="slide-thumb-content${slide.kind === 'light' ? ' is-light' : ''}">${slide.title}</div>`;
  return thumb;
}
function renderSlideMain(slide) {
  const canvas = $('slideCanvas');
  canvas.classList.add('is-fading');
  setTimeout(() => {
    canvas.style.background = slide.kind === 'light' ? 'linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)' : 'linear-gradient(135deg, #0E0F2E 0%, #2D1B6E 100%)';
    canvas.style.color = slide.kind === 'light' ? '#091640' : '#fff';
    let html = `<div class="s-title">${slide.title}</div>`;
    if (slide.sub) html += `<div class="s-sub">${slide.sub}</div>`;
    if (slide.bullets) html += `<ul class="s-bullets">` + slide.bullets.map(b => `<li>${b}</li>`).join('') + `</ul>`;
    html += `<div class="footer-stamp">客户反馈分析 · Dora Agent</div>`;
    canvas.innerHTML = html;
    canvas.classList.remove('is-fading');
  }, 200);
}
function selectSlide(idx) {
  currentSlideIdx = idx;
  document.querySelectorAll('.slide-thumb').forEach((t, i) => t.classList.toggle('is-active', i === idx));
  renderSlideMain(PPT_SLIDES[idx]);
}
function renderAllSlides() {
  const list = $('slideList'); list.innerHTML = '';
  PPT_SLIDES.forEach((s, i) => list.appendChild(buildSlideThumb(s, i)));
  pptSlidesAdded = PPT_SLIDES.length;
  renderSlideMain(PPT_SLIDES[currentSlideIdx]);
}
function resetPptPreview() {
  $('slideList').innerHTML = '';
  $('slideCanvas').innerHTML = `<div style="text-align:center;color:rgba(255,255,255,0.5);margin-top:32%;">等待 PPT 生成...</div>`;
  currentSlideIdx = 0; pptSlidesAdded = 0;
}
async function appendPptSlideProgressive() {
  if (pptSlidesAdded >= PPT_SLIDES.length) return;
  const slide = PPT_SLIDES[pptSlidesAdded];
  const thumb = buildSlideThumb(slide, pptSlidesAdded);
  $('slideList').appendChild(thumb);
  selectSlide(pptSlidesAdded);
  pptSlidesAdded += 1;
}


/* =========================================================================
   14. 产物 (live 产出 + 资料面板 outputs Tab 同步)
   ========================================================================= */
function getLiveOutputStage(stage) {
  if (stage === 'ppt-start') {
    return [
      { type: 'images', name: '反馈分布图组', sub: '图表已生成 · 共 3 张', count: 3, onClick: () => openPreview('imgs', '反馈分布图组') },
      { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '正在生成演示文稿...', loading: true, loadingLabel: '正在生成 PPT' }
    ];
  }
  if (stage === 'ppt-ready') {
    return [
      { type: 'images', name: '反馈分布图组', sub: '图表已生成 · 共 3 张', count: 3, onClick: () => openPreview('imgs', '反馈分布图组') },
      { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') }
    ];
  }
  if (stage === 'archive-start') {
    return [
      { type: 'images', name: '反馈分布图组', sub: '图表已生成 · 共 3 张', count: 3, onClick: () => openPreview('imgs', '反馈分布图组') },
      { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') },
      { type: 'docx', name: '反馈分析报告.docx', sub: '正在整理管理层版本...', loading: true, loadingLabel: '正在导出 Word' },
      { type: 'pdf', name: '反馈分析报告.pdf', sub: '正在生成归档版本...', loading: true, loadingLabel: '正在导出 PDF' },
      { type: 'xlsx', name: '反馈分类结果.xlsx', sub: '正在写入清洗结果...', loading: true, loadingLabel: '正在写入 XLSX' }
    ];
  }
  return null;
}

async function renderLiveOutputsStage(stage) {
  const items = getLiveOutputStage(stage);
  if (!items) return;
  await renderOutputs(items, {
    titleText: `已识别到 <span class="count">${items.length}</span> 个产物`,
    subText: items.some(item => item.loading) ? '已完成的产物可直接使用，生成中的产物会自动转为可用状态' : '当前产物已可直接预览或继续引用',
    animate: false
  });
}


/* =========================================================================
   15. 剧本驱动
   ========================================================================= */
function resetScenario() {
  clearScenario();
  actionCount = 0; nodeCounter = 0;
  $('execTimeline').innerHTML = '';
  $('execTitle').textContent = '准备中....';
  $('execPanel').classList.remove('is-collapsed');
  const slot = $('resultSlot');
  slot.classList.add('is-empty'); slot.classList.remove('is-fading', 'is-final'); slot.classList.add('is-interim');
  slot.innerHTML = '';
  hideWaitLine(); clearWaitText();
  $('waitTime').textContent = '0s';
  const cs = $('chartSlot'); if (cs) { cs.classList.remove('is-visible', 'is-collapsing'); cs.hidden = true; cs.innerHTML = ''; cs.style.cssText = ''; }
  const gs = $('genuiSlot'); gs.classList.remove('is-visible'); gs.hidden = true; gs.innerHTML = '';
  const os = $('outputsSection'); os.classList.remove('is-visible'); os.hidden = true; os.innerHTML = '';
  $('finalActions').classList.add('is-hidden');
  document.querySelectorAll('.conv-chat .lead-pill').forEach(el => el.remove());
  $('outputsCount').textContent = '0';
  $('extraReplies').innerHTML = '';
  closePreview(); resetPptPreview();
}

function playScenario() {
  resetScenario();
  scenarioStartedAt = Date.now();
  const isProductLiveScenario = isLiveOutputVariant();

  at(300, () => { showWaitLine(); setExecTitle('正在理解任务需求....'); });
  at(600, () => setResult('正在分析您的请求...'));

  let n1;
  at(800, () => { n1 = addActionNode({ stage: { cls: 'coordinator', label: '意图识别' }, title: '理解任务意图', detail: '识别为「数据分析 + 报告生成」复合任务，路由至任务规划' }); });

  let n2;
  at(2000, () => { completeNode(n1); setExecTitle('正在规划执行路径....'); });
  at(2200, () => { n2 = addActionNode({ stage: { cls: 'planner', label: '任务规划' }, title: '拆解为 5 步执行计划', detail: '步骤：读取数据 → 字段抽取 → 编写分类器 → 执行分析 → 综合报告', files: [{ name: 'plan.md', kind: 'code' }] }); });

  let n3;
  at(3800, () => { completeNode(n2); setExecTitle('正在读取数据源....'); });
  at(4000, () => { n3 = addActionNode({ stage: { cls: 'researcher', label: '数据分析' }, title: '读取并解析输入数据', detail: '工作表 3 · 总行数 1,247', files: [{ name: '客户反馈明细.xlsx', kind: 'data', role: 'input' }, { name: 'schema.json', kind: 'data' }] }); });
  at(5500, () => completeNode(n3));
  at(5700, () => setResult('已识别 <strong>7 个字段</strong>：客户名称、反馈类型、满意度、问题描述、日期、渠道、处理状态。'));

  let n4;
  at(6200, () => { setExecTitle('正在编写分类器....'); n4 = addActionNode({ stage: { cls: 'coder', label: '代码执行' }, title: '编写分类器代码', files: [{ name: 'classifier.py', kind: 'code' }], code: '' }); });
  at(6400, () => appendCode(n4, [
    '# 关键词词典 + 情感倾向 双通道',
    "kw = load_keywords('物流|客服|质量|价格')",
    "def classify(text):",
    "    cat = match_keywords(text, kw)",
    "    sent = sentiment(text)",
    "    return (cat, sent)",
    "df['cat'], df['sent'] = zip(*df['问题描述'].map(classify))",
    '流式输出中......'
  ], 320));

  let n5;
  at(9800, () => completeNode(n4));
  at(10000, () => { setExecTitle('正在执行分类计算....'); n5 = addActionNode({ stage: { cls: 'coder', label: '代码执行' }, title: '执行分类计算 · 1,247 条', detail: '运行 Python REPL · 估算耗时较长', files: [{ name: 'classification_result.csv', kind: 'data' }] }); });

  at(13000, () => setWaitText('Agent 正在持续工作中...'));
  at(18000, () => setWaitText('数据量较大，请您耐心等待...'));
  at(25000, () => setWaitCarousel());

  at(27000, () => { clearWaitText(); setResult('已发现 <strong>3 类</strong>主要问题：物流配送（42%）、客户服务（28%）、产品质量（18%）。'); completeNode(n5); });

  let n5b;
  at(27500, () => {
    setExecTitle('正在查询 Top 反馈客户....');
    n5b = addActionNode({
      stage: { cls: 'researcher', label: '数据分析' },
      title: '查询 Top 反馈客户排名',
      detail: '2025 Q2 · 按反馈数降序 · 共 25 条',
      files: [{ name: '反馈数_2025Q2.json', kind: 'data' }]
    });
  });
  at(28100, () => renderChart(n5b));
  at(31600, () => completeNode(n5b));

  let n6;
  at(32000, () => {
    collapseChart(n5b);
    setExecTitle('正在生成可视化图表....');
    n6 = addActionNode({ stage: { cls: 'reporter', label: '报告生成' }, title: '生成可视化图表', files: [{ name: '分类分布.png', kind: 'img', role: 'deliver' }, { name: '满意度趋势.png', kind: 'img', role: 'deliver' }, { name: 'Top 客户.png', kind: 'img', role: 'deliver' }] });
  });
  at(34000, () => completeNode(n6));

  let n7;
  at(34400, () => { setExecTitle('正在撰写汇报 PPT....'); n7 = addActionNode({ stage: { cls: 'reporter', label: '报告生成' }, title: '撰写汇报 PPT', detail: '组织封面 / 概览 / 三类问题 / 趋势 / Top 客户 / 行动项', files: [{ name: 'ppt_generator.py', kind: 'code' }, { name: '客户反馈分析汇报.pptx', role: 'deliver' }], code: '' }); });
  at(34450, () => { if (isProductLiveScenario) renderLiveOutputsStage('ppt-start'); });
  at(34600, () => appendCode(n7, [
    "from pptx import Presentation",
    "prs = Presentation('templates/dora.pptx')",
    "for slide_data in slides:",
    "    add_slide(prs, slide_data)",
    "prs.save('客户反馈分析汇报.pptx')",
    "上传文件中......"
  ], 380));

  at(34700, () => openPreview('pptx', '客户反馈分析汇报.pptx', { progressive: true }));
  PPT_SLIDES.forEach((s, i) => { at(35200 + i * (isProductLiveScenario ? 1500 : 700), () => appendPptSlideProgressive()); });

  at(40200, () => {
    completeNode(n7);
    if (isProductLiveScenario) renderLiveOutputsStage('ppt-ready');
  });

  let n8;
  at(40500, () => {
    setExecTitle('正在导出多格式归档....');
    n8 = addActionNode({
      stage: { cls: 'reporter', label: '报告生成' },
      title: '导出多格式归档',
      detail: '为不同消费者准备：Word/PDF 给管理层、清洗 XLSX/CSV 给数据团队、JSON 给下游系统、ZIP 一键打包',
      files: [
        { name: '反馈分析报告.docx', role: 'deliver' },
        { name: '反馈分析报告.pdf', role: 'deliver' },
        { name: '反馈分类结果.xlsx', kind: 'data', role: 'deliver' },
        { name: '反馈分类明细.csv', kind: 'data', role: 'deliver' },
        { name: 'analysis_result.json', kind: 'data', role: 'deliver' },
        { name: '完整交付包.zip', role: 'deliver' }
      ]
    });
  });
  at(42700, () => completeNode(n8));

  at(43200, () => {
    if (isProductLiveScenario) return;
    hideWaitLine();
    setResult(`
      <p>本季度客户反馈共 <strong>1,247</strong> 条，主要集中在 <strong>3 类问题</strong>。整体满意度均值为 3.6（满分 5），低于上季度的 3.9。原始数据来自 <a class="file-link xlsx" onclick="openPreview('xlsx','客户反馈明细.xlsx')">客户反馈明细.xlsx</a>${citation('客户反馈明细.xlsx · 原始反馈表', 1)}。</p>
      <p>从分布看，<strong>物流配送</strong>占比最高(42%)，主要为延迟交付与包装破损；<strong>客户服务</strong>(28%) 与 <strong>产品质量</strong>(18%) 紧随其后${citation('反馈分类结果.xlsx · Agent 清洗结果', 2)}。</p>
      <div class="inline-img" data-caption="图 1 · 反馈类型分布">📊 反馈类型分布饼图</div>
      <p>分类型来看：物流问题集中于"配送延迟（60%）"与"包装破损（40%）"；客户服务集中于"响应慢（55%）"与"态度问题（45%）"；产品质量集中于"外观瑕疵（68%）"${citation('analysis_result.json · 分类明细', 3)}。</p>
      <div class="img-grid">
        <div class="inline-img" data-caption="图 2 · 满意度趋势">📈 满意度趋势</div>
        <div class="inline-img" data-caption="图 3 · Top 客户">🏆 Top 客户</div>
        <div class="inline-img" data-caption="图 4 · 投诉热点">📉 投诉热点</div>
      </div>
      <p>建议优先推进物流端的改造，可为整体满意度带来约 <strong>+0.4</strong> 的提升。汇报已生成为 <a class="file-link pptx" onclick="openPreview('pptx','客户反馈分析汇报.pptx')">客户反馈分析汇报.pptx</a>；另已同步导出 <a class="file-link docx" onclick="openPreview('docx','反馈分析报告.docx')">Word</a> / <a class="file-link pdf" onclick="openPreview('pdf','反馈分析报告.pdf')">PDF</a> 给管理层，<a class="file-link xlsx" onclick="openPreview('xlsx','反馈分类结果.xlsx')">XLSX</a> / <a class="file-link csv" onclick="openPreview('csv','反馈分类明细.csv')">CSV</a> / <a class="file-link json" onclick="openPreview('json','analysis_result.json')">JSON</a> 给数据团队，全部产物也已打包为 <a class="file-link zip" onclick="openPreview('zip','完整交付包.zip')">完整交付包.zip</a>。</p>
    `, { isFinal: true });
  });

  at(45200, () => { if (!isProductLiveScenario) showLeadPill('正在为您渲染可交互看板', 1200); });
  at(46400, () => { if (!isProductLiveScenario) renderInScenarioGenUI(); });

  at(49200, () => { if (!isProductLiveScenario) showLeadPill('正在归集本次会话产出', 1100); });
  at(50300, () => {
    if (!isProductLiveScenario) {
      renderOutputs([
        { type: 'skill', name: '客户反馈分析技能', sub: '自动生成', desc: '基于本次客户反馈明细自动生成。输入新的反馈表即可复用此分析流程。' },
        { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') },
        { type: 'docx', name: '反馈分析报告.docx', sub: '320 KB · 给管理层', onClick: () => openPreview('docx', '反馈分析报告.docx') },
        { type: 'pdf', name: '反馈分析报告.pdf', sub: '480 KB · 归档版', onClick: () => openPreview('pdf', '反馈分析报告.pdf') },
        { type: 'md', name: '反馈分析报告.md', sub: '12 KB · 纯文本', onClick: () => openPreview('md', '反馈分析报告.md') },
        { type: 'html', name: '反馈分布看板.html', sub: '24 KB · 可交互', onClick: () => openPreview('html', '反馈分布看板.html') },
        { type: 'xlsx', name: '反馈分类结果.xlsx', sub: '186 KB · 清洗后数据', onClick: () => openPreview('xlsx', '反馈分类结果.xlsx') },
        { type: 'csv', name: '反馈分类明细.csv', sub: '142 KB · 1,247 行', onClick: () => openPreview('csv', '反馈分类明细.csv') },
        { type: 'json', name: 'analysis_result.json', sub: '38 KB · 结构化', onClick: () => openPreview('json', 'analysis_result.json') },
        { type: 'images', name: '反馈分布图组', count: 3, sub: '共 3 张 · 1.8 MB', onClick: () => openPreview('imgs', '反馈分布图组') },
        { type: 'zip', name: '完整交付包.zip', sub: '5.2 MB · 包含全部产物', onClick: () => openPreview('zip', '完整交付包.zip') }
      ]);
    }
  });

  if (isProductLiveScenario) {
    at(41400, () => showLeadPill('正在为您渲染可交互看板', 1200));
    at(42600, () => renderInScenarioGenUI());
    at(46800, () => {
      hideWaitLine();
      setResult(`
        <p>本季度客户反馈共 <strong>1,247</strong> 条，主要集中在 <strong>3 类问题</strong>。整体满意度均值为 3.6（满分 5），低于上季度的 3.9${citation('客户反馈明细.xlsx · 原始反馈表', 1)}。</p>
        <p>从分布看，<strong>物流配送</strong>占比最高(42%)，<strong>客户服务</strong>(28%) 与 <strong>产品质量</strong>(18%) 紧随其后${citation('反馈分类结果.xlsx · Agent 清洗结果', 2)}。</p>
        <div class="inline-img" data-caption="图 1 · 反馈类型分布">📊 反馈类型分布饼图</div>
      `, { isFinal: true });
    });
    at(54000, () => renderLiveOutputsStage('archive-start'));
    at(59600, () => renderOutputs([
      { type: 'images', name: '反馈分布图组', count: 3, sub: '图表已生成 · 共 3 张', onClick: () => openPreview('imgs', '反馈分布图组') },
      { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') },
      { type: 'docx', name: '反馈分析报告.docx', sub: '320 KB · 给管理层', onClick: () => openPreview('docx', '反馈分析报告.docx') },
      { type: 'pdf', name: '反馈分析报告.pdf', sub: '480 KB · 归档版', onClick: () => openPreview('pdf', '反馈分析报告.pdf') },
      { type: 'xlsx', name: '反馈分类结果.xlsx', sub: '186 KB · 清洗后数据', onClick: () => openPreview('xlsx', '反馈分类结果.xlsx') },
      { type: 'csv', name: '反馈分类明细.csv', sub: '142 KB · 1,247 行', onClick: () => openPreview('csv', '反馈分类明细.csv') },
      { type: 'json', name: 'analysis_result.json', sub: '38 KB · 结构化', onClick: () => openPreview('json', 'analysis_result.json') },
      { type: 'md', name: '反馈分析报告.md', sub: '12 KB · 纯文本', onClick: () => openPreview('md', '反馈分析报告.md') },
      { type: 'html', name: '反馈分布看板.html', sub: '24 KB · 可交互', onClick: () => openPreview('html', '反馈分布看板.html') },
      { type: 'skill', name: '客户反馈分析技能', sub: '自动生成', desc: '基于本次客户反馈明细自动生成。' },
      { type: 'zip', name: '完整交付包.zip', sub: '5.2 MB · 包含全部产物', onClick: () => openPreview('zip', '完整交付包.zip') }
    ], {
      titleText: `已识别到 <span class="count">11</span> 个产物`,
      subText: '已完成的产物可直接使用，可继续引用到后续对话',
      animate: false
    }));
  }

  at(55700, () => {
    if (isProductLiveScenario) return;
    foldPanelWithSummary(55);
    $('finalActions').classList.remove('is-hidden');
    $('outputsCount').textContent = '11';
    scrollToBottom();
  });

  if (isProductLiveScenario) {
    at(64000, () => {
      foldPanelWithSummary(55);
      $('finalActions').classList.remove('is-hidden');
      $('outputsCount').textContent = '11';
      scrollToBottom();
    });
  }
}


/* =========================================================================
   16. 用户额外消息 (输入 'genui' 触发 GenUI 卡片)
   ========================================================================= */
function appendGenUIReply(userText) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;flex-direction:column;gap:14px;margin-top:8px;';
  wrap.innerHTML = `
    <div class="msg-user"><div class="bubble">${userText}</div></div>
    <div class="agent-reply">
      <div class="agent-row">
        <span class="agent-avatar"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 10.2a4.5 4.5 0 009 0C12.5 6.5 8 1.5 8 1.5z"/></svg></span>
        <span class="agent-name">${conversationConfigs[currentConversationType]?.agentName || 'Dora'}</span>
      </div>
      <div style="font-size:14px;color:var(--neutral-11);">根据上轮分析结果，为您渲染交互式分布卡片：</div>
      <div class="genui-slot is-visible">
        <div class="genui-header">客户反馈问题分布</div>
        <iframe class="genui-frame" sandbox="allow-same-origin"></iframe>
      </div>
    </div>`;
  const iframe = wrap.querySelector('iframe');
  iframe.srcdoc = GENUI_DASHBOARD_SRC;
  iframe.addEventListener('load', () => { try { iframe.style.height = (iframe.contentDocument.body.scrollHeight + 40) + 'px'; } catch (e) {} });
  $('extraReplies').appendChild(wrap);
  scrollToBottom();
}

function handleSend() {
  const input = $('conversationInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  $('conversationSendBtn').classList.remove('is-active');
  if (/genui/i.test(text)) {
    appendGenUIReply(text);
  } else {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:8px;';
    wrap.innerHTML = `
      <div class="msg-user"><div class="bubble">${text}</div></div>
      <div class="agent-row" style="margin-top:8px;">
        <span class="agent-avatar"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5C8 1.5 3.5 6.5 3.5 10.2a4.5 4.5 0 009 0C12.5 6.5 8 1.5 8 1.5z"/></svg></span>
        <span class="agent-name">${conversationConfigs[currentConversationType]?.agentName || 'Dora'}</span>
      </div>
      <div style="font-size:14px;color:var(--neutral-11);">（演示原型，仅支持 <strong>「重播剧本」</strong> 与 <strong>「genui」</strong> 触发；正式对话需接入后端）</div>`;
    $('extraReplies').appendChild(wrap);
    scrollToBottom();
  }
}


/* =========================================================================
   17. 文件 Tab 切换 (B 的资料/产出 Tab)
   ========================================================================= */
function bindFilesTabClicks() {
  document.querySelectorAll('.conv-files .files-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.conv-files .files-tab').forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      const target = tab.dataset.tab;
      $('filesListMaterials').hidden = (target !== 'input');
      $('filesListOutputs').hidden = (target !== 'output');
    });
  });
  // 资料面板顶部的"上传文件 / 平台数据"切换
  document.querySelectorAll('.conv-files .btn-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.conv-files .btn-pill').forEach(b => b.classList.remove('is-primary'));
      btn.classList.add('is-primary');
    });
  });
}


/* =========================================================================
   17b. 会话页 — 中右列宽度拖拽
   ========================================================================= */
const FILES_MIN = 280;   // 右列最小宽度 (资料面板)
const CHAT_MIN  = 360;   // 中列最小宽度 (对话区)
function initConvResize() {
  const handle = document.getElementById('convResizeHandle');
  if (!handle || handle.dataset.bound) return;
  handle.dataset.bound = '1';
  const page = handle.closest('.conversation-page');
  if (!page) return;

  let dragging = false;
  let pageRect = null;
  let sideWidth = 0;

  handle.addEventListener('pointerdown', e => {
    dragging = true;
    pageRect = page.getBoundingClientRect();
    const side = page.querySelector('.conversation-side');
    sideWidth = (side && !page.classList.contains('sidebar-collapsed')) ? side.getBoundingClientRect().width : 0;
    handle.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    handle.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener('pointermove', e => {
    if (!dragging || !pageRect) return;
    const handleWidth = 6;
    const available = pageRect.width - sideWidth - handleWidth;
    // 鼠标相对页面右边的距离即资料面板期望宽度
    let filesPx = pageRect.right - e.clientX;
    filesPx = Math.max(FILES_MIN, Math.min(available - CHAT_MIN, filesPx));
    const pct = (filesPx / pageRect.width) * 100;
    page.style.setProperty('--files-width', pct + '%');
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('is-dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
  }
  handle.addEventListener('pointerup', endDrag);
  handle.addEventListener('pointercancel', endDrag);

  // 双击复位到默认 50/50
  handle.addEventListener('dblclick', () => {
    page.style.removeProperty('--files-width');
  });
}


/* =========================================================================
   18. 全局事件绑定
   ========================================================================= */
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('.sender-left-tools')) closeSenderMenus();
  if (!event.target.closest('.modal') && !event.target.closest('[onclick*="openAssetModal"]') && !event.target.closest('[onclick*="openAssetPicker"]')) closeAssetModal();
  if (!event.target.closest('.library-popconfirm') && !event.target.closest('.library-state-btn')) closeLibraryPopconfirm();
  if (!event.target.closest('.rail-tab-wrap') && $('expertUnreadPopover')) $('expertUnreadPopover').classList.remove('open');
});

document.addEventListener('pointerover', event => {
  const marker = event.target.closest('.change-marker');
  if (marker) showChangeTooltip(marker);
});
document.addEventListener('pointerout', event => {
  if (!activeChangeMarker) return;
  const nextMarker = event.relatedTarget && event.relatedTarget.closest ? event.relatedTarget.closest('.change-marker') : null;
  if (nextMarker === activeChangeMarker) return;
  hideChangeTooltip();
});
window.addEventListener('scroll', syncChangeTooltipPosition, true);
window.addEventListener('resize', syncChangeTooltipPosition);

document.addEventListener('click', event => {
  if (!event.target.closest('.version-menu')) $('versionMenu').classList.remove('open');
  if (!event.target.closest('.agent-switch-popover') && !event.target.closest('#agentSwitchButton')) closeAgentSwitch();
  if (!event.target.closest('.source-popover') && !event.target.closest('.source-icon') && !event.target.closest('[title="查看来源对话"]')) closeSourcePopover();
});

// 会话页输入框：input/keydown 绑定
const conversationInputEl = $('conversationInput');
if (conversationInputEl) {
  conversationInputEl.addEventListener('input', e => {
    $('conversationSendBtn').classList.toggle('is-active', e.target.value.trim().length > 0);
  });
  conversationInputEl.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
}


/* =========================================================================
   19. 启动初始化
   ========================================================================= */
function init() {
  // 设置初始 sender variant
  switchVariant('menu', document.querySelector('#variantGroupA .v-tab.active'));
  document.body.dataset.senderVariant = currentVariant;

  // 设置初始 B variant
  document.body.dataset.variant = currentBVariant;

  // 默认显示 A 的方案，隐藏 B
  toggleVariantGroups(false);

  // 初始化未读
  refreshExpertUnreadState();

  // 渲染文件列表
  renderFilePanel();

  // 绑定 B 的 Tab 切换
  bindFilesTabClicks();
  const outputTab = document.querySelector('.conv-files .files-tab[data-tab="output"]');
  if (outputTab) outputTab.click();

  // 初始化会话文件和资料库快照状态
  syncLibraryStateButtons();

  // 初始化会话页拖拽分割条
  initConvResize();

  // 标记剧本可以播放（但默认进入 Dora 首页，不会立即播）
  hasScenarioBooted = true;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
