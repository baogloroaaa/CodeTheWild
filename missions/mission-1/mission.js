/* Mission-1-specific data for the shared engine (assets/mission-engine.js).
   Must load BEFORE mission-engine.js. One "Your turn" challenge at the
   end of the coding section: edit the concentration model's variables. */

window.MISSION_CHALLENGES = [
  {
    title: 'Challenge 1',
    prompt: 'Change "salt_grams = 5" to "salt_grams = 10", keeping "water_mL = 100". Then press Check answer and run the code.',
    hint: 'Find the line that says "salt_grams = 5" and change the 5 to 10.',
    solution: 'salt_grams = 10\nwater_mL = 100\n\nconcentration = salt_grams / water_mL\n\nprint("Salt:", salt_grams, "grams")\nprint("Water:", water_mL, "mL")\nprint("Concentration:", concentration, "grams per mL")',
    validate(code) {
      return /salt_grams\s*=\s*10\b/.test(code) && /water_mL\s*=\s*100\b/.test(code);
    },
    successMessage: 'salt_grams is now 10 — press Run above to see the concentration increase.',
  },
];
