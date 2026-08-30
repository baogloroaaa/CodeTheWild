/* Mission-2-specific data for the shared engine (assets/mission-engine.js).
   Must load BEFORE mission-engine.js. One tiny "now you try" challenge at
   the end of the coding section: flip lemon_juice to True to model Apple C. */

window.MISSION_CHALLENGES = [
  {
    title: 'Now you try',
    prompt: 'Change "lemon_juice = False" to "lemon_juice = True" so the code models Apple C. Then press Check answer.',
    hint: 'Find the line that says "lemon_juice = False" and change False to True.',
    solution: 'oxygen = True\nlemon_juice = True\n\nif lemon_juice:\n    print("The apple browns slowly.")\nelif oxygen:\n    print("The apple browns quickly!")\nelse:\n    print("The apple stays fresh.")',
    validate(code) {
      return /lemon_juice\s*=\s*True\b/.test(code);
    },
    successMessage: "That's it — lemon_juice is now True. Press Run above to see \"The apple browns slowly.\" print out.",
  },
];
