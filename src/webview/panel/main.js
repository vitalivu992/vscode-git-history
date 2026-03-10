// VS Code API
const vscode = acquireVsCodeApi();

// State
let commits = [];
let selectedCommits = new Set();
let currentDiff = '';
let currentDiffType = 'unified'; // 'unified' or 'side-by-side'
let diff2htmlUi = null;
let searchQuery = '';

// DOM Elements
const diffViewer = document.getElementById('diff-viewer');
const commitList = document.getElementById('commit-list');
const selectAllCheckbox = document.getElementById('select-all');
const unifiedBtn = document.getElementById('unified-btn');
const sideBySideBtn = document.getElementById('side-by-side-btn');
const fileList = document.getElementById('file-list');
const searchInput = document.getElementById('search-input');

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
      renderCommits();
      break;

    case 'diff':
      currentDiff = message.diff;
      renderDiff(currentDiff);
      renderFiles(message.files);
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

  if (filteredCommits.length === 0) {
    commitList.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-text">${searchQuery ? 'No commits match your search' : 'No commits found'}</div>
        </td>
      </tr>
    `;
    return;
  }

  filteredCommits.forEach(commit => {
    const tr = document.createElement('tr');
    tr.dataset.hash = commit.hash;

    const date = formatDate(commit.date);

    tr.innerHTML = `
      <td class="checkbox-col">
        <input type="checkbox" class="commit-checkbox" data-hash="${commit.hash}">
      </td>
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
  vscode.postMessage({ type: 'requestDiff', hash });
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
    highlight: true
  };

  try {
    const diff2htmlInstance = new Diff2HtmlUI(targetElement, diffText, configuration);
    diff2htmlInstance.draw();
    diff2htmlInstance.highlightAll();
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

function renderFiles(files) {
  fileList.innerHTML = '';

  if (!files || files.length === 0) {
    fileList.innerHTML = '<li class="empty-state-text">No files changed</li>';
    return;
  }

  files.forEach(file => {
    const li = document.createElement('li');

    const statusClass = getStatusClass(file.status);
    const statusLabel = getStatusLabel(file.status);

    let displayPath = file.path;
    if (file.previousPath && file.status === 'R') {
      displayPath = `${file.previousPath} → ${file.path}`;
    }

    li.innerHTML = `
      <span class="file-status ${statusClass}">${statusLabel}</span>
      <span class="file-path" title="${displayPath}">${displayPath}</span>
    `;

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
