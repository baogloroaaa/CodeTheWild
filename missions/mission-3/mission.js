/* Mission-3-specific data for the shared engine (assets/mission-engine.js).
   Must load BEFORE mission-engine.js. One tiny "now you try" challenge at
   the end of the coding section: edit the shaded side's daily growth rate. */

window.MISSION_CHALLENGES = [
  {
    title: 'Now you try',
    prompt: "Change how much the shaded side grows each day — edit \"shaded_side = shaded_side + 2\" so it grows by 3 units a day instead of 2. Then press Check answer.",
    hint: 'Find the line that starts with "shaded_side = shaded_side +" and change the number after the plus sign to 3.',
    solution: 'shaded_side = 1\nlight_side = 1\n\nfor day in range(5):\n    shaded_side = shaded_side + 3\n    light_side = light_side + 1\n\nprint("Shaded side:", shaded_side)\nprint("Light side:", light_side)',
    validate(code) {
      return /shaded_side\s*=\s*shaded_side\s*\+\s*3\b/.test(code);
    },
    successMessage: "That's it — the shaded side now grows 3 units a day. Press Run above to see how much longer it gets after 5 days.",
  },
];
