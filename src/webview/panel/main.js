// VS Code API
const vscode = acquireVsCodeApi();

// State
let commits = [];
let selectedCommits = new Set();
let currentDiff = '';
let currentDiffType = 'unified'; // 'unified' or 'side-by-side'
let searchQuery = '';
let showGraph = true;
let selectedFile = null;
let currentCommitHash = null;
let trackedFilePath = null;
let expandedMessages = new Set(); // Track which commit messages are expanded
let focusedIndex = -1; // Keyboard focus index for commit list navigation
let sortMode = 0; // 0=newest first, 1=oldest first, 2=author A-Z, 3=author Z-A
let currentBranch = null; // Current git branch name
let hideMergeCommits = false; // Filter out merge commits (commits with multiple parents)
let wordWrapEnabled = false; // Word wrap toggle for diff view
let rangeSelectionAnchor = null; // Anchor commit for Shift+click range selection
let rangeSelectionTarget = null; // Target commit for Shift+click range selection
let regexSearchEnabled = false; // Regex search mode toggle
let branches = []; // All available branches from init message
let branchCommitHashes = {}; // Map: branchName -> Set of commit hashes
let currentUser = null; // Current git user from git config
let showMyCommitsOnly = false; // Filter to show only my commits
let ignoreWhitespace = false; // Ignore whitespace in diffs
let diffContextLines = 3; // Number of context lines in diffs (1-10)
let commitFilesMap = new Map(); // hash -> CommitFileChange[]
let firstRunTipVisible = false; // First-run tip banner visibility state
let savedPresets = []; // Saved filter presets
let presetDropdownVisible = false; // Preset dropdown visibility state

/**
 * Parse filters from search query
 * Supports: after:YYYY-MM-DD, before:YYYY-MM-DD, last:Ndays/weeks/months, author:name
 * @param {string} query - The search query
 * @returns {{textQuery: string, dateFilters: {after?: Date, before?: Date}, authorFilter: string|null}}
 */
function parseDateFilter(query) {
  const dateFilters = {};
  let textQuery = query;

  const authorMatch = query.match(/author:([^\s]+)/i);
  const authorFilter = authorMatch ? authorMatch[1].toLowerCase() : null;
  if (authorMatch) {
    textQuery = textQuery.replace(authorMatch[0], '').trim();
  }

  const tagMatch = query.match(/tag:([^\s]+)/i);
  const tagFilter = tagMatch ? tagMatch[1].toLowerCase() : null;
  if (tagMatch) {
    textQuery = textQuery.replace(tagMatch[0], '').trim();
  }

  const branchMatch = query.match(/branch:([^\s]+)/i);
  const branchFilter = branchMatch ? branchMatch[1].toLowerCase() : null;
  if (branchMatch) {
    textQuery = textQuery.replace(branchMatch[0], '').trim();
  }

  const pathMatch = query.match(/path:([^\s]+)/i);
  const pathFilter = pathMatch ? pathMatch[1].toLowerCase() : null;
  if (pathMatch) {
    textQuery = textQuery.replace(pathMatch[0], '').trim();
  }

  // Parse after:YYYY-MM-DD or after:YYYY/MM/DD
  const afterMatch = query.match(/after:([^\s]+)/i);
  if (afterMatch) {
    const dateStr = afterMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.after = date;
    }
    textQuery = textQuery.replace(afterMatch[0], '').trim();
  }

  // Parse before:YYYY-MM-DD or before:YYYY/MM/DD
  const beforeMatch = query.match(/before:([^\s]+)/i);
  if (beforeMatch) {
    const dateStr = beforeMatch[1];
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateFilters.before = date;
    }
    textQuery = textQuery.replace(beforeMatch[0], '').trim();
  }

  // Parse last:Ndays/weeks/months (case-insensitive, singular/plural)
  const lastMatch = query.match(/last:(\d+)\s*(day|days|week|weeks|month|months)/i);
  if (lastMatch) {
    const num = parseInt(lastMatch[1], 10);
    const unit = lastMatch[2].toLowerCase();
    const now = new Date();
    const after = new Date(now);

    if (unit === 'day' || unit === 'days') {
      after.setDate(now.getDate() - num);
    } else if (unit === 'week' || unit === 'weeks') {
      after.setDate(now.getDate() - (num * 7));
    } else if (unit === 'month' || unit === 'months') {
      after.setMonth(now.getMonth() - num);
    }

    dateFilters.after = after;
    textQuery = textQuery.replace(lastMatch[0], '').trim();
  }

  const lastFilter = lastMatch ? lastMatch[0] : null;
  return { textQuery: textQuery.trim(), dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, lastFilter };
}

/**
 * Check if any filters are active (includes search query, date filters, author/tag/branch/path filters, merge commits toggle, my commits toggle)
 * @returns {boolean}
 */
function hasActiveFilters() {
  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter } = parseDateFilter(searchQuery);
  return !!(searchQuery || dateFilters.after || dateFilters.before || authorFilter || tagFilter || branchFilter || pathFilter || showMyCommitsOnly || hideMergeCommits || regexSearchEnabled);
}

function hasActiveDateFilters() {
  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter } = parseDateFilter(searchQuery);
  return !!(dateFilters.after || dateFilters.before || authorFilter || tagFilter || branchFilter || pathFilter);
}

/**
 * Update Clear All button visibility and reset all filters
 */
function updateClearAllButton() {
  const hasFilters = hasActiveFilters();
  if (clearAllFiltersBtn) {
    if (hasFilters) {
      clearAllFiltersBtn.classList.add('visible');
    } else {
      clearAllFiltersBtn.classList.remove('visible');
    }
  }
}

function clearAllFilters() {
  searchQuery = '';
  hideMergeCommits = false;
  regexSearchEnabled = false;
  showMyCommitsOnly = false;

  // Update UI elements
  searchInput.value = '';
  mergeToggleBtn.classList.remove('active');
  regexToggleBtn.classList.remove('active');
  myCommitsBtn.classList.remove('active');

  // Render commits with no filters
  renderCommits();

  // Update badges and clear all button
  renderFilterBadges();
  updateClearAllButton();

  // Save settings
  saveSettings();
}

/**
 * Render active date filter badges below search input
 */
function renderFilterBadges() {
  const existingBadges = document.querySelector('.filter-badges');
  if (existingBadges) {
    existingBadges.remove();
  }

  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, lastFilter } = parseDateFilter(searchQuery);
  const hasDateFilters = !!(dateFilters.after || dateFilters.before);
  const hasFilters = hasDateFilters || authorFilter || tagFilter || branchFilter || pathFilter || lastFilter;

  if (!hasFilters) {
    return;
  }

  const searchContainer = document.querySelector('.search-container');
  if (!searchContainer) {
    return;
  }

  const badgesContainer = document.createElement('div');
  badgesContainer.className = 'filter-badges';

  const formatDate = (date) => {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (authorFilter) {
    const authorBadge = document.createElement('span');
    authorBadge.className = 'filter-badge';
    authorBadge.innerHTML = `author: ${escapeHtml(authorFilter)} <span class="filter-badge-clear" data-filter="author">&times;</span>`;
    badgesContainer.appendChild(authorBadge);
  }

  if (tagFilter) {
    const tagBadge = document.createElement('span');
    tagBadge.className = 'filter-badge';
    tagBadge.innerHTML = `tag: ${escapeHtml(tagFilter)} <span class="filter-badge-clear" data-filter="tag">&times;</span>`;
    badgesContainer.appendChild(tagBadge);
  }

  if (branchFilter) {
    const branchBadge = document.createElement('span');
    branchBadge.className = 'filter-badge';
    branchBadge.innerHTML = `branch: ${escapeHtml(branchFilter)} <span class="filter-badge-clear" data-filter="branch">&times;</span>`;
    badgesContainer.appendChild(branchBadge);
  }

  if (pathFilter) {
    const pathBadge = document.createElement('span');
    pathBadge.className = 'filter-badge';
    pathBadge.innerHTML = `path: ${escapeHtml(pathFilter)} <span class="filter-badge-clear" data-filter="path">&times;</span>`;
    badgesContainer.appendChild(pathBadge);
  }

  if (lastFilter) {
    const lastBadge = document.createElement('span');
    lastBadge.className = 'filter-badge';
    lastBadge.innerHTML = `${escapeHtml(lastFilter)} <span class="filter-badge-clear" data-filter="last">&times;</span>`;
    badgesContainer.appendChild(lastBadge);
  } else if (dateFilters.after) {
    const afterBadge = document.createElement('span');
    afterBadge.className = 'filter-badge';
    afterBadge.innerHTML = `after: ${formatDate(dateFilters.after)} <span class="filter-badge-clear" data-filter="after">&times;</span>`;
    badgesContainer.appendChild(afterBadge);
  }

  if (dateFilters.before) {
    const beforeBadge = document.createElement('span');
    beforeBadge.className = 'filter-badge';
    beforeBadge.innerHTML = `before: ${formatDate(dateFilters.before)} <span class="filter-badge-clear" data-filter="before">&times;</span>`;
    badgesContainer.appendChild(beforeBadge);
  }

  // Insert after search container
  searchContainer.parentNode.insertBefore(badgesContainer, searchContainer.nextSibling);

  // Add click handlers for clear buttons
  badgesContainer.querySelectorAll('.filter-badge-clear').forEach(btn => {
    btn.addEventListener('click', () => {
      const filterToRemove = btn.dataset.filter;
      let newQuery = searchQuery;

      if (filterToRemove === 'after') {
        newQuery = newQuery.replace(/after:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'before') {
        newQuery = newQuery.replace(/before:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'author') {
        newQuery = newQuery.replace(/author:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'tag') {
        newQuery = newQuery.replace(/tag:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'branch') {
        newQuery = newQuery.replace(/branch:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'path') {
        newQuery = newQuery.replace(/path:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'last') {
        newQuery = newQuery.replace(/last:\d+\s*(day|days|week|weeks|month|months)/i, '').trim();
      }

      searchInput.value = newQuery;
      searchQuery = newQuery;
      focusedIndex = -1;
      renderCommits();
      updateCommitCount();
      renderFilterBadges();
    });
  });
}

// Graph rendering constants
const GRAPH_COLORS = ['#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#ce9178', '#4fc1ff', '#d16969', '#b5cea8'];
const LANE_W = 14;  // pixels per lane column
const ROW_H = 28;   // row height in pixels
const NODE_R = 4;   // commit node circle radius

// DOM Elements
const diffViewer = document.getElementById('diff-viewer');
const commitList = document.getElementById('commit-list');
const unifiedBtn = document.getElementById('unified-btn');
const sideBySideBtn = document.getElementById('side-by-side-btn');
const fileList = document.getElementById('file-list');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const sortBtn = document.getElementById('sort-btn');
const copyBtn = document.getElementById('copy-btn');
const compareParentBtn = document.getElementById('compare-parent-btn');
const wordWrapBtn = document.getElementById('word-wrap-btn');
const ignoreWsBtn = document.getElementById('ignore-ws-btn');
const contextLinesBtn = document.getElementById('context-lines-btn');
const mergeToggleBtn = document.getElementById('merge-toggle-btn');
const regexToggleBtn = document.getElementById('regex-toggle-btn');
const exportBtn = document.getElementById('export-btn');
const myCommitsBtn = document.getElementById('my-commits-btn');
const commitCountEl = document.getElementById('commit-count');
const copyFilterQueryBtn = document.getElementById('copy-filter-query-btn');
const pasteFilterQueryBtn = document.getElementById('paste-filter-query-btn');
const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
const savePresetBtn = document.getElementById('save-preset-btn');
const presetDropdownBtn = document.getElementById('preset-dropdown-btn');
const graphToggleBtn = document.getElementById('graph-toggle-btn');

let isRefreshing = false;

/**
 * Render a single commit row's graph cell as an inline SVG string.
 * @param {object} cell - Layout cell from computeGraphLayout
 * @param {number} totalCols - Total number of lane columns (for SVG width)
 * @returns {string} Inline SVG markup
 */
function renderGraphSvg(cell, totalCols) {
  const width = Math.max(totalCols * LANE_W, LANE_W);
  const cy = ROW_H / 2;

  const paths = [];

  for (let i = 0; i < cell.segments.length; i++) {
    const seg = cell.segments[i];
    const color = GRAPH_COLORS[seg.color % GRAPH_COLORS.length];

    if (seg.type === 'vertical') {
      const x = seg.col * LANE_W + LANE_W / 2;
      paths.push(`<line x1="${x}" y1="0" x2="${x}" y2="${ROW_H}" stroke="${color}" stroke-width="2"/>`);
    } else if (seg.type === 'top-half') {
      const x = seg.col * LANE_W + LANE_W / 2;
      paths.push(`<line x1="${x}" y1="0" x2="${x}" y2="${cy}" stroke="${color}" stroke-width="2"/>`);
    } else if (seg.type === 'bottom-half') {
      const x = seg.col * LANE_W + LANE_W / 2;
      paths.push(`<line x1="${x}" y1="${cy}" x2="${x}" y2="${ROW_H}" stroke="${color}" stroke-width="2"/>`);
    } else if (seg.type === 'merge') {
      const fromX = seg.fromCol * LANE_W + LANE_W / 2;
      const toX = seg.toCol * LANE_W + LANE_W / 2;
      paths.push(`<path d="M ${fromX} ${cy} C ${fromX} ${ROW_H} ${toX} ${cy} ${toX} ${ROW_H}" stroke="${color}" stroke-width="2" fill="none"/>`);
    }
  }

  // Draw commit node circle on top of lines
  const cx = cell.nodeCol * LANE_W + LANE_W / 2;
  const nodeColor = GRAPH_COLORS[cell.nodeColor % GRAPH_COLORS.length];
  paths.push(`<circle cx="${cx}" cy="${cy}" r="${NODE_R}" fill="${nodeColor}"/>`);

  // height/width are set via CSS (100% of the td); the viewBox uses ROW_H so coordinates stay stable.
  // overflow: visible lets vertical lines extend into the td's padding area, closing the gap between rows.
  return `<svg style="display:block;width:${width}px;height:100%;overflow:visible;" viewBox="0 0 ${width} ${ROW_H}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">${paths.join('')}</svg>`;
}

// ─── Author avatar helpers ───────────────────────────────────────────────────

function getAuthorColor(author) {
  let hash = 0;
  for (let i = 0; i < author.length; i++) {
    hash = author.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRAPH_COLORS[Math.abs(hash) % GRAPH_COLORS.length];
}

function getAuthorInitials(author) {
  const parts = author.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return author.substring(0, 2).toUpperCase();
}

// ─── Keyboard Navigation ───────────────────────────────────────────────────

function handleKeyDown(e) {
  // Ctrl+Shift+R: Refresh
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
    e.preventDefault();
    handleRefresh();
    return;
  }

  // Ctrl+Shift+C: Copy commit message
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'c') {
    e.preventDefault();
    handleCopyMessage();
    return;
  }

  // Ctrl+Shift+H: Copy commit hash
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
    e.preventDefault();
    handleCopyHash();
    return;
  }

  // Ctrl+Shift+I: Copy full commit info
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'i') {
    e.preventDefault();
    handleCopyInfo();
    return;
  }

  // Ctrl+Shift+P: Copy cherry-pick command
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
    e.preventDefault();
    handleCopyCherryPick();
    return;
  }

  // Ctrl+Shift+U: Copy revert command
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && e.key === 'u') {
    e.preventDefault();
    handleCopyRevert();
    return;
  }

  // Ctrl+Alt+Shift+U: Copy file URL
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.shiftKey && e.key === 'u') {
    e.preventDefault();
    handleCopyFileUrl();
    return;
  }

  // Ctrl+Shift+F: Copy changed files list
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
    e.preventDefault();
    handleCopyFiles();
    return;
  }

  // Ctrl+Shift+D: Copy commit diff
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'd') {
    e.preventDefault();
    handleCopyDiff();
    return;
  }

  // Ctrl+Alt+D: Copy combined diff (multi-select)
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'd') {
    e.preventDefault();
    handleCopyCombinedDiff();
    return;
  }

  // Ctrl+Alt+R: Copy range diff
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'r') {
    e.preventDefault();
    handleCopyRangeDiff();
    return;
  }

  // Ctrl+Shift+E: Copy commit as patch
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'e') {
    e.preventDefault();
    handleCopyPatch();
    return;
  }

  // Ctrl+Alt+Q: Clear all filters
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'q') {
    e.preventDefault();
    clearAllFilters();
    return;
  }

  // Ctrl+Alt+G: Copy git describe
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'g') {
    e.preventDefault();
    handleCopyDescribe();
    return;
  }

  // Ctrl+Alt+B: Copy branch name
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'b') {
    e.preventDefault();
    handleCopyBranchName();
    return;
  }

  // Ctrl+Shift+A: Copy author email
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'a') {
    e.preventDefault();
    handleCopyAuthorEmail();
    return;
  }

  // Ctrl+Shift+N: Copy author name
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'n') {
    e.preventDefault();
    handleCopyAuthorName();
    return;
  }

  // Ctrl+Shift+V: Copy parent hash
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'v') {
    e.preventDefault();
    handleCopyParentHash();
    return;
  }

  // Ctrl+Shift+7: Copy short hash
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '7') {
    e.preventDefault();
    handleCopyShortHash();
    return;
  }

  // Ctrl+Shift+6: Copy subject
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '6') {
    e.preventDefault();
    handleCopySubject();
    return;
  }

  // Ctrl+Shift+9: Copy diff stat summary
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '9') {
    e.preventDefault();
    handleCopyDiffStatSummary();
    return;
  }

  // Ctrl+Shift+K: Copy co-authors
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'k') {
    e.preventDefault();
    handleCopyCoAuthors();
    return;
  }

  // Ctrl+Shift+T: Copy commit date
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 't') {
    e.preventDefault();
    handleCopyCommitDate();
    return;
  }

  // Ctrl+Shift+8: Copy relative date
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '8') {
    e.preventDefault();
    handleCopyRelativeDate();
    return;
  }

  // Ctrl+Shift+Y: Copy as oneline
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'y') {
    e.preventDefault();
    handleCopyOneline();
    return;
  }

  // Ctrl+Shift+Z: Copy commit body
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
    e.preventDefault();
    handleCopyCommitBody();
    return;
  }

  // Ctrl+Shift+;: Copy selected hashes
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ';') {
    e.preventDefault();
    handleCopySelectedHashes();
    return;
  }

  // Ctrl+Shift+S: Copy commit stats
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 's') {
    e.preventDefault();
    handleCopyStats();
    return;
  }

  // Ctrl+Shift+O: Export filtered commits
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'o') {
    e.preventDefault();
    handleExportCommits();
    return;
  }

  // Ctrl+Shift+5: Copy filter query
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '5') {
    e.preventDefault();
    handleCopyFilterQuery();
    return;
  }

  // Ctrl+Shift+L: Copy commit URL
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
    e.preventDefault();
    handleCopyUrl();
    return;
  }

  // Ctrl+Shift+@: Copy as platform mention
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '@') {
    e.preventDefault();
    handleCopyMention();
    return;
  }

  // Ctrl+Shift+]: Copy commit reference
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === ']') {
    e.preventDefault();
    handleCopyRef();
    return;
  }

  // Ctrl+Alt+P: Quick compare with parent
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'p') {
    e.preventDefault();
    handleQuickCompare();
    return;
  }

  // Ctrl+Alt+S: Show branch picker
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 's') {
    e.preventDefault();
    if (_allBranches.length > 0) {
      showBranchPickerDialog();
    }
    return;
  }

  // Ctrl+Alt+M: Copy as Markdown
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'm') {
    e.preventDefault();
    handleCopyMarkdown();
    return;
  }

  // Ctrl+Alt+J: Copy as JSON
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'j') {
    e.preventDefault();
    handleCopyJson();
    return;
  }

  // Ctrl+Alt+O: Copy remote URL
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'o') {
    e.preventDefault();
    handleCopyRemoteUrl();
    return;
  }

  // Ctrl+Shift+M: Toggle my commits filter
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'm') {
    e.preventDefault();
    handleMyCommitsToggle();
    return;
  }

  // Ctrl+Shift+W: Toggle word wrap
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'w') {
    e.preventDefault();
    handleWordWrapToggle();
    return;
  }

  // Ctrl+Shift+X: Toggle regex search mode
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'x') {
    e.preventDefault();
    handleRegexToggle();
    return;
  }

  // Ctrl+Shift+J: Toggle ignore whitespace
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'j') {
    e.preventDefault();
    handleIgnoreWhitespaceToggle();
    return;
  }

  // Ctrl+Shift+/: Cycle diff context lines
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === '/' || e.key === '?')) {
    e.preventDefault();
    handleDiffContextLinesCycle();
    return;
  }

  // Ctrl+Shift+Q: Toggle hide merge commits
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'q') {
    e.preventDefault();
    handleMergeToggle();
    return;
  }

  // / or Ctrl+F: Focus search
  if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'f')) {
    e.preventDefault();
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
    return;
  }

  // ?: Show keyboard help
  if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault();
    showKeyboardHelpDialog();
    return;
  }

  // Ctrl+Shift+G or Cmd+Shift+G: Copy tags
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'g') {
    e.preventDefault();
    handleCopyTags();
    return;
  }

  // Ctrl+G or Cmd+G: Jump to hash
  if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
    e.preventDefault();
    showJumpToHashDialog();
    return;
  }

  // Escape: Clear selection and focus
  if (e.key === 'Escape') {
    e.preventDefault();
    clearSelection();
    focusedIndex = -1;
    updateFocusedRow();
    if (document.activeElement === searchInput) {
      searchInput.blur();
    }
    return;
  }

  // Ctrl+A or Cmd+A: Select all visible commits
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
    e.preventDefault();
    handleSelectAll();
    return;
  }

  // Only handle arrow keys and Enter if not in an input
  if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
    return;
  }

  const filteredCommits = getFilteredCommits();
  if (filteredCommits.length === 0) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (focusedIndex < filteredCommits.length - 1) {
        focusedIndex++;
      } else {
        focusedIndex = 0; // Wrap to top
      }
      updateFocusedRow();
      scrollFocusedIntoView();
      break;

    case 'ArrowUp':
      e.preventDefault();
      if (focusedIndex > 0) {
        focusedIndex--;
      } else {
        focusedIndex = filteredCommits.length - 1; // Wrap to bottom
      }
      updateFocusedRow();
      scrollFocusedIntoView();
      break;

    case 'Home':
      e.preventDefault();
      focusedIndex = 0;
      updateFocusedRow();
      scrollFocusedIntoView();
      break;

    case 'End':
      e.preventDefault();
      focusedIndex = filteredCommits.length - 1;
      updateFocusedRow();
      scrollFocusedIntoView();
      break;

    case 'Enter':
      e.preventDefault();
      if (focusedIndex >= 0 && focusedIndex < filteredCommits.length) {
        const commit = filteredCommits[focusedIndex];
        if (e.shiftKey && rangeSelectionAnchor && rangeSelectionAnchor !== commit.hash) {
          // Shift+Enter: Select range between anchor and focused commit
          handleRangeSelection(rangeSelectionAnchor, commit.hash);
        } else if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Enter: Toggle multi-select
          if (selectedCommits.has(commit.hash)) {
            selectedCommits.delete(commit.hash);
            if (selectedCommits.size === 0) {
              rangeSelectionAnchor = null;
              rangeSelectionTarget = null;
            }
          } else {
            selectedCommits.add(commit.hash);
            rangeSelectionAnchor = commit.hash;
          }
          updateSelectedRows();
          if (selectedCommits.size > 1) {
            requestCombinedDiff();
          } else if (selectedCommits.size === 1) {
            requestDiff([...selectedCommits][0]);
          }
        } else {
          // Enter: Select commit, set as anchor
          clearSelection();
          selectCommit(commit.hash);
          rangeSelectionAnchor = commit.hash;
        }
      }
      break;
  }
}

function getFilteredCommits() {
  let filtered = commits;

  // Filter out merge commits if enabled
  if (hideMergeCommits) {
    filtered = filtered.filter(commit => !(commit.parentHashes && commit.parentHashes.length > 1));
  }

  // Filter to show only my commits if enabled
  if (showMyCommitsOnly && currentUser) {
    filtered = filtered.filter(commit =>
      commit.email.toLowerCase() === currentUser.email.toLowerCase() ||
      commit.author.toLowerCase() === currentUser.name.toLowerCase()
    );
  }

  // Parse date filters and get remaining text query
  const { textQuery, dateFilters, authorFilter, tagFilter, branchFilter, pathFilter } = parseDateFilter(searchQuery);

  // Apply author filter
  if (authorFilter) {
    filtered = filtered.filter(commit =>
      commit.author.toLowerCase().includes(authorFilter) ||
      commit.email.toLowerCase().includes(authorFilter)
    );
  }

  if (tagFilter) {
    filtered = filtered.filter(commit =>
      commit.tags && commit.tags.some(t => t.toLowerCase().includes(tagFilter))
    );
  }

  // Apply branch filter
  if (branchFilter) {
    filtered = filtered.filter(commit => {
      const branchHashes = branchCommitHashes[branchFilter];
      return branchHashes && branchHashes.has(commit.hash);
    });
  }

  // Apply path filter - requires fetching commit files
  if (pathFilter) {
    filtered = filtered.filter(commit => {
      const files = commitFilesMap.get(commit.hash);
      if (!files) {
        // Request files for this commit if not cached
        vscode.postMessage({ type: 'requestCommitFiles', hash: commit.hash });
        return false;
      }
      return files.some(f => f.path.toLowerCase().includes(pathFilter));
    });
  }

  // Apply date filters
  if (dateFilters.after) {
    const afterMs = dateFilters.after.getTime();
    filtered = filtered.filter(commit => new Date(commit.date).getTime() >= afterMs);
  }

  if (dateFilters.before) {
    const beforeMs = dateFilters.before.getTime();
    filtered = filtered.filter(commit => new Date(commit.date).getTime() <= beforeMs);
  }

  // Apply text search query filter (using textQuery which has date filters removed)
  if (textQuery) {
    filtered = filtered.filter(commit =>
      isRegexMatch(commit.hash, textQuery) ||
      isRegexMatch(commit.shortHash, textQuery) ||
      isRegexMatch(commit.author, textQuery) ||
      isRegexMatch(commit.email, textQuery) ||
      isRegexMatch(commit.fullMessage, textQuery) ||
      (commit.tags && commit.tags.some(t => isRegexMatch(t, textQuery)))
    );
  }

  return filtered;
}

function getOrderedCommits(filteredCommits) {
  const sorted = filteredCommits.slice();
  switch (sortMode) {
    case 0: return sorted;           // newest first (default)
    case 1: return sorted.reverse(); // oldest first
    case 2: return sorted.sort((a, b) => a.author.localeCompare(b.author));   // author A-Z
    case 3: return sorted.sort((a, b) => b.author.localeCompare(a.author));   // author Z-A
  }
  return sorted;
}

function updateSortButton() {
  if (!sortBtn) return;
  switch (sortMode) {
    case 0:
      sortBtn.innerHTML = '&#x2193; Newest';
      sortBtn.title = 'Sort: Newest first (click to cycle)';
      sortBtn.classList.remove('sort-active');
      break;
    case 1:
      sortBtn.innerHTML = '&#x2191; Oldest';
      sortBtn.title = 'Sort: Oldest first (click to cycle)';
      sortBtn.classList.add('sort-active');
      break;
    case 2:
      sortBtn.innerHTML = 'A&#x2192;Z Author';
      sortBtn.title = 'Sort: Author A-Z (click to cycle)';
      sortBtn.classList.add('sort-active');
      break;
    case 3:
      sortBtn.innerHTML = 'Z&#x2192;A Author';
      sortBtn.title = 'Sort: Author Z-A (click to cycle)';
      sortBtn.classList.add('sort-active');
      break;
  }
}

function handleSortToggle() {
  sortMode = (sortMode + 1) % 4;
  updateSortButton();
  const graphTh = document.querySelector('th.graph-col');
  if (graphTh) { graphTh.style.display = (showGraph && sortMode < 2) ? '' : 'none'; }
  focusedIndex = -1;
  renderCommits();

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { sortMode } });
}

function handleMergeToggle() {
  hideMergeCommits = !hideMergeCommits;
  if (mergeToggleBtn) {
    if (hideMergeCommits) {
      mergeToggleBtn.classList.add('active');
      mergeToggleBtn.title = 'Merge commits hidden (click to show)';
    } else {
      mergeToggleBtn.classList.remove('active');
      mergeToggleBtn.title = 'Hide merge commits';
    }
  }
  focusedIndex = -1;
  renderCommits();
  updateCommitCount();
  updateClearAllButton();

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { hideMergeCommits } });
}

function handleWordWrapToggle() {
  wordWrapEnabled = !wordWrapEnabled;
  const diffViewer = document.getElementById('diff-viewer');
  if (diffViewer) {
    if (wordWrapEnabled) {
      diffViewer.classList.add('word-wrap');
      if (wordWrapBtn) {
        wordWrapBtn.classList.add('active');
        wordWrapBtn.title = 'Word wrap enabled (Ctrl+Shift+W to toggle)';
      }
    } else {
      diffViewer.classList.remove('word-wrap');
      if (wordWrapBtn) {
        wordWrapBtn.classList.remove('active');
        wordWrapBtn.title = 'Toggle word wrap (Ctrl+Shift+W)';
      }
    }
  }

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { wordWrapEnabled } });
}

function handleToggleGraph() {
  showGraph = !showGraph;
  if (graphToggleBtn) {
    if (showGraph) {
      graphToggleBtn.classList.add('active');
      graphToggleBtn.title = 'Graph visible (click to hide)';
    } else {
      graphToggleBtn.classList.remove('active');
      graphToggleBtn.title = 'Show graph';
    }
  }
  const graphTh = document.querySelector('th.graph-col');
  if (graphTh) { graphTh.style.display = (showGraph && sortMode < 2) ? '' : 'none'; }
  focusedIndex = -1;
  renderCommits();
  updateCommitCount();

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { showGraph } });
}

/**
 * Check if text matches the regex pattern
 * @param {string} text - Text to test
 * @param {string} pattern - Regex pattern
 * @returns {boolean} True if matches or if regex is invalid (fallback to includes)
 */
function isRegexMatch(text, pattern) {
  if (!pattern) return true;
  if (!regexSearchEnabled) {
    return text.toLowerCase().includes(pattern.toLowerCase());
  }
  try {
    const regex = new RegExp(pattern, 'i');
    return regex.test(text);
  } catch (e) {
    // Invalid regex - fallback to simple includes
    return text.toLowerCase().includes(pattern.toLowerCase());
  }
}

/**
 * Check if the current regex pattern is valid
 * @param {string} pattern - Regex pattern to validate
 * @returns {boolean} True if valid or not in regex mode
 */
function isValidRegex(pattern) {
  if (!regexSearchEnabled || !pattern) return true;
  try {
    new RegExp(pattern);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Toggle regex search mode
 */
function handleRegexToggle() {
  regexSearchEnabled = !regexSearchEnabled;
  if (regexToggleBtn) {
    if (regexSearchEnabled) {
      regexToggleBtn.classList.add('active');
      regexToggleBtn.title = 'Regex mode enabled (Ctrl+Shift+X to toggle)';
    } else {
      regexToggleBtn.classList.remove('active');
      regexToggleBtn.classList.remove('invalid');
      regexToggleBtn.title = 'Toggle regex search mode (Ctrl+Shift+X)';
    }
  }
  // Update search results with new mode
  focusedIndex = -1;
  renderCommits();
  updateCommitCount();
  // Validate current pattern
  updateRegexValidation();

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { regexSearchEnabled } });
}

/**
 * Toggle ignore whitespace in diffs
 */
function handleIgnoreWhitespaceToggle() {
  ignoreWhitespace = !ignoreWhitespace;
  if (ignoreWsBtn) {
    if (ignoreWhitespace) {
      ignoreWsBtn.classList.add('active');
      ignoreWsBtn.title = 'Ignore whitespace enabled (Ctrl+Shift+J to toggle)';
    } else {
      ignoreWsBtn.classList.remove('active');
      ignoreWsBtn.title = 'Toggle ignore whitespace (Ctrl+Shift+J)';
    }
  }

  // Re-fetch diff if a commit is selected
  if (currentCommitHash) {
    vscode.postMessage({ type: 'requestDiff', hash: currentCommitHash });
  } else if (selectedCommits && selectedCommits.size > 0) {
    // Handle combined diff for multiple selected commits
    const hashes = Array.from(selectedCommits);
    if (hashes.length === 1) {
      vscode.postMessage({ type: 'requestDiff', hash: hashes[0] });
    } else {
      vscode.postMessage({ type: 'requestCombinedDiff', hashes });
    }
  }

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { ignoreWhitespace } });
}

/**
 * Cycle diff context lines (1-10)
 */
function handleDiffContextLinesCycle() {
  diffContextLines = diffContextLines >= 10 ? 1 : diffContextLines + 1;

  // Update button display
  if (contextLinesBtn) {
    const valueSpan = contextLinesBtn.querySelector('#context-lines-value');
    if (valueSpan) {
      valueSpan.textContent = diffContextLines;
    } else {
      contextLinesBtn.innerHTML = `<span id="context-lines-value">${diffContextLines}</span>`;
    }
    contextLinesBtn.title = `Diff context lines: ${diffContextLines} (Ctrl+Shift+/ to change)`;
  }

  // Re-fetch diff if a commit is selected
  if (currentCommitHash) {
    vscode.postMessage({ type: 'requestDiff', hash: currentCommitHash });
  } else if (selectedCommits && selectedCommits.size > 0) {
    const hashes = Array.from(selectedCommits);
    if (hashes.length === 1) {
      vscode.postMessage({ type: 'requestDiff', hash: hashes[0] });
    } else {
      vscode.postMessage({ type: 'requestCombinedDiff', hashes });
    }
  }

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { diffContextLines } });
}

/**
 * Toggle my commits only filter
 */
function handleMyCommitsToggle() {
  showMyCommitsOnly = !showMyCommitsOnly;
  if (myCommitsBtn) {
    if (showMyCommitsOnly) {
      myCommitsBtn.classList.add('active');
      myCommitsBtn.title = 'Showing only my commits (click to show all)';
    } else {
      myCommitsBtn.classList.remove('active');
      myCommitsBtn.title = 'Show only my commits (Ctrl+Shift+M)';
    }
  }
  focusedIndex = -1;
  renderCommits();
  updateCommitCount();
  updateClearAllButton();

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { showMyCommitsOnly } });
}

/**
 * Update regex validation visual feedback
 */
function updateRegexValidation() {
  if (!regexToggleBtn) return;
  const { textQuery } = parseDateFilter(searchQuery);
  if (regexSearchEnabled && textQuery && !isValidRegex(textQuery)) {
    regexToggleBtn.classList.add('invalid');
  } else {
    regexToggleBtn.classList.remove('invalid');
  }
}

function updateCommitCount() {
  if (!commitCountEl) return;
  const filtered = getFilteredCommits();
  const hasActiveFilter = searchQuery || hideMergeCommits || showMyCommitsOnly;
  if (hasActiveFilter && filtered.length !== commits.length) {
    commitCountEl.textContent = `${filtered.length} of ${commits.length} commits`;
  } else {
    commitCountEl.textContent = `${commits.length} commit${commits.length !== 1 ? 's' : ''}`;
  }
}

// ─── Branch Badge ───────────────────────────────────────────────────────────

function renderBranchBadge() {
  const header = document.getElementById('commit-detail-header');
  if (!header) return;

  // Remove existing branch badge if any
  const existingBadge = header.querySelector('.branch-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  if (currentBranch) {
    const branchBadge = document.createElement('span');
    branchBadge.className = 'branch-badge branch-filter-link clickable';
    branchBadge.textContent = currentBranch;
    branchBadge.title = `Current branch: ${currentBranch} (right-click to switch)`;
    branchBadge.addEventListener('click', () => handleCopyBranchName());
    branchBadge.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showBranchContextMenu(e);
    });
    header.insertBefore(branchBadge, header.firstChild);
  }
}

	let _allBranches = [];
	let _currentBranch;

	function setAllBranches(branches) {
	  _allBranches = branches;
	}

	function showBranchContextMenu(event) {
	  // Remove existing menu if any
	  const existingMenu = document.querySelector('.branch-context-menu');
	  if (existingMenu) existingMenu.remove();

	  const menu = document.createElement('div');
	  menu.className = 'branch-context-menu';

	  // Group branches into local and remote
	  const localBranches = _allBranches.filter(b => !b.startsWith('remotes/'));
	  const remoteBranches = _allBranches.filter(b => b.startsWith('remotes/'));

	  if (localBranches.length > 0) {
	    const localTitle = document.createElement('div');
	    localTitle.className = 'context-menu-section-title';
	    localTitle.textContent = 'Local Branches';
	    menu.appendChild(localTitle);

	    localBranches.forEach(branch => {
	      const item = document.createElement('div');
	      item.className = 'context-menu-item';
	      if (branch === currentBranch) {
	        item.classList.add('current-branch');
	        item.textContent = '✓ ' + branch;
	        item.title = 'Current branch';
	      } else {
	        item.textContent = branch;
	        item.addEventListener('click', () => {
	          closeContextMenu();
	          vscode.postMessage({ type: 'checkoutBranch', branch: branch });
	        });
	      }
	      menu.appendChild(item);
	    });
	  }

	  if (remoteBranches.length > 0) {
	    const remoteTitle = document.createElement('div');
	    remoteTitle.className = 'context-menu-section-title';
	    remoteTitle.textContent = 'Remote Branches';
	    menu.appendChild(remoteTitle);

	    // Show remote branches without 'remotes/' prefix
	    remoteBranches.forEach(fullPath => {
	      const branch = fullPath.replace(/^remotes\//, '');
	      const item = document.createElement('div');
	      item.className = 'context-menu-item';
	      item.textContent = branch;
	      item.addEventListener('click', () => {
	        closeContextMenu();
	        vscode.postMessage({ type: 'checkoutBranch', branch: branch });
	      });
	      menu.appendChild(item);
	    });
	  }

	  // Position menu near cursor
	  const rect = event.target.getBoundingClientRect();
	  menu.style.position = 'fixed';
	  menu.style.left = rect.left + 'px';
	  menu.style.top = (rect.bottom + 4) + 'px';
	  document.body.appendChild(menu);

	  // Close on click outside
	  document.addEventListener('click', closeContextMenu, { once: true });
	}

	function closeContextMenu() {
	  const menu = document.querySelector('.branch-context-menu');
	  if (menu) menu.remove();
	}

	function showBranchPickerDialog() {
	  const existingDialog = document.querySelector('.branch-picker-modal');
	  if (existingDialog) existingDialog.remove();

	  const modal = document.createElement('div');
	  modal.className = 'branch-picker-modal';
	  modal.innerHTML = `
	    <div class="branch-picker-content">
	      <div class="branch-picker-header">
	        <h3>Switch Branch</h3>
	        <button class="branch-picker-close">&times;</button>
	      </div>
	      <input type="text" class="branch-picker-input" placeholder="Search branches..." autofocus>
	      <div class="branch-picker-results"></div>
	    </div>
	  `;
	  document.body.appendChild(modal);

	  const input = modal.querySelector('.branch-picker-input');
	  const results = modal.querySelector('.branch-picker-results');
	  const closeBtn = modal.querySelector('.branch-picker-close');

	  function updateResults(filter) {
	    results.innerHTML = '';
	    const filtered = _allBranches.filter(b =>
	      b.toLowerCase().includes(filter.toLowerCase())
	    );
	    filtered.slice(0, 20).forEach((branch, i) => {
	      const item = document.createElement('div');
	      item.className = 'branch-result-item' + (branch === currentBranch ? ' current-branch' : '');
	      item.textContent = branch + (branch === currentBranch ? ' ✓' : '');
	      item.addEventListener('click', () => {
	        if (branch !== currentBranch) {
	          vscode.postMessage({ type: 'checkoutBranch', branch: branch });
	        }
	        closePicker();
	      });
	      results.appendChild(item);
	    });
	  }

	  function closePicker() {
	    modal.remove();
	  }

	  input.addEventListener('input', () => updateResults(input.value));
	  closeBtn.addEventListener('click', closePicker);
	  modal.addEventListener('click', (e) => {
	    if (e.target === modal) closePicker();
	  });

	  input.addEventListener('keydown', (e) => {
	    if (e.key === 'Escape') closePicker();
	    if (e.key === 'Enter') {
	      const first = results.querySelector('.branch-result-item');
	      if (first) first.click();
	    }
	  });

	  updateResults('');
	  input.focus();
	}

	function updateFocusedRow() {
  document.querySelectorAll('#commit-table tbody tr').forEach((tr, index) => {
    if (index === focusedIndex) {
      tr.classList.add('focused');
    } else {
      tr.classList.remove('focused');
    }
  });
}

function scrollFocusedIntoView() {
  const focusedRow = document.querySelector('#commit-table tbody tr.focused');
  if (focusedRow) {
    focusedRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ─── Initialize ─────────────────────────────────────────────────────────────

function init() {
  vscode.postMessage({ type: 'ready' });

  unifiedBtn.addEventListener('click', () => setDiffType('unified'));
  sideBySideBtn.addEventListener('click', () => setDiffType('side-by-side'));
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', handleRefresh);
  }

  if (sortBtn) {
    sortBtn.addEventListener('click', handleSortToggle);
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', handleCopyMessage);
  }

  if (compareParentBtn) {
    compareParentBtn.addEventListener('click', handleQuickCompare);
  }

  if (wordWrapBtn) {
    wordWrapBtn.addEventListener('click', handleWordWrapToggle);
  }

  if (mergeToggleBtn) {
    mergeToggleBtn.addEventListener('click', handleMergeToggle);
  }

  if (regexToggleBtn) {
    regexToggleBtn.addEventListener('click', handleRegexToggle);
  }

  if (copyFilterQueryBtn) {
    copyFilterQueryBtn.addEventListener('click', handleCopyFilterQuery);
  }

  if (pasteFilterQueryBtn) {
    pasteFilterQueryBtn.addEventListener('click', handlePasteFilterQuery);
  }

  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.addEventListener('click', clearAllFilters);
  }

  const savePresetBtn = document.getElementById('save-preset-btn');
  if (savePresetBtn) {
    savePresetBtn.addEventListener('click', showSavePresetDialog);
  }

  const presetDropdownBtn = document.getElementById('preset-dropdown-btn');
  if (presetDropdownBtn) {
    presetDropdownBtn.addEventListener('click', showPresetDropdown);
  }

  if (ignoreWsBtn) {
    ignoreWsBtn.addEventListener('click', handleIgnoreWhitespaceToggle);
  }

  if (contextLinesBtn) {
    contextLinesBtn.addEventListener('click', handleDiffContextLinesCycle);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExportCommits);
  }

  if (myCommitsBtn) {
    myCommitsBtn.addEventListener('click', handleMyCommitsToggle);
  }
  if (graphToggleBtn) {
    graphToggleBtn.addEventListener('click', handleToggleGraph);
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyDown);

  // Hash chip copy-on-click and message expand (event delegation)
  commitList.addEventListener('click', (e) => {
    if (e.target.classList.contains('hash-chip')) {
      e.stopPropagation();
      const hash = e.target.dataset.hash;
      navigator.clipboard.writeText(hash).then(() => {
        e.target.classList.add('copied');
        setTimeout(() => e.target.classList.remove('copied'), 1200);
      }).catch(() => {
        // Clipboard API unavailable in some webview contexts — silently ignore
      });
    }
    if (e.target.classList.contains('message-expand-btn')) {
      e.stopPropagation();
      const hash = e.target.dataset.hash;
      if (expandedMessages.has(hash)) {
        expandedMessages.delete(hash);
      } else {
        expandedMessages.add(hash);
      }
      renderCommits();
    }
    if (e.target.classList.contains('author-filter-link')) {
      e.stopPropagation();
      const author = e.target.dataset.author;
      searchInput.value = `author:${author}`;
      searchQuery = `author:${author}`;
      focusedIndex = -1;
      renderCommits();
      updateCommitCount();
      renderFilterBadges();
    }
    if (e.target.classList.contains('tag-filter-link')) {
      e.stopPropagation();
      const tag = e.target.dataset.tag;
      searchInput.value = `tag:${tag}`;
      searchQuery = `tag:${tag}`;
      focusedIndex = -1;
      renderCommits();
      updateCommitCount();
      renderFilterBadges();
    }
  });

  initResizers();

  window.addEventListener('message', handleMessage);
}

// ─── Resizable panels ────────────────────────────────────────────────────────

function initResizers() {
  const mainContent = document.getElementById('main-content');
  const verticalResizer = document.getElementById('vertical-resizer');
  const horizontalResizer = document.getElementById('horizontal-resizer');
  const bottomPanel = document.getElementById('bottom-panel');
  const commitTableContainer = document.getElementById('commit-table-container');

  // Vertical resizer (between diff-viewer and bottom-panel)
  let isResizingV = false;
  let vStartY = 0;
  let vStartHeight = 0;

  verticalResizer.addEventListener('mousedown', (e) => {
    isResizingV = true;
    vStartY = e.clientY;
    vStartHeight = diffViewer.getBoundingClientRect().height;
    verticalResizer.classList.add('active');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  // Horizontal resizer (between commit table and detail panel)
  let isResizingH = false;
  let hStartX = 0;
  let hStartWidth = 0;

  horizontalResizer.addEventListener('mousedown', (e) => {
    isResizingH = true;
    hStartX = e.clientX;
    hStartWidth = commitTableContainer.getBoundingClientRect().width;
    horizontalResizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isResizingV) {
      const delta = e.clientY - vStartY;
      const totalH = mainContent.getBoundingClientRect().height;
      const newHeight = Math.max(60, Math.min(vStartHeight + delta, totalH - 80));
      diffViewer.style.height = newHeight + 'px';
    }
    if (isResizingH) {
      const delta = e.clientX - hStartX;
      const totalW = bottomPanel.getBoundingClientRect().width;
      const newWidth = Math.max(120, Math.min(hStartWidth + delta, totalW - 120));
      commitTableContainer.style.flex = 'none';
      commitTableContainer.style.width = newWidth + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isResizingV) {
      isResizingV = false;
      verticalResizer.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    if (isResizingH) {
      isResizingH = false;
      horizontalResizer.classList.remove('active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ─── Message handler ─────────────────────────────────────────────────────────

function handleMessage(event) {
  const message = event.data;

  switch (message.type) {
    case 'init':
      commits = message.commits;
      showGraph = message.showGraph !== false;
      trackedFilePath = message.filePath || null;
      currentBranch = message.branch || null;
      currentUser = message.currentUser || null;

      // Apply user settings from persistent storage (overrides defaultDiffView)
      if (message.userSettings) {
        const settings = message.userSettings;

        // Apply diff type (user setting takes precedence over defaultDiffView config)
        if (settings.diffType === 'side-by-side' || settings.diffType === 'unified') {
          setDiffType(settings.diffType);
        } else if (message.defaultDiffView === 'side-by-side') {
          setDiffType('side-by-side');
        }

        // Apply word wrap
        if (settings.wordWrapEnabled !== wordWrapEnabled) {
          wordWrapEnabled = settings.wordWrapEnabled;
          if (wordWrapEnabled) {
            diffViewer.classList.add('word-wrap');
            if (wordWrapBtn) {
              wordWrapBtn.classList.add('active');
              wordWrapBtn.title = 'Word wrap enabled (Ctrl+Shift+W to toggle)';
            }
          }
        }

        // Apply sort mode
        if (settings.sortMode !== undefined && settings.sortMode !== sortMode) {
          sortMode = settings.sortMode;
          updateSortButton();
        }

        // Apply merge commits filter
        hideMergeCommits = settings.hideMergeCommits;

        // Apply regex search mode
        regexSearchEnabled = settings.regexSearchEnabled;
        if (regexToggleBtn) {
          if (regexSearchEnabled) {
            regexToggleBtn.classList.add('active');
            regexToggleBtn.title = 'Regex mode enabled (Ctrl+Shift+X to toggle)';
          } else {
            regexToggleBtn.classList.remove('active');
            regexToggleBtn.classList.remove('invalid');
            regexToggleBtn.title = 'Toggle regex search mode (Ctrl+Shift+X)';
          }
        }

        // Apply ignore whitespace setting
        ignoreWhitespace = settings.ignoreWhitespace;
        if (ignoreWsBtn) {
          if (ignoreWhitespace) {
            ignoreWsBtn.classList.add('active');
            ignoreWsBtn.title = 'Ignore whitespace enabled (Ctrl+Shift+J to toggle)';
          } else {
            ignoreWsBtn.classList.remove('active');
            ignoreWsBtn.title = 'Toggle ignore whitespace (Ctrl+Shift+J)';
          }
        }

        // Apply diff context lines setting
        if (settings.diffContextLines !== undefined) {
          diffContextLines = settings.diffContextLines;
          if (contextLinesBtn) {
            const valueSpan = contextLinesBtn.querySelector('#context-lines-value');
            if (valueSpan) {
              valueSpan.textContent = diffContextLines;
            } else {
              contextLinesBtn.innerHTML = `<span id="context-lines-value">${diffContextLines}</span>`;
            }
            contextLinesBtn.title = `Diff context lines: ${diffContextLines} (Ctrl+Shift+/ to change)`;
          }
        }

        // Apply my commits only filter
        showMyCommitsOnly = settings.showMyCommitsOnly;

        // Apply graph visibility from persisted settings
        if (settings.showGraph !== undefined) {
          showGraph = settings.showGraph;
        }
        if (graphToggleBtn) {
          if (showGraph) {
            graphToggleBtn.classList.add('active');
            graphToggleBtn.title = 'Graph visible (click to hide)';
          } else {
            graphToggleBtn.classList.remove('active');
            graphToggleBtn.title = 'Show graph';
          }
        }
        renderCommits();
        updateCommitCount();

        // Apply saved search query
        if (settings.searchQuery !== undefined && settings.searchQuery !== '') {
          searchQuery = settings.searchQuery;
          if (searchInput) {
            searchInput.value = searchQuery;
          }
          renderCommits();
          updateCommitCount();
          renderFilterBadges();
        }
      } else if (message.defaultDiffView === 'side-by-side') {
        setDiffType('side-by-side');
      }

      const graphTh = document.querySelector('th.graph-col');
      if (graphTh) { graphTh.style.display = (showGraph && sortMode < 2) ? '' : 'none'; }

      // Update merge toggle button state
      if (mergeToggleBtn) {
        if (hideMergeCommits) {
          mergeToggleBtn.classList.add('active');
          mergeToggleBtn.title = 'Merge commits hidden (click to show)';
        } else {
          mergeToggleBtn.classList.remove('active');
          mergeToggleBtn.title = 'Hide merge commits';
        }
      }

      // Update my commits toggle button state
      if (myCommitsBtn) {
        if (showMyCommitsOnly) {
          myCommitsBtn.classList.add('active');
          myCommitsBtn.title = 'Showing only my commits (click to show all)';
        } else {
          myCommitsBtn.classList.remove('active');
          myCommitsBtn.title = 'Show only my commits (Ctrl+Shift+M)';
        }
        // Disable my commits button if no current user is configured
        myCommitsBtn.disabled = !currentUser;
        if (!currentUser) {
          myCommitsBtn.title = 'No git user configured (set user.name and user.email)';
        }
      }

      // Initialize branches and fetch their commit hashes
      if (message.branches && message.branches.length > 0) {
        branches = message.branches;
        setAllBranches(branches);
        // Request branch commit hashes from extension
        vscode.postMessage({ type: 'requestBranchHashes', branches: branches });
      }

      // Initialize saved filter presets
      if (message.savedPresets) {
        savedPresets = message.savedPresets;
      }

      renderBranchBadge();
      renderCommits();
      updateClearAllButton();
      if (commits.length > 0) {
        selectCommit(commits[0].hash);
      }
      break;

    case 'diff':
      currentDiff = message.diff;
      selectedFile = message.selectedFile || null;
      renderDiff(currentDiff);
      renderFiles(message.files, selectedFile);
      break;

    case 'combinedDiff':
      currentDiff = message.diff;
      renderDiff(currentDiff);
      break;

    case 'rangeDiff':
      currentDiff = message.diff;
      renderDiff(currentDiff);
      // Update header to show range comparison
      updateCommitDetailHeaderForRange(message.fromHash, message.toHash);
      break;

    case 'commitFiles':
      // Cache the files for filtering
      if (message.hash) {
        commitFilesMap.set(message.hash, message.files);
      }
      renderFiles(message.files);
      renderCommits(); // Re-render commit list to re-evaluate path filter
      break;

    case 'error':
      showError(message.message);
      break;

    case 'branchHashes':
      // Build a map of branch names to commit hash sets
      if (message.hashes) {
        branchCommitHashes = {};
        for (const [branchName, hashList] of Object.entries(message.hashes)) {
          branchCommitHashes[branchName.toLowerCase()] = new Set(hashList);
        }
      }
      break;

    case 'selectCommit':
      handleSelectCommit(message.hash);
      break;

    case 'filterPresets':
      savedPresets = message.presets || [];
      renderPresetDropdown();
      break;

    case 'applyFilterQuery':
      applyFilterQuery(message.filterState);
      break;

    case 'showFirstRunTip':
      if (message.showFirstRunTip) {
        showFirstRunTipBanner();
      }
      break;

    case 'triggerAction':
      switch (message.action) {
        case 'refresh': handleRefresh(); break;
        case 'copyCommitMessage': handleCopyMessage(); break;
        case 'copyCommitHash': handleCopyHash(); break;
        case 'copyCommitInfo': handleCopyInfo(); break;
        case 'copyCherryPick': handleCopyCherryPick(); break;
        case 'copyRevert': handleCopyRevert(); break;
        case 'copyCommitFiles': handleCopyFiles(); break;
        case 'copyCommitDiff': handleCopyDiff(); break;
        case 'copyCombinedDiff': handleCopyCombinedDiff(); break;
        case 'copyRangeDiff': handleCopyRangeDiff(); break;
        case 'copyCommitPatch': handleCopyPatch(); break;
        case 'copyCommitUrl': handleCopyUrl(); break;
        case 'copyCommitMention': handleCopyMention(); break;
        case 'copyCommitRef': handleCopyRef(); break;
        case 'copyBranchName': handleCopyBranchName(); break;
        case 'copyBranchUrl': handleCopyBranchUrl(); break;
        case 'copyRemoteUrl': handleCopyRemoteUrl(); break;
        case 'copyTags': handleCopyTags(); break;
        case 'copyAuthorEmail': handleCopyAuthorEmail(); break;
        case 'copyAuthorName': handleCopyAuthorName(); break;
        case 'copyParentHash': handleCopyParentHash(); break;
        case 'copyShortHash': handleCopyShortHash(); break;
        case 'copySubject': handleCopySubject(); break;
        case 'copyDiffStatSummary': handleCopyDiffStatSummary(); break;
        case 'copyCommitStats': handleCopyStats(); break;
        case 'copyOneline': handleCopyOneline(); break;
        case 'copyCommitBody': handleCopyCommitBody(); break;
        case 'copyCommitMarkdown': handleCopyMarkdown(); break;
        case 'copyCommitJson': handleCopyJson(); break;
        case 'copyCoAuthors': handleCopyCoAuthors(); break;
        case 'copyCommitDate': handleCopyCommitDate(); break;
        case 'copyRelativeDate': handleCopyRelativeDate(); break;
        case 'copySelectedHashes': handleCopySelectedHashes(); break;
        case 'copyFileName': handleCopyFileName(); break;
        case 'copyFileExtension': handleCopyExtension(); break;
        case 'copyFileDirectory': handleCopyFileDirectory(); break;
        case 'copyFilePath': handleCopyFilePath(); break;
        case 'copyRelativePath': handleCopyRelativePath(); break;
        case 'copyFileDiff': handleCopyFileDiff(); break;
        case 'copyFileContent': handleCopyFileContent(); break;
        case 'copyFileUrl': handleCopyFileUrl(); break;
        case 'copyDescribe': handleCopyDescribe(); break;
        case 'exportCommits': handleExportCommits(); break;
        case 'quickCompare': handleQuickCompare(); break;
        case 'createBranch': handleCreateBranch(); break;
        case 'createTag': handleCreateTag(); break;
        case 'deleteTag': handleDeleteTag(); break;
        case 'deleteBranch': handleDeleteBranch(); break;
        case 'checkoutBranch': showBranchPickerDialog(); break;
        case 'toggleMyCommits': handleMyCommitsToggle(); break;
        case 'toggleWordWrap': handleWordWrapToggle(); break;
        case 'toggleRegex': handleRegexToggle(); break;
        case 'toggleIgnoreWhitespace': handleIgnoreWhitespaceToggle(); break;
        case 'toggleHideMergeCommits': handleMergeToggle(); break;
        case 'toggleGraph': handleToggleGraph(); break;
        case 'jumpToHash': showJumpToHashDialog(); break;
        case 'focusSearch': if (searchInput) { searchInput.focus(); searchInput.select(); } break;
        case 'showKeyboardHelp': showKeyboardHelpDialog(); break;
        case 'cycleDiffContextLines': handleDiffContextLinesCycle(); break;
        case 'cycleSortMode': handleSortToggle(); break;
        case 'copyFilterQuery': handleCopyFilterQuery(); break;
        case 'pasteFilterQuery': handlePasteFilterQuery(); break;
        case 'clearAllFilters': clearAllFilters(); break;
        case 'openCommitUrl': handleOpenUrl(); break;
        case 'openFileUrl': handleOpenFileUrl(); break;
        case 'saveFilterPreset': showSavePresetDialog(); break;
        case 'loadFilterPreset': showPresetDropdown(); break;
      }
      break;
  }
}

function handleSelectCommit(hash) {
  const row = document.querySelector(`#commit-table tbody tr[data-hash="${hash}"]`);
  if (row) {
    clearSelection();
    selectCommit(hash);
    row.scrollIntoView({ block: 'nearest' });
  }
}

// ─── Commit rendering ────────────────────────────────────────────────────────

function renderCommits() {
  commitList.innerHTML = '';

  const filteredCommits = getFilteredCommits();
  const displayCommits = getOrderedCommits(filteredCommits);

  // Reset focus if out of bounds after filtering
  if (focusedIndex >= displayCommits.length) {
    focusedIndex = displayCommits.length > 0 ? 0 : -1;
  }

  // Graph is only shown in newest-first order
  const effectiveShowGraph = showGraph && sortMode < 2;
  const colspan = effectiveShowGraph ? 6 : 5;

  if (displayCommits.length === 0) {
    const hasFilters = hasActiveFilters();
    let emptyMessage = 'No commits found';
    if (searchQuery && hasFilters) {
      emptyMessage = 'No commits match your search and filters';
    } else if (searchQuery) {
      emptyMessage = 'No commits match your search';
    } else if (hasFilters) {
      emptyMessage = 'No commits match your filters';
    }
    commitList.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">${emptyMessage}</div>
        </td>
      </tr>
    `;
    return;
  }

  let graphData = [];
  let maxCols = 1;
  if (effectiveShowGraph && typeof computeGraphLayout === 'function') {
    const graphCommits = typeof simplifyParentsForDisplay === 'function'
      ? simplifyParentsForDisplay(displayCommits)
      : displayCommits;
    graphData = computeGraphLayout(graphCommits);
    for (let g = 0; g < graphData.length; g++) {
      if (graphData[g].maxColumns > maxCols) { maxCols = graphData[g].maxColumns; }
    }
  }

  displayCommits.forEach((commit, index) => {
    const tr = document.createElement('tr');
    tr.dataset.hash = commit.hash;
    tr.dataset.index = index;

    const isMerge = commit.parentHashes && commit.parentHashes.length > 1;
    if (isMerge) {
      tr.classList.add('commit-merge');
    }

    const date = formatDate(commit.date);
    const absoluteDate = new Date(commit.date).toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const graphCell = effectiveShowGraph && graphData[index]
      ? `<td class="graph-col">${renderGraphSvg(graphData[index], maxCols)}</td>`
      : '';

    // Format stats for display
    const statsHtml = formatCommitStats(commit.stats);

    const tagBadges = (commit.tags || [])
      .map(t => `<span class="tag-badge tag-filter-link" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`)
      .join('');

    const mergeBadge = isMerge ? '<span class="merge-badge">merge</span>' : '';

    const avatarColor = getAuthorColor(commit.author);
    const initials = getAuthorInitials(commit.author);

    // Build message content with expand/collapse for commits with body
    const hasBody = commit.fullMessage && commit.fullMessage !== commit.message;
    const isExpanded = expandedMessages.has(commit.hash);
    let messageHtml;
    if (hasBody) {
      const bodyContent = commit.fullMessage.substring(commit.message.length).trim();
      messageHtml = `
        <div class="message-content ${isExpanded ? 'expanded' : ''}">
          <div class="message-subject">${mergeBadge}${tagBadges}${escapeHtml(commit.message)}</div>
          ${isExpanded ? `<div class="message-body">${escapeHtml(bodyContent)}</div>` : ''}
        </div>
        <button class="message-expand-btn" data-hash="${commit.hash}" title="${isExpanded ? 'Collapse' : 'Expand'} message">
          ${isExpanded ? '▲' : '▼'}
        </button>
      `;
    } else {
      messageHtml = `<div class="message-content">${mergeBadge}${tagBadges}${escapeHtml(commit.message)}</div>`;
    }

    tr.innerHTML = `
      ${graphCell}
      <td class="hash-col"><span class="hash-chip" data-hash="${commit.hash}" title="Click to copy full hash">${commit.shortHash}</span></td>
      <td class="author-col" title="${escapeHtml(commit.author)}">
        <div class="author-col-inner">
          <span class="author-avatar" style="background-color:${avatarColor}">${initials}</span>
           <span class="author-name author-filter-link" data-author="${escapeHtml(commit.author)}">${escapeHtml(truncate(commit.author, 16))}</span>
        </div>
      </td>
      <td class="date-col" title="${absoluteDate}">${date}</td>
      <td class="stats-col" title="${commit.stats ? `${commit.stats.filesChanged} file${commit.stats.filesChanged !== 1 ? 's' : ''} changed, ${commit.stats.insertions} insertion${commit.stats.insertions !== 1 ? 's' : ''}(+), ${commit.stats.deletions} deletion${commit.stats.deletions !== 1 ? 's' : ''}(-)` : ''}">${statsHtml}</td>
      <td class="message-col ${hasBody ? 'has-expand' : ''}">${messageHtml}</td>
    `;

    tr.addEventListener('click', (e) => {
      // Update focused index on mouse click
      focusedIndex = index;
      updateFocusedRow();

      if (e.shiftKey && rangeSelectionAnchor && rangeSelectionAnchor !== commit.hash) {
        // Shift+click: Select range between anchor and clicked commit
        e.preventDefault();
        handleRangeSelection(rangeSelectionAnchor, commit.hash);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd+click: Toggle multi-select
        if (selectedCommits.has(commit.hash)) {
          selectedCommits.delete(commit.hash);
          if (selectedCommits.size === 0) {
            rangeSelectionAnchor = null;
            rangeSelectionTarget = null;
          }
        } else {
          selectedCommits.add(commit.hash);
          rangeSelectionAnchor = commit.hash; // Update anchor to last selected
        }
        updateSelectedRows();
        if (selectedCommits.size > 1) {
          requestCombinedDiff();
        } else if (selectedCommits.size === 1) {
          requestDiff([...selectedCommits][0]);
        }
      } else {
        // Regular click: Select single commit, set as anchor
        clearSelection();
        selectCommit(commit.hash);
        rangeSelectionAnchor = commit.hash;
      }
    });

    // Add context menu handler for right-click on commit rows
    tr.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showCommitContextMenu(e, commit);
    });

    commitList.appendChild(tr);
  });

  updateFocusedRow();
}

function selectCommit(hash) {
  selectedCommits.clear();
  selectedCommits.add(hash);
  currentCommitHash = hash;
  selectedFile = null;

  updateSelectedRows();
  updateCommitDetailHeader(commits.find(c => c.hash === hash) || null);
  showDiffLoading();
  requestDiff(hash);
}

function clearSelection() {
  selectedCommits.clear();
  rangeSelectionAnchor = null;
  rangeSelectionTarget = null;
  updateSelectedRows();
}

function handleSelectAll() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (displayCommits.length === 0) {
    return; // No-op if no commits visible
  }

  // Add all visible commits to selection
  displayCommits.forEach(commit => selectedCommits.add(commit.hash));
  updateSelectedRows();

  // Request combined diff for all selected commits
  requestCombinedDiff();
}

function handleRangeSelection(anchorHash, targetHash) {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  const anchorIndex = displayCommits.findIndex(c => c.hash === anchorHash);
  const targetIndex = displayCommits.findIndex(c => c.hash === targetHash);

  if (anchorIndex === -1 || targetIndex === -1) {
    return;
  }

  // Store anchor and target for copy range diff
  rangeSelectionAnchor = anchorHash;
  rangeSelectionTarget = targetHash;

  // Select all commits between anchor and target (inclusive)
  const startIndex = Math.min(anchorIndex, targetIndex);
  const endIndex = Math.max(anchorIndex, targetIndex);

  selectedCommits.clear();
  for (let i = startIndex; i <= endIndex; i++) {
    selectedCommits.add(displayCommits[i].hash);
  }

  updateSelectedRows();

  // Request range diff between the two endpoints
  const fromIndex = Math.min(anchorIndex, targetIndex);
  const toIndex = Math.max(anchorIndex, targetIndex);
  const fromHash = displayCommits[fromIndex].hash;
  const toHash = displayCommits[toIndex].hash;

  requestRangeDiff(fromHash, toHash);
}

function updateSelectedRows() {
  document.querySelectorAll('#commit-table tbody tr').forEach(tr => {
    if (selectedCommits.has(tr.dataset.hash)) {
      tr.classList.add('selected');
    } else {
      tr.classList.remove('selected');
    }
  });
}

// ─── Diff loading skeleton ────────────────────────────────────────────────────

function showDiffLoading() {
  const widths = ['38%', '100%', '100%', '72%', '100%', '100%', '55%', '100%', '85%', '100%'];
  const lines = widths.map(w => `<div class="skeleton-line" style="width:${w}"></div>`).join('');
  diffViewer.innerHTML = `<div class="diff-loading">${lines}</div>`;
}

// ─── Commit detail header ────────────────────────────────────────────────────

function updateCommitDetailHeader(commit) {
  const header = document.getElementById('commit-detail-header');
  if (!header) return;
  if (!commit) {
    header.innerHTML = '<span class="detail-label">Changed Files</span>';
    return;
  }
  header.innerHTML = `
    <span class="detail-hash-chip">${escapeHtml(commit.shortHash)}</span>
    <span class="detail-subject" title="${escapeHtml(commit.message)}">${escapeHtml(truncate(commit.message, 50))}</span>
  `;
}

function updateCommitDetailHeaderForRange(fromHash, toHash) {
  const header = document.getElementById('commit-detail-header');
  if (!header) return;

  const fromCommit = commits.find(c => c.hash === fromHash);
  const toCommit = commits.find(c => c.hash === toHash);
  const fromShort = fromCommit ? fromCommit.shortHash : fromHash.substring(0, 7);
  const toShort = toCommit ? toCommit.shortHash : toHash.substring(0, 7);

  header.innerHTML = `
    <span class="detail-label">Comparing:</span>
    <span class="detail-hash-chip">${escapeHtml(fromShort)}</span>
    <span style="color: var(--vscode-descriptionForeground);">..</span>
    <span class="detail-hash-chip">${escapeHtml(toShort)}</span>
  `;
}

// ─── Message sending ─────────────────────────────────────────────────────────

function requestDiff(hash) {
  if (trackedFilePath) {
    vscode.postMessage({ type: 'requestFileDiff', hash, filePath: trackedFilePath });
  } else {
    vscode.postMessage({ type: 'requestDiff', hash });
  }
}

function requestCombinedDiff() {
  const hashes = Array.from(selectedCommits);
  vscode.postMessage({ type: 'requestCombinedDiff', hashes });
}

function requestRangeDiff(fromHash, toHash) {
  vscode.postMessage({ type: 'requestRangeDiff', fromHash, toHash });
}

// ─── Diff rendering ───────────────────────────────────────────────────────────

function renderDiff(diffText) {
  if (!diffText || diffText.trim() === '') {
    diffViewer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <div class="empty-state-text">No diff to display</div>
      </div>
    `;
    return;
  }

  const configuration = {
    drawFileList: false,
    matching: 'lines',
    outputFormat: currentDiffType === 'side-by-side' ? 'side-by-side' : 'line-by-line',
    highlight: true,
    stickyFileHeaders: false,
    fileListToggle: false
  };

  try {
    const diff2htmlInstance = new Diff2HtmlUI(diffViewer, diffText, configuration);
    diff2htmlInstance.draw();
  } catch (error) {
    console.error('Error rendering diff:', error);
    diffViewer.innerHTML = `<pre style="white-space: pre-wrap;">${escapeHtml(diffText)}</pre>`;
  }
}

function clearDiff() {
  diffViewer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📊</div>
      <div class="empty-state-text">Select a commit to view its diff</div>
    </div>
  `;
}

function setDiffType(type) {
  currentDiffType = type;

  if (type === 'unified') {
    unifiedBtn.classList.add('active');
    sideBySideBtn.classList.remove('active');
  } else {
    unifiedBtn.classList.remove('active');
    sideBySideBtn.classList.add('active');
  }

  if (currentDiff) {
    renderDiff(currentDiff);
  }

  // Persist the setting
  vscode.postMessage({ type: 'saveSettings', settings: { diffType: type } });
}

// ─── File list ────────────────────────────────────────────────────────────────

function renderFiles(files, activeFile) {
  fileList.innerHTML = '';

  if (!files || files.length === 0) {
    fileList.innerHTML = '<li class="empty-state-text" style="padding:8px">No files changed</li>';
    return;
  }

  if (activeFile && currentCommitHash) {
    const backLi = document.createElement('li');
    backLi.className = 'file-back-link';
    backLi.textContent = '\u2190 Show full commit diff';
    backLi.addEventListener('click', () => {
      selectedFile = null;
      vscode.postMessage({ type: 'requestDiff', hash: currentCommitHash });
    });
    fileList.appendChild(backLi);
  }

  const isMultiSelect = selectedCommits.size > 1;

  files.forEach(file => {
    const li = document.createElement('li');

    const statusClass = getStatusClass(file.status);
    const statusLabel = getStatusLabel(file.status);

    let displayPath = file.path;
    if (file.previousPath && file.status === 'R') {
      displayPath = `${file.previousPath} → ${file.path}`;
    }

    if (activeFile && file.path === activeFile) {
      li.classList.add('file-selected');
    }

    li.innerHTML = `
      <span class="file-status ${statusClass}">${statusLabel}</span>
      <span class="file-path" title="${escapeHtml(displayPath)}">${escapeHtml(displayPath)}</span>
    `;

    if (!isMultiSelect && currentCommitHash) {
      li.addEventListener('click', (e) => {
        // Only handle left-click, not right-click (context menu)
        if (e.button !== 0) return;
        selectedFile = file.path;
        vscode.postMessage({
          type: 'requestFileDiff',
          hash: currentCommitHash,
          filePath: file.path
        });
      });

      // Add context menu handler for right-click
      li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showFileContextMenu(e, file.path, currentCommitHash);
      });
    }

    fileList.appendChild(li);
  });
}

// ─── File Context Menu ─────────────────────────────────────────────────────────

function showFileContextMenu(event, filePath, commitHash) {
  // Remove any existing context menu
  const existingMenu = document.getElementById('file-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'file-context-menu';
  menu.className = 'context-menu';
  menu.innerHTML = `
    <div class="context-menu-item" data-action="open-at-commit">
      <span class="context-menu-icon">📄</span>
      <span class="context-menu-label">Open file at this commit</span>
    </div>
    <div class="context-menu-item" data-action="view-diff">
      <span class="context-menu-icon">🔍</span>
      <span class="context-menu-label">View diff for this file</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-diff">
      <span class="context-menu-icon">🩹</span>
      <span class="context-menu-label">Copy diff for this file</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-content">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy file content</span>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="copy-file-path">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy file path</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-name">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy file name only</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-extension">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy file extension</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-directory">
      <span class="context-menu-icon">📁</span>
      <span class="context-menu-label">Copy file directory</span>
    </div>
    <div class="context-menu-item" data-action="copy-relative-path">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy relative path</span>
    </div>
    <div class="context-menu-item" data-action="copy-file-url">
      <span class="context-menu-icon">🔗</span>
      <span class="context-menu-label">Copy file permalink</span>
    </div>
    <div class="context-menu-item" data-action="open-file-url">
      <span class="context-menu-icon">🌐</span>
      <span class="context-menu-label">Open file permalink in browser</span>
    </div>
  `;

  // Position the menu at click location
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  document.body.appendChild(menu);

  // Handle menu item clicks
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'open-at-commit') {
        vscode.postMessage({
          type: 'openFileAtCommit',
          hash: commitHash,
          filePath: filePath
        });
      } else if (action === 'view-diff') {
        selectedFile = filePath;
        vscode.postMessage({
          type: 'requestFileDiff',
          hash: commitHash,
          filePath: filePath
        });
      } else if (action === 'copy-file-diff') {
        vscode.postMessage({
          type: 'copyFileDiff',
          hash: commitHash,
          filePath: filePath
        });
      } else if (action === 'copy-file-content') {
        vscode.postMessage({
          type: 'copyFileContent',
          hash: commitHash,
          filePath: filePath
        });
      } else if (action === 'copy-file-path') {
        vscode.postMessage({
          type: 'copyFilePath',
          filePath: filePath
        });
      } else if (action === 'copy-file-name') {
        vscode.postMessage({
          type: 'copyFileName',
          filePath: filePath
        });
      } else if (action === 'copy-file-extension') {
        vscode.postMessage({
          type: 'copyFileExtension',
          filePath: filePath
        });
      } else if (action === 'copy-file-directory') {
        vscode.postMessage({
          type: 'copyFileDirectory',
          filePath: filePath
        });
      } else if (action === 'copy-relative-path') {
        vscode.postMessage({
          type: 'copyRelativePath',
          filePath: filePath
        });
      } else if (action === 'copy-file-url') {
        vscode.postMessage({
          type: 'copyFileUrl',
          hash: commitHash,
          filePath: filePath
        });
      } else if (action === 'open-file-url') {
        vscode.postMessage({
          type: 'openFileUrl',
          hash: commitHash,
          filePath: filePath
        });
      }
      menu.remove();
    });
  });

  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// ─── Commit Context Menu ───────────────────────────────────────────────────────

function showCommitContextMenu(event, commit) {
  // Remove any existing context menu
  const existingMenu = document.getElementById('commit-context-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'commit-context-menu';
  menu.className = 'context-menu';
  menu.innerHTML = `
    <div class="context-menu-item" data-action="copy-hash">
      <span class="context-menu-icon">#</span>
      <span class="context-menu-label">Copy commit hash</span>
    </div>
    <div class="context-menu-item" data-action="copy-message">
      <span class="context-menu-icon">📝</span>
      <span class="context-menu-label">Copy commit message</span>
    </div>
    <div class="context-menu-item" data-action="copy-info">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy commit info</span>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="copy-cherry-pick">
      <span class="context-menu-icon">🍒</span>
      <span class="context-menu-label">Copy cherry-pick command</span>
    </div>
    <div class="context-menu-item" data-action="copy-revert">
      <span class="context-menu-icon">↩️</span>
      <span class="context-menu-label">Copy revert command</span>
    </div>
    <div class="context-menu-item" data-action="copy-files">
      <span class="context-menu-icon">📁</span>
      <span class="context-menu-label">Copy changed files</span>
    </div>
    <div class="context-menu-item" data-action="copy-diff">
      <span class="context-menu-icon">📄</span>
      <span class="context-menu-label">Copy commit diff</span>
    </div>
    <div class="context-menu-item" data-action="copy-describe">
      <span class="context-menu-icon">🏷️</span>
      <span class="context-menu-label">Copy as Git Describe</span>
    </div>
    <div class="context-menu-item" data-action="copy-patch">
      <span class="context-menu-icon">🩹</span>
      <span class="context-menu-label">Copy as patch</span>
    </div>
    <div class="context-menu-item" data-action="copy-url">
      <span class="context-menu-icon">🔗</span>
      <span class="context-menu-label">Copy commit URL</span>
    </div>
    <div class="context-menu-item" data-action="open-url">
      <span class="context-menu-icon">🌐</span>
      <span class="context-menu-label">Open in browser</span>
    </div>
    <div class="context-menu-item" data-action="copy-mention">
      <span class="context-menu-icon">📢</span>
      <span class="context-menu-label">Copy as Platform Mention</span>
    </div>
    <div class="context-menu-item" data-action="copy-ref">
      <span class="context-menu-icon">🔗</span>
      <span class="context-menu-label">Copy commit reference</span>
    </div>
    <div class="context-menu-item" data-action="copy-stats">
      <span class="context-menu-icon">📊</span>
      <span class="context-menu-label">Copy stats</span>
    </div>
    <div class="context-menu-item" data-action="copy-author-email">
      <span class="context-menu-icon">@</span>
      <span class="context-menu-label">Copy author email</span>
    </div>
    <div class="context-menu-item" data-action="copy-author-name">
      <span class="context-menu-icon">👤</span>
      <span class="context-menu-label">Copy author name</span>
    </div>
    <div class="context-menu-item" data-action="copy-parent-hash">
      <span class="context-menu-icon">⧁</span>
      <span class="context-menu-label">Copy parent hash</span>
    </div>
    <div class="context-menu-item" data-action="copy-short-hash">
      <span class="context-menu-icon">#7</span>
      <span class="context-menu-label">Copy short hash</span>
    </div>
    <div class="context-menu-item" data-action="copy-subject">
      <span class="context-menu-icon">📌</span>
      <span class="context-menu-label">Copy subject</span>
    </div>
    <div class="context-menu-item" data-action="copy-diff-stat-summary">
      <span class="context-menu-icon">📊</span>
      <span class="context-menu-label">Copy diff stat summary</span>
    </div>
    <div class="context-menu-item" data-action="copy-oneline">
      <span class="context-menu-icon">≡</span>
      <span class="context-menu-label">Copy as oneline</span>
    </div>
    <div class="context-menu-item" data-action="copy-commit-body">
      <span class="context-menu-icon">📄</span>
      <span class="context-menu-label">Copy commit body</span>
    </div>
    <div class="context-menu-item" data-action="copy-markdown">
      <span class="context-menu-icon">📜</span>
      <span class="context-menu-label">Copy as Markdown</span>
    </div>
    <div class="context-menu-item" data-action="copy-json">
      <span class="context-menu-icon">{}</span>
      <span class="context-menu-label">Copy as JSON</span>
    </div>
    <div class="context-menu-item" data-action="copy-co-authors">
      <span class="context-menu-icon">👥</span>
      <span class="context-menu-label">Copy co-authors</span>
    </div>
    <div class="context-menu-item" data-action="copy-commit-date">
      <span class="context-menu-icon">🕐</span>
      <span class="context-menu-label">Copy commit date</span>
    </div>
    <div class="context-menu-item" data-action="copy-relative-date">
      <span class="context-menu-icon">🕒</span>
      <span class="context-menu-label">Copy relative date</span>
    </div>
    <div class="context-menu-item" data-action="copy-branch-name">
      <span class="context-menu-icon">🌿</span>
      <span class="context-menu-label">Copy branch name</span>
    </div>
    <div class="context-menu-item" data-action="copy-branch-url">
      <span class="context-menu-icon">🔗</span>
      <span class="context-menu-label">Copy branch URL</span>
    </div>
    <div class="context-menu-item" data-action="copy-remote-url">
      <span class="context-menu-icon">📡</span>
      <span class="context-menu-label">Copy remote URL</span>
    </div>
    <div class="context-menu-item" data-action="copy-tags">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy tags</span>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="create-branch">
      <span class="context-menu-icon">🌿</span>
      <span class="context-menu-label">Create branch from commit</span>
    </div>
    <div class="context-menu-item" data-action="create-tag">
      <span class="context-menu-icon">🏷️</span>
      <span class="context-menu-label">Create tag from commit</span>
    </div>
    <div class="context-menu-item" data-action="delete-tag" style="display: ${(commit.tags && commit.tags.length > 0) ? 'flex' : 'none'}">
      <span class="context-menu-icon">🗑️</span>
      <span class="context-menu-label">Delete tag from commit</span>
    </div>
    <div class="context-menu-item" data-action="copy-selected-hashes" style="display: ${selectedCommits.size > 1 ? 'block' : 'none'}">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy selected hashes</span>
    </div>
    <div class="context-menu-item" data-action="copy-combined-diff" style="display: ${selectedCommits.size > 1 ? 'block' : 'none'}">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy combined diff</span>
    </div>
    <div class="context-menu-item" data-action="copy-range-diff" style="display: ${rangeSelectionAnchor !== null ? 'block' : 'none'}">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy range diff</span>
    </div>
    <div class="context-menu-item" data-action="compare-parent">
      <span class="context-menu-icon">⧁</span>
      <span class="context-menu-label">Compare with parent</span>
    </div>
  `;

  // Position the menu at click location
  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  document.body.appendChild(menu);

  // Handle menu item clicks
  menu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      if (action === 'copy-hash') {
        vscode.postMessage({ type: 'copyCommitHash', hash: commit.hash });
      } else if (action === 'copy-message') {
        vscode.postMessage({ type: 'copyCommitMessage', hash: commit.hash });
      } else if (action === 'copy-info') {
        vscode.postMessage({ type: 'copyCommitInfo', hash: commit.hash });
      } else if (action === 'copy-cherry-pick') {
        vscode.postMessage({ type: 'copyCherryPickCommand', hash: commit.hash });
      } else if (action === 'copy-revert') {
        vscode.postMessage({ type: 'copyRevertCommand', hash: commit.hash });
      } else if (action === 'copy-files') {
        vscode.postMessage({ type: 'copyCommitFiles', hash: commit.hash });
      } else if (action === 'copy-diff') {
        vscode.postMessage({ type: 'copyCommitDiff', hash: commit.hash });
      } else if (action === 'copy-describe') {
        vscode.postMessage({ type: 'copyDescribe', hash: commit.hash });
      } else if (action === 'copy-patch') {
        vscode.postMessage({ type: 'copyCommitPatch', hash: commit.hash });
      } else if (action === 'copy-url') {
        vscode.postMessage({ type: 'copyCommitUrl', hash: commit.hash });
      } else if (action === 'open-url') {
        vscode.postMessage({ type: 'openCommitUrl', hash: commit.hash });
      } else if (action === 'copy-mention') {
        vscode.postMessage({ type: 'copyCommitMention', hash: commit.hash });
      } else if (action === 'copy-ref') {
        vscode.postMessage({ type: 'copyCommitRef', hash: commit.hash });
      } else if (action === 'copy-stats') {
        vscode.postMessage({ type: 'copyCommitStats', hash: commit.hash });
      } else if (action === 'copy-author-email') {
        vscode.postMessage({ type: 'copyAuthorEmail', hash: commit.hash });
      } else if (action === 'copy-author-name') {
        vscode.postMessage({ type: 'copyAuthorName', hash: commit.hash });
      } else if (action === 'copy-parent-hash') {
        vscode.postMessage({ type: 'copyParentHash', hash: commit.hash });
      } else if (action === 'copy-short-hash') {
        vscode.postMessage({ type: 'copyShortHash', hash: commit.hash });
      } else if (action === 'copy-subject') {
        vscode.postMessage({ type: 'copySubject', hash: commit.hash });
      } else if (action === 'copy-diff-stat-summary') {
        vscode.postMessage({ type: 'copyDiffStatSummary', hash: commit.hash });
      } else if (action === 'copy-oneline') {
        vscode.postMessage({ type: 'copyOneline', hash: commit.hash });
      } else if (action === 'copy-commit-body') {
        vscode.postMessage({ type: 'copyCommitBody', hash: commit.hash });
      } else if (action === 'copy-markdown') {
        vscode.postMessage({ type: 'copyCommitMarkdown', hash: commit.hash });
      } else if (action === 'copy-json') {
        vscode.postMessage({ type: 'copyCommitJson', hash: commit.hash });
      } else if (action === 'copy-co-authors') {
        vscode.postMessage({ type: 'copyCoAuthors', hash: commit.hash });
      } else if (action === 'copy-commit-date') {
        vscode.postMessage({ type: 'copyCommitDate', hash: commit.hash });
      } else if (action === 'copy-relative-date') {
        vscode.postMessage({ type: 'copyRelativeDate', hash: commit.hash });
      } else if (action === 'copy-branch-name') {
        handleCopyBranchName();
      } else if (action === 'copy-branch-url') {
        handleCopyBranchUrl();
      } else if (action === 'copy-remote-url') {
        handleCopyRemoteUrl();
      } else if (action === 'copy-tags') {
        handleCopyTags();
      } else if (action === 'create-branch') {
        handleCreateBranch();
      } else if (action === 'create-tag') {
        handleCreateTag();
      } else if (action === 'delete-tag') {
        handleDeleteTag();
      } else if (action === 'copy-selected-hashes') {
        handleCopySelectedHashes();
      } else if (action === 'copy-combined-diff') {
        handleCopyCombinedDiff();
      } else if (action === 'copy-range-diff') {
        handleCopyRangeDiff();
      } else if (action === 'compare-parent') {
        vscode.postMessage({ type: 'quickCompare', hash: commit.hash });
      }
      menu.remove();
    });
  });

  // Close menu when clicking outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusClass(status) {
  switch (status) {
    case 'A': return 'added';
    case 'M': return 'modified';
    case 'D': return 'deleted';
    case 'R': return 'renamed';
    case 'C': return 'copied';
    default: return '';
  }
}

function getStatusLabel(status) {
  switch (status) {
    case 'A': return '+';
    case 'M': return 'M';
    case 'D': return '-';
    case 'R': return 'R';
    case 'C': return 'C';
    default: return status;
  }
}

function formatDate(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today: show time (e.g., "Today 2:30 PM")
    return `Today ${formatTime(date)}`;
  } else if (diffDays === 1) {
    // Yesterday: show time (e.g., "Yesterday 3:45 PM")
    return `Yesterday ${formatTime(date)}`;
  } else if (diffDays < 7) {
    // 2-6 days: show days ago (e.g., "3 days ago")
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    // 1-4 weeks: show weeks ago (e.g., "2 weeks ago")
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format commit statistics for display in the stats column
 * @param {Object} stats - Commit stats object with filesChanged, insertions, deletions
 * @returns {string} HTML string with formatted stats
 */
function formatCommitStats(stats) {
  if (!stats) {
    return '<span class="stats-empty">-</span>';
  }

  const { filesChanged, insertions, deletions } = stats;

  // Format: files | +insertions -deletions (compact view)
  let html = '';

  if (filesChanged > 0) {
    html += `<span class="stats-files">${filesChanged}</span>`;
  }

  if (insertions > 0 || deletions > 0) {
    html += '<span class="stats-changes">';
    if (insertions > 0) {
      html += `<span class="stats-insertions">+${insertions}</span>`;
    }
    if (deletions > 0) {
      html += `<span class="stats-deletions">-${deletions}</span>`;
    }
    html += '</span>';
  }

  // If there are no changes (e.g., merge commit with no actual file changes to this file)
  if (!html) {
    html = '<span class="stats-empty">-</span>';
  }

  return html;
}

function showError(message) {
  diffViewer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-text">${escapeHtml(message)}</div>
    </div>
  `;
}

function handleSearch(e) {
  searchQuery = e.target.value.trim();
  focusedIndex = -1; // Reset keyboard focus on search change
  renderCommits();
  updateCommitCount();
  renderFilterBadges();
  updateRegexValidation();
  vscode.postMessage({ type: 'saveSettings', settings: { searchQuery } });
}

async function handleRefresh() {
  if (isRefreshing) return;
  isRefreshing = true;
  if (refreshBtn) {
    refreshBtn.classList.add('spinning');
    refreshBtn.disabled = true;
  }

  vscode.postMessage({ type: 'requestRefresh' });

  await new Promise(resolve => setTimeout(resolve, 500));

  isRefreshing = false;
  if (refreshBtn) {
    refreshBtn.classList.remove('spinning');
    refreshBtn.disabled = false;
  }
}

function handleCopyMessage() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitMessage', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitMessage', hash });
  } else {
    showError('Select a commit to copy its message');
  }
}

function handleCopyHash() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitHash', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitHash', hash });
  } else {
    showError('Select a commit to copy its hash');
  }
}

function handleCopyInfo() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitInfo', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitInfo', hash });
  } else {
    showError('Select a commit to copy its info');
  }
}

function handleCopyCherryPick() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCherryPickCommand', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCherryPickCommand', hash });
  } else {
    showError('Select a commit to copy cherry-pick command');
  }
}

function handleCopyRevert() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyRevertCommand', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyRevertCommand', hash });
  } else {
    showError('Select a commit to copy revert command');
  }
}

function handleCopyFiles() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitFiles', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitFiles', hash });
  } else {
    showError('Select a commit to copy its file list');
  }
}

function handleCopyDiff() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitDiff', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitDiff', hash });
  } else {
    showError('Select a commit to copy its diff');
  }
}

function handleCopyCombinedDiff() {
  const hashes = [...selectedCommits];
  if (hashes.length < 2) {
    showError('Select at least 2 commits (Ctrl+click) to copy combined diff');
    return;
  }
  vscode.postMessage({ type: 'copyCombinedDiff', hashes });
}

function handleCopyRangeDiff() {
  if (rangeSelectionAnchor && rangeSelectionTarget) {
    vscode.postMessage({ type: 'copyRangeDiff', fromHash: rangeSelectionAnchor, toHash: rangeSelectionTarget });
  } else {
    showError('Select a range of commits (Shift+click) to copy range diff');
  }
}

function handleCopyPatch() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitPatch', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitPatch', hash });
  } else {
    showError('Select a commit to copy its patch');
  }
}

function handleCopyUrl() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitUrl', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitUrl', hash });
  } else {
    showError('Select a commit to copy its URL');
  }
}

function handleCopyMention() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitMention', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitMention', hash });
  } else {
    showError('Select a commit to copy mention');
  }
}

function handleCopyRef() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitRef', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitRef', hash });
  } else {
    showError('Select a commit to copy reference');
  }
}

function handleCopyBranchName() {
  if (!currentBranch) {
    showError('No branch detected');
    return;
  }
  vscode.postMessage({ type: 'copyBranchName' });
}

function handleCopyBranchUrl() {
  if (!currentBranch) {
    showError('No branch detected');
    return;
  }
  vscode.postMessage({ type: 'copyBranchUrl' });
}

function handleCopyRemoteUrl() {
  vscode.postMessage({ type: 'copyRemoteUrl' });
}

function handleCopyTags() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy tags');
    return;
  }

  vscode.postMessage({ type: 'copyTags', hash: targetCommit.hash });
}

function handleCopyAuthorEmail() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy author email');
    return;
  }

  vscode.postMessage({
    type: 'copyAuthorEmail',
    hash: targetCommit.hash
  });
}

function handleCopyAuthorName() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy author name');
    return;
  }

  vscode.postMessage({
    type: 'copyAuthorName',
    hash: targetCommit.hash
  });
}

function handleCopyParentHash() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy parent hash');
    return;
  }

  vscode.postMessage({
    type: 'copyParentHash',
    hash: targetCommit.hash
  });
}

function handleCopyShortHash() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy short hash');
    return;
  }

  vscode.postMessage({
    type: 'copyShortHash',
    hash: targetCommit.hash
  });
}

function handleCopySubject() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy subject');
    return;
  }

  vscode.postMessage({
    type: 'copySubject',
    hash: targetCommit.hash
  });
}

function handleCopyDiffStatSummary() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy diff stat summary');
    return;
  }

  vscode.postMessage({
    type: 'copyDiffStatSummary',
    hash: targetCommit.hash
  });
}

function handleCopyFilterQuery() {
  const filterState = {
    query: searchInput.value,
    hideMergeCommits: hideMergeCommits,
    sortMode: sortMode,
    showMyCommitsOnly: showMyCommitsOnly,
    regexSearchEnabled: regexSearchEnabled,
    pathFilter: pathFilter
  };
  vscode.postMessage({ type: 'copyFilterQuery', filterState });
}

function handlePasteFilterQuery() {
  vscode.postMessage({ type: 'pasteFilterQuery' });
}

function applyFilterQuery(filterState) {
  if (!filterState || typeof filterState !== 'object') {
    return;
  }

  if (typeof filterState.query === 'string') {
    searchInput.value = filterState.query;
    searchQuery = filterState.query;
  }
  if (typeof filterState.hideMergeCommits === 'boolean') {
    hideMergeCommits = filterState.hideMergeCommits;
    if (mergeToggleBtn) {
      if (hideMergeCommits) {
        mergeToggleBtn.classList.add('active');
        mergeToggleBtn.title = 'Merge commits hidden (click to show)';
      } else {
        mergeToggleBtn.classList.remove('active');
        mergeToggleBtn.title = 'Hide merge commits';
      }
    }
  }
  if (typeof filterState.sortMode === 'number' && filterState.sortMode >= 0 && filterState.sortMode <= 3) {
    sortMode = filterState.sortMode;
    updateSortButton();
  }
  if (typeof filterState.showMyCommitsOnly === 'boolean') {
    showMyCommitsOnly = filterState.showMyCommitsOnly;
    if (myCommitsBtn) {
      if (showMyCommitsOnly) {
        myCommitsBtn.classList.add('active');
        myCommitsBtn.title = 'Showing only my commits (click to show all)';
      } else {
        myCommitsBtn.classList.remove('active');
        myCommitsBtn.title = 'Show only my commits (Ctrl+Shift+M)';
      }
    }
  }
  if (typeof filterState.regexSearchEnabled === 'boolean') {
    regexSearchEnabled = filterState.regexSearchEnabled;
    if (regexToggleBtn) {
      regexToggleBtn.classList.toggle('active', regexSearchEnabled);
    }
  }
  if (typeof filterState.pathFilter === 'string' || filterState.pathFilter === null) {
    pathFilter = filterState.pathFilter;
  }

  focusedIndex = -1;
  renderCommits();
  updateCommitCount();
  renderFilterBadges();
}

function handleCopyOneline() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy as oneline');
    return;
  }

  vscode.postMessage({
    type: 'copyOneline',
    hash: targetCommit.hash
  });
}

function handleCopyCommitBody() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy body');
    return;
  }

  vscode.postMessage({
    type: 'copyCommitBody',
    hash: targetCommit.hash
  });
}

function handleCopyMarkdown() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy as Markdown');
    return;
  }

  vscode.postMessage({
    type: 'copyCommitMarkdown',
    hash: targetCommit.hash
  });
}

function handleCopyJson() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy as JSON');
    return;
  }

  vscode.postMessage({
    type: 'copyCommitJson',
    hash: targetCommit.hash
  });
}

function handleCopyCoAuthors() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy co-authors');
    return;
  }

  vscode.postMessage({
    type: 'copyCoAuthors',
    hash: targetCommit.hash
  });
}

function handleCopyCommitDate() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy its date');
    return;
  }

  vscode.postMessage({
    type: 'copyCommitDate',
    hash: targetCommit.hash
  });
}

function handleCopyRelativeDate() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy its relative date');
    return;
  }

  vscode.postMessage({
    type: 'copyRelativeDate',
    hash: targetCommit.hash
  });
}

function handleCreateBranch() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to create a branch from');
    return;
  }

  vscode.postMessage({
    type: 'createBranch',
    hash: targetCommit.hash
  });
}

function handleCreateTag() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to create a tag from');
    return;
  }

  vscode.postMessage({
    type: 'createTag',
    hash: targetCommit.hash
  });
}

function handleDeleteTag() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to delete tags from');
    return;
  }

  if (!targetCommit.tags || targetCommit.tags.length === 0) {
    showError('This commit has no tags');
    return;
  }

  vscode.postMessage({
    type: 'deleteTag',
    hash: targetCommit.hash
  });
}

function handleDeleteBranch() {
  if (!_allBranches || _allBranches.length === 0) {
    showError('No branches available');
    return;
  }

  // Filter to local branches only (exclude remotes)
  const localBranches = _allBranches.filter(b => !b.startsWith('remotes/'));

  if (localBranches.length === 0) {
    showError('No local branches available');
    return;
  }

  // Show a modal to select branch to delete
  const modal = document.createElement('div');
  modal.id = 'delete-branch-modal';
  modal.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content delete-branch-content';

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Delete Branch';
  content.appendChild(title);

  const list = document.createElement('div');
  list.className = 'branch-list';

  localBranches.forEach(branch => {
    const item = document.createElement('div');
    item.className = 'branch-item';
    if (branch === currentBranch) {
      item.classList.add('current-branch');
      item.textContent = '✓ ' + branch + ' (current)';
      item.title = 'Cannot delete current branch';
    } else {
      item.textContent = branch;
      item.addEventListener('click', () => {
        closeModal();
        vscode.postMessage({ type: 'deleteBranch', branch: branch });
      });
    }
    list.appendChild(item);
  });

  content.appendChild(list);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn';
  closeBtn.textContent = 'Cancel';
  closeBtn.addEventListener('click', closeModal);
  content.appendChild(closeBtn);

  modal.appendChild(content);
  document.body.appendChild(modal);

  function closeModal() {
    modal.remove();
  }

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close on Escape
  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleKeyDown);
    }
  }
  document.addEventListener('keydown', handleKeyDown);
}

function handleCopySelectedHashes() {
  const displayCommits = getOrderedCommits(getFilteredCommits());

  // Get hashes from selected commits
  const selectedHashes = [...selectedCommits];

  if (selectedHashes.length === 0) {
    // Fall back to focused commit
    if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
      const commit = displayCommits[focusedIndex];
      vscode.postMessage({ type: 'copyCommitHash', hash: commit.hash });
    } else {
      showError('Select a commit to copy its hash');
    }
  } else if (selectedHashes.length === 1) {
    // Fall back to single hash copy
    vscode.postMessage({ type: 'copyCommitHash', hash: selectedHashes[0] });
  } else {
    // Copy all selected hashes as newline-separated list
    // Reorder to match display order (newest first)
    const orderedHashes = selectedHashes
      .map(hash => displayCommits.find(c => c.hash === hash))
      .filter(Boolean)
      .map(c => c.hash);

    vscode.postMessage({ type: 'copySelectedHashes', hashes: orderedHashes });
  }
}

function handleCopyStats() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;

  // Prioritize focused row, then selected commit
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }

  if (!targetCommit) {
    showError('Select a commit to copy its stats');
    return;
  }

  if (!targetCommit.stats) {
    showError('No stats available for this commit');
    return;
  }

  vscode.postMessage({
    type: 'copyCommitStats',
    hash: targetCommit.hash
  });
}

// ─── Export Commits ───────────────────────────────────────────────────────────

function handleExportCommits() {
  const filteredCommits = getFilteredCommits();
  if (filteredCommits.length === 0) {
    showError('No commits to export');
    return;
  }

  // Show format selection modal
  showExportFormatDialog(filteredCommits);
}

function showExportFormatDialog(commitsToExport) {
  const existingModal = document.getElementById('export-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const orderedCommits = getOrderedCommits(commitsToExport);
  const mboxDisabled = orderedCommits.length < 2;

  const modal = document.createElement('div');
  modal.id = 'export-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content export-modal-content">
      <div class="modal-header">
        <span class="modal-title">Export ${commitsToExport.length} Commit${commitsToExport.length !== 1 ? 's' : ''}</span>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <p class="export-description">Choose export format:</p>
        <div class="export-options">
          <button class="export-option-btn" data-format="json">
            <span class="export-option-icon">{}</span>
            <span class="export-option-label">JSON</span>
            <span class="export-option-desc">Full commit data with stats and tags</span>
          </button>
          <button class="export-option-btn" data-format="csv">
            <span class="export-option-icon">📊</span>
            <span class="export-option-label">CSV</span>
            <span class="export-option-desc">Spreadsheet format for analysis</span>
          </button>
          <button class="export-option-btn" data-format="markdown">
            <span class="export-option-icon">📝</span>
            <span class="export-option-label">Markdown</span>
            <span class="export-option-desc">Changelog format for documentation</span>
          </button>
          <button class="export-option-btn${mboxDisabled ? ' disabled' : ''}" data-format="mbox" ${mboxDisabled ? 'disabled' : ''} title="${mboxDisabled ? 'Select 2+ commits to enable' : 'Export as mbox for email/git am'}">
            <span class="export-option-icon">📧</span>
            <span class="export-option-label">mbox${mboxDisabled ? ' (2+ commits)' : ''}</span>
            <span class="export-option-desc">RFC 822 patches for email clients and git am</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const overlay = modal.querySelector('.modal-overlay');
  const closeBtn = modal.querySelector('.modal-close');

  const closeModal = () => modal.remove();

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  modal.querySelectorAll('.export-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      if (format === 'mbox') {
        const fromHash = orderedCommits[0].hash;
        const toHash = orderedCommits[orderedCommits.length - 1].hash;
        vscode.postMessage({
          type: 'exportCommitsMbox',
          fromHash,
          toHash
        });
      } else {
        vscode.postMessage({
          type: 'exportCommits',
          format,
          commits: commitsToExport
        });
      }
      closeModal();
    });
  });

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function handleQuickCompare() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetHash = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetHash = displayCommits[focusedIndex].hash;
  } else if (selectedCommits.size === 1) {
    targetHash = [...selectedCommits][0];
  }

  if (targetHash) {
    vscode.postMessage({ type: 'quickCompare', hash: targetHash });
  }
}

// ─── Jump to Hash ───────────────────────────────────────────────────────────────

function showJumpToHashDialog() {
  const existingModal = document.getElementById('jump-to-hash-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'jump-to-hash-modal';
  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">Jump to Commit</span>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <input type="text" id="jump-to-hash-input" class="jump-to-hash-input" placeholder="Paste commit hash (full or short)..." autofocus>
        <div id="jump-to-hash-results" class="jump-to-hash-results"></div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = document.getElementById('jump-to-hash-input');
  const results = document.getElementById('jump-to-hash-results');
  const overlay = modal.querySelector('.modal-overlay');
  const closeBtn = modal.querySelector('.modal-close');

  const closeModal = () => modal.remove();

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    if (!query) {
      results.innerHTML = '';
      return;
    }

    const matches = commits.filter(c =>
      c.hash.toLowerCase().startsWith(query) ||
      c.shortHash.toLowerCase() === query
    ).slice(0, 5);

    if (matches.length === 0) {
      results.innerHTML = '<div class="jump-no-results">No matching commit found</div>';
      return;
    }

    results.innerHTML = matches.map(commit => `
      <div class="jump-result-item" data-hash="${commit.hash}">
        <span class="jump-result-hash">${commit.shortHash}</span>
        <span class="jump-result-message">${escapeHtml(truncate(commit.message, 40))}</span>
      </div>
    `).join('');

    results.querySelectorAll('.jump-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const hash = item.dataset.hash;
        closeModal();
        scrollToCommitByHash(hash);
      });
    });
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const firstResult = results.querySelector('.jump-result-item');
      if (firstResult) {
        firstResult.click();
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  input.focus();
}

function scrollToCommitByHash(hash) {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  const index = displayCommits.findIndex(c => c.hash === hash || c.shortHash === hash);
  if (index >= 0) {
    focusedIndex = index;
    updateFocusedRow();
    selectCommit(hash);
    scrollFocusedIntoView();
  } else {
    showError('Commit not found in current list');
  }
}

// ─── Keyboard Help Dialog ────────────────────────────────────────────────────

/**
 * Show keyboard shortcuts help dialog
 */
function showKeyboardHelpDialog() {
  const existingModal = document.getElementById('keyboard-help-modal');
  if (existingModal) {
    existingModal.remove();
    return;
  }

  const isMac = navigator.platform.toLowerCase().includes('mac');
  const cmdKey = isMac ? 'Cmd' : 'Ctrl';
  const altKey = isMac ? 'Option' : 'Alt';

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['↑', '↓'], description: 'Navigate up/down through commits' },
        { keys: ['Home'], description: 'Jump to first commit' },
        { keys: ['End'], description: 'Jump to last commit' },
        { keys: ['Enter'], description: 'Select focused commit' },
        { keys: ['Shift', 'Enter'], description: 'Select range from anchor to focused' },
        { keys: [cmdKey, 'Enter'], description: 'Add/remove from multi-selection' },
        { keys: [cmdKey, 'A'], description: 'Select all visible commits' },
        { keys: ['?'], description: 'Show this help dialog' },
        { keys: ['Esc'], description: 'Clear selection and close dialogs' }
      ]
    },
    {
      category: 'Search & Filter',
      items: [
        { keys: ['/'], description: 'Focus search input' },
        { keys: [cmdKey, 'F'], description: 'Focus search input' },
        { keys: [cmdKey, 'Shift', 'X'], description: 'Toggle regex search mode' },
        { keys: [cmdKey, 'G'], description: 'Jump to commit by hash' },
        { keys: [cmdKey, 'Shift', 'Q'], description: 'Toggle hide merge commits' },
        { keys: [cmdKey, 'Alt', 'S'], description: 'Show branch picker' }
      ]
    },
    {
      category: 'View Options',
      items: [
        { keys: [cmdKey, 'Shift', 'W'], description: 'Toggle word wrap' },
        { keys: [cmdKey, 'Shift', 'M'], description: 'Toggle my commits filter' },
        { keys: [cmdKey, 'Alt', 'P'], description: 'Quick compare with parent' },
        { keys: [cmdKey, 'Shift', 'J'], description: 'Toggle ignore whitespace' },
        { keys: [cmdKey, 'Shift', '/'], description: 'Cycle diff context lines' },
        { keys: [cmdKey, 'Shift', '3'], description: 'Cycle sort mode (Newest/Oldest/Author A-Z/Author Z-A)' },
        { keys: [cmdKey, altKey, 'T'], description: 'Toggle commit graph' }
      ]
    },
    {
      category: 'Copy Commands',
      items: [
        { keys: [cmdKey, 'Shift', 'C'], description: 'Copy commit message' },
        { keys: [cmdKey, 'Shift', 'H'], description: 'Copy commit hash' },
        { keys: [cmdKey, 'Shift', 'I'], description: 'Copy commit info' },
        { keys: [cmdKey, 'Shift', 'P'], description: 'Copy cherry-pick command' },
        { keys: [cmdKey, 'Shift', 'U'], description: 'Copy revert command' },
        { keys: [cmdKey, 'Shift', 'F'], description: 'Copy changed files' },
        { keys: [cmdKey, 'Shift', 'D'], description: 'Copy commit diff' },
        { keys: [cmdKey, 'Alt', 'D'], description: 'Copy combined diff (multi-select)' },
        { keys: [cmdKey, 'Alt', 'R'], description: 'Copy range diff (range select)' },
        { keys: [cmdKey, 'Shift', 'E'], description: 'Copy commit as patch' },
        { keys: [cmdKey, 'Shift', 'L'], description: 'Copy commit URL' },
        { keys: [cmdKey, 'Shift', 'S'], description: 'Copy commit stats' },
        { keys: [cmdKey, 'Alt', 'B'], description: 'Copy branch name' },
        { keys: [cmdKey, 'Alt', 'U'], description: 'Copy branch URL' },
        { keys: [cmdKey, 'Alt', 'O'], description: 'Copy remote URL' },
        { keys: [cmdKey, 'Shift', 'A'], description: 'Copy author email' },
        { keys: [cmdKey, 'Shift', 'N'], description: 'Copy author name' },
        { keys: [cmdKey, 'Shift', 'V'], description: 'Copy parent hash' },
        { keys: [cmdKey, 'Shift', '7'], description: 'Copy short hash' },
        { keys: [cmdKey, 'Shift', '6'], description: 'Copy commit subject' },
        { keys: [cmdKey, 'Shift', 'T'], description: 'Copy commit date' },
        { keys: [cmdKey, 'Shift', '8'], description: 'Copy relative date' },
        { keys: [cmdKey, 'Shift', 'K'], description: 'Copy co-authors' },
        { keys: [cmdKey, 'Shift', ';'], description: 'Copy selected hashes' },
        { keys: [cmdKey, 'Shift', 'G'], description: 'Copy tags' },
        { keys: [cmdKey, 'Shift', 'Y'], description: 'Copy as oneline' },
        { keys: [cmdKey, 'Shift', 'Z'], description: 'Copy commit body' },
        { keys: [cmdKey, 'Alt', 'M'], description: 'Copy as Markdown' },
        { keys: [cmdKey, 'Alt', 'J'], description: 'Copy as JSON' },
        { keys: [cmdKey, 'Shift', '9'], description: 'Copy diff stat summary' },
        { keys: [cmdKey, 'Shift', '5'], description: 'Copy filter query' },
        { keys: [cmdKey, 'Shift', '4'], description: 'Paste filter query from clipboard' },
        { keys: [cmdKey, 'Shift', '.'], description: 'Copy file path' },
        { keys: [cmdKey, 'Shift', ','], description: 'Copy file name' },
        { keys: [cmdKey, 'Alt', 'E'], description: 'Copy file extension' },
        { keys: [cmdKey, 'Alt', 'K'], description: 'Copy file directory' },
        { keys: [cmdKey, 'Alt', 'L'], description: 'Copy relative path' },
        { keys: [cmdKey, 'Shift', '@'], description: 'Copy as platform mention (owner/repo@hash)' },
        { keys: [cmdKey, 'Shift', ']'], description: 'Copy commit reference (refs/commit/<hash>)' },
        { keys: [cmdKey, 'Alt', 'Shift', 'U'], description: 'Copy file permalink' },
        { keys: [cmdKey, 'Alt', 'G'], description: 'Copy as Git Describe' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: [cmdKey, 'Shift', 'R'], description: 'Refresh history' },
        { keys: [cmdKey, 'Alt', 'Q'], description: 'Clear all filters' },
        { keys: [cmdKey, 'Shift', 'O'], description: 'Export filtered commits' },
        { keys: [cmdKey, 'Shift', '0'], description: 'Save filter preset' },
        { keys: [cmdKey, 'Shift', '1'], description: 'Load filter preset' },
        { keys: [cmdKey, 'K', cmdKey, 'O'], description: 'Open commit URL in browser' },
        { keys: [cmdKey, 'K', cmdKey, 'P'], description: 'Open file URL in browser' },
        { keys: [cmdKey, 'Alt', 'X'], description: 'Delete local branch' }
      ]
    }
  ];

  const modal = document.createElement('div');
  modal.id = 'keyboard-help-modal';

  const formatKey = (key) => {
    const isModifier = key === 'Cmd' || key === 'Ctrl' || key === 'Shift' || key === 'Alt' || key === 'Option';
    return `<span class="keyboard-help-key ${isModifier ? 'modifier' : ''}">${escapeHtml(key)}</span>`;
  };

  const formatShortcut = (item) => {
    const keysHtml = item.keys.map((key, index) => {
      const keyHtml = formatKey(key);
      const plusHtml = index < item.keys.length - 1 ? '<span class="keyboard-help-plus">+</span>' : '';
      return keyHtml + plusHtml;
    }).join('');

    return `
      <div class="keyboard-help-row">
        <span class="keyboard-help-description">${escapeHtml(item.description)}</span>
        <span class="keyboard-help-keys">${keysHtml}</span>
      </div>
    `;
  };

  const sectionsHtml = shortcuts.map(section => `
    <div class="keyboard-help-section">
      <div class="keyboard-help-section-title">${escapeHtml(section.category)}</div>
      ${section.items.map(formatShortcut).join('')}
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">⌨️ Keyboard Shortcuts</span>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${sectionsHtml}
        <div class="keyboard-help-footer">
          Tip: Right-click on commits and files for additional options
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const overlay = modal.querySelector('.modal-overlay');
  const closeBtn = modal.querySelector('.modal-close');

  const closeModal = () => modal.remove();

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  // Close on Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

// ─── First-Run Tip Banner ────────────────────────────────────────────────────────

/**
 * Show the first-run welcome tip banner
 */
function showFirstRunTipBanner() {
  // Don't show if already visible
  if (firstRunTipVisible) {
    return;
  }

  // Remove any existing banner
  const existingBanner = document.getElementById('first-run-tip-banner');
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement('div');
  banner.id = 'first-run-tip-banner';
  banner.className = 'first-run-tip-banner';
  banner.innerHTML = `
    <div class="first-run-tip-content">
      <div class="first-run-tip-icon">💡</div>
      <div class="first-run-tip-text">
        <div class="first-run-tip-title">Welcome to Git History!</div>
        <div class="first-run-tip-message">Press <kbd>?</kbd> anytime to see keyboard shortcuts</div>
      </div>
      <button class="first-run-tip-dismiss" title="Dismiss this tip">Got it</button>
    </div>
  `;

  // Insert at the top of #app
  const app = document.getElementById('app');
  if (app) {
    app.insertBefore(banner, app.firstChild);
    firstRunTipVisible = true;
  }

  // Add click handler for dismiss button
  const dismissBtn = banner.querySelector('.first-run-tip-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', dismissFirstRunTip);
  }
}

/**
 * Dismiss the first-run welcome tip banner
 */
function dismissFirstRunTip() {
  const banner = document.getElementById('first-run-tip-banner');
  if (banner) {
    banner.remove();
  }
  firstRunTipVisible = false;

  // Notify extension to mark tip as shown
  vscode.postMessage({ type: 'dismissFirstRunTip' });
}

function handleCopyFileName() {
  if (!selectedFile) {
    showError('Select a file to copy its name');
    return;
  }
  vscode.postMessage({ type: 'copyFileName', filePath: selectedFile });
}

function handleCopyExtension() {
  if (!selectedFile) {
    showError('Select a file to copy its extension');
    return;
  }
  vscode.postMessage({ type: 'copyFileExtension', filePath: selectedFile });
}

function handleCopyFileDirectory() {
  if (!selectedFile) {
    showError('Select a file to copy its directory');
    return;
  }
  vscode.postMessage({ type: 'copyFileDirectory', filePath: selectedFile });
}

function handleCopyFilePath() {
  if (!selectedFile) {
    showError('Select a file to copy its path');
    return;
  }
  vscode.postMessage({ type: 'copyFilePath', filePath: selectedFile });
}

function handleCopyRelativePath() {
  if (!selectedFile) {
    showError('Select a file to copy its relative path');
    return;
  }
  vscode.postMessage({ type: 'copyRelativePath', filePath: selectedFile });
}

function handleCopyFileDiff() {
  if (!selectedFile) {
    showError('Select a file to copy its diff');
    return;
  }
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }
  if (!targetCommit) {
    showError('Select a commit to copy its file diff');
    return;
  }
  vscode.postMessage({ type: 'copyFileDiff', hash: targetCommit.hash, filePath: selectedFile });
}

function handleCopyFileContent() {
  if (!selectedFile) {
    showError('Select a file to copy its content');
    return;
  }
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }
  if (!targetCommit) {
    showError('Select a commit to copy file content');
    return;
  }
  vscode.postMessage({ type: 'copyFileContent', hash: targetCommit.hash, filePath: selectedFile });
}

function handleCopyFileUrl() {
  if (!selectedFile) {
    showError('Select a file to copy its URL');
    return;
  }
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }
  if (!targetCommit) {
    showError('Select a commit to copy file URL');
    return;
  }
  vscode.postMessage({ type: 'copyFileUrl', hash: targetCommit.hash, filePath: selectedFile });
}

function handleOpenUrl() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    const commit = displayCommits[focusedIndex];
    vscode.postMessage({ type: 'openCommitUrl', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'openCommitUrl', hash });
  } else {
    showError('Select a commit to open its URL');
  }
}

function handleOpenFileUrl() {
  if (!selectedFile) {
    showError('Select a file to open its URL');
    return;
  }
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }
  if (!targetCommit) {
    showError('Select a commit to open file URL');
    return;
  }
  vscode.postMessage({ type: 'openFileUrl', hash: targetCommit.hash, filePath: selectedFile });
}

function handleCopyDescribe() {
  const displayCommits = getOrderedCommits(getFilteredCommits());
  let targetCommit = null;
  if (focusedIndex >= 0 && focusedIndex < displayCommits.length) {
    targetCommit = displayCommits[focusedIndex];
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    targetCommit = displayCommits.find(c => c.hash === hash);
  }
  if (!targetCommit) {
    showError('Select a commit to copy git describe');
    return;
  }
  vscode.postMessage({ type: 'copyDescribe', hash: targetCommit.hash });
}

// ─── Filter Presets ───────────────────────────────────────────────────────────────

function showSavePresetDialog() {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.id = 'preset-save-modal';
  modal.className = 'preset-save-modal';
  modal.innerHTML = `
    <div class="preset-save-content">
      <h3>Save Filter Preset</h3>
      <input type="text" id="preset-name-input" class="preset-save-input" placeholder="Preset name (max 50 chars)" maxlength="50">
      <div class="preset-save-buttons">
        <button id="preset-save-cancel" class="preset-save-cancel">Cancel</button>
        <button id="preset-save-confirm" class="preset-save-confirm">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const input = modal.querySelector('#preset-name-input');
  const cancelBtn = modal.querySelector('#preset-save-cancel');
  const confirmBtn = modal.querySelector('#preset-save-confirm');

  // Focus input
  setTimeout(() => input.focus(), 50);

  // Handle enter key
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      confirmBtn.click();
    } else if (e.key === 'Escape') {
      modal.remove();
    }
  });

  // Handle cancel
  cancelBtn.addEventListener('click', () => {
    modal.remove();
  });

  // Handle save
  confirmBtn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) {
      showError('Preset name cannot be empty');
      return;
    }

    const filterState = {
      query: searchQuery,
      hideMergeCommits: hideMergeCommits,
      sortMode: sortMode,
      showMyCommitsOnly: showMyCommitsOnly
    };

    vscode.postMessage({
      type: 'saveFilterPreset',
      name: name,
      filterState: filterState
    });

    modal.remove();
  });

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function savePreset(name) {
  const filterState = {
    query: searchQuery,
    hideMergeCommits: hideMergeCommits,
    sortMode: sortMode,
    showMyCommitsOnly: showMyCommitsOnly
  };

  vscode.postMessage({
    type: 'saveFilterPreset',
    name: name,
    filterState: filterState
  });
}

function showPresetDropdown() {
  presetDropdownVisible = !presetDropdownVisible;
  renderPresetDropdown();
}

function loadPreset(preset) {
  vscode.postMessage({
    type: 'applyPreset',
    presetName: preset.name
  });
  presetDropdownVisible = false;
  renderPresetDropdown();
}

function deletePreset(name) {
  vscode.postMessage({
    type: 'deleteFilterPreset',
    name: name
  });
}

function renderPresetDropdown() {
  // Remove existing dropdown
  const existing = document.getElementById('preset-dropdown-menu');
  if (existing) {
    existing.remove();
  }

  if (!presetDropdownVisible) {
    return;
  }

  const btn = document.getElementById('preset-dropdown-btn');
  if (!btn) {
    return;
  }

  const dropdown = document.createElement('div');
  dropdown.id = 'preset-dropdown-menu';
  dropdown.className = 'preset-dropdown-menu';

  if (savedPresets.length === 0) {
    dropdown.innerHTML = '<div class="preset-dropdown-empty">No saved presets</div>';
  } else {
    savedPresets.forEach(preset => {
      const item = document.createElement('div');
      item.className = 'preset-dropdown-item';

      const summary = getPresetSummary(preset);
      const content = document.createElement('div');
      content.className = 'preset-item-content';
      content.innerHTML = `
        <div class="preset-name">${escapeHtml(preset.name)}</div>
        <div class="preset-summary">${summary}</div>
      `;

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'preset-delete-btn';
      deleteBtn.innerHTML = '×';
      deleteBtn.title = 'Delete preset';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePreset(preset.name);
      });

      item.appendChild(content);
      item.appendChild(deleteBtn);
      item.addEventListener('click', () => loadPreset(preset));

      dropdown.appendChild(item);
    });
  }

  // Position dropdown below the button
  const rect = btn.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + 5}px`;
  dropdown.style.left = `${rect.left}px`;

  document.body.appendChild(dropdown);

  // Close dropdown when clicking outside
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!dropdown.contains(e.target) && e.target !== btn) {
        dropdown.remove();
        presetDropdownVisible = false;
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 0);
}

function getPresetSummary(preset) {
  const parts = [];
  if (preset.filterState.query) {
    parts.push(`"${escapeHtml(preset.filterState.query)}"`);
  }
  if (preset.filterState.hideMergeCommits) {
    parts.push('No Merge');
  }
  if (preset.filterState.showMyCommitsOnly) {
    parts.push('My Commits');
  }
  const sortLabels = ['Newest', 'Oldest', 'A-Z', 'Z-A'];
  if (preset.filterState.sortMode >= 0 && preset.filterState.sortMode < 4) {
    parts.push(sortLabels[preset.filterState.sortMode]);
  }
  return parts.length > 0 ? parts.join(' • ') : 'Default filters';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
init();
