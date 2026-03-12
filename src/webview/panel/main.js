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

// Graph rendering constants
const GRAPH_COLORS = ['#4ec9b0', '#569cd6', '#c586c0', '#dcdcaa', '#ce9178', '#4fc1ff', '#d16969', '#b5cea8'];
const LANE_W = 14;  // pixels per lane column
const ROW_H = 28;   // row height in pixels
const NODE_R = 4;   // commit node circle radius

// DOM Elements
const diffViewer = document.getElementById('diff-viewer');
const commitList = document.getElementById('commit-list');
const selectAllCheckbox = document.getElementById('select-all');
const unifiedBtn = document.getElementById('unified-btn');
const sideBySideBtn = document.getElementById('side-by-side-btn');
const fileList = document.getElementById('file-list');
const searchInput = document.getElementById('search-input');

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

  return `<svg width="${width}" height="${ROW_H}" viewBox="0 0 ${width} ${ROW_H}" xmlns="http://www.w3.org/2000/svg">${paths.join('')}</svg>`;
}

// Initialize
function init() {
  // Send ready message
  vscode.postMessage({ type: 'ready' });

  // Event listeners
  selectAllCheckbox.addEventListener('change', handleSelectAll);
  unifiedBtn.addEventListener('click', () => setDiffType('unified'));
  sideBySideBtn.addEventListener('click', () => setDiffType('side-by-side'));
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }

  // Listen for messages from extension
  window.addEventListener('message', handleMessage);
}

function handleMessage(event) {
  const message = event.data;

  switch (message.type) {
    case 'init':
      commits = message.commits;
      showGraph = message.showGraph !== false;
      trackedFilePath = message.filePath || null;
      // Show or hide the graph column header
      const graphTh = document.querySelector('th.graph-col');
      if (graphTh) { graphTh.style.display = showGraph ? '' : 'none'; }
      renderCommits();
      // Auto-select the latest commit to show its diff immediately
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
  // Find the row by hash and select it
  const row = document.querySelector(`#commit-table tbody tr[data-hash="${hash}"]`);
  if (row) {
    clearSelection();
    selectCommit(hash);
    row.scrollIntoView({ block: 'nearest' });
  }
}

function renderCommits() {
  commitList.innerHTML = '';

  // Filter commits based on search query
  const filteredCommits = commits.filter(commit => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      commit.hash.toLowerCase().includes(query) ||
      commit.shortHash.toLowerCase().includes(query) ||
      commit.author.toLowerCase().includes(query) ||
      commit.message.toLowerCase().includes(query)
    );
  });

  const colspan = showGraph ? 6 : 5;

  if (filteredCommits.length === 0) {
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

  // Compute graph layout for all filtered commits
  let graphData = [];
  let maxCols = 1;
  if (showGraph && typeof computeGraphLayout === 'function') {
    graphData = computeGraphLayout(filteredCommits);
    for (let g = 0; g < graphData.length; g++) {
      if (graphData[g].maxColumns > maxCols) { maxCols = graphData[g].maxColumns; }
    }
  }

  filteredCommits.forEach((commit, index) => {
    const tr = document.createElement('tr');
    tr.dataset.hash = commit.hash;

    const date = formatDate(commit.date);
    const graphCell = showGraph && graphData[index]
      ? `<td class="graph-col">${renderGraphSvg(graphData[index], maxCols)}</td>`
      : '';

    tr.innerHTML = `
      <td class="checkbox-col">
        <input type="checkbox" class="commit-checkbox" data-hash="${commit.hash}">
      </td>
      ${graphCell}
      <td class="hash-col" title="${commit.hash}">${commit.shortHash}</td>
      <td class="author-col" title="${commit.author}">${truncate(commit.author, 20)}</td>
      <td class="date-col">${date}</td>
      <td class="message-col" title="${commit.message}">${commit.message}</td>
    `;

    // Row click handler
    tr.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        clearSelection();
        selectCommit(commit.hash);
      }
    });

    // Checkbox change handler
    const checkbox = tr.querySelector('.commit-checkbox');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedCommits.add(commit.hash);
      } else {
        selectedCommits.delete(commit.hash);
      }
      updateSelectedRows();
      updateSelectAllState();

      if (selectedCommits.size > 1) {
        requestCombinedDiff();
      } else if (selectedCommits.size === 1) {
        const hash = [...selectedCommits][0];
        requestDiff(hash);
      }
    });

    commitList.appendChild(tr);
  });
}

function selectCommit(hash) {
  selectedCommits.clear();
  selectedCommits.add(hash);
  currentCommitHash = hash;
  selectedFile = null;

  // Update checkboxes
  document.querySelectorAll('.commit-checkbox').forEach(cb => {
    cb.checked = cb.dataset.hash === hash;
  });

  updateSelectedRows();
  updateSelectAllState();
  requestDiff(hash);
}

function clearSelection() {
  selectedCommits.clear();
  document.querySelectorAll('.commit-checkbox').forEach(cb => {
    cb.checked = false;
  });
  updateSelectedRows();
  updateSelectAllState();
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

function updateSelectAllState() {
  const totalCheckboxes = document.querySelectorAll('.commit-checkbox').length;
  selectAllCheckbox.checked = selectedCommits.size === totalCheckboxes && totalCheckboxes > 0;
  selectAllCheckbox.indeterminate = selectedCommits.size > 0 && selectedCommits.size < totalCheckboxes;
}

function handleSelectAll(e) {
  const checked = e.target.checked;
  document.querySelectorAll('.commit-checkbox').forEach(cb => {
    cb.checked = checked;
    const hash = cb.dataset.hash;
    if (checked) {
      selectedCommits.add(hash);
    } else {
      selectedCommits.delete(hash);
    }
  });
  updateSelectedRows();

  if (selectedCommits.size > 1) {
    requestCombinedDiff();
  } else if (selectedCommits.size === 1) {
    const hash = [...selectedCommits][0];
    requestDiff(hash);
  } else {
    clearDiff();
  }
}

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

  const targetElement = diffViewer;
  const configuration = {
    drawFileList: false,
    matching: 'lines',
    outputFormat: currentDiffType === 'side-by-side' ? 'side-by-side' : 'line-by-line',
    highlight: true,
    stickyFileHeaders: false,
    fileListToggle: false
  };

  try {
    const diff2htmlInstance = new Diff2HtmlUI(targetElement, diffText, configuration);
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

function renderFiles(files, activeFile) {
  fileList.innerHTML = '';

  if (!files || files.length === 0) {
    fileList.innerHTML = '<li class="empty-state-text">No files changed</li>';
    return;
  }

  // Show back-link when viewing a single file's diff
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
      <span class="file-path" title="${displayPath}">${displayPath}</span>
    `;

    // Add click handler for single-commit mode only
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
  renderCommits();
}

// Initialize on load
init();
