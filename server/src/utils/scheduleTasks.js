const TASK_FIELDS = {
  livingRoom: { title: 'Living Room', emoji: '🛋', category: 'living_room', points: 10 },
  kitchen: { title: 'Kitchen Cleaning', emoji: '🍽', category: 'kitchen', points: 10 },
  toilet1: { title: 'Toilet 1 Cleaning', emoji: '🚽', category: 'bathroom', points: 25 },
  toilet2: { title: 'Toilet 2 Cleaning', emoji: '🚽', category: 'bathroom', points: 25 },
  mopFloor: { title: 'Mop Floor', emoji: '🧹', category: 'general', points: 15 },
};

/**
 * Build Task documents from a monthly rotation schedule.
 * @param {Object} opts
 * @param {string} opts.houseId
 * @param {string} opts.createdById
 * @param {Record<string, {_id: string}>} opts.userByName - name → user doc
 * @param {{ tasks: Array }} opts.schedule
 * @param {Date} [opts.referenceDate] - used to mark past tasks completed
 */
function buildTasksFromSchedule({ houseId, createdById, userByName, schedule, referenceDate = new Date() }) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const tasks = [];

  for (const day of schedule.tasks) {
    const dueDay = new Date(`${day.date}T12:00:00`);

    for (const [field, def] of Object.entries(TASK_FIELDS)) {
      const assigneeName = day[field];
      if (!assigneeName) continue;

      const assignee = userByName[assigneeName];
      if (!assignee) {
        throw new Error(`Unknown member "${assigneeName}" in schedule for ${day.date}`);
      }

      const dayStart = new Date(`${day.date}T00:00:00`);
      const isPast = dayStart < today;
      const isToday = dayStart.getTime() === today.getTime();

      let status = 'pending';
      if (isPast) status = 'completed';
      else if (isToday) status = 'pending';

      const task = {
        house: houseId,
        createdBy: createdById,
        title: def.title,
        emoji: def.emoji,
        category: def.category,
        assignedTo: assignee._id,
        dueDate: dueDay,
        points: def.points,
        status,
        notes: `June rotation · ${day.weekday}`,
      };

      if (status === 'completed') {
        task.completedAt = new Date(`${day.date}T20:00:00`);
        task.completedBy = assignee._id;
      }

      tasks.push(task);
    }
  }

  return tasks;
}

module.exports = { buildTasksFromSchedule, TASK_FIELDS };
