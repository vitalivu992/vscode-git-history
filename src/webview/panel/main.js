// VS Code API
const vscode = acquireVsCodeApi();

// State
let commits = [];
let selectedCommits = new Set();
let currentDiff = '';
let currentDiffType = 'unified'; // 'unified' or 'side-by-side'
let searchQuery = '';
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
let regexErrorMessage = null; // Error message when regex is invalid
let branches = []; // All available branches from init message
let branchCommitHashes = {}; // Map: branchName -> Set of commit hashes
let currentUser = null; // Current git user from git config
let showMyCommitsOnly = false; // Filter to show only my commits
let ignoreWhitespace = false; // Ignore whitespace in diffs
let diffContextLines = 3; // Number of context lines in diffs (1-10)
let commitFilesMap = new Map(); // hash -> CommitFileChange[]
let firstRunTipVisible = false; // First-run tip banner visibility state

let diffSearchHashes = null; // null = not searching, string[] = matching hashes
let diffSearchQuery = ''; // Current diff search query string
let commitListDateFormat = 'relative'; // Commit list date format: 'relative' | 'short' | 'iso'
let sprintLengthWeeks = 2; // Default sprint length for the sprint filter button
let hasMoreCommits = false;
let isLoadingMore = false;
let pageSize = 500;

/**
 * Parse filters from search query
 * Supports: after:YYYY-MM-DD, before:YYYY-MM-DD, last:Ndays/weeks/months, author:name,
 *           tag:name, branch:name, path:name, message:subject-term, body:body-term
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

  const messageMatch = query.match(/message:([^\s]+)/i);
  const messageFilter = messageMatch ? messageMatch[1].toLowerCase() : null;
  if (messageMatch) {
    textQuery = textQuery.replace(messageMatch[0], '').trim();
  }

  const bodyMatch = query.match(/body:([^\s]+)/i);
  const bodyFilter = bodyMatch ? bodyMatch[1].toLowerCase() : null;
  if (bodyMatch) {
    textQuery = textQuery.replace(bodyMatch[0], '').trim();
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
  const lastMatch = query.match(/last:(\d+)\s*(days?|weeks?|months?)/i);
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
  return { textQuery: textQuery.trim(), dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, messageFilter, bodyFilter, lastFilter };
}

/**
 * Check if any filters are active (includes search query, date filters, author/tag/branch/path/message/body filters, merge commits toggle, my commits toggle)
 * @returns {boolean}
 */
function hasActiveFilters() {
  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, messageFilter, bodyFilter } = parseDateFilter(searchQuery);
  return !!(searchQuery || dateFilters.after || dateFilters.before || authorFilter || tagFilter || branchFilter || pathFilter || messageFilter || bodyFilter || showMyCommitsOnly || hideMergeCommits || regexSearchEnabled);
}

function hasActiveDateFilters() {
  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, messageFilter, bodyFilter } = parseDateFilter(searchQuery);
  return !!(dateFilters.after || dateFilters.before || authorFilter || tagFilter || branchFilter || pathFilter || messageFilter || bodyFilter);
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
  sortMode = 0; // Reset to newest first
  diffSearchHashes = null;
  diffSearchQuery = '';

  // Update UI elements
  searchInput.value = '';
  mergeToggleBtn.classList.remove('active');
  regexToggleBtn.classList.remove('active');
  myCommitsBtn.classList.remove('active');
  updateQuickDateFilterButtons();
  updateSortButton();

  // Render commits with no filters
  renderCommits();

  // Update badges and clear all button
  renderFilterBadges();
  updateClearAllButton();

  // Save settings
  vscode.postMessage({ type: 'saveSettings', settings: { sortMode, hideMergeCommits: false, regexSearchEnabled: false, showMyCommitsOnly: false, searchQuery: '' } });
}

function handleDiffSearchClick() {
  // Use a simple prompt-style modal within the webview
  const query = window.prompt('Search within diff content — find commits whose diffs contain:', diffSearchQuery || '');
  if (query === null) { return; } // User cancelled
  if (query.trim() === '') {
    // Empty query clears the filter
    diffSearchHashes = null;
    diffSearchQuery = '';
    renderFilterBadges();
    renderCommits();
    return;
  }

  // Collect all visible commit hashes (excluding diff search filter to get the base set)
  const tempDiffSearch = diffSearchHashes;
  diffSearchHashes = null;
  const visibleCommits = getFilteredCommits();
  diffSearchHashes = tempDiffSearch;

  const commitHashes = visibleCommits.map(c => c.hash);
  if (commitHashes.length === 0) {
    return;
  }

  // Show loading state
  const countEl = document.getElementById('commit-count');
  if (countEl) {
    countEl.textContent = `Searching diffs in ${commitHashes.length} commits...`;
  }

  vscode.postMessage({ type: 'requestDiffSearch', query: query.trim(), commitHashes });
}

function updateQuickDateFilterButtons() {
  const { lastFilter } = parseDateFilter(searchQuery);
  const sprintFilterValue = `last:${sprintLengthWeeks}week${sprintLengthWeeks !== 1 ? 's' : ''}`;
  [todayFilterBtn, sprintFilterBtn].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });
  if (lastFilter === 'last:1day' && todayFilterBtn) {
    todayFilterBtn.classList.add('active');
  } else if (lastFilter === sprintFilterValue && sprintFilterBtn) {
    sprintFilterBtn.classList.add('active');
  }
}

function applyQuickDateFilter(filterValue) {
  const { lastFilter, textQuery } = parseDateFilter(searchQuery);
  const otherParts = textQuery || '';

  if (lastFilter === filterValue) {
    searchQuery = otherParts;
  } else {
    searchQuery = filterValue + (otherParts ? ' ' + otherParts : '');
  }

  searchInput.value = searchQuery;
  focusedIndex = -1;
  updateQuickDateFilterButtons();
  renderCommits();
  updateCommitCount();
  renderFilterBadges();
  updateClearAllButton();
  vscode.postMessage({ type: 'saveSettings', settings: { searchQuery } });
}

/**
 * Render active date filter badges below search input
 */
function renderFilterBadges() {
  const existingBadges = document.querySelector('.filter-badges');
  if (existingBadges) {
    existingBadges.remove();
  }

  const { dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, messageFilter, bodyFilter, lastFilter } = parseDateFilter(searchQuery);
  const hasDateFilters = !!(dateFilters.after || dateFilters.before);
  const hasFilters = hasDateFilters || authorFilter || tagFilter || branchFilter || pathFilter || messageFilter || bodyFilter || lastFilter || diffSearchHashes !== null;

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

  if (messageFilter) {
    const messageBadge = document.createElement('span');
    messageBadge.className = 'filter-badge';
    messageBadge.innerHTML = `message: ${escapeHtml(messageFilter)} <span class="filter-badge-clear" data-filter="message">&times;</span>`;
    badgesContainer.appendChild(messageBadge);
  }

  if (bodyFilter) {
    const bodyBadge = document.createElement('span');
    bodyBadge.className = 'filter-badge';
    bodyBadge.innerHTML = `body: ${escapeHtml(bodyFilter)} <span class="filter-badge-clear" data-filter="body">&times;</span>`;
    badgesContainer.appendChild(bodyBadge);
  }

  if (diffSearchHashes !== null) {
    const diffBadge = document.createElement('span');
    diffBadge.className = 'filter-badge diff-search-badge';
    diffBadge.innerHTML = `diff: ${escapeHtml(diffSearchQuery)} (${diffSearchHashes.length}) <span class="filter-badge-clear" data-filter="diff">&times;</span>`;
    badgesContainer.appendChild(diffBadge);
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
      } else if (filterToRemove === 'message') {
        newQuery = newQuery.replace(/message:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'body') {
        newQuery = newQuery.replace(/body:[^\s]+/i, '').trim();
      } else if (filterToRemove === 'last') {
        newQuery = newQuery.replace(/last:\d+\s*(days?|weeks?|months?)/i, '').trim();
      } else if (filterToRemove === 'diff') {
        diffSearchHashes = null;
        diffSearchQuery = '';
      }

      searchInput.value = newQuery;
      searchQuery = newQuery;
      focusedIndex = -1;
      renderCommits();
      updateCommitCount();
      renderFilterBadges();
      updateQuickDateFilterButtons();
    });
  });
}

// Graph rendering constants
const GRAPH_COLORS = ['#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#ce9178', '#4fc1ff', '#d16969', '#b5cea8'];

// DOM Elements
const diffViewer = document.getElementById('diff-viewer');
const commitList = document.getElementById('commit-list');
const unifiedBtn = document.getElementById('unified-btn');
const sideBySideBtn = document.getElementById('side-by-side-btn');
const fileList = document.getElementById('file-list');
const searchInput = document.getElementById('search-input');
const refreshBtn = document.getElementById('refresh-btn');
const wordWrapBtn = document.getElementById('word-wrap-btn');
const ignoreWsBtn = document.getElementById('ignore-ws-btn');
const contextLinesBtn = document.getElementById('context-lines-btn');
const mergeToggleBtn = document.getElementById('merge-toggle-btn');
const regexToggleBtn = document.getElementById('regex-toggle-btn');
const myCommitsBtn = document.getElementById('my-commits-btn');
const commitCountEl = document.getElementById('commit-count');
const clearAllFiltersBtn = document.getElementById('clear-all-filters-btn');
const todayFilterBtn = document.getElementById('today-filter-btn');
const sprintFilterBtn = document.getElementById('sprint-filter-btn');

let isRefreshing = false;

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
  // Ctrl+Shift+Alt+R: Copy range diff (must precede the plain Ctrl+Shift+R refresh handler)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.key === 'r') {
    e.preventDefault();
    handleCopyRangeDiff();
    return;
  }

  // Ctrl+Shift+R: Refresh
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'r') {
    e.preventDefault();
    handleRefresh();
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

  // Ctrl+Alt+Q: Clear all filters
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'q') {
    e.preventDefault();
    clearAllFilters();
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

  // Ctrl+Shift+L: Copy commit URL
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
    e.preventDefault();
    handleCopyUrl();
    return;
  }

  // Ctrl+Shift+Alt+L: Open commit URL in browser
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.key === 'l') {
    e.preventDefault();
    handleOpenUrl();
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

  // Ctrl+Alt+D: Copy short date (YYYY-MM-DD)
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'd') {
    e.preventDefault();
    handleCopyShortDate();
    return;
  }

  // Ctrl+Alt+P: Quick compare with parent
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'p') {
    e.preventDefault();
    handleCompareWithParent();
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

  // Ctrl+Shift+Alt+J: Toggle ignore whitespace
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.key === 'j') {
    e.preventDefault();
    handleIgnoreWhitespaceToggle();
    return;
  }

  // Ctrl+Shift+Alt+3: Copy trailers (must precede the plain Ctrl+Shift+3 sort handler)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.altKey && e.key === '3') {
    e.preventDefault();
    handleCopyTrailers();
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

  // Ctrl+Shift+3: Cycle sort mode
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '3') {
    e.preventDefault();
    handleSortToggle();
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

    case 'PageDown':
      e.preventDefault();
      const PAGE_SIZE = 10;
      if (focusedIndex < filteredCommits.length - 1) {
        focusedIndex = Math.min(focusedIndex + PAGE_SIZE, filteredCommits.length - 1);
      } else {
        focusedIndex = filteredCommits.length - 1;
      }
      updateFocusedRow();
      scrollFocusedIntoView();
      break;

    case 'PageUp':
      e.preventDefault();
      if (focusedIndex > 0) {
        focusedIndex = Math.max(focusedIndex - PAGE_SIZE, 0);
      } else {
        focusedIndex = 0;
      }
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
  const { textQuery, dateFilters, authorFilter, tagFilter, branchFilter, pathFilter, messageFilter, bodyFilter } = parseDateFilter(searchQuery);

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

  // Apply subject-scoped search filter (message:)
  if (messageFilter) {
    filtered = filtered.filter(commit => isRegexMatch(commit.message, messageFilter));
  }

  // Apply body-scoped search filter (body:)
  if (bodyFilter) {
    filtered = filtered.filter(commit => {
      if (!commit.fullMessage || !commit.message) {
        return false;
      }
      const body = commit.fullMessage.substring(commit.message.length).trim();
      return isRegexMatch(body, bodyFilter);
    });
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

  // Apply diff search filter (commits whose diffs contain the search string)
  if (diffSearchHashes !== null) {
    filtered = filtered.filter(commit => diffSearchHashes.includes(commit.hash));
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

function updateSortHeaders() {
  const dateHeader = document.querySelector('th.sortable[data-sort="date"]');
  const authorHeader = document.querySelector('th.sortable[data-sort="author"]');
  [dateHeader, authorHeader].forEach(th => { if (th) th.classList.remove('sort-asc', 'sort-desc'); });
  switch (sortMode) {
    case 0:
      if (dateHeader) { dateHeader.classList.add('sort-desc'); dateHeader.title = 'Sort: Newest first (click to toggle)'; }
      break;
    case 1:
      if (dateHeader) { dateHeader.classList.add('sort-asc'); dateHeader.title = 'Sort: Oldest first (click to toggle)'; }
      break;
    case 2:
      if (authorHeader) { authorHeader.classList.add('sort-asc'); authorHeader.title = 'Sort: Author A-Z (click to toggle)'; }
      break;
    case 3:
      if (authorHeader) { authorHeader.classList.add('sort-desc'); authorHeader.title = 'Sort: Author Z-A (click to toggle)'; }
      break;
  }
}

function handleSortClick(column) {
  if (column === 'date') {
    sortMode = sortMode === 0 ? 1 : 0;
  } else if (column === 'author') {
    sortMode = sortMode === 2 ? 3 : 2;
  }
  updateSortHeaders();
  focusedIndex = -1;
  renderCommits();
  vscode.postMessage({ type: 'saveSettings', settings: { sortMode } });
}

function handleSortToggle() {
  sortMode = (sortMode + 1) % 4;
  updateSortHeaders();
  focusedIndex = -1;
  renderCommits();
  vscode.postMessage({ type: 'saveSettings', settings: { sortMode } });
}

function handleMergeToggle() {
  hideMergeCommits = !hideMergeCommits;
  if (mergeToggleBtn) {
    if (hideMergeCommits) {
      mergeToggleBtn.classList.add('active');
      mergeToggleBtn.title = 'Merge commits hidden (Ctrl+Shift+Q to toggle)';
    } else {
      mergeToggleBtn.classList.remove('active');
      mergeToggleBtn.title = 'Hide merge commits (Ctrl+Shift+Q)';
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
 * Get the regex error message if the pattern is invalid
 * @param {string} pattern - Regex pattern to validate
 * @returns {string|null} Error message or null if valid
 */
function getRegexError(pattern) {
  if (!regexSearchEnabled || !pattern) return null;
  try {
    new RegExp(pattern);
    return null;
  } catch (e) {
    return e.message;
  }
}

/**
 * Check if the current regex pattern is valid
 * @param {string} pattern - Regex pattern to validate
 * @returns {boolean} True if valid or not in regex mode
 */
function isValidRegex(pattern) {
  return !getRegexError(pattern);
}

/**
 * Toggle regex search mode
 */
function handleRegexToggle() {
  regexSearchEnabled = !regexSearchEnabled;
  if (regexToggleBtn) {
    if (regexSearchEnabled) {
      regexToggleBtn.classList.add('active');
    } else {
      regexToggleBtn.classList.remove('active');
      regexToggleBtn.classList.remove('invalid');
    }
  }
  // Update search results with new mode
  focusedIndex = -1;
  renderCommits();
  updateCommitCount();
  // Validate current pattern and update tooltip
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
ignoreWsBtn.title = 'Ignore whitespace enabled (Ctrl+Shift+Alt+J to toggle)';
          } else {
            ignoreWsBtn.classList.remove('active');
            ignoreWsBtn.title = 'Toggle ignore whitespace (Ctrl+Shift+Alt+J)';
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
  const error = getRegexError(textQuery);

  if (error) {
    regexToggleBtn.classList.add('invalid');
    regexToggleBtn.title = `Invalid regex: ${error}`;
    regexErrorMessage = error;
  } else {
    regexToggleBtn.classList.remove('invalid');
    regexToggleBtn.title = regexSearchEnabled
      ? 'Regex mode enabled (Ctrl+Shift+X to toggle)'
      : 'Toggle regex search mode (Ctrl+Shift+X)';
    regexErrorMessage = null;
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

function handleFocusCommitList() {
  const filteredCommits = getOrderedCommits(getFilteredCommits());
  if (filteredCommits.length === 0) {
    return;
  }

  focusedIndex = 0;
  updateFocusedRow();
  scrollFocusedIntoView();
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

  if (wordWrapBtn) {
    wordWrapBtn.addEventListener('click', handleWordWrapToggle);
  }

  if (mergeToggleBtn) {
    mergeToggleBtn.addEventListener('click', handleMergeToggle);
  }

  if (regexToggleBtn) {
    regexToggleBtn.addEventListener('click', handleRegexToggle);
  }

  if (clearAllFiltersBtn) {
    clearAllFiltersBtn.addEventListener('click', clearAllFilters);
  }

  const diffSearchBtn = document.getElementById('diff-search-btn');
  if (diffSearchBtn) {
    diffSearchBtn.addEventListener('click', handleDiffSearchClick);
  }

  if (todayFilterBtn) {
    todayFilterBtn.addEventListener('click', () => applyQuickDateFilter('last:1day'));
  }
  if (sprintFilterBtn) {
    sprintFilterBtn.addEventListener('click', () => applyQuickDateFilter(`last:${sprintLengthWeeks}week${sprintLengthWeeks !== 1 ? 's' : ''}`));
  }

  if (ignoreWsBtn) {
    ignoreWsBtn.addEventListener('click', handleIgnoreWhitespaceToggle);
  }

  if (contextLinesBtn) {
    contextLinesBtn.addEventListener('click', handleDiffContextLinesCycle);
  }

  if (myCommitsBtn) {
    myCommitsBtn.addEventListener('click', handleMyCommitsToggle);
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

  // Sort on table header click
  const tableHead = document.querySelector('#commit-table thead');
  if (tableHead) {
    tableHead.addEventListener('click', (e) => {
      const th = e.target.closest('th.sortable');
      if (th) {
        handleSortClick(th.dataset.sort);
      }
    });
  }

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
      trackedFilePath = message.filePath || null;
      currentBranch = message.branch || null;
      currentUser = message.currentUser || null;
      commitListDateFormat = message.commitListDateFormat || 'relative';
      sprintLengthWeeks = message.sprintLengthWeeks || 2;
      hasMoreCommits = message.hasMore || false;
      pageSize = message.pageSize || 500;
      isLoadingMore = false;

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
          updateSortHeaders();
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
ignoreWsBtn.title = 'Ignore whitespace enabled (Ctrl+Shift+Alt+J to toggle)';
          } else {
            ignoreWsBtn.classList.remove('active');
ignoreWsBtn.title = 'Toggle ignore whitespace (Ctrl+Shift+Alt+J)';
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
          updateQuickDateFilterButtons();
        }
      } else if (message.defaultDiffView === 'side-by-side') {
        setDiffType('side-by-side');
      }

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
      renderDiffStats(message.stats);
      renderDiff(currentDiff);
      renderFiles(message.files, selectedFile);
      break;

    case 'commitsLoaded':
      isLoadingMore = false;
      if (message.commits && message.commits.length > 0) {
        const existingHashes = new Set(commits.map(c => c.hash));
        for (const c of message.commits) {
          if (!existingHashes.has(c.hash)) {
            commits.push(c);
            existingHashes.add(c.hash);
          }
        }
      }
      hasMoreCommits = message.hasMore;
      renderCommits();
      updateCommitCount();
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
      isLoadingMore = false;
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

    case 'diffSearchResults':
      diffSearchHashes = message.matchingHashes;
      diffSearchQuery = message.query;
      renderFilterBadges();
      renderCommits();
      break;

    case 'selectCommit':
      handleSelectCommit(message.hash);
      break;

    case 'showFirstRunTip':
      if (message.showFirstRunTip) {
        showFirstRunTipBanner();
      }
      break;

    case 'triggerAction':
      switch (message.action) {
        case 'refresh': handleRefresh(); break;
        case 'copyCommitHash': handleCopyHash(); break;
        case 'copyCommitInfo': handleCopyInfo(); break;
        case 'copyCherryPick': handleCopyCherryPick(); break;
        case 'copyRevert': handleCopyRevert(); break;
        case 'copyCommitUrl': handleCopyUrl(); break;
        case 'openCommitUrl': handleOpenUrl(); break;
        case 'copyAuthorEmail': handleCopyAuthorEmail(); break;
        case 'copyAuthorName': handleCopyAuthorName(); break;
        case 'copyShortHash': handleCopyShortHash(); break;
        case 'copySubject': handleCopySubject(); break;
        case 'copyShortDate': handleCopyShortDate(); break;
        case 'copyTrailers': handleCopyTrailers(); break;
        case 'copyRangeDiff': handleCopyRangeDiff(); break;
        case 'compareWithParent': handleCompareWithParent(); break;
        case 'createBranch': handleCreateBranch(); break;
        case 'createTag': handleCreateTag(); break;
        case 'deleteTag': handleDeleteTag(); break;
        case 'deleteBranch': handleDeleteBranch(); break;
        case 'renameBranch': handleRenameBranch(); break;
        case 'checkoutBranch': showBranchPickerDialog(); break;
        case 'cherryPickCommit': handleCherryPickCommit(); break;
        case 'revertCommit': handleRevertCommit(); break;
        case 'toggleMyCommits': handleMyCommitsToggle(); break;
        case 'toggleWordWrap': handleWordWrapToggle(); break;
        case 'toggleRegex': handleRegexToggle(); break;
        case 'toggleIgnoreWhitespace': handleIgnoreWhitespaceToggle(); break;
        case 'toggleHideMergeCommits': handleMergeToggle(); break;
        case 'jumpToHash': showJumpToHashDialog(); break;
        case 'jumpToNextTag': jumpToNextTag(); break;
        case 'jumpToPreviousTag': jumpToPreviousTag(); break;
        case 'jumpToParent': jumpToParent(); break;
        case 'focusSearch': if (searchInput) { searchInput.focus(); searchInput.select(); } break;
        case 'focusCommitList': handleFocusCommitList(); break;
        case 'showKeyboardHelp': showKeyboardHelpDialog(); break;
        case 'cycleDiffContextLines': handleDiffContextLinesCycle(); break;
        case 'cycleSortMode': handleSortToggle(); break;
        case 'clearAllFilters': clearAllFilters(); break;
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

  let colCount = 4;
  const colspan = colCount;

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

    const tagBadges = (commit.tags || [])
      .map(t => `<span class="tag-badge tag-filter-link" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`)
      .join('');

    const mergeBadge = isMerge ? '<span class="merge-badge">merge</span>' : '';

    const signatureBadge = commit.signature
      ? `<span class="signature-badge ${commit.signature.verified ? 'verified' : 'unverified'}"
           title="${commit.signature.verified ? 'Verified' : 'Unverified'} signature${commit.signature.signer ? ' by: ' + escapeHtml(commit.signature.signer) : ''}">
           ${commit.signature.verified ? '✓' : '✗'}
         </span>`
      : '';

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
          <div class="message-subject">${mergeBadge}${signatureBadge}${tagBadges}${escapeHtml(commit.message)}</div>
          ${isExpanded ? `<div class="message-body">${escapeHtml(bodyContent)}</div>` : ''}
        </div>
        <button class="message-expand-btn" data-hash="${commit.hash}" title="${isExpanded ? 'Collapse' : 'Expand'} message">
          ${isExpanded ? '▲' : '▼'}
        </button>
      `;
    } else {
      messageHtml = `<div class="message-content">${mergeBadge}${signatureBadge}${tagBadges}${escapeHtml(commit.message)}</div>`;
    }

    tr.innerHTML = `
      <td class="hash-col"><span class="hash-chip" data-hash="${commit.hash}" title="Click to copy full hash">${commit.shortHash}</span></td>
      <td class="author-col" title="${escapeHtml(commit.author)}">
        <div class="author-col-inner">
          <span class="author-avatar" style="background-color:${avatarColor}">${initials}</span>
           <span class="author-name author-filter-link" data-author="${escapeHtml(commit.author)}">${escapeHtml(truncate(commit.author, 16))}</span>
        </div>
      </td>
      <td class="date-col" title="${absoluteDate}">${date}</td>
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

  if (hasMoreCommits) {
    const loadMoreTr = document.createElement('tr');
    loadMoreTr.className = 'load-more-row';
    const loadMoreTd = document.createElement('td');
    loadMoreTd.colSpan = colspan;
    loadMoreTd.style.textAlign = 'center';
    loadMoreTd.style.padding = '12px';
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.id = 'load-more-btn';
    loadMoreBtn.className = 'date-filter-btn';
    loadMoreBtn.textContent = isLoadingMore ? 'Loading...' : `Load more`;
    loadMoreBtn.disabled = isLoadingMore;
    loadMoreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isLoadingMore) return;
      isLoadingMore = true;
      loadMoreBtn.textContent = 'Loading...';
      loadMoreBtn.disabled = true;
      vscode.postMessage({ type: 'loadMoreCommits' });
    });
    loadMoreTd.appendChild(loadMoreBtn);
    loadMoreTr.appendChild(loadMoreTd);
    commitList.appendChild(loadMoreTr);
  }

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

function renderDiffStats(stats) {
  let statsBar = document.getElementById('diff-stats-bar');
  if (!stats) {
    if (statsBar) { statsBar.remove(); }
    return;
  }
  if (!statsBar) {
    statsBar = document.createElement('div');
    statsBar.id = 'diff-stats-bar';
    statsBar.className = 'diff-stats';
    diffViewer.parentNode.insertBefore(statsBar, diffViewer);
  }
  const filesLabel = stats.filesChanged === 1 ? 'file' : 'files';
  statsBar.innerHTML =
    '<span class="stat-files">' + stats.filesChanged + ' ' + filesLabel + ' changed</span>' +
    '<span class="stat-insertions">+' + stats.insertions + '</span>' +
    '<span class="stat-deletions">-' + stats.deletions + '</span>';
}

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
    <div class="context-menu-item" data-action="compare-working-tree">
      <span class="context-menu-icon">🔄</span>
      <span class="context-menu-label">Compare with working tree</span>
    </div>
    <div class="context-menu-item" data-action="blame-file">
      <span class="context-menu-icon">🕵</span>
      <span class="context-menu-label">Blame file</span>
    </div>
    <div class="context-menu-item" data-action="open-file-url">
      <span class="context-menu-icon">🌐</span>
      <span class="context-menu-label">Open file URL at this commit</span>
    </div>
    <div class="context-menu-item" data-action="restore-from-commit">
      <span class="context-menu-icon">⏪</span>
      <span class="context-menu-label">Restore file from this commit</span>
    </div>
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="copy-path">
      <span class="context-menu-icon">📋</span>
      <span class="context-menu-label">Copy path</span>
    </div>
    <div class="context-menu-item" data-action="copy-relative-path">
      <span class="context-menu-icon">📎</span>
      <span class="context-menu-label">Copy relative path</span>
    </div>
    <div class="context-menu-item" data-action="reveal-in-explorer">
      <span class="context-menu-icon">📁</span>
      <span class="context-menu-label">Reveal in File Explorer</span>
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
      } else if (action === 'compare-working-tree') {
        vscode.postMessage({ type: 'compareFileWithWorkingTree', hash: commitHash, filePath: filePath });
      } else if (action === 'blame-file') {
        vscode.postMessage({ type: 'blameFile', filePath: filePath });
      } else if (action === 'open-file-url') {
        vscode.postMessage({ type: 'openFileUrl', hash: commitHash, filePath: filePath });
      } else if (action === 'restore-from-commit') {
        vscode.postMessage({ type: 'restoreFileFromCommit', hash: commitHash, filePath: filePath });
      } else if (action === 'copy-path') {
        vscode.postMessage({ type: 'copyFilePath', filePath: filePath, relative: false });
      } else if (action === 'copy-relative-path') {
        vscode.postMessage({ type: 'copyFilePath', filePath: filePath, relative: true });
      } else if (action === 'reveal-in-explorer') {
        vscode.postMessage({ type: 'revealInExplorer', filePath: filePath });
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
    <div class="context-menu-item" data-action="cherry-pick-commit">
      <span class="context-menu-icon">🍒</span>
      <span class="context-menu-label">Cherry-pick commit</span>
    </div>
    <div class="context-menu-item" data-action="revert-commit">
      <span class="context-menu-icon">↩️</span>
      <span class="context-menu-label">Revert commit</span>
    </div>
    <div class="context-menu-item" data-action="copy-url">
      <span class="context-menu-icon">🔗</span>
      <span class="context-menu-label">Copy commit URL</span>
    </div>
    <div class="context-menu-item" data-action="open-url">
      <span class="context-menu-icon">🌐</span>
      <span class="context-menu-label">Open commit URL in browser</span>
    </div>
    <div class="context-menu-item" data-action="copy-author-email">
      <span class="context-menu-icon">@</span>
      <span class="context-menu-label">Copy author email</span>
    </div>
    <div class="context-menu-item" data-action="copy-author-name">
      <span class="context-menu-icon">👤</span>
      <span class="context-menu-label">Copy author name</span>
    </div>
    <div class="context-menu-item" data-action="copy-short-hash">
      <span class="context-menu-icon">#7</span>
      <span class="context-menu-label">Copy short hash</span>
    </div>
    <div class="context-menu-item" data-action="copy-subject">
      <span class="context-menu-icon">📌</span>
      <span class="context-menu-label">Copy subject</span>
    </div>
    <div class="context-menu-item" data-action="copy-short-date">
      <span class="context-menu-icon">📅</span>
      <span class="context-menu-label">Copy short date (YYYY-MM-DD)</span>
    </div>
    <div class="context-menu-item" data-action="copy-trailers">
      <span class="context-menu-icon">🏷</span>
      <span class="context-menu-label">Copy trailers</span>
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
    <div class="context-menu-divider"></div>
    <div class="context-menu-item" data-action="reset-to-commit">
      <span class="context-menu-icon">⏮️</span>
      <span class="context-menu-label">Reset to this commit...</span>
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
      } else if (action === 'copy-info') {
        vscode.postMessage({ type: 'copyCommitInfo', hash: commit.hash });
      } else if (action === 'copy-cherry-pick') {
        vscode.postMessage({ type: 'copyCherryPickCommand', hash: commit.hash });
      } else if (action === 'copy-revert') {
        vscode.postMessage({ type: 'copyRevertCommand', hash: commit.hash });
      } else if (action === 'cherry-pick-commit') {
        vscode.postMessage({ type: 'cherryPickCommit', hash: commit.hash });
      } else if (action === 'revert-commit') {
        vscode.postMessage({ type: 'revertCommit', hash: commit.hash });
      } else if (action === 'copy-url') {
        vscode.postMessage({ type: 'copyCommitUrl', hash: commit.hash });
      } else if (action === 'open-url') {
        vscode.postMessage({ type: 'openCommitUrl', hash: commit.hash });
      } else if (action === 'copy-author-email') {
        vscode.postMessage({ type: 'copyAuthorEmail', hash: commit.hash });
      } else if (action === 'copy-author-name') {
        vscode.postMessage({ type: 'copyAuthorName', hash: commit.hash });
      } else if (action === 'copy-short-hash') {
        vscode.postMessage({ type: 'copyShortHash', hash: commit.hash });
      } else if (action === 'copy-subject') {
        vscode.postMessage({ type: 'copySubject', hash: commit.hash });
      } else if (action === 'copy-short-date') {
        vscode.postMessage({ type: 'copyShortDate', hash: commit.hash });
      } else if (action === 'copy-trailers') {
        vscode.postMessage({ type: 'copyTrailers', hash: commit.hash });
      } else if (action === 'create-branch') {
        handleCreateBranch();
      } else if (action === 'create-tag') {
        handleCreateTag();
      } else if (action === 'delete-tag') {
        handleDeleteTag();
      } else if (action === 'reset-to-commit') {
        showResetSubMenu(event, commit);
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

// ─── Reset Sub-Menu ───────────────────────────────────────────────────────────

function showResetSubMenu(event, commit) {
  const existing = document.getElementById('reset-submenu');
  if (existing) { existing.remove(); }

  const submenu = document.createElement('div');
  submenu.id = 'reset-submenu';
  submenu.className = 'context-menu';
  submenu.innerHTML = `
    <div class="context-menu-item" data-mode="soft">
      <span class="context-menu-icon">📄</span>
      <span class="context-menu-label">Soft — keep staged</span>
    </div>
    <div class="context-menu-item" data-mode="mixed">
      <span class="context-menu-icon">📝</span>
      <span class="context-menu-label">Mixed — keep unstaged</span>
    </div>
    <div class="context-menu-item" data-mode="hard">
      <span class="context-menu-icon">⚠️</span>
      <span class="context-menu-label">Hard — discard all</span>
    </div>
  `;

  submenu.style.left = `${event.clientX + 150}px`;
  submenu.style.top = `${event.clientY}px`;
  document.body.appendChild(submenu);

  submenu.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const mode = item.dataset.mode;
      vscode.postMessage({ type: 'resetToCommit', hash: commit.hash, mode: mode });
      submenu.remove();
    });
  });

  const closeSubmenu = (e) => {
    if (!submenu.contains(e.target)) {
      submenu.remove();
      document.removeEventListener('click', closeSubmenu);
    }
  };
  setTimeout(() => { document.addEventListener('click', closeSubmenu); }, 0);
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

  // Absolute formats from gitHistory.commitList.dateFormat
  if (commitListDateFormat === 'iso') {
    return date.toISOString().substring(0, 10);
  }
  if (commitListDateFormat === 'short') {
    return date.toLocaleDateString();
  }

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
  updateQuickDateFilterButtons();
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


function handleCopyShortDate() {
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
    showError('Select a commit to copy short date');
    return;
  }

  vscode.postMessage({
    type: 'copyShortDate',
    hash: targetCommit.hash
  });
}


function handleCopyTrailers() {
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
    showError('Select a commit to copy trailers');
    return;
  }

  vscode.postMessage({
    type: 'copyTrailers',
    hash: targetCommit.hash
  });
}


function handleCopyRangeDiff() {
  // Prefer the last Shift+click range selection endpoints; otherwise exactly
  // two selected commits define the range.
  let fromHash = rangeSelectionAnchor;
  let toHash = rangeSelectionTarget;

  if (!fromHash || !toHash) {
    if (selectedCommits.size === 2) {
      const displayCommits = getOrderedCommits(getFilteredCommits());
      const ordered = displayCommits.filter(c => selectedCommits.has(c.hash));
      if (ordered.length === 2) {
        fromHash = ordered[0].hash;
        toHash = ordered[1].hash;
      }
    }
  }

  if (!fromHash || !toHash) {
    showError('Select two commits (Shift+click) to copy the range diff');
    return;
  }

  vscode.postMessage({
    type: 'copyRangeDiff',
    fromHash,
    toHash
  });
}


function handleCompareWithParent() {
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
    showError('Select a commit to compare with its parent');
    return;
  }

  const parentHash = targetCommit.parentHashes && targetCommit.parentHashes[0];
  if (!parentHash) {
    showError('Commit has no parent (root commit)');
    return;
  }

  // Diff parent..commit through the existing range-diff plumbing
  requestRangeDiff(parentHash, targetCommit.hash);
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

function handleRenameBranch() {
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

  // Show a modal to select branch to rename
  const modal = document.createElement('div');
  modal.id = 'rename-branch-modal';
  modal.className = 'modal-overlay';

  const content = document.createElement('div');
  content.className = 'modal-content delete-branch-content';

  const title = document.createElement('div');
  title.className = 'modal-title';
  title.textContent = 'Rename Branch';
  content.appendChild(title);

  const list = document.createElement('div');
  list.className = 'branch-list';

  localBranches.forEach(branch => {
    const item = document.createElement('div');
    item.className = 'branch-item';
    if (branch === currentBranch) {
      item.classList.add('current-branch');
      item.textContent = '✓ ' + branch + ' (current)';
    } else {
      item.textContent = branch;
      item.addEventListener('click', () => {
        closeModal();
        vscode.postMessage({ type: 'renameBranch', branch: branch });
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

function handleCherryPickCommit() {
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
    showError('Select a commit to cherry-pick');
    return;
  }

  vscode.postMessage({ type: 'cherryPickCommit', hash: targetCommit.hash });
}

function handleRevertCommit() {
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
    showError('Select a commit to revert');
    return;
  }

  vscode.postMessage({ type: 'revertCommit', hash: targetCommit.hash });
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

// ─── Tag Navigation ──────────────────────────────────────────────────────

function getTaggedCommits() {
  return getOrderedCommits(getFilteredCommits()).filter(commit => commit.tags && commit.tags.length > 0);
}

function jumpToNextTag() {
  const taggedCommits = getTaggedCommits();
  if (taggedCommits.length === 0) {
    showError('No tagged commits found');
    return;
  }

  const displayCommits = getOrderedCommits(getFilteredCommits());
  const currentHash = focusedIndex >= 0 && focusedIndex < displayCommits.length
    ? displayCommits[focusedIndex].hash
    : null;

  let currentIndex = -1;
  if (currentHash) {
    currentIndex = taggedCommits.findIndex(c => c.hash === currentHash);
  }

  let nextIndex;
  if (currentIndex < 0) {
    nextIndex = 0;
  } else if (currentIndex < taggedCommits.length - 1) {
    nextIndex = currentIndex + 1;
  } else {
    nextIndex = 0;
  }

  const targetCommit = taggedCommits[nextIndex];
  scrollToCommitByHash(targetCommit.hash);
  setFocusedRow(targetCommit.hash);
}

function jumpToPreviousTag() {
  const taggedCommits = getTaggedCommits();
  if (taggedCommits.length === 0) {
    showError('No tagged commits found');
    return;
  }

  const displayCommits = getOrderedCommits(getFilteredCommits());
  const currentHash = focusedIndex >= 0 && focusedIndex < displayCommits.length
    ? displayCommits[focusedIndex].hash
    : null;

  let currentIndex = -1;
  if (currentHash) {
    currentIndex = taggedCommits.findIndex(c => c.hash === currentHash);
  }

  let prevIndex;
  if (currentIndex < 0) {
    prevIndex = taggedCommits.length - 1;
  } else if (currentIndex > 0) {
    prevIndex = currentIndex - 1;
  } else {
    prevIndex = taggedCommits.length - 1;
  }

  const targetCommit = taggedCommits[prevIndex];
  scrollToCommitByHash(targetCommit.hash);
  setFocusedRow(targetCommit.hash);
}

function jumpToParent() {
  const displayCommits = getOrderedCommits(getFilteredCommits());

  // Get the currently focused commit
  if (focusedIndex < 0 || focusedIndex >= displayCommits.length) {
    showError('No commit focused');
    return;
  }

  const currentCommit = displayCommits[focusedIndex];

  // Check if commit has a parent
  if (!currentCommit.parentHashes || currentCommit.parentHashes.length === 0) {
    showError('Root commit has no parent');
    return;
  }

  // Get the first parent hash
  const parentHash = currentCommit.parentHashes[0];

  // Check if parent is in the current filtered list
  const parentExists = displayCommits.some(c => c.hash === parentHash);
  if (!parentExists) {
    showError('Parent commit not in current view (try clearing filters)');
    return;
  }

  // Navigate to parent
  scrollToCommitByHash(parentHash);
  setFocusedRow(parentHash);
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
        { keys: [cmdKey, 'L'], description: 'Focus commit list for navigation' },
        { keys: [cmdKey, 'Alt', 'P'], description: 'Quick compare with parent commit' },
        { keys: ['↑', '↓'], description: 'Navigate up/down through commits' },
        { keys: ['Home'], description: 'Jump to first commit' },
        { keys: ['End'], description: 'Jump to last commit' },
        { keys: ['PageDown'], description: 'Jump down one page (10 commits)' },
        { keys: ['PageUp'], description: 'Jump up one page (10 commits)' },
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
        { keys: [cmdKey, 'P'], description: 'Jump to parent commit' },
        { keys: [cmdKey, ']'], description: 'Jump to next tagged commit' },
        { keys: [cmdKey, '['], description: 'Jump to previous tagged commit' },
        { keys: [cmdKey, 'Shift', 'Q'], description: 'Toggle hide merge commits' },
        { keys: [cmdKey, 'Alt', 'S'], description: 'Show branch picker' }
      ]
    },
    {
      category: 'View Options',
      items: [
        { keys: [cmdKey, 'Shift', 'W'], description: 'Toggle word wrap' },
        { keys: [cmdKey, 'Shift', 'M'], description: 'Toggle my commits filter' },
        { keys: [cmdKey, 'Shift', 'Alt', 'J'], description: 'Toggle ignore whitespace' },
        { keys: [cmdKey, 'Shift', '/'], description: 'Cycle diff context lines' },
        { keys: [cmdKey, 'Shift', '3'], description: 'Cycle sort mode (Newest/Oldest/Author A-Z/Author Z-A)' }
      ]
    },
    {
      category: 'Copy Commands',
      items: [
        { keys: [cmdKey, 'Shift', 'H'], description: 'Copy commit hash' },
        { keys: [cmdKey, 'Shift', 'I'], description: 'Copy commit info' },
        { keys: [cmdKey, 'Shift', 'P'], description: 'Copy cherry-pick command' },
        { keys: [cmdKey, 'Shift', 'U'], description: 'Copy revert command' },
        { keys: [cmdKey, 'Shift', 'L'], description: 'Copy commit URL' },
        { keys: [cmdKey, 'Shift', 'Alt', 'L'], description: 'Open commit URL in browser' },
        { keys: [cmdKey, 'Shift', 'A'], description: 'Copy author email' },
        { keys: [cmdKey, 'Shift', 'N'], description: 'Copy author name' },
        { keys: [cmdKey, 'Shift', '7'], description: 'Copy short hash' },
        { keys: [cmdKey, 'Shift', '6'], description: 'Copy commit subject' },
        { keys: [cmdKey, 'Alt', 'D'], description: 'Copy short date (YYYY-MM-DD)' },
        { keys: [cmdKey, 'Shift', 'Alt', '3'], description: 'Copy commit trailers' },
        { keys: [cmdKey, 'Shift', 'Alt', 'R'], description: 'Copy range diff (between two selected commits)' }
      ]
    },
    {
      category: 'Actions',
      items: [
        { keys: ['F5'], description: 'Refresh history' },
        { keys: [cmdKey, 'Shift', 'R'], description: 'Refresh history (alternative)' },
        { keys: [cmdKey, 'Alt', 'Q'], description: 'Clear all filters' },
        { keys: [cmdKey, 'Alt', 'X'], description: 'Delete local branch' },
        { keys: [cmdKey, 'Alt', 'K'], description: 'Cherry-pick commit' },
        { keys: [cmdKey, 'Alt', 'R'], description: 'Revert commit' },
        { keys: [cmdKey, 'Shift', 'Alt', 'B'], description: 'Create branch' },
        { keys: [cmdKey, 'Alt', 'I'], description: 'Create tag' },
        { keys: [cmdKey, 'Alt', '.'], description: 'Delete tag' }
      ]
    },
    {
      category: 'Global Editor Shortcuts',
      items: [
        { keys: [cmdKey, 'Shift', 'B'], description: 'Toggle blame annotations (works in editor)' },
        { keys: [cmdKey, altKey, 'H'], description: 'Show file history (works in editor)' },
        { keys: [cmdKey, altKey, 'Shift', 'H'], description: 'Show selection history (works in editor)' }
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

  function filterShortcutsBySearch(allShortcuts, query) {
    if (!query || query.trim() === '') {
      return allShortcuts;
    }
    const lowerQuery = query.toLowerCase().trim();
    return allShortcuts
      .map(category => ({
        category: category.category,
        items: category.items.filter(item =>
          item.description.toLowerCase().includes(lowerQuery)
        )
      }))
      .filter(category => category.items.length > 0);
  }

  function renderKeyboardHelpShortcuts(filteredShortcuts) {
    const container = document.getElementById('keyboard-help-shortcuts-container');
    if (!container) return;

    if (filteredShortcuts.length === 0) {
      container.innerHTML = '<div class="keyboard-help-no-results">No shortcuts match your search</div>';
      return;
    }

    container.innerHTML = filteredShortcuts.map(section => `
      <div class="keyboard-help-section">
        <div class="keyboard-help-section-title">${escapeHtml(section.category)}</div>
        ${section.items.map(formatShortcut).join('')}
      </div>
    `).join('');
  }

  modal.innerHTML = `
    <div class="modal-overlay"></div>
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">⌨️ Keyboard Shortcuts</span>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <div class="keyboard-help-search-container">
          <input type="text"
                 class="keyboard-help-search-input"
                 placeholder="Filter shortcuts..."
                 id="keyboard-help-search-input">
          <button class="keyboard-help-search-clear"
                  id="keyboard-help-search-clear"
                  style="display: none;">&times;</button>
        </div>
        <div id="keyboard-help-shortcuts-container"></div>
        <div class="keyboard-help-footer">
          Tip: Right-click on commits and files for additional options
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  renderKeyboardHelpShortcuts(shortcuts);

  const closeModal = () => modal.remove();

  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };

  const searchInput = modal.querySelector('#keyboard-help-search-input');
  const searchClear = modal.querySelector('#keyboard-help-search-clear');

  searchInput.addEventListener('input', () => {
    const query = searchInput.value;
    searchClear.style.display = query ? 'block' : 'none';
    const filtered = filterShortcutsBySearch(shortcuts, query);
    renderKeyboardHelpShortcuts(filtered);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    renderKeyboardHelpShortcuts(shortcuts);
    searchInput.focus();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (searchInput.value) {
        e.stopPropagation();
        searchInput.value = '';
        searchClear.style.display = 'none';
        renderKeyboardHelpShortcuts(shortcuts);
      } else {
        e.stopPropagation();
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    }
  });

  const overlay = modal.querySelector('.modal-overlay');
  const closeBtn = modal.querySelector('.modal-close');

  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);

  document.addEventListener('keydown', handleEscape);

  searchInput.focus();
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


function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
init();
