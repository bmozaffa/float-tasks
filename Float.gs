function run() {
  advanceTasks();
  removeUnsolicitedEvents();
}

function advanceTasks() {
  const taskLists = getTaskLists();
  for (let i = 0; i < taskLists.length; i++) {
    const taskList = taskLists[i];
    console.log(`Found task list called ${taskList.name}`);
    const overdueTasks = getOverdueTasks(taskList.id);
    console.log(`Found ${overdueTasks.length} overdue tasks`);
    for (let j = 0; j < overdueTasks.length; j++) {
      advanceTask(taskList.id, overdueTasks[j].id);
    }
    const completedTasks = getCompletedTasks(taskList.id);
    console.log(`Found ${completedTasks.length} completed tasks`);
    for (let j = 0; j < completedTasks.length; j++) {
      console.log(`Found completed task called ${completedTasks[j].title}`);
      if (addCalendarEvent(completedTasks[j].title, completedTasks[j].notes, completedTasks[j].completed, completedTasks[j].links)) {
        deleteTask(taskList.id, completedTasks[j].id);
      }
    }
  }
}

function getTaskLists() {
  const taskLists = Tasks.Tasklists.list();
  if (!taskLists || !taskLists.items) {
    return [];
  }
  return taskLists.items.map(taskList => ({
    id: taskList.id,  
    name: taskList.title,
  }));
}

function getOverdueTasks(listId) {
  const params = {
    dueMax: formatDate(getToday()),
    showCompleted: false,
    showDeleted: false,
  };
  const tasks = Tasks.Tasks.list(listId, params);
  if (!tasks || !tasks.items) {
    return [];
  }
  return tasks.items.map(task => ({
    id: task.id,    
    title: task.title,
    due: task.due,   
  })).filter(task => task.title);
}

function advanceTask(taskListId, taskId) {
  const task = Tasks.Tasks.get(taskListId, taskId);
  let dueDate = new Date(task.due);
  console.log(`Advancing task ${task.title} due at ${dueDate}`);
  while (dueDate < getToday()) {
    dueDate.setDate(dueDate.getDate() + 1);
  }
  console.log(`Task will now be due at ${dueDate}`);
  task.due = formatDate(dueDate); // Update the due date
  Tasks.Tasks.update(task, taskListId, taskId);
}

function getToday() {
  const today = new Date();
  today.setDate(today.getDate() - 1);
  return today;
}

function getCompletedTasks(listId) {
  const params = {
    showCompleted: true,
    showHidden: true,
    completedMax: getEndOfDays(),
    showDeleted: false,
  };
  const tasks = Tasks.Tasks.list(listId, params);
  if (!tasks || !tasks.items) {
    return [];
  }
  return tasks.items.map(task => ({
    id: task.id,        
    title: task.title,   
    notes: task.notes,    
    completed: task.completed,
    links: task.links,     
  })).filter(task => task.title);
}

function getEndOfDays() {
  const date = new Date();
  date.setDate(date.getDate() + 365000);
  return formatDate(date);
}

function addCalendarEvent(title, notes, date, links) {
  if (links) {
    if (!notes) {
      notes = "Links:\n";
    } else {
      notes = notes + "\n\nLinks:\n";
    }
    for (let i = 0; i < links.length; i++) {
      notes = notes + links[i].type + ": " + links[i].link + "\n";
    }
  }

  const event = {
    start: {
      dateTime: date,
    },
    end: {
      dateTime: date,
    },
    summary: title,
    transparency: "transparent", // Don't block time
    description: notes,
  };
  Calendar.Events.insert(event, Session.getActiveUser().getEmail());
  return true;
}

function deleteTask(taskListId, taskId) {
  Tasks.Tasks.remove(taskListId, taskId);
}

function removeUnsolicitedEvents() {
  const events = getUnsolicitedEvents();
  console.log(`Found ${events.length} events that should be declined`);
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    console.log(`Will decline "${event.title}" created at ${event.createdTime} and updated at ${event.updated}`);
    event.myStatus = CalendarApp.GuestStatus.NO; // Correct way to set status
  }
}


function getUnsolicitedEvents() {
  const DAYS_MAX_LOOK_AHEAD = new Date(Date.now() + (14 * 24 * 60 * 60 * 1000));
  const events = CalendarApp.getEvents(new Date(), DAYS_MAX_LOOK_AHEAD, { max: 200 });
  if (events.length === 0) {
    console.log("Found no events");
    return [];
  }
  return events.filter(event =>
      isLargeEvent(event) && hasNotResponded(event) && isNotNewInvite(event)
  );
}

function isLargeEvent(event) {
  return !event.guestsCanSeeGuests;
}

function hasNotResponded(event) {
  return event.myStatus === CalendarApp.GuestStatus.INVITED;
}

function isNotNewInvite(event) {
  const DAYS_GRACE_PERIOD = new Date(Date.now() - (8 * 60 * 60 * 1000));
  return event.createdTime < DAYS_GRACE_PERIOD;
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
