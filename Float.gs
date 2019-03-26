function advanceTasks() {
  var taskLists = getTaskLists();
  for (i = 0; i < taskLists.length; i++) {
    Logger.log("Found task list " + taskLists[i].name);
    overdueTasks = getOverdueTasks(taskLists[i].id);
    Logger.log("Overdue tasks: " + overdueTasks.length);
    for (j = 0; j < overdueTasks.length; j++) {
      advanceTask(taskLists[i].id, overdueTasks[j].id);
    }
    completedTasks = getCompletedTasks(taskLists[i].id);
    Logger.log("Completed tasks: " + completedTasks.length);
    for (j = 0; j < completedTasks.length; j++) {
      Logger.log(completedTasks[j].title);
      if (addCalendarEvent( completedTasks[j].title, completedTasks[j].notes, completedTasks[j].completed )) {
        deleteTask(taskLists[i].id, completedTasks[j].id);
      }
    }
  }
}

function getTaskLists() {
  var taskLists = Tasks.Tasklists.list().getItems();
  if (!taskLists) {
    return [];
  }
  return taskLists.map(function(taskList) {
    return {
      id: taskList.getId(),
      name: taskList.getTitle()
    };
  });
}

function getOverdueTasks(listId) {
  var params = {
    dueMax: formatDate(new Date()),
    showCompleted: false,
    showDeleted: false
  };
  var tasks = Tasks.Tasks.list(listId, params).getItems();
  if (!tasks) {
    return [];
  }
//  return tasks;
  return tasks.map(function(task) {
    return {
      id: task.getId(),
      title: task.getTitle(),
      due: task.getDue()
    };
  }).filter(function(task) {
    return task.title;
  });
}

function advanceTask(taskListId, taskId) {
  task = Tasks.Tasks.get(taskListId, taskId);
  Logger.log("Advance task: " + task.title + " due at " + task.due);
  dueDate = new Date(task.due);
  now = new Date();
  while( dueDate < now ) {
    dueDate.setDate( dueDate.getDate() + 1 );
  }
  Logger.log("Will now be due at " + dueDate);
  task.due = formatDate(dueDate);
  Tasks.Tasks.update(task, taskListId, taskId)
}

function getCompletedTasks(listId) {
  var params = {
    showCompleted: true,
    showHidden: true,
    completedMax: getEndOfDays(),
    showDeleted: false
  };
  var tasks = Tasks.Tasks.list(listId, params).getItems();
  if (!tasks) {
    return [];
  }
  return tasks.map(function(task) {
    return {
      id: task.getId(),
      title: task.getTitle(),
      notes: task.getNotes(),
      completed: task.getCompleted()
    };
  }).filter(function(task) {
    return task.title;
  });
}

function getEndOfDays() {
  date = new Date();
  date.setDate( date.getDate() + (1000 * 365) );
  return formatDate(date);
}

function addCalendarEvent(title, notes, date) {
  var event = {
    start: {
      dateTime: date,
    },
    end: {
      dateTime: date,
    },
    summary: title,
    description: notes
  };
  Calendar.Events.insert(event, Session.getActiveUser().getEmail());
  return true;
}

function deleteTask(taskListId, taskId) {
  Tasks.Tasks.remove(taskListId, taskId);
}

/**
 * Return an RFC3339 formated date String corresponding to the given
 * Date object.
 * @param {Date} date a Date.
 * @return {string} a formatted date string.
 */
function formatDate(date) {
  return Utilities.formatDate(date, 'UTC', 'yyyy-MM-dd\'T\'HH:mm:ssZ');
}

