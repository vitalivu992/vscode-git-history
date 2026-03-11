/**
 * Graph layout algorithm for commit graph visualization.
 * Computes per-row lane positions and segment types for SVG rendering.
 *
 * Pure function, no external dependencies.
 */

var GRAPH_PALETTE_SIZE = 8;

/**
 * Compute graph layout data for a list of commits.
 *
 * @param {Array} commits - Array of CommitInfo objects (newest first)
 * @returns {Array} Per-commit layout cells with segment drawing instructions
 *
 * Each returned cell:
 *   nodeCol      {number}  - Column index of this commit's node
 *   nodeColor    {number}  - Color palette index for this commit
 *   segments     {Array}   - Drawing instructions for this row
 *   maxColumns   {number}  - Total lane columns in use this row
 *
 * Segment types:
 *   { type: 'vertical',   col, color }              - Full vertical line (passing lane)
 *   { type: 'top-half',   col, color }              - Top half vertical (lane arrives at node)
 *   { type: 'bottom-half', col, color }             - Bottom half vertical (lane leaves node)
 *   { type: 'merge',      fromCol, toCol, color }   - Bezier curve to merge target lane
 */
function computeGraphLayout(commits) {
  if (!commits || commits.length === 0) { return []; }

  // lanes[i] = { hash: string, color: number } | null
  var lanes = [];
  var colorCounter = 0;
  var result = [];

  for (var i = 0; i < commits.length; i++) {
    var commit = commits[i];
    var parentHashes = (commit.parentHashes || []).slice();

    // Find this commit's lane (it was placed here by a previous commit listing it as parent)
    var nodeCol = -1;
    for (var j = 0; j < lanes.length; j++) {
      if (lanes[j] && lanes[j].hash === commit.hash) {
        nodeCol = j;
        break;
      }
    }

    var wasInLane = nodeCol !== -1;
    var nodeColor;

    if (!wasInLane) {
      // Branch head not yet tracked: assign a new lane
      nodeColor = colorCounter % GRAPH_PALETTE_SIZE;
      colorCounter++;
      // Find first empty slot
      nodeCol = -1;
      for (var k = 0; k < lanes.length; k++) {
        if (!lanes[k]) { nodeCol = k; break; }
      }
      if (nodeCol === -1) { nodeCol = lanes.length; lanes.push(null); }
      lanes[nodeCol] = { hash: commit.hash, color: nodeColor };
    } else {
      nodeColor = lanes[nodeCol].color;
    }

    var segments = [];

    // Passing lanes: full vertical lines for all other active lanes
    for (var l = 0; l < lanes.length; l++) {
      if (l !== nodeCol && lanes[l]) {
        segments.push({ type: 'vertical', col: l, color: lanes[l].color });
      }
    }

    // Node's own lane: top-half if it was tracked from above
    if (wasInLane) {
      segments.push({ type: 'top-half', col: nodeCol, color: nodeColor });
    }

    // Update lanes for next iteration
    if (parentHashes.length === 0) {
      // Root commit: lane terminates
      lanes[nodeCol] = null;
    } else {
      // First parent continues in the same lane
      lanes[nodeCol] = { hash: parentHashes[0], color: nodeColor };
      segments.push({ type: 'bottom-half', col: nodeCol, color: nodeColor });

      // Additional parents (merge commits): draw bezier curves to their target lanes
      for (var p = 1; p < parentHashes.length; p++) {
        var ph = parentHashes[p];
        var targetCol = -1;
        for (var m = 0; m < lanes.length; m++) {
          if (lanes[m] && lanes[m].hash === ph) { targetCol = m; break; }
        }
        var mergeColor;
        if (targetCol === -1) {
          // Parent not yet tracked: open a new lane for it
          mergeColor = colorCounter % GRAPH_PALETTE_SIZE;
          colorCounter++;
          targetCol = -1;
          for (var n = 0; n < lanes.length; n++) {
            if (!lanes[n]) { targetCol = n; break; }
          }
          if (targetCol === -1) { targetCol = lanes.length; lanes.push(null); }
          lanes[targetCol] = { hash: ph, color: mergeColor };
        } else {
          mergeColor = lanes[targetCol].color;
        }
        segments.push({ type: 'merge', fromCol: nodeCol, toCol: targetCol, color: mergeColor });
      }
    }

    // Cap max columns at 10 to prevent excessively wide graphs
    var maxColumns = Math.min(lanes.length, 10);
    if (nodeCol + 1 > maxColumns) { maxColumns = nodeCol + 1; }

    result.push({ nodeCol: nodeCol, nodeColor: nodeColor, segments: segments, maxColumns: maxColumns });

    // Clean up trailing empty lanes
    while (lanes.length > 0 && !lanes[lanes.length - 1]) {
      lanes.pop();
    }
  }

  return result;
}

// Export for Node.js/CommonJS environments (used by tests)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { computeGraphLayout: computeGraphLayout };
}
