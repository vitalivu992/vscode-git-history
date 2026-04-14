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
let sortOldestFirst = false; // Sort order: false = newest first (default), true = oldest first
let currentBranch = null; // Current git branch name

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
const commitCountEl = document.getElementById('commit-count');

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

  // / or Ctrl+F: Focus search
  if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key === 'f')) {
    e.preventDefault();
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
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
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd+Enter: Toggle multi-select
          if (selectedCommits.has(commit.hash)) {
            selectedCommits.delete(commit.hash);
          } else {
            selectedCommits.add(commit.hash);
          }
          updateSelectedRows();
          if (selectedCommits.size > 1) {
            requestCombinedDiff();
          } else if (selectedCommits.size === 1) {
            requestDiff([...selectedCommits][0]);
          }
        } else {
          // Enter: Select commit
          clearSelection();
          selectCommit(commit.hash);
        }
      }
      break;
  }
}

function getFilteredCommits() {
  if (!searchQuery) return commits;
  const query = searchQuery.toLowerCase();
  return commits.filter(commit =>
    commit.hash.toLowerCase().includes(query) ||
    commit.shortHash.toLowerCase().includes(query) ||
    commit.author.toLowerCase().includes(query) ||
    commit.email.toLowerCase().includes(query) ||
    commit.message.toLowerCase().includes(query) ||
    (commit.tags && commit.tags.some(t => t.toLowerCase().includes(query)))
  );
}

function getOrderedCommits(filteredCommits) {
  if (sortOldestFirst) {
    return filteredCommits.slice().reverse();
  }
  return filteredCommits;
}

function handleSortToggle() {
  sortOldestFirst = !sortOldestFirst;
  if (sortBtn) {
    if (sortOldestFirst) {
      sortBtn.innerHTML = '&#x2191; Oldest';
      sortBtn.title = 'Sort: Oldest first (click to toggle)';
      sortBtn.classList.add('sort-active');
    } else {
      sortBtn.innerHTML = '&#x2193; Newest';
      sortBtn.title = 'Sort: Newest first (click to toggle)';
      sortBtn.classList.remove('sort-active');
    }
  }
  const graphTh = document.querySelector('th.graph-col');
  if (graphTh) { graphTh.style.display = (showGraph && !sortOldestFirst) ? '' : 'none'; }
  focusedIndex = -1;
  renderCommits();
}

function updateCommitCount() {
  if (!commitCountEl) return;
  const filtered = getFilteredCommits();
  if (searchQuery && filtered.length !== commits.length) {
    commitCountEl.textContent = `${filtered.length} of ${commits.length}`;
  } else {
    commitCountEl.textContent = '';
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
    branchBadge.className = 'branch-badge';
    branchBadge.textContent = currentBranch;
    branchBadge.title = `Current branch: ${currentBranch}`;
    header.insertBefore(branchBadge, header.firstChild);
  }
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
      const graphTh = document.querySelector('th.graph-col');
      if (graphTh) { graphTh.style.display = (showGraph && !sortOldestFirst) ? '' : 'none'; }
      renderBranchBadge();
      renderCommits();
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

    case 'commitFiles':
      renderFiles(message.files);
      break;

    case 'error':
      showError(message.message);
      break;

    case 'selectCommit':
      handleSelectCommit(message.hash);
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
  const effectiveShowGraph = showGraph && !sortOldestFirst;
  const colspan = effectiveShowGraph ? 5 : 4;

  if (displayCommits.length === 0) {
    commitList.innerHTML = `
      <tr>
        <td colspan="${colspan}" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">${searchQuery ? 'No commits match your search' : 'No commits found'}</div>
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

    const tagBadges = (commit.tags || [])
      .map(t => `<span class="tag-badge">${escapeHtml(t)}</span>`)
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
          <span class="author-name">${escapeHtml(truncate(commit.author, 16))}</span>
        </div>
      </td>
      <td class="date-col" title="${absoluteDate}">${date}</td>
      <td class="message-col ${hasBody ? 'has-expand' : ''}">${messageHtml}</td>
    `;

    tr.addEventListener('click', (e) => {
      // Update focused index on mouse click
      focusedIndex = index;
      updateFocusedRow();

      if (e.ctrlKey || e.metaKey) {
        if (selectedCommits.has(commit.hash)) {
          selectedCommits.delete(commit.hash);
        } else {
          selectedCommits.add(commit.hash);
        }
        updateSelectedRows();
        if (selectedCommits.size > 1) {
          requestCombinedDiff();
        } else if (selectedCommits.size === 1) {
          requestDiff([...selectedCommits][0]);
        }
      } else {
        clearSelection();
        selectCommit(commit.hash);
      }
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
  updateSelectedRows();
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
      li.addEventListener('click', () => {
        selectedFile = file.path;
        vscode.postMessage({
          type: 'requestFileDiff',
          hash: currentCommitHash,
          filePath: file.path
        });
      });
    }

    fileList.appendChild(li);
  });
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
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
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
  if (focusedIndex >= 0 && focusedIndex < commits.length) {
    const commit = commits[focusedIndex];
    vscode.postMessage({ type: 'copyCommitMessage', hash: commit.hash });
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    vscode.postMessage({ type: 'copyCommitMessage', hash });
  }
}

// Initialize on load
init();
