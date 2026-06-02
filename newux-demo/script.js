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
let currentBVariant = 'ppt-only-live';     // B 的对话方案
let activeSenderContext = 'hero';
let pendingAssetType = 'bi';
let pendingAssetLabel = '';
let activeAssetPreviewId = '';
let selectedAssetIds = [];
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
let currentPreviewTab = 'input';
let currentPreviewHtmlMode = 'desktop';
let currentPreviewHtmlRefreshKey = 1;
let currentPreviewImageScale = 1;
let currentPreviewImageFit = 'fit';
let currentPreviewImageRotation = 0;
let currentPreviewPdfZoom = 100;
let currentPreviewPdfFit = 'fit-width';
let currentPreviewPdfOrientation = 'vertical';
let currentPreviewPdfRotation = 0;
let currentPreviewPdfPage = 1;
let currentPreviewPdfOutlineOpen = false;
let currentPreviewDocSection = 'summary';
let currentPreviewPptStyle = 'default';
let currentPreviewSpeakerNotesOpen = true;
let currentPreviewSpeakerNotesText = '建议先强调问题规模，再进入分类拆解和行动项。';
let currentPreviewMdStyle = 'default';
let currentInputSourceFilter = 'local';
let currentInputSearch = '';
let currentSourceTrace = null;
let preserveTraceTitle = false;
let currentAssetMock = 'html';
let liveOutputProgressShown = false;
let pendingOutputLibrarySave = null;
let pendingPromptReuse = null;
let activeShareFileName = '';
let scenarioVisibleOutputCount = 0;
let outputTabFlashTimer = null;

const avatarSources = {
  dora: 'dora-agent',
  smartData: 'smart-data-agent',
  report: 'report-agent',
  analysis: 'analysis-agent',
  modeling: 'modeling-agent',
  finance: 'finance-agent',
  marketing: 'marketing-agent'
};

const AVATAR_PROFILES = {
  'dora-agent': { initial: 'D', tone: 'dora' },
  'dora-side': { initial: 'D', tone: 'dora' },
  'dora-session': { initial: 'D', tone: 'dora' },
  'dora-floating': { initial: 'D', tone: 'dora' },
  'dora-rail': { initial: 'D', tone: 'dora' },
  'smart-data-agent': { initial: '问', tone: 'blue' },
  'report-agent': { initial: '报', tone: 'orange' },
  'analysis-agent': { initial: '析', tone: 'teal' },
  'modeling-agent': { initial: '模', tone: 'violet' },
  'finance-agent': { initial: '财', tone: 'green' },
  'marketing-agent': { initial: '营', tone: 'rose' },
  'product-agent': { initial: '产', tone: 'orange' },
  'design-agent': { initial: '设', tone: 'violet' }
};

function getAvatarSeedFromUrl(src = '') {
  const match = src.match(/[?&]seed=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function getAvatarProfile(seed, alt = '') {
  if (AVATAR_PROFILES[seed]) return AVATAR_PROFILES[seed];
  const firstChar = (alt || seed || 'A').trim().charAt(0).toUpperCase();
  return { initial: firstChar, tone: 'blue' };
}

function avatarImg(seed, alt) {
  const profile = getAvatarProfile(seed, alt);
  return `<span class="avatar-letter" data-avatar-tone="${profile.tone}" aria-label="${alt}">${profile.initial}</span>`;
}

function hydrateLetterAvatars(root = document) {
  root.querySelectorAll('img.avatar-image').forEach(img => {
    const parent = img.parentElement;
    if (!parent) return;
    const seed = getAvatarSeedFromUrl(img.getAttribute('src') || '');
    parent.innerHTML = avatarImg(seed, img.getAttribute('alt') || '');
  });
}

const libraryFileState = {
  status: 'neverSaved',
  hasDuplicateName: true,
  savedVersion: 0,
  sessionVersion: 1
};

const FILE_ACTIONS = {
  input: {
    frbiDashboard: ['quote', 'open'],
    frbiFvs: ['quote', 'open', 'download', 'saveLibraryDisabled'],
    excel: ['quote', 'open', 'download'],
    source: ['quote', 'open', 'download']
  },
  output: {
    skill: ['quote', 'saveBackend', 'share', 'open'],
    ppt: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    html: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    md: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    image: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    pdf: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    docx: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    dataset: ['quote', 'saveLibrary', 'share', 'open', 'download', 'reusePrompt'],
    json: ['quote', 'download'],
    source: ['quote', 'download']
  }
};

const OUTPUT_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'presentation', label: 'PPT' },
  { id: 'web', label: '网页' },
  { id: 'report', label: '报告' },
  { id: 'image', label: '图像' },
  { id: 'pdf', label: 'PDF' },
  { id: 'skill', label: '技能' },
  { id: 'dataset', label: '数据表' },
  { id: 'document', label: '文档' },
  { id: 'source', label: '源码/其他' }
];

const FILE_LABELS = {
  input: '来源',
  output: '产物'
};

const FILE_DEFS = {
  input: [
    { id: 'input-frbi-dashboard', source: 'input', type: 'frbiDashboard', ext: 'BI', name: '客户仪表板', meta: 'FRBI · 仪表板 · 只读引用', icon: 'BI', iconClass: 'bi', clickKind: 'html', clickName: '客户仪表板', sourcePrompt: '请基于客户仪表板分析本季度经营波动与关键指标变化。' },
    { id: 'input-frbi-fvs', source: 'input', type: 'frbiFvs', ext: 'FVS', name: '分析主题.fvs', meta: 'FRBI · 模型指标集 · 不支持存资料库', icon: 'FVS', iconClass: 'skill', clickKind: 'json', clickName: '分析主题.fvs', canSaveToLibrary: false, sourcePrompt: '请基于分析主题.fvs 中的模型指标集，解释当前经营指标的口径与趋势。' },
    { id: 'input-source-doc', source: 'input', type: 'source', ext: 'TXT', name: '销售预测规则说明.txt', meta: '24 KB · 其他类输入', icon: 'TXT', iconClass: 'md', clickKind: 'source', clickName: '销售预测规则说明.txt', sourcePrompt: '请先阅读销售预测规则说明.txt，再对销售预测的规则做整理和分析。' },
    { id: 'input-excel', source: 'input', type: 'excel', ext: 'XLSX', name: '客户反馈明细.xlsx', meta: '161.17 KB · 用户上传', icon: 'XLSX', iconClass: 'xlsx', clickKind: 'xlsx', clickName: '客户反馈明细.xlsx', sourcePrompt: '请分析客户反馈明细.xlsx，找出主要问题并输出汇报材料。' }
  ],
  output: [
    { id: 'output-skill', source: 'output', type: 'skill', ext: 'SKILL', name: '客户反馈分析技能', meta: '技能 · Agent 自动生成', icon: 'SKILL', iconClass: 'skill', clickKind: 'skill', clickName: '客户反馈分析技能', sourcePrompt: '请将本次客户反馈分析流程整理成可复用技能。' },
    { id: 'output-ppt', source: 'output', type: 'ppt', ext: 'PPTX', name: '客户反馈分析汇报.pptx', meta: '2.4 MB · Agent 产出', icon: 'PPTX', iconClass: 'pptx', clickKind: 'pptx', clickName: '客户反馈分析汇报.pptx', sourcePrompt: '请基于客户反馈分析结果生成一份汇报 PPT。' },
    { id: 'output-docx', source: 'output', type: 'docx', ext: 'DOCX', name: '反馈分析报告.docx', meta: '320 KB · 给管理层 · Agent 产出', icon: 'DOCX', iconClass: 'docx', clickKind: 'docx', clickName: '反馈分析报告.docx', sourcePrompt: '请将客户反馈分析整理成适合管理层阅读的 Word 报告。' },
    { id: 'output-pdf', source: 'output', type: 'pdf', ext: 'PDF', name: '反馈分析报告.pdf', meta: '480 KB · 归档版 · Agent 产出', icon: 'PDF', iconClass: 'pdf', clickKind: 'pdf', clickName: '反馈分析报告.pdf', sourcePrompt: '请导出客户反馈分析的 PDF 归档版。' },
    { id: 'output-md', source: 'output', type: 'md', ext: 'MD', name: '反馈分析报告.md', meta: '12 KB · Agent 产出', icon: 'MD', iconClass: 'md', clickKind: 'md', clickName: '反馈分析报告.md', sourcePrompt: '请输出客户反馈分析的 Markdown 版本。' },
    { id: 'output-html', source: 'output', type: 'html', ext: 'HTML', name: '反馈分布看板.html', meta: '24 KB · 可交互 · Agent 产出', icon: 'HTML', iconClass: 'html', clickKind: 'html', clickName: '反馈分布看板.html', sourcePrompt: '请生成客户反馈分布的 HTML 看板。' },
    { id: 'output-xlsx', source: 'output', type: 'dataset', ext: 'XLSX', name: '反馈分类结果.xlsx', meta: '186 KB · 清洗后数据 · Agent 产出', icon: 'XLSX', iconClass: 'xlsx', clickKind: 'xlsx', clickName: '反馈分类结果.xlsx', sourcePrompt: '请导出客户反馈分类结果的 Excel 数据表。' },
    { id: 'output-csv', source: 'output', type: 'dataset', ext: 'CSV', name: '反馈分类明细.csv', meta: '142 KB · 1,247 行 · Agent 产出', icon: 'CSV', iconClass: 'csv', clickKind: 'csv', clickName: '反馈分类明细.csv', sourcePrompt: '请导出客户反馈分类明细的 CSV 文件。' },
    { id: 'output-json', source: 'output', type: 'source', ext: 'JSON', name: 'analysis_result.json', meta: '38 KB · 结构化结果 · Agent 产出', icon: 'JSON', iconClass: 'json', clickKind: 'json', clickName: 'analysis_result.json', sourcePrompt: '请输出客户反馈分析的结构化 JSON 结果。' },
    { id: 'output-img', source: 'output', type: 'image', ext: 'PNG', name: '反馈分布图组（3 张）', meta: '1.8 MB · Agent 产出', icon: 'PNG', iconClass: 'imgs', clickKind: 'imgs', clickName: '反馈分布图组', sourcePrompt: '请生成客户反馈分布图组。' },
    { id: 'output-zip', source: 'output', type: 'source', ext: 'ZIP', name: '完整交付包.zip', meta: '5.2 MB · 包含全部产物 · Agent 产出', icon: 'ZIP', iconClass: 'zip', clickKind: 'zip', clickName: '完整交付包.zip', sourcePrompt: '请将客户反馈分析的全部交付物打包成 ZIP。' }
  ]
};

const FILE_PANEL_STATE = {
  input: FILE_DEFS.input.map(item => ({ ...item })),
  output: FILE_DEFS.output.map(item => ({ ...item })),
  savedAssets: []
};

const ASSET_PICKER_DEFS = {
  bi: {
    title: '添加 FineBI 资产',
    kind: 'BI',
    tone: 'blue',
    defaultSelected: ['bi-dashboard', 'bi-topic-sales'],
    items: [
      { id: 'bi-dashboard', label: '门店经营仪表板', group: '仪表板', enabled: true, preview: '核心指标：销售额、客单价、门店排名，可用于经营看板分析。' },
      { id: 'bi-topic-sales', label: 'BI demo_门店销售表', group: '分析主题', enabled: true, preview: '字段：门店、城市、品类、销售额、利润率、订单数。' },
      { id: 'bi-topic-member', label: '会员复购分析主题', group: '文件夹1', enabled: true, preview: '字段：会员等级、复购周期、优惠券使用、生命周期价值。' },
      { id: 'bi-offline-node', label: '节点名称2', group: '文件夹1', enabled: false, preview: '该节点未发布，暂不可选择。' }
    ]
  },
  fr: {
    title: '添加 FineReport 资产',
    kind: 'FR',
    tone: 'purple',
    defaultSelected: ['fr-region', 'fr-store'],
    items: [
      { id: 'fr-region', label: 'FR demo_地区经营看板', group: '报表', enabled: true, preview: '按地区展示收入、费用、利润和预算完成率。' },
      { id: 'fr-store', label: '门店日报填报表', group: '填报', enabled: true, preview: '门店每日填报客流、库存、缺货和活动执行情况。' },
      { id: 'fr-finance', label: '财务月结分析报表', group: '文件夹1', enabled: true, preview: '月结、应收应付、费用科目和异常波动追踪。' },
      { id: 'fr-archive', label: '历史归档报表', group: '文件夹3', enabled: false, preview: '归档报表仅可在平台侧打开，当前暂不可引用。' }
    ]
  }
};

const ASSET_LIBRARY_DEFS = {
  html: {
    id: 'asset-html',
    typeClass: 'html',
    fileBadge: 'HTML',
    title: '销售预测系统.html',
    owner: '财务小助手',
    source: '来源会话：销售预测系统规则调整',
    recentThumb: '图表与预测规则',
    cardPreviewClass: 'dashboard',
    cardPreviewHtml: `
      <div class="kpi">已存入</div><div class="kpi">$510.854 亿</div><div class="kpi red">V2</div><div class="line-chart"></div>
    `,
    cardTitle: '销售预测系统.html',
    cardSubTitle: '图表与预测规则',
    headerOwner: '财务小助手：Nina',
    version: 'V2',
    versionLabel: 'V2 · 规则优化版',
    sourceConversation: '销售预测系统规则调整',
    sourceDesc: '本次版本基于销售预测系统规则调整而来，包含资金余额预测、规则配置与趋势图。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: '销售预测系统规则调整', desc: '原始生成会话' },
      { title: '现金流预测复盘', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>Data Agent 看板摘要</h3>
        <div class="detail-kpi-grid">
          <div class="detail-kpi"><span>本月净流入</span><strong>+$28.854 亿</strong><em>较上月 +12%</em></div>
          <div class="detail-kpi"><span>Q2 预测余额</span><strong>$510.854 亿</strong><em>预测置信度 89%</em></div>
          <div class="detail-kpi"><span>风险预警</span><strong>2 条</strong><em>中风险 / 低风险</em></div>
        </div>
      </div>
      <div class="report-card">
        <h3>规则配置</h3>
        <div style="font-size:13px;color:var(--ink-9);margin-bottom:12px;">📊 已加载 1153 行 · 12 个月 (2025-04~2026-03) · 8 个 BU</div>
        <div class="rule-row" style="background:#F8F8F9;border-top:none;font-weight:600;color:var(--ink-9);"><span>科目</span><span>方法</span><span>参数</span><span>来源</span><span></span></div>
        <div class="rule-row"><span>员工薪酬</span><span>avg</span><span>{\"window\":3}</span><span>🤖 薪资按前 3 个月平均滚动</span><button class=\"outline-btn\">删除</button></div>
      </div>
      <div class="chart-block"><h3>6 个月资金余额预测(USD 亿)</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
      <div class="report-card"><h3>逐月明细 · 点击单元格查看血缘 · 数值三舍五入调整</h3><div class="rule-row" style="grid-template-columns: repeat(7, 1fr);"><span>科目</span><span>04月</span><span>05月</span><span>06月</span><span>07月</span><span>08月</span><span>09月</span></div></div>
    `
  },
  ppt: {
    id: 'asset-ppt',
    typeClass: 'ppt',
    fileBadge: 'PPT',
    title: '2025年9月生产经营分析会.pptx',
    owner: '经营助手',
    source: '来源会话：经营分析PPT生成',
    recentThumb: '2025年9月生产经营分析会',
    cardPreviewClass: 'ppt',
    cardPreviewHtml: '2025年9月生产经营分析会',
    cardTitle: '2025年9月生产经营分析会',
    cardSubTitle: '经营汇报 · 12 页',
    headerOwner: '经营助手：Nina',
    version: 'V3',
    versionLabel: 'V3 · 汇报定稿',
    sourceConversation: '经营分析PPT生成',
    sourceDesc: '本次版本适用于经营汇报，包含趋势页、问题页、行动项和附录页。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: '经营分析PPT生成', desc: '原始生成会话' },
      { title: '经营会预演彩排', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>汇报结构</h3>
        <div class="ppt-outline">
          <div><strong>01</strong><span>封面与结论摘要</span></div>
          <div><strong>02</strong><span>经营指标趋势</span></div>
          <div><strong>03</strong><span>风险与机会</span></div>
          <div><strong>04</strong><span>行动建议与排期</span></div>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric-card"><div class="metric-label">本期收入</div><div class="metric-value">$539.709 亿</div><div class="metric-label">同比 +9.6%</div></div>
        <div class="metric-card green"><div class="metric-label">毛利率</div><div class="metric-value">31.8%</div><div class="metric-label">较上期 +1.2pt</div></div>
        <div class="metric-card red"><div class="metric-label">风险项</div><div class="metric-value">3 条</div><div class="metric-label">供应链 / 价格 / 人效</div></div>
        <div class="metric-card blue"><div class="metric-label">建议动作</div><div class="metric-value">4 项</div><div class="metric-label">已按优先级排序</div></div>
      </div>
      <div class="chart-block"><h3>9 月经营趋势</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
      <div class="report-card">
        <h3>行动项</h3>
        <div class="ppt-actions">
          <div><span>01</span><p>供应链侧启动补货策略评估。</p></div>
          <div><span>02</span><p>重点区域做价格敏感性复盘。</p></div>
          <div><span>03</span><p>业务线下发下月经营目标。</p></div>
        </div>
      </div>
    `
  },
  dashboard: {
    id: 'asset-dashboard',
    typeClass: 'html',
    fileBadge: 'HTML',
    title: '客户分群洞察看板.html',
    owner: '增长分析助手',
    source: '来源会话：高价值客户分群洞察',
    recentThumb: '客户分群与转化洞察',
    cardPreviewClass: 'dashboard',
    cardPreviewHtml: `
      <div class="kpi">高价值 18%</div><div class="kpi">$2.31 亿</div><div class="kpi red">流失 7.4%</div><div class="line-chart"></div>
    `,
    cardTitle: '客户分群洞察看板.html',
    cardSubTitle: '客户分层 · 转化路径 · 流失预警',
    headerOwner: '增长分析助手：Nina',
    version: 'V1',
    versionLabel: 'V1 · 洞察初版',
    sourceConversation: '高价值客户分群洞察',
    sourceDesc: '本资料由 Data Agent 基于客户交易、活跃行为与服务反馈生成，沉淀了客户分层、转化路径和流失风险看板。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: '高价值客户分群洞察', desc: '原始生成会话' },
      { title: '会员运营策略复盘', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>客户分群摘要</h3>
        <div class="detail-kpi-grid">
          <div class="detail-kpi"><span>高价值客户</span><strong>18%</strong><em>贡献收入 52%</em></div>
          <div class="detail-kpi"><span>潜力成长客群</span><strong>31%</strong><em>近 30 天活跃 +16%</em></div>
          <div class="detail-kpi"><span>流失风险客户</span><strong>7.4%</strong><em>需 7 日内触达</em></div>
        </div>
      </div>
      <div class="chart-block"><h3>客户价值与活跃度趋势</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
      <div class="report-card">
        <h3>Agent 推荐动作</h3>
        <div class="ppt-actions">
          <div><span>01</span><p>对高价值低活跃客户推送专属权益，优先覆盖 TOP 12 城市。</p></div>
          <div><span>02</span><p>对潜力成长客群进行二次转化实验，按首购品类拆分策略。</p></div>
          <div><span>03</span><p>对流失风险客户建立 7 日召回任务，持续追踪回访结果。</p></div>
        </div>
      </div>
    `
  },
  churnReport: {
    id: 'asset-churn-report',
    typeClass: 'bi',
    fileBadge: 'PDF',
    title: 'Q2 客户流失归因报告.pdf',
    owner: '经营分析助手',
    source: '来源会话：Q2 客户流失归因分析',
    recentThumb: '流失归因与挽回策略',
    cardPreviewClass: 'article',
    cardPreviewHtml: 'Q2 客户流失归因报告',
    cardTitle: 'Q2 客户流失归因报告.pdf',
    cardSubTitle: '归因分析 · 策略建议 · 16 页',
    headerOwner: '经营分析助手：Nina',
    version: 'V2',
    versionLabel: 'V2 · 管理层摘要版',
    sourceConversation: 'Q2 客户流失归因分析',
    sourceDesc: '本报告汇总了 Q2 客户流失样本、关键归因、影响规模和挽回动作，用于经营例会与复盘追踪。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: 'Q2 客户流失归因分析', desc: '原始生成会话' },
      { title: '流失客户召回策略', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>报告结论</h3>
        <div class="metric-grid">
          <div class="metric-card red"><div class="metric-label">Q2 流失率</div><div class="metric-value">8.7%</div><div class="metric-label">环比 +1.9pt</div></div>
          <div class="metric-card"><div class="metric-label">主要归因</div><div class="metric-value">物流</div><div class="metric-label">占流失样本 36%</div></div>
          <div class="metric-card green"><div class="metric-label">可挽回规模</div><div class="metric-value">24k</div><div class="metric-label">中高价值客户</div></div>
        </div>
      </div>
      <div class="report-card">
        <h3>归因链路</h3>
        <div class="rule-row" style="grid-template-columns: 140px 1fr 140px 140px;"><span>归因</span><span>典型信号</span><span>影响占比</span><span>建议动作</span></div>
        <div class="rule-row" style="grid-template-columns: 140px 1fr 140px 140px;"><span>物流延迟</span><span>延迟超过 48h 后投诉率显著升高</span><span>36%</span><span>优先赔付</span></div>
        <div class="rule-row" style="grid-template-columns: 140px 1fr 140px 140px;"><span>客服响应</span><span>首次响应超过 10min 的会话复购下降</span><span>24%</span><span>排班优化</span></div>
      </div>
      <div class="chart-block"><h3>流失风险趋势</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
    `
  },
  metricModel: {
    id: 'asset-metric-model',
    typeClass: 'bi',
    fileBadge: 'BI',
    title: '指标口径治理台.html',
    owner: '数据治理助手',
    source: '来源会话：经营指标口径校准',
    recentThumb: '指标血缘与口径规则',
    cardPreviewClass: 'bi',
    cardPreviewHtml: '<div class="panel"></div><div class="side"></div>',
    cardTitle: '指标口径治理台.html',
    cardSubTitle: '指标血缘 · 口径差异 · 规则审计',
    headerOwner: '数据治理助手：Nina',
    version: 'V4',
    versionLabel: 'V4 · 口径校准版',
    sourceConversation: '经营指标口径校准',
    sourceDesc: '本资料记录 Data Agent 对核心经营指标的口径比对、异常追踪和血缘说明，方便后续问数时统一引用。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: '经营指标口径校准', desc: '原始生成会话' },
      { title: '收入指标差异排查', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>治理概览</h3>
        <div class="detail-kpi-grid">
          <div class="detail-kpi"><span>已校准指标</span><strong>42</strong><em>覆盖经营核心域</em></div>
          <div class="detail-kpi"><span>口径冲突</span><strong>6</strong><em>待业务确认</em></div>
          <div class="detail-kpi"><span>血缘节点</span><strong>128</strong><em>已生成追溯链路</em></div>
        </div>
      </div>
      <div class="report-card">
        <h3>重点指标</h3>
        <div class="rule-row" style="background:#F8F8F9;border-top:none;font-weight:600;color:var(--ink-9);"><span>指标</span><span>当前口径</span><span>差异说明</span><span>状态</span><span></span></div>
        <div class="rule-row"><span>有效收入</span><span>订单实收</span><span>退款时点与财务口径存在差异</span><span>待确认</span><button class="outline-btn">查看</button></div>
        <div class="rule-row"><span>活跃客户</span><span>30 天登录</span><span>建议改为登录或交易任一行为</span><span>已建议</span><button class="outline-btn">查看</button></div>
      </div>
      <div class="chart-block"><h3>指标血缘覆盖趋势</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
    `
  },
  conversionDataset: {
    id: 'asset-conversion-dataset',
    typeClass: 'html',
    fileBadge: 'XLSX',
    title: '营销活动转化明细.xlsx',
    owner: '营销分析助手',
    source: '来源会话：618 活动转化复盘',
    recentThumb: '活动触达与转化明细',
    cardPreviewClass: 'dashboard',
    cardPreviewHtml: `
      <div class="kpi">触达 186k</div><div class="kpi">转化 12.8%</div><div class="kpi red">CAC ¥31</div><div class="line-chart"></div>
    `,
    cardTitle: '营销活动转化明细.xlsx',
    cardSubTitle: '触达明细 · 渠道转化 · 成本拆解',
    headerOwner: '营销分析助手：Nina',
    version: 'V1',
    versionLabel: 'V1 · 清洗明细版',
    sourceConversation: '618 活动转化复盘',
    sourceDesc: '本数据集由活动触达、渠道点击、转化订单和成本数据清洗而来，可供 Agent 继续引用分析。',
    historyTitle: '仅展示 dora 中由此文件发起的会话',
    historyItems: [
      { title: '618 活动转化复盘', desc: '原始生成会话' },
      { title: '渠道预算再分配建议', desc: '引用该资料' }
    ],
    preview: `
      <div class="report-card">
        <h3>数据集摘要</h3>
        <div class="detail-kpi-grid">
          <div class="detail-kpi"><span>记录数</span><strong>186,420</strong><em>覆盖 9 个渠道</em></div>
          <div class="detail-kpi"><span>平均转化率</span><strong>12.8%</strong><em>搜索渠道最高</em></div>
          <div class="detail-kpi"><span>获客成本</span><strong>¥31</strong><em>较计划 -8%</em></div>
        </div>
      </div>
      <div class="report-card">
        <h3>字段预览</h3>
        <div class="rule-row" style="grid-template-columns: repeat(5, 1fr);background:#F8F8F9;border-top:none;font-weight:600;color:var(--ink-9);"><span>日期</span><span>渠道</span><span>触达</span><span>转化</span><span>CAC</span></div>
        <div class="rule-row" style="grid-template-columns: repeat(5, 1fr);"><span>06-18</span><span>搜索</span><span>42,183</span><span>7,216</span><span>¥24</span></div>
        <div class="rule-row" style="grid-template-columns: repeat(5, 1fr);"><span>06-18</span><span>私域</span><span>31,902</span><span>5,048</span><span>¥18</span></div>
      </div>
      <div class="chart-block"><h3>渠道转化趋势</h3><div class="chart-grid"></div><div class="chart-line"></div></div>
    `
  }
};

let currentOutputCategory = 'all';
let currentOutputSearch = '';

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

function getOutputCategory(file) {
  if (!file) return 'other';
  if (file.type === 'skill') return 'skill';
  if (file.type === 'image') return 'image';
  if (file.type === 'html') return 'web';
  if (file.type === 'ppt' || file.type === 'pptx') return 'presentation';
  if (file.type === 'md') return 'report';
  if (file.type === 'pdf') return 'pdf';
  if (file.type === 'docx') return 'document';
  if (file.type === 'dataset' || file.ext === 'XLSX' || file.ext === 'CSV') return 'dataset';
  return 'source';
}

function getOutputCategoryLabel(category) {
  return OUTPUT_CATEGORIES.find(item => item.id === category)?.label || '其他';
}

function normalizeQuery(text) {
  return (text || '').trim().toLowerCase();
}

function matchesOutputFilter(file) {
  if (!file) return false;
  if (currentOutputCategory !== 'all' && getOutputCategory(file) !== currentOutputCategory) return false;
  const query = normalizeQuery(currentOutputSearch);
  if (!query) return true;
  return [file.name, file.meta, file.ext, getOutputCategoryLabel(getOutputCategory(file))]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(query));
}

function getVisibleOutputFilesForScenario() {
  if (currentBVariant !== 'ppt-only-live') return FILE_PANEL_STATE.output;
  return FILE_PANEL_STATE.output.filter(file => file.type === 'ppt' || file.type === 'pptx' || file.name === '客户反馈分析汇报.pptx');
}

function getFileActions(source, type, file) {
  const sourceActions = FILE_ACTIONS[source];
  if (!sourceActions) return [];
  if (source === 'output' && file?.clickKind === 'json') return FILE_ACTIONS.output.json;
  if (source === 'output' && file?.clickKind === 'zip') return FILE_ACTIONS.output.source;
  return sourceActions[type] || sourceActions.normal || [];
}

function buildFileActionButton(action, file) {
  if (action === 'quote') {
    return `<button class="btn-attach" onclick="event.stopPropagation(); addFileToConversation('${file.clickName}')">@引用</button>`;
  }
  if (action === 'open') {
    return `<button class="file-icon-action" title="新窗口打开" onclick="event.stopPropagation(); openFileInNewWindow('${file.clickKind}', '${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h7v7"/><path d="M13 3L7 9"/><path d="M4 5H3v8h8v-1"/></svg></button>`;
  }
  if (action === 'download') {
    return `<button class="file-icon-action" title="下载" onclick="event.stopPropagation(); downloadFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v8"/><path d="M5 8l3 3 3-3"/><path d="M3 13.5h10"/></svg></button>`;
  }
  if (action === 'saveLibrary') {
    if (file.savedToLibrary) {
      if (file.libraryDirty) {
        return `<button class="library-state-btn is-compact is-dirty" title="会话文件已有更新，点击同步到资料库" onclick="event.stopPropagation(); handleOutputLibrarySave('${file.clickName}')">存入资料库</button>`;
      }
      return `<button class="library-state-btn is-compact is-saved" disabled onclick="event.stopPropagation()">已存入资料库</button>`;
    }
    return `<button class="library-state-btn is-compact" onclick="event.stopPropagation(); handleOutputLibrarySave('${file.clickName}')">存入资料库</button>`;
  }
  if (action === 'saveBackend') {
    if (file.savedToBackend) {
      return `<button class="library-state-btn is-compact is-saved" disabled onclick="event.stopPropagation()">已添加</button>`;
    }
    return `<button class="library-state-btn is-compact" onclick="event.stopPropagation(); saveSkillToBackend('${file.clickName}')">另存到后台</button>`;
  }
  if (action === 'saveLibraryDisabled') {
    return `<button class="library-state-btn is-compact is-disabled" disabled title="fvs 看板暂不支持存入资料库" onclick="event.stopPropagation()">存入资料库</button>`;
  }
  if (action === 'share') {
    return `<button class="file-icon-action" title="分享" onclick="event.stopPropagation(); shareFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v2.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V10"/><path d="M8 3v8"/><path d="M5 6l3-3 3 3"/></svg></button>`;
  }
  if (action === 'reusePrompt') {
    return `<button class="file-icon-action" title="复用 Prompt" onclick="event.stopPropagation(); reuseOutputPrompt('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V11"/><path d="M9 2h4v4"/><path d="M13 2 7 8"/><path d="M5 10h5"/></svg></button>`;
  }
  if (action === 'refresh') {
    return `<button class="file-icon-action" title="重新生成" onclick="event.stopPropagation(); refreshOutputFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13.2 8.3A5.5 5.5 0 1 1 10.9 3.8"/><path d="M10.7 2.3H14v3.3"/></svg></button>`;
  }
  if (action === 'delete') {
    return `<button class="file-icon-action is-danger" title="删除" onclick="event.stopPropagation(); deleteOutputFile('${file.clickName}')"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 4h10.4"/><path d="M6.1 2.6h3.8"/><path d="M5.2 4v8.3a1 1 0 0 0 1 1h3.6a1 1 0 0 0 1-1V4"/><path d="M6.8 6.4v3.8"/><path d="M9.2 6.4v3.8"/></svg></button>`;
  }
  return '';
}

function renderInputFileRow(file) {
  const actions = getFileActions(file.source, file.type, file);
  const actionHtml = actions.map(action => buildFileActionButton(action, file)).join('');
  const openAttr = `onclick="handleFileRowClick('${file.id}')"`;
  return `
    <div class="file-row" data-file-id="${file.id}" data-source="${file.source}" data-filetype="${file.type}" ${openAttr}>
      <div class="file-icon ${file.iconClass}">${file.icon}</div>
      <div class="file-info">
        <div class="file-name">${file.name}</div>
        <div class="file-size">${file.meta}</div>
      </div>
      <div class="file-actions">${actionHtml}</div>
    </div>`;
}

function getInputSourceKind(file) {
  return String(file?.type || '').startsWith('frbi') ? 'platform' : 'local';
}

function matchesInputFilter(file) {
  if (!file) return false;
  if (currentInputSourceFilter !== 'all' && getInputSourceKind(file) !== currentInputSourceFilter) return false;
  const query = normalizeQuery(currentInputSearch);
  if (!query) return true;
  return [file.name, file.meta, file.ext, file.clickName]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(query));
}

function renderInputPanel() {
  const visibleFiles = FILE_PANEL_STATE.input.filter(matchesInputFilter);
  if (visibleFiles.length) return visibleFiles.map(renderInputFileRow).join('');
  const sourceCopy = currentInputSourceFilter === 'platform' ? '平台资产' : '本地文件';
  return `<div class="output-empty-state">没有匹配的${sourceCopy}</div>`;
}

function renderOutputFileRow(file) {
  const actions = getFileActions(file.source, file.type, file);
  const actionHtml = actions.map(action => buildFileActionButton(action, file)).join('');
  const category = getOutputCategory(file);
  const categoryLabel = getOutputCategoryLabel(category);
  return `
    <div class="output-row" data-file-id="${file.id}" data-category="${category}" data-filetype="${file.type}" onclick="handleFileRowClick('${file.id}')">
      <div class="output-preview-icon ${file.iconClass}">${file.icon}</div>
      <div class="output-row-main">
        <div class="output-row-title">
          <span class="output-row-name">${file.name}</span>
          <span class="output-row-badge">${categoryLabel}</span>
        </div>
        <div class="output-row-meta">${file.meta}</div>
      </div>
      <div class="output-row-actions">${actionHtml}</div>
    </div>`;
}

function findFileById(fileId) {
  return [...FILE_PANEL_STATE.input, ...FILE_PANEL_STATE.output].find(file => file.id === fileId);
}

function getDefaultPreviewFile(tab) {
  return tab === 'output' ? FILE_PANEL_STATE.output[0] || null : FILE_PANEL_STATE.input[0] || null;
}

function handleFileRowClick(fileId) {
  const file = findFileById(fileId);
  if (!file) return;
  if (file.source === 'input') {
    currentPreviewTab = 'input';
    openPreview(file.clickKind, file.clickName);
    return;
  }
  currentPreviewTab = 'output';
  openPreview(file.clickKind, file.clickName);
}

function renderFilePanel() {
  const inputList = $('filesListMaterials');
  const outputList = $('filesListOutputs');
  if (inputList) inputList.innerHTML = renderInputPanel();
  if (outputList) outputList.innerHTML = renderOutputPanel();
  const materialsCount = $('materialsCount');
  if (materialsCount) materialsCount.textContent = String(FILE_PANEL_STATE.input.length);
  const outputsCount = $('outputsCount');
  if (outputsCount) outputsCount.textContent = String(getVisibleOutputFilesForScenario().length);
}

function notifyOutputTabUpdate(nextVisibleCount) {
  const nextCount = Number(nextVisibleCount) || 0;
  const delta = nextCount - scenarioVisibleOutputCount;
  scenarioVisibleOutputCount = Math.max(scenarioVisibleOutputCount, nextCount);
  if (delta <= 0) return;
  const outputTab = document.querySelector('.conv-files .files-tab[data-tab="output"]');
  const outputsCount = $('outputsCount');
  const folderTrigger = document.querySelector('.files-folder-trigger');
  if (folderTrigger) folderTrigger.classList.add('has-new-output');
  if (!outputTab || !outputsCount) return;
  outputsCount.dataset.delta = `+${delta}`;
  outputTab.classList.remove('is-output-updated');
  void outputTab.offsetWidth;
  outputTab.classList.add('is-output-updated');
  window.clearTimeout(outputTabFlashTimer);
  outputTabFlashTimer = window.setTimeout(() => {
    outputTab.classList.remove('is-output-updated');
    delete outputsCount.dataset.delta;
  }, 800);
}

function setFilesPanelTab(target, opts = {}) {
  document.querySelectorAll('.conv-files .files-tab').forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.tab === target);
  });
  const pane = $('paneFiles');
  if (pane) pane.dataset.activeTab = target;
  currentPreviewTab = target;
  const inputList = $('filesListMaterials');
  const outputList = $('filesListOutputs');
  if (inputList) inputList.hidden = target !== 'input';
  if (outputList) outputList.hidden = target !== 'output';
  const toolbarInput = document.querySelector('.conv-files .input-toolbar-group');
  const toolbarOutput = document.querySelector('.conv-files .output-toolbar-group');
  const uploadBtn = document.querySelector('.conv-files .input-toolbar-action');
  if (toolbarInput) toolbarInput.hidden = target !== 'input';
  if (toolbarOutput) toolbarOutput.hidden = target !== 'output';
  if (uploadBtn) uploadBtn.hidden = target !== 'input';
  if (opts.preservePreview) return;
  currentPreviewFile = null;
  closePreview();
}

function highlightFileRow(fileId) {
  const row = document.querySelector(`.conv-files [data-file-id="${fileId}"]`);
  if (!row) return;
  row.classList.add('is-citation-target');
  row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  window.clearTimeout(highlightFileRow.timer);
  highlightFileRow.timer = window.setTimeout(() => {
    row.classList.remove('is-citation-target');
  }, 800);
}

function renderOutputPanel() {
  const scenarioOutputFiles = getVisibleOutputFilesForScenario();
  const visibleFiles = scenarioOutputFiles.filter(matchesOutputFilter);
  const countByCategory = OUTPUT_CATEGORIES.reduce((acc, item) => {
    acc[item.id] = item.id === 'all'
      ? scenarioOutputFiles.length
      : scenarioOutputFiles.filter(file => getOutputCategory(file) === item.id).length;
    return acc;
  }, {});
  const tabs = OUTPUT_CATEGORIES.map(item => {
    const isActive = item.id === currentOutputCategory ? ' is-active' : '';
    const count = countByCategory[item.id] || 0;
    return `<button class="output-filter-tab${isActive}" data-output-category="${item.id}" onclick="setOutputCategory('${item.id}')">${item.label}<span class="output-filter-count">${count}</span></button>`;
  }).join('');
  const rows = visibleFiles.length
    ? visibleFiles.map(renderOutputFileRow).join('')
    : `<div class="output-empty-state">没有匹配的产物</div>`;
  return `
    <div class="output-filter-bar">
      <div class="output-filter-tabs">${tabs}</div>
    </div>
    <div class="output-row-list">${rows}</div>
  `;
}

function setOutputCategory(category) {
  currentOutputCategory = category;
  renderFilePanel();
}

function setOutputSearch(value) {
  currentOutputSearch = value || '';
  renderFilePanel();
}

function setInputSourceFilter(source) {
  currentInputSourceFilter = source || 'local';
  syncInputSourceFilterButtons();
  renderFilePanel();
}

function syncInputSourceFilterButtons() {
  document.querySelectorAll('.conv-files .btn-pill[data-input-source]').forEach(btn => {
    btn.classList.toggle('is-primary', btn.dataset.inputSource === currentInputSourceFilter);
  });
}

function setInputSearch(value) {
  currentInputSearch = value || '';
  renderFilePanel();
}

function handleFilesPanelUpload() {
  currentInputSearch = '';
  const inputSearch = document.querySelector('.conv-files .input-toolbar-group .search-input');
  if (inputSearch) inputSearch.value = '';
  setInputSourceFilter('local');
  openLocalUpload('conversation');
}

function getPreviewFile(fileName) {
  return [...FILE_PANEL_STATE.input, ...FILE_PANEL_STATE.output].find(file => file.clickName === fileName || file.name === fileName) || null;
}

function getCitationFile(label) {
  const fileName = String(label || '').split('·')[0].trim();
  return [...FILE_PANEL_STATE.input, ...FILE_PANEL_STATE.output].find(file => {
    return file.name === fileName
      || file.clickName === fileName
      || fileName.includes(file.name)
      || fileName.includes(file.clickName);
  }) || null;
}

function renderPreviewToolbarActions(file) {
  const actionWrap = $('previewActions');
  if (!actionWrap) return;
  if (!file) {
    actionWrap.innerHTML = '';
    return;
  }
  const previewActions = getFileActions(file.source, file.type, file).filter(action => action !== 'reusePrompt');
  actionWrap.innerHTML = previewActions.map(action => buildFileActionButton(action, file)).join('');
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
      <button class="preview-tool-btn" onclick="cyclePptPreviewStyle()">风格：${getPptStyleLabel()}</button>
      <button class="preview-tool-btn${currentPreviewSpeakerNotesOpen ? ' is-active' : ''}" onclick="toggleSpeakerNotes()">演示者备注</button>
    `;
    return;
  }
  if (mode === 'html') {
    tools.innerHTML = `
      <div class="preview-tool-group">
        <button class="preview-tool-btn${currentPreviewHtmlMode === 'desktop' ? ' is-active' : ''}" data-html-mode="desktop" onclick="setHtmlPreviewMode('desktop')">电脑</button>
        <button class="preview-tool-btn${currentPreviewHtmlMode === 'mobile' ? ' is-active' : ''}" data-html-mode="mobile" onclick="setHtmlPreviewMode('mobile')">手机</button>
      </div>
      <button class="preview-tool-btn" onclick="refreshHtmlPreview()">刷新</button>
    `;
    return;
  }
  if (mode === 'md') {
    tools.innerHTML = `<button class="preview-tool-btn" onclick="cycleMdPreviewStyle()">风格：${getMdStyleLabel()}</button>`;
    return;
  }
  if (mode === 'image') {
    tools.innerHTML = `
      <span class="preview-tool-status">缩放 ${Math.round(currentPreviewImageScale * 100)}%</span>
      <button class="preview-tool-btn" onclick="zoomPreviewImage(1.15)">放大</button>
      <button class="preview-tool-btn" onclick="zoomPreviewImage(0.87)">缩小</button>
      <button class="preview-tool-btn" onclick="rotatePreviewImage(-1)">左旋</button>
      <button class="preview-tool-btn" onclick="rotatePreviewImage(1)">右旋</button>
    `;
    return;
  }
  if (mode === 'pdf') {
    tools.innerHTML = `
      <button class="preview-tool-btn${currentPreviewPdfOutlineOpen ? ' is-active' : ''}" onclick="togglePdfOutline()">目录</button>
      <label class="pdf-page-jump">跳页<input value="${currentPreviewPdfPage}" onkeydown="handlePdfPageJump(event)" /></label>
      <button class="preview-tool-btn" onclick="zoomPreviewPdf(10)">放大</button>
      <button class="preview-tool-btn" onclick="zoomPreviewPdf(-10)">缩小</button>
      <button class="preview-tool-btn" onclick="togglePdfFitMode()">适应</button>
      <button class="preview-tool-btn" onclick="togglePdfOrientation()">方向</button>
    `;
    return;
  }
  if (mode === 'document') {
    tools.innerHTML = `<button class="preview-tool-btn is-active">目录</button>`;
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
  slideList.hidden = mode !== 'ppt';
  slideCanvas.classList.remove('is-fading');
  if (mode !== 'ppt') {
    slideCanvas.removeAttribute('style');
  }
  if (slideNotes) {
    slideNotes.hidden = mode !== 'ppt' || !currentPreviewSpeakerNotesOpen;
    slideNotes.contentEditable = mode === 'ppt' && currentPreviewSpeakerNotesOpen ? 'true' : 'false';
    slideNotes.dataset.placeholder = '点击添加演示者备注';
    slideNotes.textContent = mode === 'ppt' ? currentPreviewSpeakerNotesText : '';
    if (!slideNotes.dataset.bound) {
      slideNotes.dataset.bound = '1';
      slideNotes.addEventListener('input', () => {
        currentPreviewSpeakerNotesText = slideNotes.textContent || '';
      });
    }
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
        <div class="preview-empty-copy">${file.savedToBackend ? '已另存到后台，可继续 @引用 到后续对话。' : '技能产物可另存到后台，也可 @引用 到后续对话继续使用。'}</div>
      </div>`;
    return;
  }
  if (mode === 'html') {
    const srcdoc = escapeHtmlAttr(getHtmlPreviewSrcdoc(file));
    slideCanvas.innerHTML = `
      <div class="html-preview-frame ${currentPreviewHtmlMode}">
        <div class="html-preview-device">
          <div class="html-preview-address">https://preview.local/${file.clickName}</div>
          <iframe class="html-preview-iframe" sandbox="allow-scripts" srcdoc="${srcdoc}" title="${file.name}"></iframe>
        </div>
      </div>`;
    return;
  }
  if (mode === 'md') {
    slideCanvas.innerHTML = `
      <div class="md-preview ${currentPreviewMdStyle}">
        <div class="md-preview-title">${file.name}</div>
        <div class="md-preview-body">
          <p><strong>客户反馈分析摘要</strong></p>
          <p>本报告仅支持风格切换，不支持正文编辑。</p>
          <p>适合快速浏览、引用、分享和继续沉淀到资料库。</p>
          <ul><li>物流配送占比 42%，是当前主要问题。</li><li>客户服务占比 28%，集中在响应时效。</li></ul>
        </div>
      </div>`;
    return;
  }
  if (mode === 'text') {
    slideCanvas.innerHTML = `
      <div class="text-preview">
        <div class="text-preview-title">${file.name}</div>
        <pre>${getTextPreviewContent(file)}</pre>
      </div>`;
    return;
  }
  if (mode === 'document') {
    const docSections = [
      {
        id: 'summary',
        label: '1. 管理摘要',
        title: '管理摘要',
        body: '<p>本文档支持目录定位预览，可用于快速检查报告结构。</p><table><tr><th>问题类型</th><th>占比</th><th>建议</th></tr><tr><td>物流配送</td><td>42%</td><td>复盘 SLA</td></tr><tr><td>客户服务</td><td>28%</td><td>优化响应</td></tr></table>'
      },
      {
        id: 'category',
        label: '2. 问题分类',
        title: '问题分类',
        body: '<p>物流配送、客户服务、产品质量是本轮反馈的前三类问题。</p><table><tr><th>分类</th><th>关键原因</th><th>影响</th></tr><tr><td>物流配送</td><td>延迟与破损</td><td>满意度下降</td></tr><tr><td>产品质量</td><td>外观瑕疵</td><td>售后压力增加</td></tr></table>'
      },
      {
        id: 'actions',
        label: '3. 行动建议',
        title: '行动建议',
        body: '<p>建议先处理物流 SLA 与客服响应时效，再沉淀产品质检改进机制。</p><ul><li>复盘重点地区配送 SLA</li><li>补充客服响应话术和升级路径</li><li>加强出库质检抽检比例</li></ul>'
      }
    ];
    const activeSection = docSections.find(item => item.id === currentPreviewDocSection) || docSections[0];
    slideCanvas.innerHTML = `
      <div class="doc-preview-shell">
        <aside class="doc-preview-outline">
          ${docSections.map(section => `<button class="${section.id === activeSection.id ? 'is-active' : ''}" onclick="selectDocPreviewSection('${section.id}')">${section.label}</button>`).join('')}
        </aside>
        <article class="doc-preview-page">
          <h2>${activeSection.title}</h2>
          ${activeSection.body}
        </article>
      </div>`;
    return;
  }
  if (mode === 'dataset') {
    slideCanvas.innerHTML = `
      <div class="dataset-preview">
        <table>
          <thead><tr><th>反馈类型</th><th>数量</th><th>占比</th><th>处理建议</th></tr></thead>
          <tbody>
            <tr><td>物流配送</td><td>524</td><td>42%</td><td>复盘区域 SLA</td></tr>
            <tr><td>客户服务</td><td>349</td><td>28%</td><td>补充客服话术</td></tr>
            <tr><td>产品质量</td><td>225</td><td>18%</td><td>加强出库质检</td></tr>
          </tbody>
        </table>
      </div>`;
    return;
  }
  if (mode === 'json') {
    slideCanvas.innerHTML = `
      <pre class="json-preview">{
  "total": 1247,
  "mainIssue": "物流配送",
  "ratio": "42%",
  "actions": ["复盘 SLA", "优化响应", "加强质检"]
}</pre>`;
    return;
  }
  if (mode === 'image') {
    slideCanvas.innerHTML = `
      <div class="image-preview-shell">
        <div class="image-preview-canvas" ondblclick="toggleImageFitMode()" onwheel="handleImagePreviewWheel(event)" data-fit="${currentPreviewImageFit}" style="transform: scale(${currentPreviewImageScale}) rotate(${currentPreviewImageRotation}deg);">
          <div class="image-preview-placeholder">图片组预览</div>
        </div>
      </div>`;
    return;
  }
  if (mode === 'pdf') {
    const outlineItems = [
      '1. 管理摘要',
      '2. 问题分类',
      '3. 客户样例',
      '4. 行动建议'
    ];
    const outlineHtml = currentPreviewPdfOutlineOpen
      ? `<aside class="pdf-reader-outline">${outlineItems.map((item, index) => `<button class="${Math.ceil(currentPreviewPdfPage / 2) === index + 1 ? 'is-active' : ''}" onclick="jumpPdfPage(${index * 2 + 1})">${item}</button>`).join('')}</aside>`
      : '';
    slideCanvas.innerHTML = `
      <div class="pdf-reader-shell ${currentPreviewPdfOrientation}">
        <div class="pdf-reader-toolbar">
          <span>${currentPreviewPdfOutlineOpen ? '目录已展开' : '目录已收起'} · 第 ${currentPreviewPdfPage} / 8 页</span>
          <span>缩放 ${currentPreviewPdfZoom}%</span>
          <span>${currentPreviewPdfFit === 'fit-width' ? '适应宽度' : '适应页面'} · 已旋转 ${currentPreviewPdfRotation}°</span>
        </div>
        <div class="pdf-reader-content">
          ${outlineHtml}
          <div class="pdf-reader-page" style="transform: scale(${currentPreviewPdfZoom / 100}) rotate(${currentPreviewPdfRotation}deg); transform-origin: center center;">
            <div class="pdf-page-title">反馈分析报告 · P${currentPreviewPdfPage}</div>
            <div class="pdf-page-line"></div>
            <div class="pdf-page-line short"></div>
            <div class="pdf-page-chart"></div>
          </div>
        </div>
      </div>`;
    return;
  }
  const unsupportedCopy = file.source === 'output'
    ? '该类型暂不支持预览，当前仅支持 @引用、新窗口打开、分享和下载。'
    : '输入文件不支持存入资料库，可引用到对话；其他类文件还可下载。';
  const emptyActions = getFileActions(file.source, file.type, file)
    .filter(action => action === 'quote' || action === 'download')
    .map(action => buildEmptyPreviewActionButton(action, file))
    .join('');
  slideCanvas.innerHTML = `
    <div class="preview-empty-state">
      <div class="preview-empty-illustration">${file.ext || file.icon || 'FILE'}</div>
      <div class="preview-empty-title">暂不支持预览</div>
      <div class="preview-empty-copy">${unsupportedCopy}</div>
      <div class="preview-empty-actions">${emptyActions}</div>
    </div>`;
}

function buildEmptyPreviewActionButton(action, file) {
  if (action === 'quote') {
    return `<button class="preview-empty-action" onclick="addFileToConversation('${file.clickName}')">@引用</button>`;
  }
  if (action === 'download') {
    return `<button class="preview-empty-action" onclick="downloadFile('${file.clickName}')">下载到本地</button>`;
  }
  return '';
}

function renderPreviewFrame(file) {
  const mode = getPreviewMode(file?.clickKind, file);
  renderPreviewToolbarActions(file);
  renderPreviewModeTools(file, mode);
  renderPreviewBody(file, mode);
}

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getHtmlPreviewSrcdoc(file) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f7f9ff; color: #091e40; }
    main { padding: 18px; display: grid; gap: 14px; }
    .kpi { font-size: 24px; font-weight: 700; }
    .chart { height: 160px; border-radius: 18px; background: linear-gradient(135deg, rgba(37,98,255,.18), rgba(124,92,255,.18)); border: 1px solid rgba(37,98,255,.15); }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .card { border-radius: 14px; padding: 14px 12px; background: white; border: 1px solid #dadee7; font-size: 12px; text-align: center; }
    footer { font-size: 11px; color: #6b7690; }
    @media (max-width: 420px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <main>
    <div class="kpi">反馈总量 1,247</div>
    <div class="chart" aria-label="${file.name} 图表预览"></div>
    <section class="grid">
      <div class="card">物流配送 42%</div>
      <div class="card">客户服务 28%</div>
      <div class="card">产品质量 18%</div>
    </section>
    <footer>iframe sandbox preview · refresh ${currentPreviewHtmlRefreshKey}</footer>
  </main>
</body>
</html>`;
}

function getTextPreviewContent(file) {
  const title = file?.name || '文本文件';
  return `# ${title}

销售预测规则说明

1. 预测周期：按月滚动预测未来 3 个月销售额。
2. 数据口径：剔除异常退货、重复订单和未确认收入。
3. 调整规则：当促销活动覆盖重点客户时，需按渠道权重修正预测值。
4. 输出要求：解释关键假设，并标注可能影响预测的风险因素。`;
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
  currentPreviewHtmlRefreshKey += 1;
  renderPreviewFrame(file);
  showToast('HTML 预览已刷新');
}

function selectDocPreviewSection(sectionId) {
  currentPreviewDocSection = sectionId;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function zoomPreviewImage(multiplier) {
  currentPreviewImageScale = Math.max(0.5, Math.min(2.4, Math.round((currentPreviewImageScale * multiplier) * 100) / 100));
  currentPreviewImageFit = currentPreviewImageScale === 1 ? 'fit' : 'actual';
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function rotatePreviewImage(direction = 1) {
  currentPreviewImageRotation = (currentPreviewImageRotation + (direction * 90) + 360) % 360;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function toggleImageFitMode() {
  currentPreviewImageFit = currentPreviewImageFit === 'fit' ? 'actual' : 'fit';
  currentPreviewImageScale = currentPreviewImageFit === 'fit' ? 1 : 1.35;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function handleImagePreviewWheel(event) {
  event.preventDefault();
  zoomPreviewImage(event.deltaY < 0 ? 1.1 : 0.9);
}

function zoomPreviewPdf(delta) {
  currentPreviewPdfZoom = Math.max(50, Math.min(180, currentPreviewPdfZoom + delta));
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function togglePdfOutline() {
  currentPreviewPdfOutlineOpen = !currentPreviewPdfOutlineOpen;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function jumpPdfPage(page) {
  currentPreviewPdfPage = Math.max(1, Math.min(8, Number(page) || 1));
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function handlePdfPageJump(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  jumpPdfPage(event.target.value);
}

function togglePdfFitMode() {
  currentPreviewPdfFit = currentPreviewPdfFit === 'fit-width' ? 'fit-page' : 'fit-width';
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function togglePdfOrientation() {
  currentPreviewPdfOrientation = currentPreviewPdfOrientation === 'vertical' ? 'horizontal' : 'vertical';
  currentPreviewPdfRotation = (currentPreviewPdfRotation + 90) % 360;
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function getPptStyleLabel() {
  if (currentPreviewPptStyle === 'dark') return '商务深色';
  if (currentPreviewPptStyle === 'light') return '简约浅色';
  return '默认';
}

function cyclePptPreviewStyle() {
  const nextMap = { default: 'dark', dark: 'light', light: 'default' };
  currentPreviewPptStyle = nextMap[currentPreviewPptStyle] || 'default';
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function toggleSpeakerNotes() {
  currentPreviewSpeakerNotesOpen = !currentPreviewSpeakerNotesOpen;
  if (currentPreviewSpeakerNotesOpen && !currentPreviewSpeakerNotesText) {
    currentPreviewSpeakerNotesText = '点击添加演示者备注';
  }
  if (currentPreviewFile) renderPreviewFrame(currentPreviewFile);
}

function getMdStyleLabel() {
  if (currentPreviewMdStyle === 'compact') return '简洁';
  if (currentPreviewMdStyle === 'github') return 'GitHub';
  return '默认';
}

function cycleMdPreviewStyle() {
  const nextMap = { default: 'compact', compact: 'github', github: 'default' };
  currentPreviewMdStyle = nextMap[currentPreviewMdStyle] || 'default';
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
  { type: 'smart-data', logo: avatarSources.smartData, name: '智能问数', desc: '指标归因与经营分析' },
  { type: 'report', logo: avatarSources.report, name: '智能报告', desc: '报告、PPT 与结构化结论' },
  { type: 'analysis', logo: avatarSources.analysis, name: '经营分析助手', desc: '经营表现诊断与风险识别' },
  { type: 'modeling', logo: avatarSources.modeling, name: '数据建模顾问', desc: '指标、维度、口径和模型设计' },
  { type: 'finance', logo: avatarSources.finance, name: '财务小助手', desc: '预算、费用结构与异常波动' },
  { type: 'marketing', logo: avatarSources.marketing, name: '营销策略助手', desc: '客户分层与活动复盘' }
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
  renderFilePanel();
  if (isProcessTopLikeVariant()) scrollToBottom();
  if (!opts.skipReplay && hasScenarioBooted && previousVariant !== id) {
    if ($('view-conversation').classList.contains('active')) {
      playScenario();
    }
  }
}

function isProcessTopLikeVariant() {
  return currentBVariant === 'process-top' || currentBVariant === 'product-live' || currentBVariant === 'muted-process' || currentBVariant === 'ppt-only-live';
}
function shouldStreamResult() {
  return currentBVariant === 'product-live' || currentBVariant === 'muted-process' || currentBVariant === 'ppt-only-live';
}
function isLiveOutputVariant() {
  return currentBVariant === 'product-live' || currentBVariant === 'muted-process' || currentBVariant === 'ppt-only-live';
}
function isPptOnlyLiveVariant() {
  return currentBVariant === 'ppt-only-live';
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
  const config = ASSET_PICKER_DEFS[type] || ASSET_PICKER_DEFS.bi;
  pendingAssetLabel = config.title;
  activeAssetPreviewId = config.defaultSelected[0] || '';
  selectedAssetIds = [...config.defaultSelected];
  const mask = $('assetModal');
  if (!mask) return;
  const modal = mask.querySelector('.modal');
  modal.dataset.source = type;
  $('assetModalTitle').textContent = config.title;
  mask.hidden = false;
  mask.classList.add('open');
  closeSenderMenus();
  renderAssetPicker(type);
}
// 保留旧名作为别名, 既有 HTML 上的 onclick="openAssetPicker(...)" 全部走新逻辑
function openAssetPicker(type) { openAssetModal(type); }

function closeAssetModal() {
  const mask = $('assetModal');
  if (mask) {
    mask.classList.remove('open');
    mask.hidden = true;
  }
  activeAssetPreviewId = '';
  selectedAssetIds = [];
}
function closeAssetPicker() { closeAssetModal(); }

function renderAssetPicker(type) {
  const config = ASSET_PICKER_DEFS[type] || ASSET_PICKER_DEFS.bi;
  const tree = $('assetTreeList');
  const preview = $('assetModalPreview');
  const tagText = $('assetModalTagText');
  const count = $('assetSelectedCount');
  if (tagText) tagText.textContent = activeAssetPreviewId
    ? (config.items.find(item => item.id === activeAssetPreviewId)?.label || config.title)
    : config.title;
  if (tree) {
    tree.innerHTML = config.items.map(item => {
      const checked = selectedAssetIds.includes(item.id) ? ' checked' : '';
      const active = item.id === activeAssetPreviewId ? ' active' : '';
      const disabled = item.enabled ? '' : ' disabled';
      const indentClass = item.group === '文件夹1' || item.group === '文件夹3' ? ' tree-indent' : '';
      return `
        <div class="tree-node${indentClass}${active}${item.enabled ? '' : ' is-disabled'}" data-asset-id="${item.id}" onclick="selectAssetItem('${type}','${item.id}')">
          <input type="checkbox"${checked}${disabled} onclick="event.stopPropagation(); toggleAssetItem('${type}','${item.id}')"/>
          <span class="src-dot">${config.kind === 'BI' ? 'D' : 'R'}</span>
          ${item.label}
        </div>`;
    }).join('');
  }
  if (preview) {
    const current = config.items.find(item => item.id === activeAssetPreviewId) || config.items[0];
    preview.textContent = current?.preview || '(资产预览占位 — 此原型不复刻弹窗细节)';
  }
  if (count) count.textContent = `${selectedAssetIds.length}个`;
  if (tagText) {
    const current = config.items.find(item => item.id === activeAssetPreviewId) || config.items[0];
    tagText.textContent = current ? current.label : config.title;
  }
}

function selectAssetItem(type, assetId) {
  const config = ASSET_PICKER_DEFS[type] || ASSET_PICKER_DEFS.bi;
  const item = config.items.find(entry => entry.id === assetId);
  if (!item || !item.enabled) return;
  activeAssetPreviewId = assetId;
  if (!selectedAssetIds.includes(assetId)) selectedAssetIds.push(assetId);
  renderAssetPicker(type);
}

function toggleAssetItem(type, assetId) {
  const config = ASSET_PICKER_DEFS[type] || ASSET_PICKER_DEFS.bi;
  const item = config.items.find(entry => entry.id === assetId);
  if (!item || !item.enabled) return;
  const index = selectedAssetIds.indexOf(assetId);
  if (index >= 0) selectedAssetIds.splice(index, 1);
  else selectedAssetIds.push(assetId);
  activeAssetPreviewId = assetId;
  renderAssetPicker(type);
}

function addSenderFileChip(context, kind, label, tone) {
  const row = $(context + 'SenderFiles');
  if (!row) return;
  const chip = document.createElement('div');
  chip.className = 'sender-file-chip';
  chip.innerHTML = `<span class="sender-file-icon" style="background:${tone === 'purple' ? '#7C5CFF' : tone === 'teal' ? '#1DB6A0' : '#6D94FF'}">${kind}</span><span class="sender-file-label">${label}</span>`;
  row.appendChild(chip);
  row.classList.add('has-file');
}

function getSenderInput(context) {
  if (context === 'conversation') return $('conversationInput');
  if (context === 'hero') return $('heroInput') || document.querySelector('.hero-input textarea');
  const row = $(context + 'SenderFiles');
  const box = row?.closest('.hero-input, .conversation-input, .chat-input-box');
  return box?.querySelector('textarea') || null;
}

function syncConversationSendState() {
  const input = $('conversationInput');
  const hasText = Boolean(input?.value.trim());
  const hasRef = Boolean($('conversationSenderFiles')?.querySelector('.sender-ref-token'));
  const btn = $('conversationSendBtn');
  if (btn) btn.classList.toggle('is-active', hasText || hasRef);
}

function insertSenderReference(context, file) {
  const row = $(context + 'SenderFiles');
  if (!row || !file) return;
  const existing = row.querySelector(`[data-ref-name="${file.clickName || file.name}"]`);
  if (existing) {
    existing.classList.add('is-pulsing');
    setTimeout(() => existing.classList.remove('is-pulsing'), 420);
  } else {
    const token = document.createElement('button');
    token.type = 'button';
    token.className = 'sender-ref-token';
    token.dataset.refName = file.clickName || file.name;
    token.dataset.refKind = file.clickKind || file.type || 'file';
    token.innerHTML = `<span>@</span>${file.name || file.clickName}<span class="sender-ref-remove" aria-hidden="true">×</span>`;
    token.addEventListener('click', event => {
      if (event.target.closest('.sender-ref-remove')) {
        token.remove();
        row.classList.toggle('has-file', Boolean(row.children.length));
        syncConversationSendState();
        return;
      }
      openPreview(token.dataset.refKind, token.dataset.refName);
    });
    row.appendChild(token);
  }
  row.classList.add('has-file');
  const input = getSenderInput(context);
  if (context === 'conversation') syncConversationSendState();
  input?.focus();
}

function insertConversationReference(file) {
  insertSenderReference('conversation', file);
}

function confirmAssetModal() {
  const context = activeSenderContext || 'hero';
  const config = ASSET_PICKER_DEFS[pendingAssetType] || ASSET_PICKER_DEFS.bi;
  const selectedItems = config.items.filter(item => selectedAssetIds.includes(item.id) && item.enabled);
  selectedItems.forEach(item => addSenderFileChip(context, config.kind, item.label, config.tone));
  closeAssetModal();
  showToast(`已添加 ${selectedItems.length} 个${pendingAssetType === 'bi' ? 'FineBI' : 'FineReport'}资产`);
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
  markExpertConversationRead(type);
  selectConversationEntry('expert', 'new', $('expertNewConversation'));
}

function getExpertUnreadCount(type) {
  const item = expertUnreadItems.find(entry => entry.type === type);
  return item ? item.count : 0;
}

function clearExpertUnread(type) {
  const item = expertUnreadItems.find(entry => entry.type === type);
  if (item) item.count = 0;
  refreshExpertUnreadState();
}

function markExpertConversationRead(type) {
  if (!type || type === 'dora') return;
  clearExpertUnread(type);
}

function syncExpertCardUnreadState() {
  document.querySelectorAll('.agent-card[data-agent-type]').forEach(card => {
    const count = getExpertUnreadCount(card.dataset.agentType);
    card.classList.toggle('has-unread', count > 0);
    card.dataset.unread = count > 0 ? String(count) : '';
  });
}

function syncConversationUnreadState(type = currentConversationType) {
  const title = $('conversationHistoryTitle');
  if (!title) return;
  if (type === 'dora') {
    title.classList.remove('has-unread');
    title.dataset.unread = '';
    return;
  }
  const count = getExpertUnreadCount(type);
  title.classList.toggle('has-unread', count > 0);
  title.dataset.unread = count > 0 ? String(count) : '';
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
  syncExpertCardUnreadState();
  syncConversationUnreadState();
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
  markExpertConversationRead(type);
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
  syncConversationUnreadState(currentConversationType);
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
      <span class="agent-logo">${avatarImg(option.logo, option.name)}</span>
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
  const page = $('conversationPage');
  page.classList.toggle('files-collapsed');
  if (!page.classList.contains('files-collapsed')) {
    document.querySelector('.files-folder-trigger')?.classList.remove('has-new-output');
  }
}


/* =========================================================================
   6. 资源库 / 资料详情页
   ========================================================================= */
function openAssetDetail() {
  switchView('space');
  moduleState.space.page = 'detail';
  syncAssetDetailPage(currentAssetMock);
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

function saveAssetChanges() {
  showToast('已保存变更');
}

function refreshAssetPreview() {
  syncAssetDetailPage(currentAssetMock);
  showToast('预览已刷新');
}

function navigateAssetPreview(direction) {
  showToast(direction === 'back' ? '已后退一步' : '已前进一步');
}

function toggleAssetDevicePreview() {
  showToast('已切换预览设备');
}

function startAssetDetailNewChat() {
  showToast('已开启新对话');
}

function refreshAssetDetailChat() {
  showToast('会话已刷新');
}

function openDetailFileBucket() {
  toggleAssetHistoryMode(true);
  showToast('已打开会话文件');
}

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

function getAssetMock(assetType = 'html') {
  return ASSET_LIBRARY_DEFS[assetType] || ASSET_LIBRARY_DEFS.html;
}

function buildAssetCard(type) {
  const asset = getAssetMock(type);
  return `
    <div class="asset-card annotated" data-asset-type="${type}" onclick="openAssetDetailByType('${type}')">
      <div class="asset-preview ${asset.cardPreviewClass}">${asset.cardPreviewHtml}</div>
      <div class="asset-info">
        <div class="asset-name"><span class="file-badge ${asset.typeClass}">${asset.fileBadge}</span>${asset.cardTitle}</div>
        <div class="asset-foot"><span>${asset.owner}：XXXXXXXX</span><span class="avatar">${avatarImg(asset.typeClass === 'ppt' ? 'report-agent' : 'finance-agent', asset.owner)}</span></div>
      </div>
      <button class="asset-experience-btn" onclick="event.stopPropagation(); openAssetDetailByType('${type}')">体验</button>
      <span class="change-marker demo-control" data-change-tooltip="点击资源库资料进入资料详情页。" data-change-placement="top">${asset.typeClass === 'html' ? '7' : '8'}</span>
    </div>`;
}

function renderAssetLibrary() {
  const home = $('spaceHome');
  if (!home) return;
  const recentRow = home.querySelector('.recent-row');
  const assetGrid = home.querySelector('.asset-grid');
  if (recentRow) {
    recentRow.innerHTML = `
      <div class="mini-asset" onclick="openAssetDetailByType('html')"><div class="mini-thumb"><div>销售预测系统.html</div><br><div>图表与预测规则</div></div><div class="mini-info"><span>财务小助手</span><span class="avatar">${avatarImg('finance-agent', '财务小助手')}</span></div></div>
      <div class="mini-asset" onclick="openAssetDetailByType('ppt')"><div class="mini-thumb ppt">2025年9月生产经营分析会</div><div class="mini-info"><span>经营助手</span><span class="avatar">${avatarImg('report-agent', '经营助手')}</span></div></div>
    `;
  }
  if (assetGrid) {
    assetGrid.innerHTML = `
      <div class="asset-card space-asset-hidden" id="savedFromSessionAsset" onclick="openAssetDetailByType('html')">
        <div class="asset-preview dashboard"><div class="kpi">已存入</div><div class="kpi">$510.854 亿</div><div class="kpi red">V2</div><div class="line-chart"></div></div>
        <div class="asset-info"><div class="asset-name"><span class="file-badge html">HTML</span>销售预测系统.html</div><div class="asset-foot"><span>来自会话文件快照</span><span class="avatar">${avatarImg('dora-session', 'Dora')}</span></div></div>
        <button class="asset-experience-btn" onclick="event.stopPropagation(); openAssetDetailByType('html')">体验</button>
      </div>
      ${buildAssetCard('html')}
      ${buildAssetCard('ppt')}
      ${buildAssetCard('dashboard')}
      ${buildAssetCard('churnReport')}
      ${buildAssetCard('metricModel')}
      ${buildAssetCard('conversionDataset')}
    `;
  }
}

function syncAssetDetailPage(assetType = 'html') {
  const asset = getAssetMock(assetType);
  currentAssetMock = assetType;
  const badgeNodes = document.querySelectorAll('.asset-title .file-badge');
  badgeNodes.forEach(node => {
    node.className = `file-badge ${asset.typeClass}`;
    node.textContent = asset.fileBadge;
  });
  const titleNode = document.querySelector('.asset-title span:last-child');
  if (titleNode) titleNode.textContent = asset.title;
  const ownerNode = document.querySelector('.preview-header .owner');
  if (ownerNode) ownerNode.textContent = asset.headerOwner;
  const versionTrigger = $('versionMenu')?.querySelector('.version-trigger');
  if (versionTrigger) versionTrigger.textContent = asset.version;
  const sourcePopover = $('sourcePopover');
  if (sourcePopover) {
    sourcePopover.querySelector('.source-label').textContent = asset.typeClass === 'ppt' ? '汇报' : '讨论';
    const p = sourcePopover.querySelector('p');
    if (p) p.textContent = asset.sourceDesc;
  }
  const detailTitle = $('detailChatTitle');
  if (detailTitle) detailTitle.textContent = asset.sourceConversation;
  const historyTitle = $('conversationHistoryTitle');
  if (historyTitle && historyTitle.classList.contains('has-unread')) historyTitle.textContent = asset.sourceConversation;
  const historyPanel = $('assetHistoryPanel');
  if (historyPanel) {
    historyPanel.innerHTML = `
      <div class="history-filter-title">${asset.historyTitle}</div>
      ${asset.historyItems.map(item => `<button onclick="openSourceConversationFromAsset('${item.title}','${asset.title}')">${item.title} · ${item.desc}</button>`).join('')}
    `;
  }
  const previewContent = document.querySelector('.preview-content');
  if (previewContent) previewContent.innerHTML = asset.preview;
}

function openAssetDetailByType(assetType) {
  syncAssetDetailPage(assetType);
  openAssetDetail();
}

function setSavedLibraryAsset(asset) {
  FILE_PANEL_STATE.savedAssets = [asset];
  updateSavedAssetCard(asset);
}

function clearSavedLibraryAssets() {
  FILE_PANEL_STATE.savedAssets = [];
  FILE_PANEL_STATE.output.forEach(file => {
    file.savedToLibrary = false;
    file.libraryDirty = false;
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
  pendingOutputLibrarySave = null;
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
  if (pendingOutputLibrarySave) {
    commitOutputLibrarySave(pendingOutputLibrarySave, 'new');
    return;
  }
  saveLibrarySnapshot('new');
}

function overwriteLibrarySnapshot() {
  if (pendingOutputLibrarySave) {
    commitOutputLibrarySave(pendingOutputLibrarySave, 'overwrite');
    return;
  }
  saveLibrarySnapshot('overwrite');
}

function markSessionFileDirty() {
  libraryFileState.sessionVersion += 1;
  libraryFileState.status = libraryFileState.savedVersion > 0 ? 'savedDirty' : 'neverSaved';
  FILE_PANEL_STATE.output.forEach(file => {
    if (file.savedToLibrary) file.libraryDirty = true;
  });
  renderFilePanel();
  if (currentPreviewFile?.source === 'output') {
    currentPreviewFile = getPreviewFile(currentPreviewFile.clickName || currentPreviewFile.name);
    renderPreviewFrame(currentPreviewFile);
  }
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
  const file = getCitationFile(label);
  currentSourceTrace = {
    type: 'citation',
    label: file ? file.name : label,
    conversation: '客户反馈归因分析'
  };
  $('conversationPage').classList.remove('files-collapsed');
  syncSourceTraceContext();
  syncConversationHistoryTitle();
  if (!file) {
    showToast(`未找到引用来源：${label}`);
    return;
  }
  if (file.source === 'output') {
    currentOutputCategory = 'all';
    currentOutputSearch = '';
    const outputSearch = document.querySelector('.conv-files .output-search-input');
    if (outputSearch) outputSearch.value = '';
  }
  if (file.source === 'input') {
    currentInputSourceFilter = getInputSourceKind(file);
    currentInputSearch = '';
    const inputSearch = document.querySelector('.conv-files .input-toolbar-group .search-input');
    if (inputSearch) inputSearch.value = '';
    syncInputSourceFilterButtons();
  }
  renderFilePanel();
  setFilesPanelTab(file.source);
  highlightFileRow(file.id);
  openPreview(file.clickKind, file.clickName);
  showToast(`已定位引用来源：${file.name}`);
}

function getCitationIndexLabel(index) {
  const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
  return circled[index - 1] || String(index);
}

function escapeJsString(value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

function citation(label, index) {
  const file = getCitationFile(label);
  const sourceName = file?.name || String(label || '').split('·')[0].trim() || `引用 ${index}`;
  const safeLabel = escapeJsString(label);
  const safeSourceName = escapeHtmlAttr(sourceName);
  return `<button class="citation-mark" title="${safeSourceName}" aria-label="查看引用来源：${safeSourceName}" onclick="showCitationSource('${safeLabel}')">${getCitationIndexLabel(index)}</button>`;
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
  pill.hidden = true;
  pill.textContent = '';
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
  const file = getPreviewFile(fileName) || FILE_PANEL_STATE.input.find(item => item.clickName === fileName || item.name === fileName) || null;
  insertConversationReference(file || { name: fileName, clickName: fileName, clickKind: 'source' });
  showToast(`已引用 ${fileName}`);
}

function applyOutputPromptReuse(file, promptText) {
  const input = $('conversationInput');
  if (!input) return;
  input.value = promptText;
  input.focus();
  input.selectionStart = promptText.length;
  input.selectionEnd = promptText.length;
  syncConversationSendState();
  showToast(`已复用 ${file.name} 的 Prompt`);
}

function reuseOutputPrompt(fileName) {
  const file = getPreviewFile(fileName);
  if (!file || file.source !== 'output') return;
  const input = $('conversationInput');
  if (!input) return;
  const promptText = file.sourcePrompt || `请基于 ${file.name} 继续生成一个新版本。`;
  const hasExistingText = Boolean(input.value.trim());
  if (hasExistingText) {
    pendingPromptReuse = { fileName, promptText };
    openPromptReusePopconfirm(file.name);
    return;
  }
  applyOutputPromptReuse(file, promptText);
}

function ensurePromptReusePopconfirm() {
  let panel = $('promptReusePopconfirm');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'promptReusePopconfirm';
  panel.className = 'prompt-reuse-popconfirm';
  panel.innerHTML = `
    <div class="library-pop-title">Sender 已有内容</div>
    <div class="library-pop-desc" id="promptReusePopDesc">是否覆盖现有内容并复用该 Prompt？</div>
    <div class="library-pop-actions">
      <button onclick="closePromptReusePopconfirm()">取消</button>
      <button class="is-primary" onclick="confirmPromptReuse()">覆盖</button>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function openPromptReusePopconfirm(fileName) {
  const panel = ensurePromptReusePopconfirm();
  const desc = $('promptReusePopDesc');
  if (desc) desc.textContent = `是否用「${fileName}」的 Prompt 覆盖当前 Sender 内容？`;
  panel.classList.add('open');
}

function closePromptReusePopconfirm() {
  pendingPromptReuse = null;
  const panel = $('promptReusePopconfirm');
  if (panel) panel.classList.remove('open');
}

function confirmPromptReuse() {
  const pending = pendingPromptReuse;
  if (!pending) return;
  const file = getPreviewFile(pending.fileName);
  closePromptReusePopconfirm();
  if (file) applyOutputPromptReuse(file, pending.promptText);
}

function getStandalonePreviewMarkup(file) {
  const mode = getPreviewMode(file?.clickKind, file);
  if (mode === 'dataset') {
    return '<table><thead><tr><th>反馈类型</th><th>数量</th><th>占比</th></tr></thead><tbody><tr><td>物流配送</td><td>524</td><td>42%</td></tr><tr><td>客户服务</td><td>349</td><td>28%</td></tr><tr><td>产品质量</td><td>225</td><td>18%</td></tr></tbody></table>';
  }
  if (mode === 'json') {
    return '<pre>{\\n  "total": 1247,\\n  "mainIssue": "物流配送",\\n  "ratio": "42%"\\n}</pre>';
  }
  if (mode === 'html') {
    return '<div class="kpi">反馈总量 1,247</div><div class="chart"></div><p>物流配送 42% · 客户服务 28% · 产品质量 18%</p>';
  }
  if (mode === 'pdf' || mode === 'document') {
    return '<h2>客户反馈分析报告</h2><p>该预览用于模拟新窗口打开的阅读器视图。</p><table><tr><th>问题</th><th>占比</th></tr><tr><td>物流配送</td><td>42%</td></tr><tr><td>客户服务</td><td>28%</td></tr></table>';
  }
  if (mode === 'image') {
    return '<div class="image-box">反馈分布图组</div>';
  }
  if (mode === 'ppt') {
    return '<div class="slide-box">客户反馈分析汇报</div>';
  }
  if (mode === 'text') {
    return `<pre>${getTextPreviewContent(file)}</pre>`;
  }
  return '<div class="empty">该类型文件暂不支持预览，可下载到本地查看。</div>';
}

function openFileInNewWindow(kind, fileName) {
  const file = getPreviewFile(fileName) || { name: fileName, clickName: fileName, clickKind: kind };
  const win = window.open('', '_blank', 'width=1180,height=820');
  if (!win) {
    showToast('浏览器阻止了新窗口打开');
    return;
  }
  const safeTitle = file.name || fileName;
  win.document.write(`<!doctype html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>${safeTitle}</title>
      <style>
        body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;background:#f5f7fb;color:#223553;}
        header{height:56px;display:flex;align-items:center;gap:12px;padding:0 20px;background:#fff;border-bottom:1px solid #e6e9ef;}
        main{padding:24px;max-width:960px;margin:0 auto;}
        .page{background:#fff;border:1px solid #e6e9ef;border-radius:8px;padding:24px;min-height:520px;}
        table{width:100%;border-collapse:collapse;margin-top:16px;font-size:14px;}
        th,td{border:1px solid #e6e9ef;padding:10px;text-align:left;}
        .kpi{font-size:28px;font-weight:700;margin-bottom:16px;}
        .chart,.image-box,.slide-box{height:320px;border-radius:8px;background:linear-gradient(135deg,#eaf2ff,#d8f3ea);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;}
        pre{background:#111827;color:#d1fae5;border-radius:8px;padding:18px;overflow:auto;}
        .empty{height:420px;display:flex;align-items:center;justify-content:center;color:#5d6b81;}
      </style>
    </head>
    <body>
      <header><strong>${safeTitle}</strong><span>${file.ext || kind || 'FILE'}</span></header>
      <main><section class="page">${getStandalonePreviewMarkup(file)}</section></main>
    </body>
    </html>`);
  win.document.close();
  showToast(`已在新窗口打开 ${fileName}`);
}

function downloadFile(fileName) {
  showToast(`开始下载 ${fileName}`);
}

function shareFile(fileName) {
  activeShareFileName = fileName;
  const panel = ensureSharePopover();
  const title = panel.querySelector('.share-pop-title');
  const link = panel.querySelector('.share-pop-link');
  if (title) title.textContent = `分享 ${fileName}`;
  if (link) link.textContent = `https://dora.local/share/${encodeURIComponent(fileName)}`;
  panel.classList.add('open');
}

function hasOutputLibraryDuplicate(file) {
  return FILE_PANEL_STATE.savedAssets.some(asset => asset.name === file.name);
}

function handleOutputLibrarySave(fileName) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (!file) return;
  if (file.savedToLibrary && file.libraryDirty) {
    commitOutputLibrarySave(fileName, 'sync');
    return;
  }
  if (!hasOutputLibraryDuplicate(file)) {
    commitOutputLibrarySave(fileName, 'direct');
    return;
  }
  pendingOutputLibrarySave = fileName;
  const pop = $('libraryPopconfirm');
  if (pop) {
    const title = pop.querySelector('.library-pop-title');
    const desc = pop.querySelector('.library-pop-desc');
    if (title) title.textContent = '资料库中已有同名文件';
    if (desc) desc.textContent = `「${file.name}」将作为会话输出快照存入资料库，请确认存入方式。`;
  }
  openLibraryPopconfirm();
}

function commitOutputLibrarySave(fileName, mode) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (!file) return;
  file.savedToLibrary = true;
  file.libraryDirty = false;
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
  pendingOutputLibrarySave = null;
  closeLibraryPopconfirm();
  const actionCopy = mode === 'sync'
    ? '同步更新到资料库'
    : mode === 'overwrite'
      ? '覆盖存入资料库'
      : mode === 'direct'
        ? '存入资料库'
        : '另存新文件到资料库';
  showToast(`已将 ${file.name} ${actionCopy}`);
}

function saveSkillToBackend(fileName) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (file) file.savedToBackend = true;
  renderFilePanel();
  if (file && currentPreviewFile && (currentPreviewFile.clickName === file.clickName || currentPreviewFile.name === file.name)) {
    currentPreviewFile = file;
    renderPreviewFrame(file);
  }
  showToast('已添加到后台技能库');
}

function ensureSharePopover() {
  let panel = $('sharePopover');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'sharePopover';
  panel.className = 'share-popover';
  panel.innerHTML = `
    <div class="share-pop-title">分享文件</div>
    <div class="share-pop-desc">可复制链接或选择成员发送。</div>
    <div class="share-pop-link"></div>
    <div class="share-pop-members">
      <button onclick="sendShareToMember('Nina')">Nina</button>
      <button onclick="sendShareToMember('Alex')">Alex</button>
      <button onclick="sendShareToMember('团队群')">团队群</button>
    </div>
    <div class="share-pop-actions">
      <button onclick="copyShareLink()">复制链接</button>
      <button class="is-primary" onclick="closeSharePopover()">完成</button>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
}

function closeSharePopover() {
  const panel = $('sharePopover');
  if (panel) panel.classList.remove('open');
}

function copyShareLink() {
  const fileName = activeShareFileName || '文件';
  closeSharePopover();
  showToast(`已复制 ${fileName} 的分享链接`);
}

function sendShareToMember(memberName) {
  const fileName = activeShareFileName || '文件';
  closeSharePopover();
  showToast(`已将 ${fileName} 分享给 ${memberName}`);
}

function refreshOutputFile(fileName) {
  const file = FILE_PANEL_STATE.output.find(item => item.clickName === fileName || item.name === fileName);
  if (!file) return;
  if (currentPreviewFile && (currentPreviewFile.clickName === file.clickName || currentPreviewFile.name === file.name)) {
    currentPreviewFile = file;
    renderPreviewFrame(file);
  }
  if (file.type === 'html') {
    refreshHtmlPreview();
    return;
  }
  showToast(`已重新生成 ${file.name}`);
}

function deleteOutputFile(fileName) {
  const idx = FILE_PANEL_STATE.output.findIndex(item => item.clickName === fileName || item.name === fileName);
  if (idx < 0) return;
  const [removed] = FILE_PANEL_STATE.output.splice(idx, 1);
  if (currentPreviewFile && (currentPreviewFile.clickName === removed.clickName || currentPreviewFile.name === removed.name)) {
    currentPreviewFile = null;
    closePreview();
  }
  renderFilePanel();
  showToast(`已删除 ${removed.name}`);
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
  openScenarioGuide();
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

const SCENARIO_STEPS = [
  { id: 'intent', time: 800, label: '先确认您的目标', desc: '我先把这次需求接住：不是只做统计，而是要整理出能汇报的结论和材料。' },
  { id: 'plan', time: 2200, label: '把工作排好顺序', desc: '我会先看数据，再归类问题、复核重点，最后整理成 PPT 和配套产物。' },
  { id: 'read', time: 4000, label: '先把数据摸清楚', desc: '我先检查客户反馈明细的字段、行数和可分析范围，避免后面结论跑偏。' },
  { id: 'code', time: 6200, label: '准备归类规则', desc: '我会把关键词和描述语义结合起来看，尽量减少只靠关键词带来的误判。' },
  { id: 'run', time: 10000, label: '逐条归类并复核', desc: '我正在处理 1,247 条反馈，会把明显集中的问题先拎出来，再做一轮复核。' },
  { id: 'chart', time: 27500, label: '整理图表素材', desc: '我把问题分布、满意度趋势和重点客户做成图表，后面能直接放进汇报。' },
  { id: 'ppt', time: 34400, label: '撰写汇报 PPT', desc: '我按“结论先行”的方式组织 PPT，先讲发现，再讲原因和行动建议。' },
  { id: 'archive', time: 72800, label: '整理完整交付包', desc: 'PPT 之外，我会把报告、明细表和结构化结果一起准备好，方便不同同学直接使用。' }
];

let scenarioGuideOpen = false;
let scenarioGuidePanel = null;

function ensureScenarioGuidePanel() {
  let panel = $('scenarioGuidePanel');
  if (panel) return panel;
  panel = document.createElement('div');
  panel.id = 'scenarioGuidePanel';
  panel.className = 'scenario-guide-panel';
  panel.innerHTML = `
    <div class="scenario-guide-card">
      <div class="scenario-guide-head">
        <div>
          <div class="scenario-guide-title">客户反馈剧本</div>
          <div class="scenario-guide-sub">点击节点可直接跳到对应环节</div>
        </div>
        <button class="scenario-guide-close" type="button" onclick="closeScenarioGuide()">×</button>
      </div>
      <div class="scenario-guide-actions">
        <button type="button" onclick="playScenario(); closeScenarioGuide()">▶ 重播剧本</button>
        <button type="button" onclick="appendGenUIReply('帮我看一下反馈分布'); closeScenarioGuide()">追加分析卡片</button>
        <button type="button" onclick="markSessionFileDirty()">模拟会话文件更新</button>
        <button type="button" onclick="deleteLibrarySnapshot()">模拟资料库删除</button>
      </div>
      <div class="scenario-guide-list" id="scenarioGuideList"></div>
    </div>`;
  document.body.appendChild(panel);
  scenarioGuidePanel = panel;
  return panel;
}

function renderScenarioGuide() {
  const list = $('scenarioGuideList');
  if (!list) return;
  list.innerHTML = SCENARIO_STEPS.map(step => `
    <button class="scenario-guide-item" onclick="jumpToScenarioStep('${step.id}')">
      <span class="scenario-guide-time">${Math.floor(step.time / 1000)}s</span>
      <span class="scenario-guide-copy">
        <span class="scenario-guide-label">${step.label}</span>
        <span class="scenario-guide-desc">${step.desc}</span>
      </span>
    </button>
  `).join('');
}

function openScenarioGuide() {
  ensureScenarioGuidePanel();
  renderScenarioGuide();
  scenarioGuideOpen = true;
  scenarioGuidePanel?.classList.add('open');
  document.querySelector('.v-demo-toggle')?.classList.add('is-open');
}

function closeScenarioGuide() {
  scenarioGuideOpen = false;
  scenarioGuidePanel?.classList.remove('open');
  document.querySelector('.v-demo-toggle')?.classList.remove('is-open');
}

function jumpToScenarioStep(stepId) {
  const step = SCENARIO_STEPS.find(item => item.id === stepId);
  if (!step) return;
  closeScenarioGuide();
  playScenario(step.time);
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

const CAROUSEL_MSGS = ['我还在继续看数据，不是卡住了...','我正在把分散反馈归到业务问题上...','我已经看到几个集中问题，正在复核...','我会把结论整理成能汇报的口径...','PPT 正在排版结论页和图表页...','我正在补齐备注和行动建议...'];

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
function setWaitCarousel(messages = CAROUSEL_MSGS) {
  $('waitText').hidden = true;
  const carousel = $('waitCarousel'), track = $('waitCarouselTrack');
  const sourceMessages = Array.isArray(messages) && messages.length ? messages : CAROUSEL_MSGS;
  track.innerHTML = sourceMessages.concat(sourceMessages[0]).map(m => `<span>${m}</span>`).join('');
  carousel.hidden = false;
  let idx = 0; track.style.transform = 'translateY(0)';
  if (carouselIntervalId) clearInterval(carouselIntervalId);
  carouselIntervalId = setInterval(() => {
    idx += 1;
    track.style.transform = `translateY(-${idx * 18}px)`;
    if (idx >= sourceMessages.length) {
      setTimeout(() => {
        track.style.transition = 'none'; track.style.transform = 'translateY(0)'; idx = 0;
        requestAnimationFrame(() => track.style.transition = '');
      }, 380);
    }
  }, 2200);
}

function markPanelAsLiveProgress() {
  if (liveOutputProgressShown) return;
  liveOutputProgressShown = true;
  setExecTitle(`已完成 ${actionCount} 个动作 · 产物生成中`);
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
html,body{width:100%;height:auto;overflow:hidden;background:#fff;}
body{font-family:-apple-system,"PingFang SC",sans-serif;color:#091640;font-size:13px;}
.genui-root{padding:20px;}
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
<div class="genui-root">
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
</div>
</body></html>`;

function resizeGenUIFrame(iframe) {
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument;
    const root = doc?.querySelector('.genui-root');
    const rootHeight = root ? Math.ceil(root.getBoundingClientRect().height) : 0;
    const fallbackHeight = Math.max(doc?.body?.scrollHeight || 0, doc?.documentElement?.scrollHeight || 0);
    iframe.style.height = `${Math.max(rootHeight || fallbackHeight, 1)}px`;
  } catch (e) {}
}


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
  slot.innerHTML = `<div class="genui-header">客户反馈问题分布<span class="genui-sub">悬停可查看各类细分占比</span></div><iframe class="genui-frame" sandbox="allow-same-origin" scrolling="no"></iframe>`;
  const iframe = slot.querySelector('iframe');
  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    resizeGenUIFrame(iframe);
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
  const matchedFile = getPreviewFile(it.name);
  const fallbackFile = {
    source: 'output',
    type: it.type === 'skill' ? 'skill' : it.type === 'html' ? 'html' : it.type === 'images' ? 'image' : it.type === 'pptx' ? 'ppt' : it.type === 'docx' ? 'docx' : it.type === 'pdf' ? 'pdf' : it.type === 'md' ? 'md' : it.type === 'xlsx' || it.type === 'csv' ? 'dataset' : 'source',
    ext: (it.type || 'FILE').toUpperCase(),
    name: it.name,
    clickName: it.name,
    clickKind: it.type === 'images' ? 'imgs' : it.type,
    icon: (it.type || 'FILE').toUpperCase(),
    iconClass: it.type === 'images' ? 'imgs' : it.type
  };
  const file = matchedFile || fallbackFile;
  const category = getOutputCategory(file);
  card.className = 'output-card output-list-card' + (it.loading ? ' is-loading' : '');
  if (it.onClick) card.onclick = it.onClick;
  const titleAttr = it.desc ? `title="${it.name} — ${it.desc}"` : `title="${it.name}"`;
  card.innerHTML = `
    <div class="output-preview ${it.type}${it.loading ? ' loading' : ''}">${buildPreviewContent(it)}</div>
    <div class="output-meta">
      <div class="output-name" ${titleAttr}>${it.name}<span class="output-category-pill">${getOutputCategoryLabel(category)}</span></div>
      <div class="output-sub${it.loading ? ' loading-note' : ''}">${it.sub || ''}</div>
    </div>
    ${it.loading ? '' : `<div class="output-card-actions">
      <button onclick="event.stopPropagation(); addFileToConversation('${file.clickName}')">@引用</button>
      <button onclick="event.stopPropagation(); openPreview('${file.clickKind}', '${file.clickName}')">预览</button>
    </div>`}`;
  return card;
}

function getPreviewMode(kind, file) {
  if (String(file?.ext || '').toUpperCase() === 'TXT') return 'text';
  if (kind === 'pptx') return 'ppt';
  if (kind === 'html') return 'html';
  if (kind === 'md') return 'md';
  if (kind === 'imgs') return 'image';
  if (kind === 'pdf') return 'pdf';
  if (kind === 'skill') return 'skill';
  if (kind === 'docx') return 'document';
  if (kind === 'xlsx' || kind === 'csv') return 'dataset';
  if (kind === 'json') return 'json';
  return 'generic';
}

async function renderOutputs(items, opts = {}) {
  const {
    titleText = `<span class="count">${items.length}</span> 个产物`,
    subText = '',
    animate = true
  } = opts;
  const wrap = $('outputsSection');
  wrap.hidden = false;
  const subHtml = subText ? `<span class="sub">${subText}</span>` : '';
  wrap.innerHTML = `<div class="outputs-title">${titleText}${subHtml}</div><div class="outputs-cards" id="outputsCards"></div>`;
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
  currentPreviewTab = currentPreviewFile?.source || currentPreviewTab || 'output';
  $('conversationPage')?.classList.remove('files-collapsed');
  document.querySelector('.files-folder-trigger')?.classList.remove('has-new-output');
  setFilesPanelTab(currentPreviewTab, { preservePreview: true });
  pane.classList.add('is-preview-mode');
  pane.dataset.activeTab = currentPreviewTab;
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
    const isLight = currentPreviewPptStyle === 'light' || slide.kind === 'light';
    const isDark = currentPreviewPptStyle === 'dark';
    canvas.style.background = isLight
      ? 'linear-gradient(135deg, #FFFFFF 0%, #F0F4FF 100%)'
      : isDark
        ? 'linear-gradient(135deg, #111827 0%, #1E3A8A 100%)'
        : 'linear-gradient(135deg, #0E0F2E 0%, #2D1B6E 100%)';
    canvas.style.color = isLight ? '#091640' : '#fff';
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
  if (isPptOnlyLiveVariant()) {
    if (stage === 'ppt-start') {
      return [
        { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '正在生成汇报 PPT，预计 1 分钟左右', loading: true, loadingLabel: '正在生成' }
      ];
    }
    if (stage === 'ppt-ready') {
      return [
        { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') }
      ];
    }
    return null;
  }
  if (stage === 'ppt-start') {
    return [
      { type: 'images', name: '反馈分布图组', sub: '图表已生成 · 共 3 张', count: 3, onClick: () => openPreview('imgs', '反馈分布图组') },
      { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '正在生成汇报 PPT，预计 1 分钟左右', loading: true, loadingLabel: '正在生成' }
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
      { type: 'docx', name: '反馈分析报告.docx', sub: '正在整理给管理层阅读的版本...', loading: true, loadingLabel: '正在整理 Word' },
      { type: 'pdf', name: '反馈分析报告.pdf', sub: '正在准备方便归档的版本...', loading: true, loadingLabel: '正在整理 PDF' },
      { type: 'xlsx', name: '反馈分类结果.xlsx', sub: '正在把分类明细写入表格...', loading: true, loadingLabel: '正在整理明细' }
    ];
  }
  return null;
}

async function renderLiveOutputsStage(stage) {
  const items = getLiveOutputStage(stage);
  if (!items) return;
  await renderOutputs(items, {
    titleText: `<span class="count">${items.length}</span> 个产物`,
    animate: false
  });
  notifyOutputTabUpdate(items.length);
}

/* =========================================================================
   15. 剧本驱动
   ========================================================================= */
function resetScenario() {
  clearScenario();
  actionCount = 0; nodeCounter = 0;
  liveOutputProgressShown = false;
  scenarioVisibleOutputCount = 0;
  window.clearTimeout(outputTabFlashTimer);
  const outputTab = document.querySelector('.conv-files .files-tab[data-tab="output"]');
  const outputsCount = $('outputsCount');
  if (outputTab) outputTab.classList.remove('is-output-updated');
  if (outputsCount) delete outputsCount.dataset.delta;
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
  $('extraReplies').innerHTML = '';
  closePreview(); resetPptPreview();
}

function playScenario(startAt = 0) {
  resetScenario();
  scenarioStartedAt = Date.now();
  const isProductLiveScenario = isLiveOutputVariant();
  const isPptOnlyScenario = isPptOnlyLiveVariant();
  const PPT_START = 34400;
  const PPT_DONE = 64400;
  const GENUI_START = PPT_DONE + 800;
  const GENUI_RENDER = GENUI_START + 1200;
  const SUMMARY_START = GENUI_START + 4200;
  const ARCHIVE_HINT = SUMMARY_START + 3000;
  const ARCHIVE_START = ARCHIVE_HINT + 400;
  const ARCHIVE_DONE = ARCHIVE_START + 2200;
  const FINAL_OUTPUTS = isPptOnlyScenario ? SUMMARY_START + 3200 : ARCHIVE_DONE + 3400;
  const SCENARIO_DONE = FINAL_OUTPUTS + 4200;
  if (startAt > 0) {
    scenarioStartedAt = Date.now() - startAt;
  }

  const schedule = (ms, fn) => {
    scenarioTimers.push(setTimeout(fn, Math.max(0, ms - startAt)));
  };

  schedule(300, () => { showWaitLine(); setExecTitle('我先确认这次要交付什么....'); });
  schedule(600, () => setResult('收到，我先帮您把这批反馈跑一遍。<br>我会先看数据结构和字段质量，再把反馈按问题类型归类，最后整理成一份适合汇报的 PPT。过程中我会把关键发现同步给您，方便您不用等到最后才知道进展。'));

  let n1;
  schedule(800, () => { n1 = addActionNode({ stage: { cls: 'coordinator', label: '任务确认' }, title: '先确认您的目标', detail: '我理解这次不是单纯做统计，而是要把“问题发现、结论汇报、可交付材料”一起做出来。' }); });

  let n2;
  schedule(2000, () => { completeNode(n1); setExecTitle('我把工作顺序先排好....'); });
  schedule(2200, () => { n2 = addActionNode({ stage: { cls: 'planner', label: '工作安排' }, title: '把工作排好顺序', detail: '我会先看数据，再归类问题、复核重点，最后整理成 PPT 和配套产物。', files: [{ name: 'plan.md', kind: 'code' }] }); });

  let n3;
  schedule(3800, () => { completeNode(n2); setExecTitle('我先把数据摸清楚....'); });
  schedule(4000, () => { n3 = addActionNode({ stage: { cls: 'researcher', label: '数据检查' }, title: '检查反馈数据', detail: '我先把客户反馈明细读进来，确认字段、行数和可分析范围。', files: [{ name: '客户反馈明细.xlsx', kind: 'data', role: 'input' }, { name: 'schema.json', kind: 'data' }] }); });
  schedule(5500, () => completeNode(n3));
  schedule(5700, () => setResult('我先看了一下数据结构：这份表里能用来分析的关键字段比较完整，包括客户、反馈类型、满意度、问题描述、日期、渠道和处理状态。可以继续往下做。'));

  let n4;
  schedule(6200, () => { setExecTitle('我在准备问题归类规则....'); n4 = addActionNode({ stage: { cls: 'coder', label: '归类规则' }, title: '准备归类规则', detail: '我会把关键词和描述语义结合起来看，尽量减少只靠关键词带来的误判。', files: [{ name: 'classifier.py', kind: 'code' }], code: '' }); });
  schedule(6400, () => appendCode(n4, [
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
  schedule(9800, () => completeNode(n4));
  schedule(10000, () => { setExecTitle('我开始逐条归类并复核....'); n5 = addActionNode({ stage: { cls: 'coder', label: '归类复核' }, title: '逐条归类 1,247 条反馈', detail: '我会先做一轮归类，再把明显集中的部分单独复核。', files: [{ name: 'classification_result.csv', kind: 'data' }] }); });

  schedule(13000, () => setWaitText('这批反馈量不小，我正在稳稳处理...'));
  schedule(18000, () => setWaitText('我已经看到几个集中问题，再多跑一层交叉分析...'));
  schedule(25000, () => setWaitCarousel());

  schedule(27000, () => { clearWaitText(); setResult('初步归类结果出来了：问题主要集中在 <strong>3 类</strong>。物流配送占比最高，大约 42%；客户服务占 28%；产品质量占 18%。我接下来会继续看这些问题分别影响哪些客户和地区。'); completeNode(n5); });

  let n5b;
  schedule(27500, () => {
    setExecTitle('我继续看哪些客户影响更大....');
    n5b = addActionNode({
      stage: { cls: 'researcher', label: '重点复核' },
      title: '找出重点客户和高频场景',
      detail: '我会把反馈更集中的客户、地区和渠道单独拎出来，方便后续安排整改优先级。',
      files: [{ name: '反馈数_2025Q2.json', kind: 'data' }]
    });
  });
  schedule(28100, () => renderChart(n5b));
  schedule(31600, () => completeNode(n5b));

  let n6;
  schedule(32000, () => {
    collapseChart(n5b);
    setExecTitle('我开始整理图表和汇报素材....');
    n6 = addActionNode({ stage: { cls: 'reporter', label: '汇报素材' }, title: '整理图表和汇报素材', detail: '我把问题分布、满意度趋势和 Top 客户做成图表，后面会直接放进 PPT。', files: [{ name: '分类分布.png', kind: 'img', role: 'deliver' }, { name: '满意度趋势.png', kind: 'img', role: 'deliver' }, { name: 'Top 客户.png', kind: 'img', role: 'deliver' }] });
  });
  schedule(34000, () => completeNode(n6));

  let n7;
  schedule(PPT_START, () => { setExecTitle('我开始撰写汇报 PPT....'); n7 = addActionNode({ stage: { cls: 'reporter', label: '汇报成稿' }, title: '撰写汇报 PPT', detail: '我按“结论先行”的方式组织，不做流水账，先给您放结论，再展开原因和行动建议。', files: [{ name: 'ppt_generator.py', kind: 'code' }, { name: '客户反馈分析汇报.pptx', role: 'deliver' }], code: '' }); });
  schedule(PPT_START + 50, () => {
    if (isProductLiveScenario) {
      markPanelAsLiveProgress();
      renderLiveOutputsStage('ppt-start');
    }
  });
  schedule(PPT_START + 200, () => appendCode(n7, [
    "from pptx import Presentation",
    "prs = Presentation('templates/dora.pptx')",
    "for slide_data in slides:",
    "    add_slide(prs, slide_data)",
    "prs.save('客户反馈分析汇报.pptx')",
    "上传文件中......"
  ], 380));

  schedule(PPT_START + 300, () => openPreview('pptx', '客户反馈分析汇报.pptx', { progressive: true }));
  PPT_SLIDES.forEach((s, i) => { schedule(PPT_START + 800 + i * (isProductLiveScenario ? 3500 : 700), () => appendPptSlideProgressive()); });
  schedule(PPT_START + 1600, () => { if (isProductLiveScenario) setWaitText('PPT 这一步会稍微久一点，我正在排版结论页和图表页，预计还需 50s...'); });
  schedule(PPT_START + 9600, () => { if (isProductLiveScenario) setWaitText('我还在继续生成，不是卡住了。现在主要是在补图表和备注...'); });
  schedule(PPT_START + 17600, () => { if (isProductLiveScenario) setWaitCarousel(['正在排版结论页和问题拆解页...','正在把关键发现整理成汇报口径...','正在补齐图表、备注和行动建议...','PPT 正在生成中，请您稍候...']); });

  schedule(PPT_DONE, () => {
    completeNode(n7);
    if (isProductLiveScenario) renderLiveOutputsStage('ppt-ready');
  });

  let n8;
  if (!isPptOnlyScenario) {
    schedule(ARCHIVE_HINT, () => { if (isProductLiveScenario) setWaitText('PPT 已经成型，我再把配套报告和明细结果一起归档好...'); });
    schedule(ARCHIVE_START, () => {
      setExecTitle('我在整理完整交付包....');
      n8 = addActionNode({
        stage: { cls: 'reporter', label: '交付整理' },
        title: '整理完整交付包',
        detail: 'PPT 之外，我会把 Word、PDF、明细表和结构化结果一起准备好，方便不同同学直接拿去用。',
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
    schedule(ARCHIVE_DONE, () => completeNode(n8));
  }

  schedule(SUMMARY_START, () => {
    if (isProductLiveScenario) return;
    hideWaitLine();
    setResult(`
      <p>这批客户反馈一共 <strong>1,247</strong> 条，我已经按问题类型、满意度和客户影响范围做了一轮整理。整体满意度均值为 <strong>3.6</strong>（满分 5），低于上季度的 3.9。原始数据来自 <a class="file-link xlsx" onclick="openPreview('xlsx','客户反馈明细.xlsx')">客户反馈明细.xlsx</a>${citation('客户反馈明细.xlsx · 原始反馈表', 1)}。</p>
      <p>主要问题集中在 <strong>3 类</strong>：<strong>物流配送</strong>占比最高（42%），其次是 <strong>客户服务</strong>（28%）和 <strong>产品质量</strong>（18%）。我建议先把物流链路放到第一优先级，因为它占比最高、影响面也最大${citation('反馈分类结果.xlsx · Agent 清洗结果', 2)}。</p>
      <div class="inline-img" data-caption="图 1 · 反馈类型分布">📊 反馈类型分布饼图</div>
      <p>我又补了一层复核：物流问题里，延迟交付和包装破损是主因；客服问题主要集中在响应慢和处理口径不一致；产品质量问题更多来自外观瑕疵和功能体验。这个拆解可以直接放到汇报的“问题原因”页里${citation('analysis_result.json · 分类明细', 3)}。</p>
      <div class="img-grid">
        <div class="inline-img" data-caption="图 2 · 满意度趋势">📈 满意度趋势</div>
        <div class="inline-img" data-caption="图 3 · Top 客户">🏆 Top 客户</div>
        <div class="inline-img" data-caption="图 4 · 投诉热点">📉 投诉热点</div>
      </div>
      <p>行动建议上，我建议优先推进物流端的改造，先压配送延迟和包装破损，预计能给整体满意度带来约 <strong>+0.4</strong> 的提升。汇报材料我已经整理成 <a class="file-link pptx" onclick="openPreview('pptx','客户反馈分析汇报.pptx')">客户反馈分析汇报.pptx</a>；同时也导出了 <a class="file-link docx" onclick="openPreview('docx','反馈分析报告.docx')">Word</a> / <a class="file-link pdf" onclick="openPreview('pdf','反馈分析报告.pdf')">PDF</a> 给管理层，<a class="file-link xlsx" onclick="openPreview('xlsx','反馈分类结果.xlsx')">XLSX</a> / <a class="file-link csv" onclick="openPreview('csv','反馈分类明细.csv')">CSV</a> / <a class="file-link json" onclick="openPreview('json','analysis_result.json')">JSON</a> 给数据团队，全部产物也打包在 <a class="file-link zip" onclick="openPreview('zip','完整交付包.zip')">完整交付包.zip</a> 里。</p>
      <p>如果您愿意，我下一步可以继续帮您把这份 PPT 调成“经营会汇报风格”，或者补一版“老板只看 3 页”的精简版。</p>
    `, { isFinal: true });
  });

  schedule(GENUI_START, () => { if (!isProductLiveScenario) showLeadPill('我再补一张可交互看板，方便您快速查看分布', 1200); });
  schedule(GENUI_RENDER, () => { if (!isProductLiveScenario) renderInScenarioGenUI(); });

  schedule(FINAL_OUTPUTS - 1100, () => { if (!isProductLiveScenario) showLeadPill('我把这次会话的产物集中放到右侧，方便您直接取用', 1100); });
  schedule(FINAL_OUTPUTS, () => {
    if (!isProductLiveScenario) {
      const finalItems = [
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
      ];
      renderOutputs(finalItems).then(() => notifyOutputTabUpdate(finalItems.length));
    }
  });

  if (isProductLiveScenario) {
    schedule(GENUI_START, () => showLeadPill('我再补一张可交互看板，方便您快速查看分布', 1200));
    schedule(GENUI_RENDER, () => renderInScenarioGenUI());
    schedule(SUMMARY_START, () => {
      hideWaitLine();
      setResult(`
        <p>这批客户反馈一共 <strong>1,247</strong> 条，我已经按问题类型、满意度和客户影响范围做了一轮整理。整体满意度均值为 <strong>3.6</strong>（满分 5），低于上季度的 3.9。原始数据来自 <a class="file-link xlsx" onclick="openPreview('xlsx','客户反馈明细.xlsx')">客户反馈明细.xlsx</a>${citation('客户反馈明细.xlsx · 原始反馈表', 1)}。</p>
        <p>主要问题集中在 <strong>3 类</strong>：<strong>物流配送</strong>占比最高（42%），其次是 <strong>客户服务</strong>（28%）和 <strong>产品质量</strong>（18%）。我建议先把物流链路放到第一优先级，因为它占比最高、影响面也最大${citation('反馈分类结果.xlsx · Agent 清洗结果', 2)}。</p>
        <div class="inline-img" data-caption="图 1 · 反馈类型分布">📊 反馈类型分布饼图</div>
        <p>我已经把汇报材料整理成 <a class="file-link pptx" onclick="openPreview('pptx','客户反馈分析汇报.pptx')">客户反馈分析汇报.pptx</a>，并同步准备了 <a class="file-link docx" onclick="openPreview('docx','反馈分析报告.docx')">Word</a> / <a class="file-link pdf" onclick="openPreview('pdf','反馈分析报告.pdf')">PDF</a>、<a class="file-link xlsx" onclick="openPreview('xlsx','反馈分类结果.xlsx')">XLSX</a> / <a class="file-link csv" onclick="openPreview('csv','反馈分类明细.csv')">CSV</a> / <a class="file-link json" onclick="openPreview('json','analysis_result.json')">JSON</a>，您可以直接点开右侧会话文件区域预览。</p>
      `, { isFinal: true });
    });
    if (isPptOnlyScenario) {
      schedule(FINAL_OUTPUTS, () => {
        const finalItems = [
          { type: 'pptx', name: '客户反馈分析汇报.pptx', sub: '2.4 MB · 8 页', onClick: () => openPreview('pptx', '客户反馈分析汇报.pptx') }
        ];
        renderOutputs(finalItems, {
          titleText: `<span class="count">1</span> 个产物`,
          animate: false
        }).then(() => notifyOutputTabUpdate(finalItems.length));
      });
    } else {
      schedule(ARCHIVE_START, () => renderLiveOutputsStage('archive-start'));
      schedule(FINAL_OUTPUTS, () => {
        const finalItems = [
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
        ];
        renderOutputs(finalItems, {
          titleText: `<span class="count">11</span> 个产物`,
          animate: false
        }).then(() => notifyOutputTabUpdate(finalItems.length));
      });
    }
  }

  schedule(SCENARIO_DONE, () => {
    foldPanelWithSummary(55);
    $('finalActions').classList.remove('is-hidden');
    renderFilePanel();
    scrollToBottom();
  });
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
        <span class="agent-avatar">${avatarImg('smart-data-agent', '智能问数')}</span>
        <span class="agent-name">${conversationConfigs[currentConversationType]?.agentName || 'Dora'}</span>
      </div>
      <div style="font-size:14px;color:var(--neutral-11);">根据上轮分析结果，为您渲染交互式分布卡片：</div>
      <div class="genui-slot is-visible">
        <div class="genui-header">客户反馈问题分布</div>
        <iframe class="genui-frame" sandbox="allow-same-origin" scrolling="no"></iframe>
      </div>
    </div>`;
  const iframe = wrap.querySelector('iframe');
  iframe.srcdoc = GENUI_DASHBOARD_SRC;
  iframe.addEventListener('load', () => resizeGenUIFrame(iframe));
  $('extraReplies').appendChild(wrap);
  scrollToBottom();
}

function handleSend() {
  const input = $('conversationInput');
  const text = input.value.trim();
  const refRow = $('conversationSenderFiles');
  const references = Array.from(refRow?.querySelectorAll('.sender-ref-token') || []).map(token => token.dataset.refName || token.textContent.trim());
  const hasReference = references.length > 0;
  if (!text && !hasReference) return;
  const messageText = text || '请帮我分析引用的文件';
  input.value = '';
  if (refRow) {
    refRow.innerHTML = '';
    refRow.classList.remove('has-file');
  }
  $('conversationSendBtn').classList.remove('is-active');
  if (/genui/i.test(messageText)) {
    appendGenUIReply(messageText);
  } else {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:8px;';
    const refHtml = references.length
      ? `<div class="sent-ref-row">${references.map(name => `<span class="sent-ref-token">@${name}</span>`).join('')}</div>`
      : '';
    wrap.innerHTML = `
      <div class="msg-user">${refHtml}<div class="bubble">${messageText}</div></div>
      <div class="agent-row" style="margin-top:8px;">
        <span class="agent-avatar">${avatarImg(currentConversationType === 'dora' ? 'dora-session' : `${currentConversationType}-agent`, conversationConfigs[currentConversationType]?.agentName || 'Dora')}</span>
        <span class="agent-name">${conversationConfigs[currentConversationType]?.agentName || 'Dora'}</span>
      </div>
      <div style="font-size:14px;color:var(--neutral-11);">（演示原型，当前仅支持重播剧本和引用会话文件；正式对话需接入后端）</div>`;
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
      setFilesPanelTab(tab.dataset.tab);
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
  if (scenarioGuideOpen && !event.target.closest('.scenario-guide-panel') && !event.target.closest('.v-demo-toggle')) closeScenarioGuide();
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
  if (!event.target.closest('.library-popconfirm') && !event.target.closest('.library-state-btn')) closeLibraryPopconfirm();
  if (!event.target.closest('.share-popover') && !event.target.closest('[title="分享"]')) closeSharePopover();
  if (!event.target.closest('.prompt-reuse-popconfirm') && !event.target.closest('[title="复用 Prompt"]')) closePromptReusePopconfirm();
});

// 会话页输入框：input/keydown 绑定
const conversationInputEl = $('conversationInput');
if (conversationInputEl) {
  conversationInputEl.addEventListener('input', e => {
    syncConversationSendState();
  });
  conversationInputEl.addEventListener('keydown', e => {
    const row = $('conversationSenderFiles');
    if ((e.key === 'Backspace' || e.key === 'Delete') && !e.target.value && row?.lastElementChild?.classList.contains('sender-ref-token')) {
      row.lastElementChild.remove();
      row.classList.toggle('has-file', Boolean(row.children.length));
      syncConversationSendState();
      e.preventDefault();
      return;
    }
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

  // 初始化资源库 mock 资产
  renderAssetLibrary();
  syncAssetDetailPage('html');
  hydrateLetterAvatars();

  // 渲染文件列表
  renderFilePanel();

  // 绑定 B 的 Tab 切换
  bindFilesTabClicks();
  setFilesPanelTab('input');

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
