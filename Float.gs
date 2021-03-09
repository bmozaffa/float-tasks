function run() {
  advanceTasks();
  removeUnsolicitedEvents();
}

function advanceTasks() {
  var taskLists = getTaskLists();
  for (i = 0; i < taskLists.length; i++) {
    taskList = taskLists[i];
    console.log('Found task list called %s', taskList.name);
    overdueTasks = getOverdueTasks(taskList.id);
    console.info("Found %d overdue tasks", overdueTasks.length);
    for (j = 0; j < overdueTasks.length; j++) {
      advanceTask(taskList.id, overdueTasks[j].id);
    }
    completedTasks = getCompletedTasks(taskList.id);
    console.info("Found %d completed tasks", completedTasks.length);
    for (j = 0; j < completedTasks.length; j++) {
      console.log("Found completed task called %s", completedTasks[j].title);
      if (addCalendarEvent( completedTasks[j].title, completedTasks[j].notes, completedTasks[j].completed, completedTasks[j].links )) {
        deleteTask(taskList.id, completedTasks[j].id);
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
    dueMax: formatDate(getToday()),
    showCompleted: false,
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
      due: task.getDue()
    };
  }).filter(function(task) {
    return task.title;
  });
}

function advanceTask(taskListId, taskId) {
  task = Tasks.Tasks.get(taskListId, taskId);
  dueDate = new Date(task.due);
  console.log("Advancing task %s due at %s", task.title, dueDate);
  while( dueDate < getToday() ) {
    dueDate.setDate( dueDate.getDate() + 1 );
  }
  console.log("Task will now be due at %s", dueDate);
  task.due = formatDate(dueDate);
  Tasks.Tasks.update(task, taskListId, taskId)
}

function getToday() {
  var today = new Date();
  today.setDate(today.getDate()-1);
  return today;
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
      completed: task.getCompleted(),
      links: task.getLinks()
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

function addCalendarEvent(title, notes, date, links) {
  if (links) {
    if (!notes) {
      notes = "Links:\n";
    } else {
      notes = notes + "\n\nLinks:\n"
    }
    for (i = 0; i < links.length; i++) {
      notes = notes + links[i].type + ": " + links[i].link + "\n";
    }
  }

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

function removeUnsolicitedEvents() {
  var events = getUnsolicitedEvents();
  console.log("Found %s events that should be declined", events.length);
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    console.log("Will decline \"%s\" created at %s and updated at %s", event.getTitle(), event.getDateCreated(), event.getLastUpdated());
    event.setMyStatus(CalendarApp.GuestStatus.NO);
  }
}


function getUnsolicitedEvents() {
  var DAYS_MAX_LOOK_AHEAD = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000));
  var events = CalendarApp.getEvents(new Date(), DAYS_MAX_LOOK_AHEAD, {max: 200})
  if (events.length == 0) {
    console.log("Found no events");
    return [];
  }
  return events.filter(function(event) {
    return isLargeEvent(event) && hasNotResponded(event) && isNotNewInvite(event);
  });
}

function isLargeEvent(event) {
  return !event.guestsCanSeeGuests();
}

function hasNotResponded(event) {
  return event.getMyStatus() == CalendarApp.GuestStatus.INVITED;
}

function isNotNewInvite(event) {
  var DAYS_GRACE_PERIOD = new Date(Date.now() - (3 * 24 * 60 * 60 * 1000));
  return event.getDateCreated() < DAYS_GRACE_PERIOD;
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
