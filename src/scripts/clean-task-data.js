// Task Data Cleaning Script
// This script analyzes and cleans the provided task data

const originalTasks = [
  // Your original data would go here - truncated for brevity
];

// Analysis of missing fields and inconsistencies
const analysis = {
  missingFields: {
    taskName: "Most tasks have null taskName - should be derived from description",
    taskType: "All tasks have null taskType - should be categorized based on procedure",
    itemsUsed: "All tasks have null itemsUsed - should list ingredients/equipment",
    taskAt: "All tasks have null taskAt - should specify location",
    priority: "Missing priority field - should be assigned based on importance",
    status: "Missing status field - should default to 'pending'"
  },
  inconsistencies: {
    taskDuration: "Some durations are in PT format, others missing",
    taskFor: "Some arrays are empty, should have default values",
    assignedTo: "Names are inconsistent (Chandu vs Chanti vs Worker vs Balu)",
    taskProcedure: "Some procedures are empty strings"
  },
  standardizations: {
    timeFormat: "All times should be in HH:MM:SS format",
    durationFormat: "All durations should be in PT format (ISO 8601)",
    nameMapping: {
      "Chandu": "Chandu",
      "Chanti": "Chanti", 
      "Worker": "Worker",
      "Balu": "Balu"
    },
    procedureMapping: {
      "": "General Task",
      "Break": "Break Time",
      "cooking": "Cooking",
      "cutting": "Cutting",
      "grinding": "Grinding",
      "cleaning": "Cleaning",
      "preparing": "Preparation",
      "removing": "Removal",
      "soaking": "Soaking",
      "mixing": "Mixing",
      "smashing": "Smashing",
      "squeezing": "Squeezing",
      "peeling": "Peeling"
    }
  }
};

// Function to clean and standardize task data
function cleanTaskData(tasks) {
  return tasks.map(task => {
    // Generate task name from description if missing
    const taskName = task.taskName || 
      (task.taskDescription ? 
        task.taskDescription.split(' - ')[0] || 
        task.taskDescription.split(' ').slice(0, 3).join(' ') : 
        `Task ${task.taskId}`);

    // Determine task type from procedure
    const taskType = task.taskType || 
      (task.taskProcedure ? 
        task.taskProcedure.toLowerCase() : 
        'general');

    // Generate items used from description
    const itemsUsed = task.itemsUsed || 
      extractItemsFromDescription(task.taskDescription);

    // Set default location
    const taskAt = task.taskAt || 
      (task.taskProcedure === 'Break' ? 'Rest Area' : 'Kitchen');

    // Determine priority based on task importance
    const priority = determinePriority(task);

    // Set default status
    const status = task.status || 'pending';

    // Ensure taskFor is not empty
    const taskFor = task.taskFor && task.taskFor.length > 0 ? 
      task.taskFor : ['General Preparation'];

    // Standardize procedure
    const taskProcedure = task.taskProcedure || 'General Task';

    return {
      taskId: task.taskId,
      taskName: taskName,
      taskDescription: task.taskDescription,
      startTime: task.startTime,
      endTime: task.endTime,
      taskDuration: task.taskDuration,
      taskType: taskType,
      completed: task.completed,
      itemsUsed: itemsUsed,
      taskFor: taskFor,
      assignedTo: task.assignedTo,
      taskProcedure: taskProcedure,
      taskAt: taskAt,
      priority: priority,
      status: status
    };
  });
}

// Helper function to extract items from description
function extractItemsFromDescription(description) {
  if (!description) return [];
  
  const commonItems = [
    'Minappappu', 'Peanuts', 'Potato', 'Onion', 'Carrot', 'Mirchi', 
    'Allam', 'Sorakaya', 'Karuvepaku', 'Kothimera', 'Water', 'Salt',
    'Jeera', 'Fried gram', 'Green chilli', 'Tomato', 'Batani', 'Idly',
    'Dosa', 'Poori', 'Sambar', 'Chutney', 'Punugu', 'Bajji', 'Gaare'
  ];
  
  const foundItems = commonItems.filter(item => 
    description.toLowerCase().includes(item.toLowerCase())
  );
  
  return foundItems.length > 0 ? foundItems : ['General Items'];
}

// Helper function to determine priority
function determinePriority(task) {
  const highPriorityKeywords = ['cooking', 'grinding', 'cutting', 'service'];
  const mediumPriorityKeywords = ['preparing', 'cleaning', 'mixing'];
  const lowPriorityKeywords = ['break', 'removing'];
  
  const procedure = (task.taskProcedure || '').toLowerCase();
  const description = (task.taskDescription || '').toLowerCase();
  
  if (highPriorityKeywords.some(keyword => 
    procedure.includes(keyword) || description.includes(keyword))) {
    return 'high';
  }
  
  if (mediumPriorityKeywords.some(keyword => 
    procedure.includes(keyword) || description.includes(keyword))) {
    return 'medium';
  }
  
  if (lowPriorityKeywords.some(keyword => 
    procedure.includes(keyword) || description.includes(keyword))) {
    return 'low';
  }
  
  return 'medium';
}

// Export the cleaning function
module.exports = {
  cleanTaskData,
  analysis
};

console.log('Task Data Cleaning Analysis:');
console.log(JSON.stringify(analysis, null, 2));
