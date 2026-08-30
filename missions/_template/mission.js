/* Mission-specific data for the shared engine (assets/mission-engine.js).
   Must load BEFORE mission-engine.js. If this mission's coding step ends
   with the "now you try" challenge box (see index.html Step 6), define
   one entry per challenge here. Each needs: title, prompt, hint,
   solution (the full corrected code, shown after 5 failed attempts), a
   validate(code) function returning true/false, and a successMessage.
   Leave the array empty if this mission has no typed challenge yet.

   Example:
   window.MISSION_CHALLENGES = [
     {
       title: 'Now you try',
       prompt: 'Change "count = 0" to "count = 10". Then press Check answer.',
       hint: 'Find the line that says "count = 0" and change the 0 to 10.',
       solution: 'count = 10\n\nfor step in range(5):\n    count = count + 1\n\nprint("Count:", count)',
       validate(code) {
         return /count\s*=\s*10\b/.test(code);
       },
       successMessage: "That's it — press Run above to see the new result.",
     },
   ];
*/

window.MISSION_CHALLENGES = [];
