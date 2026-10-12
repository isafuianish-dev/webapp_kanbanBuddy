(function () {
  'use strict';

  var STORAGE_KEY = 'kanbanBuddy.state.v1';
  var LOAD_FILTER_KEY = 'kanbanBuddy.loadFilter.v1';
  var APP_KEY = 'webapp_kanbanBuddy';
  var APP_VERSION = '001.001';

  var ICONS = Object.assign({}, Buddy.ICONS, { flag: Buddy.icon('flag'), history: Buddy.icon('historyClock') });

  function initials(name) {
    var parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }




  function userColor(id) {
    var hash = 0;
    var str = String(id);
    for (var i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) | 0;
    }
    var slot = (Math.abs(hash) % 8) + 1;
    return 'var(--series-' + slot + ')';
  }

  var state = loadState();
  var loadFilter = (function () {
    try {
      return localStorage.getItem(LOAD_FILTER_KEY) === 'all' ? 'all' : 'active';
    } catch (e) {
      return 'active';
    }
  })();

  var dom = {};
  var draggedTaskId = null;
  var draggedPriorityValue = null;
  var draggedUserId = null;



  var teamFilter = [];
  var teamFilterBoardId = null;



  var priorityFilter = [];

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    initStaticIcons();
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
    bindGlobalEvents();
    render();
  }

  function initStaticIcons() {
    dom.btnSettings.innerHTML = ICONS.settings;
    dom.btnAddUser.innerHTML = ICONS.plus;
    dom.btnAddTask.innerHTML = 'Add Task';
    dom.btnEditBoard.innerHTML = ICONS.edit;
    dom.btnOpenOverview.innerHTML = ICONS.barChart;
    dom.btnExportData.innerHTML = ICONS.download;
    dom.fileImportData.parentElement.insertAdjacentHTML('afterbegin', ICONS.upload);
  }

  function cacheDom() {
    dom.boardSearch = document.getElementById('boardSearch');
    dom.boardList = document.getElementById('boardList');
    dom.btnAddBoard = document.getElementById('btnAddBoard');
    dom.sidebarLoadSampleHint = document.getElementById('sidebarLoadSampleHint');
    dom.linkLoadSampleSidebar = document.getElementById('linkLoadSampleSidebar');
    dom.btnSettings = document.getElementById('btnSettings');
    dom.btnExportData = document.getElementById('btnExportData');
    dom.fileImportData = document.getElementById('fileImportData');

    dom.emptyState = document.getElementById('emptyState');
    dom.boardDetailContent = document.getElementById('boardDetailContent');

    dom.btnAddUser = document.getElementById('btnAddUser');
    dom.teamList = document.getElementById('teamList');
    dom.teamEmpty = document.getElementById('teamEmpty');
    dom.priorityFilterWrap = document.getElementById('priorityFilterWrap');

    dom.btnAddTask = document.getElementById('btnAddTask');
    dom.btnEditBoard = document.getElementById('btnEditBoard');
    dom.btnOpenOverview = document.getElementById('btnOpenOverview');
    dom.columnsRow = document.getElementById('columnsRow');
    dom.filterStatus = document.getElementById('filterStatus');
  }

  function bindGlobalEvents() {
    dom.boardSearch.addEventListener('input', function () { renderBoardList(); });
    dom.btnAddBoard.addEventListener('click', openAddBoardModal);
    dom.linkLoadSampleSidebar.addEventListener('click', handleLoadSample);
    dom.btnSettings.addEventListener('click', openSettingsModal);
    dom.btnExportData.addEventListener('click', openExportDataModal);
    dom.fileImportData.addEventListener('change', handleImportFile);

    dom.btnAddUser.addEventListener('click', function () {
      var board = getSelectedBoard();
      if (board) openAddUserModal(board);
    });
    dom.btnAddTask.addEventListener('click', function () {
      var board = getSelectedBoard();
      if (board) openAddTaskModal(board);
    });
    dom.btnEditBoard.addEventListener('click', function () {
      var board = getSelectedBoard();
      if (board) openEditBoardModal(board);
    });
    dom.btnOpenOverview.addEventListener('click', function () {
      var board = getSelectedBoard();
      if (board) openOverviewModal(board);
    });


    document.addEventListener('click', function (e) {
      document.querySelectorAll('.dropdown.open').forEach(function (dd) {
        if (dd.contains(e.target)) return;
        dd.classList.remove('open');
        var menu = dd.querySelector('.dropdown-menu');
        if (menu) menu.hidden = true;
        var toggle = dd.querySelector('.dropdown-toggle');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }



  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { boards: [], activeBoardId: null };
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.boards)) return { boards: [], activeBoardId: null };
      migrateState(parsed);
      return parsed;
    } catch (err) {
      console.error('Failed to load saved data, starting fresh.', err);
      return { boards: [], activeBoardId: null };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function migrateState(s) {

  }

  function applyTheme(theme) {
    Buddy.theme.applyTheme(APP_KEY, theme);
  }

  function applyAccent(accent) {
    Buddy.theme.applyAccent(APP_KEY, accent);
  }

  function openSettingsModal() {
    Buddy.settings.open(APP_KEY, openModal, closeModal, { appVersion: APP_VERSION });
  }



  function uid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function escapeHtml(str) {
    return Buddy.escapeHtml(str);
  }

  function formatDate(dateStr) {
    return Buddy.formatDate(dateStr);
  }

  function getSelectedBoard() {
    return state.boards.find(function (b) { return b.id === state.activeBoardId; }) || null;
  }

  function findUser(board, id) {
    return board.users.find(function (u) { return u.id === id; }) || null;
  }

  function findColumn(board, id) {
    return board.columns.find(function (c) { return c.id === id; }) || null;
  }

  function findTask(board, id) {
    return board.tasks.find(function (t) { return t.id === id; }) || null;
  }

  function nextOrderForColumn(board, columnId) {
    var tasks = board.tasks.filter(function (t) { return t.columnId === columnId; });
    if (tasks.length === 0) return 0;
    return Math.max.apply(null, tasks.map(function (t) { return t.order; })) + 1;
  }




  function moveTaskToColumn(board, task, columnId, insertBeforeTaskId) {
    task.columnId = columnId;
    var siblings = board.tasks
      .filter(function (t) { return t.columnId === columnId && t.id !== task.id; })
      .sort(function (a, b) { return a.order - b.order; });

    var insertIndex = siblings.length;
    if (insertBeforeTaskId) {
      var idx = siblings.findIndex(function (t) { return t.id === insertBeforeTaskId; });
      if (idx !== -1) insertIndex = idx;
    }
    siblings.splice(insertIndex, 0, task);
    siblings.forEach(function (t, i) { t.order = i; });
  }



  function render() {
    renderBoardList();
    renderBoardDetail();
  }

  function renderBoardList() {
    var query = dom.boardSearch.value.trim().toLowerCase();
    var boards = state.boards.filter(function (b) {
      return !query || b.name.toLowerCase().indexOf(query) !== -1;
    });

    dom.sidebarLoadSampleHint.hidden = state.boards.length !== 0;
    dom.boardList.innerHTML = '';

    boards.forEach(function (board) {
      var li = document.createElement('li');
      li.className = 'board-list-item' + (board.id === state.activeBoardId ? ' active' : '');
      li.innerHTML =
        '<span class="board-list-item-name">' + escapeHtml(board.name) + '</span>' +
        '<span class="board-list-item-meta">' +
        board.users.length + ' team member' + (board.users.length === 1 ? '' : 's') + ' &middot; ' +
        board.tasks.length + ' task' + (board.tasks.length === 1 ? '' : 's') +
        '</span>';
      li.addEventListener('click', function () {
        state.activeBoardId = board.id;
        saveState();
        render();
      });
      dom.boardList.appendChild(li);
    });
  }

  function renderBoardDetail() {
    var board = getSelectedBoard();
    if (!board) {
      dom.emptyState.hidden = false;
      dom.boardDetailContent.hidden = true;
      return;
    }
    if (board.id !== teamFilterBoardId) {
      teamFilter = [];
      priorityFilter = [];
      teamFilterBoardId = board.id;
    }
    dom.emptyState.hidden = true;
    dom.boardDetailContent.hidden = false;

    renderTeam(board);
    renderPriorityFilter(board);
    renderFilterStatus(board);
    renderColumns(board);
  }

  function statCard(icon, label, value) {
    return '<div class="stat-card">' +
      '<div class="stat-icon">' + ICONS[icon] + '</div>' +
      '<div class="stat-body">' +
      '<span class="stat-label">' + escapeHtml(label) + '</span>' +
      '<span class="stat-value">' + escapeHtml(value) + '</span>' +
      '</div>' +
      '</div>';
  }

  function openOverviewModal(board) {
    var html =
      '<div id="boardStats" class="board-stats"></div>' +
      '<div class="load-panel">' +
      '<div class="load-panel-header">' +
      '<h3>Load by User</h3>' +
      '<div class="load-toggle" id="loadToggle">' +
      '<button type="button" class="load-toggle-option" data-load-filter="active">Active only</button>' +
      '<button type="button" class="load-toggle-option" data-load-filter="all">All tasks</button>' +
      '</div>' +
      '</div>' +
      '<div id="loadChart" class="chart-bars"></div>' +
      '</div>';

    openModal('Overview', html, function (body) {
      renderOverview(body, board);
      body.querySelector('#loadToggle').addEventListener('click', function (e) {
        var btn = e.target.closest('[data-load-filter]');
        if (!btn) return;
        loadFilter = btn.getAttribute('data-load-filter');
        try { localStorage.setItem(LOAD_FILTER_KEY, loadFilter); } catch (err) {}
        renderOverview(body, board);
      });
    }, { wide: true });
  }

  function renderOverview(body, board) {
    var totalPoints = board.tasks.reduce(function (sum, t) { return sum + (t.points || 0); }, 0);
    var doneCount = board.tasks.filter(function (t) {
      var col = findColumn(board, t.columnId);
      return col && col.isDone;
    }).length;

    body.querySelector('#boardStats').innerHTML =
      statCard('list', 'Total Tasks', String(board.tasks.length)) +
      statCard('zap', 'Total Points', String(totalPoints)) +
      statCard('users', 'Team', String(board.users.length)) +
      statCard('check', 'Done', String(doneCount));

    body.querySelectorAll('#loadToggle .load-toggle-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-load-filter') === loadFilter);
    });

    renderLoadChart(body, board);
  }

  function renderLoadChart(body, board) {
    var loadChart = body.querySelector('#loadChart');
    var rows = board.users.map(function (u) {
      var points = board.tasks.filter(function (t) {
        if (t.assigneeId !== u.id) return false;
        if (loadFilter === 'active') {
          var col = findColumn(board, t.columnId);
          if (col && col.isDone) return false;
        }
        return true;
      }).reduce(function (sum, t) { return sum + (t.points || 0); }, 0);
      return { id: u.id, name: u.name, points: points };
    }).sort(function (a, b) { return b.points - a.points; });

    if (rows.length === 0) {
      loadChart.innerHTML = '<p class="empty-hint">Add team members to see workload.</p>';
      return;
    }

    var total = rows.reduce(function (sum, r) { return sum + r.points; }, 0);
    if (total <= 0) {
      loadChart.innerHTML = '<p class="empty-hint">No points assigned yet.</p>';
      return;
    }

    loadChart.innerHTML = rows.map(function (row) {
      var percent = Math.min(100, Math.round((row.points / total) * 100));
      var color = userColor(row.id);
      return '<div class="chart-bar-row">' +
        '<div class="chart-bar-label">' +
        '<span class="chart-bar-avatar" style="--avatar-color:' + color + ';">' + escapeHtml(initials(row.name)) + '</span>' +
        '<span class="chart-bar-name">' + escapeHtml(row.name) + '</span>' +
        '<span class="chart-bar-amount">' + row.points + ' pt' + (row.points === 1 ? '' : 's') + '</span>' +
        '</div>' +
        '<div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + percent + '%; --bar-color:' + color + ';"></div></div>' +
        '</div>';
    }).join('');
  }

  function renderTeam(board) {
    dom.teamList.innerHTML = '';
    dom.teamEmpty.hidden = board.users.length > 0;

    board.users.forEach(function (u) {
      var isActive = teamFilter.indexOf(u.id) !== -1;
      var chip = document.createElement('div');
      chip.className = 'team-chip' + (isActive ? ' active' : '');
      chip.style.setProperty('--avatar-color', userColor(u.id));
      chip.setAttribute('draggable', 'true');
      chip.setAttribute('title', 'Drag onto a task to assign ' + u.name);
      chip.innerHTML =
        '<button type="button" class="team-chip-toggle" data-action="toggle" aria-pressed="' + isActive + '" title="' +
        (isActive ? 'Showing only ' : 'Filter board to ') + escapeHtml(u.name) + '">' +
        '<span class="team-chip-avatar">' + escapeHtml(initials(u.name)) + '</span>' +
        '<span class="team-chip-name">' + escapeHtml(u.name) + '</span>' +
        '</button>' +
        '<button type="button" class="team-chip-edit" data-action="edit" title="Edit ' + escapeHtml(u.name) + '" aria-label="Edit ' + escapeHtml(u.name) + '">' + ICONS.edit + '</button>';

      chip.querySelector('[data-action="toggle"]').addEventListener('click', function () { toggleTeamFilter(board, u.id); });
      chip.querySelector('[data-action="edit"]').addEventListener('click', function () { openEditUserModal(board, u); });

      chip.addEventListener('dragstart', function (e) {
        draggedUserId = u.id;
        e.dataTransfer.setData('text/plain', 'user:' + u.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
      chip.addEventListener('dragend', function () {
        draggedUserId = null;
        document.querySelectorAll('.task-card.priority-drop-target').forEach(function (el) {
          el.classList.remove('priority-drop-target');
        });
      });

      dom.teamList.appendChild(chip);
    });
  }

  function toggleTeamFilter(board, userId) {
    var idx = teamFilter.indexOf(userId);
    if (idx === -1) teamFilter.push(userId); else teamFilter.splice(idx, 1);
    renderTeam(board);
    renderFilterStatus(board);
    renderColumns(board);
  }

  var PRIORITY_FILTER_TOGGLES = [
    { value: 'high', label: 'High priority' },
    { value: 'medium', label: 'Medium priority' },
    { value: 'low', label: 'Low priority' },
    { value: 'none', label: 'No priority' }
  ];

  function renderPriorityFilter(board) {
    var wrap = dom.priorityFilterWrap;
    wrap.innerHTML = PRIORITY_FILTER_TOGGLES.map(function (item) {
      var isActive = priorityFilter.indexOf(item.value) !== -1;
      return '<button type="button" class="btn btn-ghost btn-icon priority-toggle-btn priority-toggle-' + item.value + (isActive ? ' active' : '') +
        '" data-priority="' + item.value + '" draggable="true" aria-pressed="' + isActive + '" title="' + escapeHtml(item.label) + ' — drag onto a task to assign" aria-label="' + escapeHtml(item.label) + '">' +
        ICONS.flag + '</button>';
    }).join('');

    wrap.querySelectorAll('.priority-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var value = btn.getAttribute('data-priority');
        var idx = priorityFilter.indexOf(value);
        if (idx === -1) priorityFilter.push(value); else priorityFilter.splice(idx, 1);
        renderPriorityFilter(board);
        renderFilterStatus(board);
        renderColumns(board);
      });

      btn.addEventListener('dragstart', function (e) {
        draggedPriorityValue = btn.getAttribute('data-priority');
        e.dataTransfer.setData('text/plain', 'priority:' + draggedPriorityValue);
        e.dataTransfer.effectAllowed = 'copy';
      });
      btn.addEventListener('dragend', function () {
        draggedPriorityValue = null;
        document.querySelectorAll('.task-card.priority-drop-target').forEach(function (el) {
          el.classList.remove('priority-drop-target');
        });
      });
    });
  }

  function renderFilterStatus(board) {
    if (teamFilter.length === 0 && priorityFilter.length === 0) {
      dom.filterStatus.hidden = true;
      dom.filterStatus.innerHTML = '';
      return;
    }
    var parts = [];
    if (teamFilter.length > 0) parts.push(teamFilter.length + ' member' + (teamFilter.length === 1 ? '' : 's'));
    if (priorityFilter.length > 0) parts.push(priorityFilter.length + (priorityFilter.length === 1 ? ' priority' : ' priorities'));

    dom.filterStatus.hidden = false;
    dom.filterStatus.innerHTML =
      '<span>Filtered by ' + parts.join(' & ') + '</span>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnClearFilter">Clear</button>';
    dom.filterStatus.querySelector('#btnClearFilter').addEventListener('click', function () {
      teamFilter = [];
      priorityFilter = [];
      renderTeam(board);
      renderPriorityFilter(board);
      renderFilterStatus(board);
      renderColumns(board);
    });
  }

  function renderColumns(board) {
    dom.columnsRow.innerHTML = '';
    board.columns.forEach(function (column) {
      dom.columnsRow.appendChild(renderColumnElement(board, column));
    });
  }

  function renderColumnElement(board, column) {
    var allColumnTasks = board.tasks.filter(function (t) { return t.columnId === column.id; });
    var tasks = allColumnTasks.filter(function (t) {
      if (teamFilter.length > 0 && (!t.assigneeId || teamFilter.indexOf(t.assigneeId) === -1)) return false;
      if (priorityFilter.length > 0 && priorityFilter.indexOf(t.priority || 'none') === -1) return false;
      return true;
    }).sort(function (a, b) { return a.order - b.order; });

    var el = document.createElement('div');
    el.className = 'kanban-column' + (column.isDone ? ' is-done' : '');
    el.innerHTML =
      '<div class="kanban-column-header">' +
      '<div class="kanban-column-title-group">' +
      '<span class="kanban-column-title">' + escapeHtml(column.name) + '</span>' +
      '<span class="kanban-column-count">' + tasks.length + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="kanban-column-body" data-column-id="' + column.id + '"></div>';

    var body = el.querySelector('.kanban-column-body');
    if (tasks.length === 0) {
      var anyFilterActive = teamFilter.length > 0 || priorityFilter.length > 0;
      var emptyMessage = anyFilterActive && allColumnTasks.length > 0 ? 'No matching tasks' : 'No tasks';
      body.innerHTML = '<div class="kanban-column-empty">' + escapeHtml(emptyMessage) + '</div>';
    } else {
      tasks.forEach(function (task) { body.appendChild(renderTaskCardElement(board, column, task)); });
    }

    body.addEventListener('dragover', function (e) {
      e.preventDefault();
      if (!draggedTaskId) return;

      var draggedCard = document.querySelector('.task-card[data-task-id="' + draggedTaskId + '"]');
      if (!draggedCard) return;

      var emptyPlaceholder = body.querySelector('.kanban-column-empty');
      if (emptyPlaceholder) emptyPlaceholder.remove();

      var insertBeforeId = computeInsertBeforeId(body, e.clientY, draggedTaskId);
      var targetCard = insertBeforeId ? body.querySelector('.task-card[data-task-id="' + insertBeforeId + '"]') : null;

      var alreadyInPlace = targetCard
        ? draggedCard.nextElementSibling === targetCard
        : (draggedCard.parentElement === body && draggedCard.nextElementSibling === null);
      if (alreadyInPlace && draggedCard.parentElement === body) return;

      flipReorder(body, function () {
        if (targetCard) body.insertBefore(draggedCard, targetCard);
        else body.appendChild(draggedCard);
      });
    });
    body.addEventListener('drop', function (e) { handleColumnDrop(e, board, column, body); });

    return el;
  }

  function renderTaskCardElement(board, column, task) {
    var assignee = task.assigneeId ? findUser(board, task.assigneeId) : null;
    var subtaskDone = task.subtasks.filter(function (s) { return s.done; }).length;
    var subtaskTotal = task.subtasks.length;
    var todayStr = new Date().toISOString().slice(0, 10);
    var overdue = !!task.dueDate && task.dueDate < todayStr && !column.isDone;

    var card = document.createElement('div');
    card.className = 'task-card' + (assignee ? '' : ' task-card-unassigned-border') +
      (task.priority && task.priority !== 'none' ? ' priority-' + task.priority : '');
    card.setAttribute('draggable', 'true');
    card.setAttribute('data-task-id', task.id);
    card.innerHTML =
      '<div class="task-card-actions">' +
      '<button class="btn btn-ghost btn-icon" data-action="history-task" title="History" aria-label="History for ' + escapeHtml(task.title) + '">' + ICONS.history + '</button>' +
      '<button class="btn btn-ghost btn-icon" data-action="edit-task" title="Edit task" aria-label="Edit ' + escapeHtml(task.title) + '">' + ICONS.edit + '</button>' +
      '</div>' +
      '<p class="task-card-title">' + escapeHtml(task.title) + '</p>' +
      '<div class="task-card-meta">' +
      '<span class="points-badge">' + ICONS.zap + (task.points || 0) + ' pt' + (task.points === 1 ? '' : 's') + '</span>' +
      (task.dueDate ? '<span class="due-badge' + (overdue ? ' overdue' : '') + '">' + ICONS.calendar + formatDate(task.dueDate) + '</span>' : '') +
      '</div>' +
      '<div class="task-card-footer">' +
      (subtaskTotal > 0
        ? '<span class="subtask-progress">' +
          '<span class="subtask-progress-ring" style="--pct:' + Math.round((subtaskDone / subtaskTotal) * 100) + ';"></span>' +
          '<span class="subtask-progress-text">' + subtaskDone + '/' + subtaskTotal + '</span>' +
          '</span>'
        : '<span></span>') +
      '<div class="task-card-footer-right">' +
      (assignee
        ? '<span class="task-card-avatar" style="--avatar-color:' + userColor(assignee.id) + ';" title="' + escapeHtml(assignee.name) + '">' + escapeHtml(initials(assignee.name)) + '</span>'
        : '<span class="task-card-avatar task-card-unassigned" title="Unassigned" aria-label="Unassigned">?</span>') +
      '</div>' +
      '</div>';

    card.querySelector('[data-action="edit-task"]').addEventListener('click', function () { openEditTaskModal(board, task); });
    card.querySelector('[data-action="history-task"]').addEventListener('click', function () { openTaskHistoryModal(board, task); });

    card.addEventListener('click', function (e) {
      if (e.target.closest('[data-action]')) return;
      openEditTaskModal(board, task);
    });

    card.addEventListener('dragstart', function (e) {
      draggedTaskId = task.id;
      e.dataTransfer.setData('text/plain', task.id);
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(function () { card.classList.add('dragging'); }, 0);
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('dragging');
      draggedTaskId = null;



      render();
    });

    card.addEventListener('dragover', function (e) {
      if (!draggedPriorityValue && !draggedUserId) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      card.classList.add('priority-drop-target');
    });
    card.addEventListener('dragleave', function () {
      if (!draggedPriorityValue && !draggedUserId) return;
      card.classList.remove('priority-drop-target');
    });
    card.addEventListener('drop', function (e) {
      if (!draggedPriorityValue && !draggedUserId) return;
      e.preventDefault();
      e.stopPropagation();
      card.classList.remove('priority-drop-target');

      if (draggedPriorityValue) {
        var oldPriority = task.priority || 'none';
        if (draggedPriorityValue !== oldPriority) {
          task.priority = draggedPriorityValue;
          addHistoryEntry(task, 'priority', 'Priority changed from ' + priorityLabel(oldPriority) + ' to ' + priorityLabel(draggedPriorityValue));
        }
      }
      if (draggedUserId) {
        var oldAssigneeId = task.assigneeId;
        if (draggedUserId !== oldAssigneeId) {
          var oldUser = oldAssigneeId ? findUser(board, oldAssigneeId) : null;
          var newUser = findUser(board, draggedUserId);
          task.assigneeId = draggedUserId;
          if (newUser && oldUser) addHistoryEntry(task, 'assignee', 'Reassigned from ' + oldUser.name + ' to ' + newUser.name);
          else if (newUser) addHistoryEntry(task, 'assignee', 'Assigned to ' + newUser.name);
        }
      }

      draggedPriorityValue = null;
      draggedUserId = null;
      saveState();
      render();
      bounceTaskCard(task.id);
    });

    return card;
  }

  function bounceTaskCard(taskId) {
    var el = document.querySelector('[data-task-id="' + taskId + '"]');
    if (!el) return;
    el.classList.add('priority-bounce');
    el.addEventListener('animationend', function () { el.classList.remove('priority-bounce'); }, { once: true });
  }



  var HISTORY_ICON_BY_TYPE = { created: 'plus', assignee: 'users', priority: 'flag', column: 'columns' };

  function addHistoryEntry(task, type, text) {
    if (!task.history) task.history = [];
    task.history.push({ id: uid(), type: type, text: text, at: Date.now() });
  }

  function priorityLabel(value) {
    var item = PRIORITY_ITEMS.find(function (i) { return i.value === (value || 'none'); });
    return item ? item.label : 'None';
  }

  function formatHistoryTime(at) {
    var d = new Date(at);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }

  function openTaskHistoryModal(board, task) {
    var html =
      '<div class="history-modal">' +
      '<div class="history-list" id="historyList"></div>' +
      '<form id="historyNoteForm" class="history-input-row">' +
      '<input type="text" id="historyNoteInput" class="form-control" placeholder="Add a note..." autocomplete="off">' +
      '<button type="submit" class="btn btn-primary history-send-btn" aria-label="Add note">' + ICONS.send + '</button>' +
      '</form>' +
      '</div>';

    openModal(task.title, html, function (body) {
      var titleEl = document.getElementById('modalTitle');
      if (titleEl) titleEl.innerHTML = ICONS.history + escapeHtml(task.title);

      renderHistoryList(body, task);

      body.querySelector('#historyNoteForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var input = body.querySelector('#historyNoteInput');
        var text = input.value.trim();
        if (!text) return;
        addHistoryEntry(task, 'note', text);
        saveState();
        input.value = '';
        renderHistoryList(body, task);
        input.focus();
      });
    });
  }

  function renderHistoryList(body, task) {
    var list = body.querySelector('#historyList');
    var entries = (task.history || []).slice().sort(function (a, b) { return a.at - b.at; });

    list.innerHTML = entries.length === 0
      ? '<p class="empty-hint">No history yet.</p>'
      : entries.map(function (entry) {
        var isNote = entry.type === 'note';
        return '<div class="history-entry' + (isNote ? ' history-entry-note' : ' history-entry-event') + '">' +
          (isNote ? '' : '<span class="history-entry-icon">' + ICONS[HISTORY_ICON_BY_TYPE[entry.type] || 'history'] + '</span>') +
          '<p class="history-entry-text">' + escapeHtml(entry.text) + '</p>' +
          '<span class="history-entry-time">' + formatHistoryTime(entry.at) + '</span>' +
          '</div>';
      }).join('');

    list.scrollTop = list.scrollHeight;
  }





  function flipReorder(container, mutateFn) {
    var before = {};
    Array.from(container.children).forEach(function (c) {
      if (c.classList.contains('task-card')) before[c.getAttribute('data-task-id')] = c.getBoundingClientRect();
    });

    mutateFn();

    Array.from(container.children).forEach(function (c) {
      if (!c.classList.contains('task-card')) return;
      var first = before[c.getAttribute('data-task-id')];
      if (!first) return;
      var last = c.getBoundingClientRect();
      var deltaY = first.top - last.top;
      if (!deltaY) return;
      c.style.transition = 'none';
      c.style.transform = 'translateY(' + deltaY + 'px)';
      requestAnimationFrame(function () {
        c.style.transition = 'transform 0.15s ease';
        c.style.transform = '';
      });
    });
  }

  function computeInsertBeforeId(container, clientY, excludeTaskId) {
    var cards = Array.from(container.querySelectorAll('.task-card'));
    for (var i = 0; i < cards.length; i++) {
      if (cards[i].getAttribute('data-task-id') === excludeTaskId) continue;
      var rect = cards[i].getBoundingClientRect();
      var midY = rect.top + rect.height / 2;
      if (clientY < midY) return cards[i].getAttribute('data-task-id');
    }
    return null;
  }

  function handleColumnDrop(e, board, column, container) {
    e.preventDefault();

    var taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    var task = findTask(board, taskId);
    if (!task) return;

    var sourceColumn = findColumn(board, task.columnId);
    var insertBeforeId = computeInsertBeforeId(container, e.clientY, taskId);
    var enteringDone = column.isDone && !(sourceColumn && sourceColumn.isDone);

    function finishMove() {
      var changedColumn = task.columnId !== column.id;
      if (changedColumn && sourceColumn) {
        addHistoryEntry(task, 'column', 'Moved from "' + sourceColumn.name + '" to "' + column.name + '"');
      }
      moveTaskToColumn(board, task, column.id, insertBeforeId);
      saveState();
      render();



      if (changedColumn) setTimeout(function () { bounceTaskCard(task.id); }, 0);
      if (enteringDone) Buddy.spawnConfetti();
    }

    var hasUndoneSubtasks = enteringDone && task.subtasks.some(function (s) { return !s.done; });
    if (hasUndoneSubtasks) {
      openConfirmModal(
        'Mark All Subtasks Done?',
        'Moving "' + task.title + '" to "' + column.name + '" will also mark all its subtasks as done. Continue?',
        'Continue',
        function () {
          task.subtasks.forEach(function (s) { s.done = true; });
          finishMove();
        }
      );
      return;
    }

    finishMove();
  }



  var modalApi = Buddy.modal.init();
  var openModal = modalApi.open;
  var closeModal = modalApi.close;

  function openConfirmModal(title, message, confirmLabel, onConfirm, opts) {
    opts = opts || {};
    var danger = opts.danger ? 'btn-danger' : 'btn-primary';
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnConfirmNo">' + escapeHtml(opts.cancelLabel || 'Cancel') + '</button>' +
      '<button class="btn ' + danger + '" id="btnConfirmYes">' + escapeHtml(confirmLabel) + '</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnConfirmNo').addEventListener('click', closeModal);
      body.querySelector('#btnConfirmYes').addEventListener('click', function () {
        closeModal();
        onConfirm();
      });
    });
  }

  function openInfoModal(title, message) {
    var html =
      '<p class="modal-message">' + escapeHtml(message) + '</p>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-primary" id="btnInfoOk">OK</button>' +
      '</div>';
    openModal(title, html, function (body) {
      body.querySelector('#btnInfoOk').addEventListener('click', closeModal);
    });
  }



  function renderDropdown(container, config) {
    var items = config.items || [];
    var selectedItem = items.find(function (i) { return i.value === config.value; });

    var selectedHtml = selectedItem
      ? (selectedItem.icon || '') + '<span>' + escapeHtml(selectedItem.label) + '</span>'
      : '<span class="dropdown-placeholder">' + escapeHtml(config.placeholder || 'Select') + '</span>';

    var optionsHtml = items.map(function (item) {
      var activeClass = item.value === config.value ? ' active' : '';
      return '<button type="button" class="dropdown-option' + activeClass + '" data-value="' + escapeHtml(item.value) + '">' +
        (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span></button>';
    }).join('');

    container.innerHTML =
      '<div class="dropdown">' +
      '<button type="button" class="form-control dropdown-toggle" aria-haspopup="listbox" aria-expanded="false"' +
      (config.ariaLabel ? ' aria-label="' + escapeHtml(config.ariaLabel) + '"' : '') + '>' +
      '<span class="dropdown-selected">' + selectedHtml + '</span>' +
      ICONS.chevronDown +
      '</button>' +
      '<div class="dropdown-menu" role="listbox" hidden>' + optionsHtml + '</div>' +
      '</div>';

    var dropdown = container.querySelector('.dropdown');
    var toggle = dropdown.querySelector('.dropdown-toggle');
    var menu = dropdown.querySelector('.dropdown-menu');
    var selectedDisplay = dropdown.querySelector('.dropdown-selected');

    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('open');
      if (isOpen) {
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        dropdown.classList.add('open');
        menu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.dropdown-option').forEach(function (option) {
      option.addEventListener('click', function () {
        var value = option.getAttribute('data-value');
        var item = items.find(function (i) { return i.value === value; });
        config.value = value;
        selectedDisplay.innerHTML = item ? (item.icon || '') + '<span>' + escapeHtml(item.label) + '</span>' : '';
        menu.querySelectorAll('.dropdown-option').forEach(function (o) {
          o.classList.toggle('active', o === option);
        });
        dropdown.classList.remove('open');
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        if (typeof config.onChange === 'function') config.onChange(value);
      });
    });
  }



  function defaultColumns() {
    return [
      { id: uid(), name: 'Open', isDone: false },
      { id: uid(), name: 'In Progress', isDone: false },
      { id: uid(), name: 'Waiting', isDone: false },
      { id: uid(), name: 'Done', isDone: true }
    ];
  }

  function openAddBoardModal() {
    renderBoardFormModal('Add Board', null);
  }

  function openEditBoardModal(board) {
    renderBoardFormModal('Edit Board', board);
  }

  function boardFormColumnsHtml(columns) {
    return columns.map(function (c) {
      return '<li class="board-form-column-row" data-column-id="' + c.id + '">' +
        '<input type="text" class="form-control board-form-column-input" value="' + escapeHtml(c.name) + '" readonly>' +
        '<label class="checkbox-custom column-done-check" title="Mark tasks moved here as Done">' +
        '<input type="checkbox" class="board-form-column-done"' + (c.isDone ? ' checked' : '') + ' aria-label="Mark \'' + escapeHtml(c.name) + '\' as the Done column">' +
        '<span class="checkbox-box">' + ICONS.check + '</span>' +
        '</label>' +
        '<button type="button" class="btn btn-ghost btn-icon board-form-column-edit" title="Edit ' + escapeHtml(c.name) + '" aria-label="Edit ' + escapeHtml(c.name) + '">' + ICONS.edit + '</button>' +
        '<button type="button" class="btn btn-ghost btn-icon board-form-column-delete" data-column-id="' + c.id + '" title="Delete ' + escapeHtml(c.name) + '" aria-label="Delete ' + escapeHtml(c.name) + '">' + ICONS.trash + '</button>' +
        '</li>';
    }).join('');
  }

  function renderBoardFormModal(title, board) {
    var columns = board ? board.columns : defaultColumns();

    var html =
      '<form id="boardForm">' +
      '<div class="form-group">' +
      '<label for="boardName">Board Name</label>' +
      '<input type="text" id="boardName" class="form-control" value="' + (board ? escapeHtml(board.name) : '') + '" required>' +
      '<div class="form-error" id="boardNameError">Board name cannot be empty.</div>' +
      '</div>' +
      '</form>' +
      '<div class="form-group">' +
      '<label>Columns</label>' +
      '<ul class="board-form-columns" id="boardFormColumns">' + boardFormColumnsHtml(columns) + '</ul>' +
      '<div class="board-form-add-column">' +
      '<input type="text" id="newColumnName" class="form-control" placeholder="New column name">' +
      '<button type="button" class="btn btn-ghost btn-icon" id="btnAddColumnInline" title="Add column" aria-label="Add column">' + ICONS.plus + '</button>' +
      '</div>' +
      '<div class="form-error" id="boardFormColumnsError">A board needs at least one column.</div>' +
      '</div>' +
      (board
        ? '<div class="modal-actions-split">' +
          '<button type="button" class="btn btn-danger" id="btnDeleteBoard">Delete Board</button>' +
          '<div class="modal-actions" style="margin-top:0;">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelBoard">Cancel</button>' +
          '<button type="submit" form="boardForm" class="btn btn-primary">Save Changes</button>' +
          '</div></div>'
        : '<div class="modal-actions">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelBoard">Cancel</button>' +
          '<button type="submit" form="boardForm" class="btn btn-primary">Add Board</button>' +
          '</div>');

    openModal(title, html, function (body) {
      body.querySelector('#btnCancelBoard').addEventListener('click', closeModal);

      if (board) {
        body.querySelector('#btnDeleteBoard').addEventListener('click', function () {
          closeModal();
          openConfirmModal(
            'Delete Board',
            'Delete "' + board.name + '" and all of its columns, team members, and tasks? This cannot be undone.',
            'Delete Board',
            function () {
              state.boards = state.boards.filter(function (b) { return b.id !== board.id; });
              if (state.activeBoardId === board.id) state.activeBoardId = null;
              saveState();
              render();
            },
            { danger: true }
          );
        });
      }

      body.querySelector('#btnAddColumnInline').addEventListener('click', function () {
        var newColumnInput = body.querySelector('#newColumnName');
        var name = newColumnInput.value.trim();
        if (!name) return;
        columns.push({ id: uid(), name: name, isDone: false });
        if (board) saveState();
        newColumnInput.value = '';
        body.querySelector('#boardFormColumns').innerHTML = boardFormColumnsHtml(columns);
        if (board) render();
      });

      function commitColumnNameEdit(input) {
        if (input.readOnly) return;
        var row = input.closest('.board-form-column-row');
        var column = columns.find(function (c) { return c.id === row.getAttribute('data-column-id'); });
        input.readOnly = true;
        if (!column) return;
        var name = input.value.trim();
        if (name && name !== column.name) {
          column.name = name;
          if (board) { saveState(); render(); }
        } else {
          input.value = column.name;
        }
      }

      body.querySelector('#boardFormColumns').addEventListener('click', function (e) {
        var editBtn = e.target.closest('.board-form-column-edit');
        if (editBtn) {
          var input = editBtn.closest('.board-form-column-row').querySelector('.board-form-column-input');
          input.readOnly = false;
          input.focus();
          input.select();
          return;
        }

        var deleteBtn = e.target.closest('.board-form-column-delete');
        if (deleteBtn) {
          var column = columns.find(function (c) { return c.id === deleteBtn.getAttribute('data-column-id'); });
          if (!column) return;
          if (board) {
            closeModal();
            handleDeleteColumn(board, column);
            return;
          }
          var columnsError = body.querySelector('#boardFormColumnsError');
          if (columns.length <= 1) {
            columnsError.classList.add('visible');
            return;
          }
          columnsError.classList.remove('visible');
          columns.splice(columns.indexOf(column), 1);
          body.querySelector('#boardFormColumns').innerHTML = boardFormColumnsHtml(columns);
        }
      });

      body.querySelector('#boardFormColumns').addEventListener('focusout', function (e) {
        var input = e.target.closest('.board-form-column-input');
        if (input) commitColumnNameEdit(input);
      });

      body.querySelector('#boardFormColumns').addEventListener('change', function (e) {
        var checkbox = e.target.closest('.board-form-column-done');
        if (!checkbox) return;
        var column = columns.find(function (c) { return c.id === checkbox.closest('.board-form-column-row').getAttribute('data-column-id'); });
        if (!column) return;
        columns.forEach(function (c) { c.isDone = false; });
        column.isDone = checkbox.checked;
        if (board) saveState();
        body.querySelector('#boardFormColumns').innerHTML = boardFormColumnsHtml(columns);
        if (board) render();
      });

      body.querySelector('#boardFormColumns').addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        var input = e.target.closest('.board-form-column-input');
        if (!input) return;
        e.preventDefault();
        input.blur();
      });

      body.querySelector('#boardForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = body.querySelector('#boardName');
        var name = nameInput.value.trim();
        var nameError = body.querySelector('#boardNameError');
        if (!name) {
          nameError.classList.add('visible');
          return;
        }
        nameError.classList.remove('visible');

        if (board) {
          board.name = name;
        } else {
          var newBoard = {
            id: uid(),
            name: name,
            createdAt: Date.now(),
            columns: columns,
            users: [],
            tasks: []
          };
          state.boards.push(newBoard);
          state.activeBoardId = newBoard.id;
        }
        saveState();
        closeModal();
        render();
      });
    });
  }



  function handleDeleteColumn(board, column) {
    if (board.columns.length <= 1) {
      openInfoModal('Can\'t Delete Column', 'A board needs at least one column.');
      return;
    }

    var tasksInColumn = board.tasks.filter(function (t) { return t.columnId === column.id; });

    if (tasksInColumn.length === 0) {
      openConfirmModal(
        'Delete Column',
        'Delete the "' + column.name + '" column?',
        'Delete Column',
        function () {
          board.columns = board.columns.filter(function (c) { return c.id !== column.id; });
          saveState();
          render();
        },
        { danger: true }
      );
      return;
    }

    var fallback = board.columns.find(function (c) { return c.id !== column.id; });
    openConfirmModal(
      'Delete Column',
      'The "' + column.name + '" column has ' + tasksInColumn.length + ' task' + (tasksInColumn.length === 1 ? '' : 's') +
      '. Deleting it will move ' + (tasksInColumn.length === 1 ? 'it' : 'them') + ' to "' + fallback.name + '". Continue?',
      'Delete Column',
      function () {
        tasksInColumn.forEach(function (t) { moveTaskToColumn(board, t, fallback.id, null); });
        board.columns = board.columns.filter(function (c) { return c.id !== column.id; });
        saveState();
        render();
      },
      { danger: true }
    );
  }



  function openAddUserModal(board) {
    renderUserFormModal('Add User', board, null);
  }

  function openEditUserModal(board, user) {
    renderUserFormModal('Edit User', board, user);
  }

  function renderUserFormModal(title, board, user) {
    var html =
      '<form id="userForm">' +
      '<div class="form-group">' +
      '<label for="userName">Name</label>' +
      '<input type="text" id="userName" class="form-control" value="' + (user ? escapeHtml(user.name) : '') + '" required>' +
      '<div class="form-error" id="userNameError">Name cannot be empty.</div>' +
      '</div>' +
      (user
        ? '<div class="modal-actions-split">' +
          '<button type="button" class="btn btn-danger" id="btnDeleteUser">Remove User</button>' +
          '<div class="modal-actions" style="margin-top:0;">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelUser">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Save Changes</button>' +
          '</div></div>'
        : '<div class="modal-actions">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelUser">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Add User</button>' +
          '</div>') +
      '</form>';

    openModal(title, html, function (body) {
      body.querySelector('#btnCancelUser').addEventListener('click', closeModal);

      if (user) {
        body.querySelector('#btnDeleteUser').addEventListener('click', function () {
          closeModal();
          handleRemoveUser(board, user);
        });
      }

      body.querySelector('#userForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var nameInput = body.querySelector('#userName');
        var name = nameInput.value.trim();
        var nameError = body.querySelector('#userNameError');

        if (!name) {
          nameError.textContent = 'Name cannot be empty.';
          nameError.classList.add('visible');
          return;
        }

        var isDuplicate = board.users.some(function (u) {
          return (!user || u.id !== user.id) && u.name.trim().toLowerCase() === name.toLowerCase();
        });
        if (isDuplicate) {
          nameError.textContent = 'A team member with this name already exists.';
          nameError.classList.add('visible');
          return;
        }

        nameError.classList.remove('visible');

        if (user) {
          user.name = name;
        } else {
          board.users.push({ id: uid(), name: name });
        }
        saveState();
        closeModal();
        render();
      });
    });
  }

  function handleRemoveUser(board, user) {
    openConfirmModal(
      'Remove Team Member',
      'Remove "' + user.name + '"? Tasks assigned to them will become unassigned.',
      'Remove',
      function () {
        board.tasks.forEach(function (t) {
          if (t.assigneeId === user.id) {
            t.assigneeId = null;
            addHistoryEntry(t, 'assignee', 'Unassigned from ' + user.name + ' (team member removed)');
          }
        });
        board.users = board.users.filter(function (u) { return u.id !== user.id; });
        saveState();
        render();
      },
      { danger: true }
    );
  }



  function openAddTaskModal(board, presetColumnId) {
    renderTaskFormModal('Add Task', board, null, presetColumnId);
  }

  function openEditTaskModal(board, task) {
    renderTaskFormModal('Edit Task', board, task, task.columnId);
  }

  function subtaskRowHtml(subtask) {
    return '<div class="subtask-row">' +
      '<label class="checkbox-custom subtask-check-wrap">' +
      '<input type="checkbox"' + (subtask && subtask.done ? ' checked' : '') + ' aria-label="Subtask done">' +
      '<span class="checkbox-box">' + ICONS.check + '</span>' +
      '</label>' +
      '<input type="text" class="form-control" placeholder="Subtask" value="' + (subtask ? escapeHtml(subtask.text) : '') + '">' +
      '<button type="button" class="btn btn-ghost subtask-row-remove" aria-label="Remove subtask">' + ICONS.x + '</button>' +
      '</div>';
  }

  var PRIORITY_ITEMS = [
    { value: 'none', label: 'None' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  function renderTaskFormModal(title, board, task, presetColumnId) {
    var selectedAssignee = task ? (task.assigneeId || '') : '';
    var selectedColumn = task ? task.columnId : (presetColumnId || (board.columns[0] && board.columns[0].id) || '');
    var selectedPriority = task ? (task.priority || 'none') : 'none';

    var subtasksHtml = task && task.subtasks.length > 0
      ? task.subtasks.map(subtaskRowHtml).join('')
      : '';

    var html =
      '<form id="taskForm">' +
      '<div class="form-row">' +
      '<div class="form-group" style="flex:3;">' +
      '<label for="taskTitle">Title</label>' +
      '<input type="text" id="taskTitle" class="form-control" value="' + (task ? escapeHtml(task.title) : '') + '" required>' +
      '<div class="form-error" id="taskTitleError">Title cannot be empty.</div>' +
      '</div>' +
      '<div class="form-group" style="flex:1;">' +
      '<label>Assignee</label>' +
      '<div id="taskAssigneeDropdown"></div>' +
      '</div>' +
      '</div>' +
      '<div class="form-row">' +
      '<div class="form-group">' +
      '<label for="taskPoints">Points</label>' +
      '<input type="number" id="taskPoints" class="form-control" min="0" step="1" value="' + (task ? task.points : 0) + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Priority</label>' +
      '<div id="taskPriorityDropdown"></div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="taskDueDate">Due Date (optional)</label>' +
      '<input type="date" id="taskDueDate" class="form-control" value="' + (task ? (task.dueDate || '') : '') + '">' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Column</label>' +
      '<div id="taskColumnDropdown"></div>' +
      '</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label for="taskDescription">Description (optional)</label>' +
      '<textarea id="taskDescription" class="form-control">' + (task ? escapeHtml(task.description || '') : '') + '</textarea>' +
      '</div>' +
      '<div class="form-group">' +
      '<label>Subtasks</label>' +
      '<div class="subtask-rows" id="subtaskRows">' + subtasksHtml + '</div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnAddSubtask">' + ICONS.plus + 'Add Subtask</button>' +
      '</div>' +
      (task
        ? '<div class="modal-actions-split">' +
          '<button type="button" class="btn btn-danger" id="btnDeleteTask">Delete Task</button>' +
          '<div class="modal-actions" style="margin-top:0;">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelTask">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Save Changes</button>' +
          '</div></div>'
        : '<div class="modal-actions">' +
          '<button type="button" class="btn btn-ghost" id="btnCancelTask">Cancel</button>' +
          '<button type="submit" class="btn btn-primary">Add Task</button>' +
          '</div>') +
      '</form>';

    openModal(title, html, function (body) {
      var assigneeItems = [{ value: '', label: 'Unassigned' }].concat(
        board.users.map(function (u) { return { value: u.id, label: u.name }; })
      );
      renderDropdown(body.querySelector('#taskAssigneeDropdown'), {
        items: assigneeItems,
        value: selectedAssignee,
        ariaLabel: 'Assignee',
        onChange: function (value) { selectedAssignee = value; }
      });

      renderDropdown(body.querySelector('#taskPriorityDropdown'), {
        items: PRIORITY_ITEMS,
        value: selectedPriority,
        ariaLabel: 'Priority',
        onChange: function (value) { selectedPriority = value; }
      });

      var columnItems = board.columns.map(function (c) {
        return { value: c.id, label: c.name + (c.isDone ? ' (Done)' : '') };
      });
      renderDropdown(body.querySelector('#taskColumnDropdown'), {
        items: columnItems,
        value: selectedColumn,
        ariaLabel: 'Column',
        onChange: function (value) { selectedColumn = value; }
      });

      body.querySelectorAll('#subtaskRows .subtask-row-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { btn.closest('.subtask-row').remove(); });
      });

      body.querySelector('#btnAddSubtask').addEventListener('click', function () {
        body.querySelector('#subtaskRows').insertAdjacentHTML('beforeend', subtaskRowHtml(null));
        var rows = body.querySelectorAll('#subtaskRows .subtask-row');
        var lastRow = rows[rows.length - 1];
        lastRow.querySelector('.subtask-row-remove').addEventListener('click', function () { lastRow.remove(); });
      });

      body.querySelector('#btnCancelTask').addEventListener('click', closeModal);

      if (task) {
        body.querySelector('#btnDeleteTask').addEventListener('click', function () {
          closeModal();
          handleDeleteTask(board, task);
        });
      }

      body.querySelector('#taskForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var titleInput = body.querySelector('#taskTitle');
        var titleVal = titleInput.value.trim();
        var titleError = body.querySelector('#taskTitleError');
        if (!titleVal) {
          titleError.classList.add('visible');
          return;
        }
        titleError.classList.remove('visible');

        var description = body.querySelector('#taskDescription').value.trim();
        var points = Math.max(0, parseInt(body.querySelector('#taskPoints').value, 10) || 0);
        var dueDate = body.querySelector('#taskDueDate').value;

        var subtasks = Array.from(body.querySelectorAll('#subtaskRows .subtask-row')).map(function (row) {
          var text = row.querySelector('input[type="text"]').value.trim();
          var done = row.querySelector('input[type="checkbox"]').checked;
          return text ? { id: uid(), text: text, done: done } : null;
        }).filter(Boolean);

        if (task) {
          var oldColumn = findColumn(board, task.columnId);
          var columnChanged = selectedColumn !== task.columnId;
          var oldAssigneeId = task.assigneeId;
          var newAssigneeId = selectedAssignee || null;
          var oldPriority = task.priority || 'none';
          var newPriority = selectedPriority;

          task.title = titleVal;
          task.description = description;
          task.points = points;
          task.priority = newPriority;
          task.dueDate = dueDate;
          task.assigneeId = newAssigneeId;
          task.subtasks = subtasks;

          var destColumn = findColumn(board, selectedColumn);
          if (columnChanged) moveTaskToColumn(board, task, selectedColumn, null);

          if (newAssigneeId !== oldAssigneeId) {
            var oldUser = oldAssigneeId ? findUser(board, oldAssigneeId) : null;
            var newUser = newAssigneeId ? findUser(board, newAssigneeId) : null;
            if (newUser && oldUser) addHistoryEntry(task, 'assignee', 'Reassigned from ' + oldUser.name + ' to ' + newUser.name);
            else if (newUser) addHistoryEntry(task, 'assignee', 'Assigned to ' + newUser.name);
            else if (oldUser) addHistoryEntry(task, 'assignee', 'Unassigned from ' + oldUser.name);
          }
          if (newPriority !== oldPriority) {
            addHistoryEntry(task, 'priority', 'Priority changed from ' + priorityLabel(oldPriority) + ' to ' + priorityLabel(newPriority));
          }
          if (columnChanged && destColumn && oldColumn) {
            addHistoryEntry(task, 'column', 'Moved from "' + oldColumn.name + '" to "' + destColumn.name + '"');
          }

          saveState();
          closeModal();
          render();
          if (columnChanged && destColumn && destColumn.isDone && oldColumn && !oldColumn.isDone) Buddy.spawnConfetti();
        } else {
          var newTask = {
            id: uid(),
            title: titleVal,
            description: description,
            points: points,
            priority: selectedPriority,
            dueDate: dueDate,
            assigneeId: selectedAssignee || null,
            columnId: selectedColumn,
            order: nextOrderForColumn(board, selectedColumn),
            subtasks: subtasks,
            createdAt: Date.now()
          };
          addHistoryEntry(newTask, 'created', 'Task created');
          board.tasks.push(newTask);
          saveState();
          closeModal();
          render();
        }
      });
    }, { wide: true });
  }

  function handleDeleteTask(board, task) {
    openConfirmModal(
      'Delete Task',
      'Delete "' + task.title + '"? This cannot be undone.',
      'Delete Task',
      function () {
        board.tasks = board.tasks.filter(function (t) { return t.id !== task.id; });
        saveState();
        render();
      },
      { danger: true }
    );
  }



  function downloadFile(filename, content, mime) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function openExportDataModal() {
    if (state.boards.length === 0) {
      openInfoModal('Export Data', 'There are no boards to export yet.');
      return;
    }

    var rowsHtml = state.boards.map(function (b) {
      return '<label class="export-board-row selected">' +
        '<input type="checkbox" class="export-board-checkbox" data-board="' + b.id + '" checked>' +
        '<span class="export-board-row-name">' + escapeHtml(b.name) + '</span>' +
        '<span class="export-board-row-meta">' + b.tasks.length + ' task' + (b.tasks.length === 1 ? '' : 's') + '</span>' +
        '</label>';
    }).join('');

    var html =
      '<form id="exportDataForm">' +
      '<div class="form-group">' +
      '<label>Boards to include</label>' +
      '<div class="export-board-list">' + rowsHtml + '</div>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="btnToggleAllExportBoards" style="margin-top:8px;">Select / Deselect All</button>' +
      '<div class="form-error" id="exportDataError">Select at least one board to export.</div>' +
      '</div>' +
      '<div class="form-group">' +
      '<label class="form-check">' +
      '<span class="checkbox-custom column-done-check">' +
      '<input type="checkbox" id="exportIncludeHistory" checked>' +
      '<span class="checkbox-box">' + ICONS.check + '</span>' +
      '</span>' +
      'Include task history' +
      '</label>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button type="button" class="btn btn-ghost" id="btnCancelExportData">Cancel</button>' +
      '<button type="submit" class="btn btn-primary">Export</button>' +
      '</div>' +
      '</form>';

    openModal('Export Data', html, function (body) {
      var checkboxes = body.querySelectorAll('.export-board-checkbox');

      checkboxes.forEach(function (cb) {
        cb.addEventListener('change', function () {
          cb.closest('.export-board-row').classList.toggle('selected', cb.checked);
        });
      });

      body.querySelector('#btnToggleAllExportBoards').addEventListener('click', function () {
        var allChecked = Array.prototype.every.call(checkboxes, function (cb) { return cb.checked; });
        checkboxes.forEach(function (cb) {
          cb.checked = !allChecked;
          cb.closest('.export-board-row').classList.toggle('selected', cb.checked);
        });
      });

      body.querySelector('#btnCancelExportData').addEventListener('click', closeModal);

      body.querySelector('#exportDataForm').addEventListener('submit', function (e) {
        e.preventDefault();
        var selectedIds = Array.prototype.filter.call(checkboxes, function (cb) { return cb.checked; })
          .map(function (cb) { return cb.getAttribute('data-board'); });

        var errorEl = body.querySelector('#exportDataError');
        if (selectedIds.length === 0) {
          errorEl.classList.add('visible');
          return;
        }
        errorEl.classList.remove('visible');

        var selectedBoards = state.boards.filter(function (b) { return selectedIds.indexOf(b.id) !== -1; });
        var includeHistory = body.querySelector('#exportIncludeHistory').checked;
        closeModal();
        exportDataJSON(selectedBoards, includeHistory);
      });
    });
  }




  function stripTaskHistory(boards) {
    return boards.map(function (b) {
      return Object.assign({}, b, {
        tasks: (b.tasks || []).map(function (t) {
          var copy = Object.assign({}, t);
          delete copy.history;
          return copy;
        })
      });
    });
  }

  function exportDataJSON(boards, includeHistory) {
    var exportBoards = includeHistory ? boards : stripTaskHistory(boards);
    var content = JSON.stringify({ boards: exportBoards }, null, 2);
    downloadFile('kanban-buddy-backup-' + new Date().toISOString().slice(0, 10) + '.json', content, 'application/json');
  }

  function handleImportFile(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      var parsed;
      try {
        parsed = JSON.parse(reader.result);
      } catch (err) {
        openInfoModal('Import Failed', 'That file is not valid JSON.');
        dom.fileImportData.value = '';
        return;
      }
      if (!parsed || !Array.isArray(parsed.boards)) {
        openInfoModal('Import Failed', 'That file does not look like a Kanban Buddy backup.');
        dom.fileImportData.value = '';
        return;
      }

      openImportModal(parsed.boards);
      dom.fileImportData.value = '';
    };
    reader.readAsText(file);
  }

  function openImportModal(importedBoards) {
    var hasExisting = state.boards.length > 0;
    var html =
      '<p class="modal-message">' + (hasExisting
        ? 'This browser already has ' + state.boards.length + ' board(s) saved. The file you picked has ' + importedBoards.length + ' board(s). What would you like to do?'
        : 'Import ' + importedBoards.length + ' board(s) from this file?') +
      '</p>' +
      '<div class="form-group">' +
      '<label class="form-check">' +
      '<span class="checkbox-custom column-done-check">' +
      '<input type="checkbox" id="importIncludeHistory" checked>' +
      '<span class="checkbox-box">' + ICONS.check + '</span>' +
      '</span>' +
      'Include task history' +
      '</label>' +
      '</div>' +
      '<div class="modal-actions">' +
      '<button class="btn btn-ghost" id="btnImportCancel">Cancel</button>' +
      (hasExisting
        ? '<button class="btn btn-danger" id="btnImportReplace">Replace All</button>' +
          '<button class="btn btn-primary" id="btnImportAppend">Append</button>'
        : '<button class="btn btn-primary" id="btnImportConfirm">Import</button>') +
      '</div>';

    openModal('Import Data', html, function (body) {
      function boardsToImport() {
        return body.querySelector('#importIncludeHistory').checked ? importedBoards : stripTaskHistory(importedBoards);
      }

      body.querySelector('#btnImportCancel').addEventListener('click', closeModal);

      if (hasExisting) {
        body.querySelector('#btnImportReplace').addEventListener('click', function () {
          closeModal();
          state = { boards: boardsToImport(), activeBoardId: null };
          saveState();
          render();
        });

        body.querySelector('#btnImportAppend').addEventListener('click', function () {
          closeModal();
          state.boards = state.boards.concat(boardsToImport().map(remapImportedBoardIds));
          saveState();
          render();
        });
      } else {
        body.querySelector('#btnImportConfirm').addEventListener('click', function () {
          closeModal();
          state.boards = boardsToImport();
          state.activeBoardId = null;
          saveState();
          render();
        });
      }
    });
  }




  function remapImportedBoardIds(board) {
    var columnIdMap = {};
    var newColumns = (board.columns || []).map(function (c) {
      var newId = uid();
      columnIdMap[c.id] = newId;
      return { id: newId, name: c.name, isDone: !!c.isDone };
    });

    var userIdMap = {};
    var newUsers = (board.users || []).map(function (u) {
      var newId = uid();
      userIdMap[u.id] = newId;
      return { id: newId, name: u.name };
    });

    var newTasks = (board.tasks || []).map(function (t) {
      return {
        id: uid(),
        title: t.title,
        description: t.description || '',
        points: t.points || 0,
        priority: t.priority || 'none',
        dueDate: t.dueDate || '',
        assigneeId: userIdMap.hasOwnProperty(t.assigneeId) ? userIdMap[t.assigneeId] : null,
        columnId: columnIdMap.hasOwnProperty(t.columnId) ? columnIdMap[t.columnId] : (newColumns[0] && newColumns[0].id),
        order: t.order || 0,
        subtasks: (t.subtasks || []).map(function (s) { return { id: uid(), text: s.text, done: !!s.done }; }),
        history: (t.history || []).map(function (h) { return { id: uid(), type: h.type, text: h.text, at: h.at }; }),
        createdAt: Date.now()
      };
    });

    return {
      id: uid(),
      name: board.name,
      createdAt: board.createdAt || new Date().toISOString().slice(0, 10),
      columns: newColumns,
      users: newUsers,
      tasks: newTasks
    };
  }



  function handleLoadSample(e) {
    e.preventDefault();
    if (window.location.protocol === 'file:') {
      openInfoModal(
        'Server Required',
        'Loading the sample board needs the app to be served from a local or remote server — it can\'t read local files when index.html is opened directly from your file system. Instead, download kanbanBuddy_sample.json from cdnBuddy/samples and use the Import button (top-left) to load it.'
      );
      return;
    }
    fetch('https://isafuianish-dev.github.io/webapp_cdnBuddy/samples/kanbanBuddy_sample.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed');
        return res.json();
      })
      .then(function (parsed) {
        if (!parsed || !Array.isArray(parsed.boards) || !parsed.boards.length) throw new Error('Invalid data');
        var newBoards = parsed.boards.map(remapImportedBoardIds);
        state.boards = state.boards.concat(newBoards);
        state.activeBoardId = newBoards[0].id;
        saveState();
        render();
      })
      .catch(function () {
        openInfoModal('Load Failed', 'Could not load the sample board.');
      });
  }
})();
