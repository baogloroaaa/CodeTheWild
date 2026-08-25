/* Mission-1-specific data for the shared engine (assets/mission-engine.js).
   Must load BEFORE mission-engine.js. */

function extractRangeCount(code) {
  const lines = code.split('\n').map((line) => line.trim());
  let days = 5;
  let arg = null;

  lines.forEach((line) => {
    const daysAssign = line.match(/^days\s*=\s*(\d+)/);
    if (daysAssign) days = Number(daysAssign[1]);

    const loopMatch = line.match(/^for day in range\((\w+)\)/);
    if (loopMatch) arg = loopMatch[1];
  });

  if (arg === null) return null;
  return /^\d+$/.test(arg) ? Number(arg) : arg === 'days' ? days : null;
}

window.MISSION_CHALLENGES = [
  {
    title: 'Challenge 1',
    prompt: 'Can you find the line that defines the direction? Change "window" to something else.',
    hint: 'Try changing the text inside the quotes to something new, like "lamp".',
    successMessage: 'A variable is a name that stores information your program can use — direction stores where the plant is growing.',
    solution: 'direction = "lamp"\n\nfor day in range(5):\n    print("Day", day + 1)\n    print("Growing toward the", direction)',
    validate(code) {
      const match = code.match(/direction\s*=\s*["']([^"']*)["']/);
      return Boolean(match && match[1].trim() && match[1].trim() !== 'window');
    },
  },
  {
    title: 'Challenge 2',
    prompt: 'Give the plant more time to grow. Change range(5) to range(10).',
    hint: 'Find the range(5) in the loop line and change the number.',
    successMessage: 'A for loop repeats instructions — now it repeats for more days.',
    solution: 'direction = "window"\n\nfor day in range(10):\n    print("Day", day + 1)\n    print("Growing toward the", direction)',
    validate(code) {
      const count = extractRangeCount(code);
      return count !== null && count !== 5;
    },
  },
  {
    title: 'Challenge 3 (optional)',
    prompt: 'Combine variables: add a "days" variable and use range(days) instead of a fixed number.',
    hint: 'Add a line like days = 10 above the loop, then change range(10) to range(days).',
    successMessage: 'Now the direction and the number of days are both controlled by variables.',
    solution: 'direction = "window"\ndays = 10\n\nfor day in range(days):\n    print("Day", day + 1)\n    print("Growing toward the", direction)',
    validate(code) {
      const hasDaysVar = /^\s*days\s*=\s*\d+/m.test(code);
      const usesDaysInLoop = /for day in range\(\s*days\s*\)/.test(code);
      return hasDaysVar && usesDaysInLoop;
    },
  },
];
