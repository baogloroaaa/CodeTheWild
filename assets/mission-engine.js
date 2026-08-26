/* Shared engine for every mission page. Reads plain data attributes out of
   the mission's own index.html, so a new mission never has to touch this file. */

(function () {
  'use strict';

  /* ---------- Page mascot ---------- */

  const pageMascotFigure = document.getElementById('page-mascot-figure');
  const pageMascotBubble = document.getElementById('page-mascot-bubble');

  function setPageMascot(pose, text) {
    if (!pageMascotFigure || typeof window.renderMascot !== 'function') return;
    pageMascotFigure.innerHTML = window.renderMascot(pose, 185);
    if (pageMascotBubble) {
      if (text) {
        pageMascotBubble.textContent = text;
        pageMascotBubble.classList.add('is-visible');
      } else {
        pageMascotBubble.textContent = '';
        pageMascotBubble.classList.remove('is-visible');
      }
    }
  }

  /* ---------- Step navigation / progress ---------- */

  const steps = Array.from(document.querySelectorAll('.step-card'));
  const progressLabel = document.getElementById('progress-label');
  const progressTrack = document.getElementById('progress-track');
  const progressFill = document.getElementById('progress-line-fill');
  const introCard = document.getElementById('mission-intro');
  const startMissionBtn = document.getElementById('start-mission-btn');
  let currentStep = 0;

  function goToIntro() {
    if (!introCard) return;
    steps.forEach((step) => step.classList.remove('active'));
    introCard.classList.remove('is-hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function jumpToStep(index) {
    if (introCard) introCard.classList.add('is-hidden');
    currentStep = index;
    updateProgress();
    setPageMascot('idle');
  }

  if (startMissionBtn) {
    startMissionBtn.addEventListener('click', () => jumpToStep(0));
  }

  function buildProgressDots() {
    if (!progressTrack) return;
    steps.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      dot.addEventListener('click', () => jumpToStep(index));
      progressTrack.appendChild(dot);
    });
  }

  function updateProgress() {
    const stepNumber = currentStep + 1;
    const percent = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 100;

    if (progressFill) progressFill.style.width = `calc(${percent}% - 12px)`;
    if (progressLabel) progressLabel.textContent = `Step ${stepNumber} of ${steps.length}`;

    steps.forEach((step, index) => {
      step.classList.toggle('active', index === currentStep);
    });

    if (progressTrack) {
      const dots = progressTrack.querySelectorAll('.progress-dot');
      dots.forEach((dot, index) => {
        dot.classList.toggle('is-current', index === currentStep);
        dot.classList.toggle('is-done', index < currentStep);
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.querySelectorAll('.next-btn').forEach((button) => {
    if (button.tagName === 'A') return;
    button.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        updateProgress();
        setPageMascot('idle');
      }
    });
  });

  function wireStepFooters() {
    steps.forEach((card, index) => {
      const forward = card.querySelector(':scope > .next-btn, :scope > a.btn-accent');
      if (!forward) return;
      const canGoBack = index > 0 || Boolean(introCard);
      const footer = document.createElement('div');
      footer.className = 'step-footer' + (canGoBack ? '' : ' is-end');
      forward.parentNode.insertBefore(footer, forward);
      if (canGoBack) {
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'back-btn';
        back.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Back';
        back.addEventListener('click', () => {
          if (index === 0) {
            goToIntro();
            return;
          }
          if (currentStep > 0) {
            currentStep -= 1;
            updateProgress();
            setPageMascot('idle');
          }
        });
        footer.appendChild(back);
      }
      footer.appendChild(forward);
    });
  }

  /* ---------- Choice grids (ack / reveal) ---------- */

  function resetQuestionBlock(block) {
    const checkBtn = block.querySelector('.check-btn');
    const feedback = block.querySelector('.feedback-box');
    if (checkBtn) checkBtn.classList.add('is-ready');
    if (feedback) {
      feedback.classList.remove('is-correct', 'is-wrong');
      feedback.textContent = 'Pick a choice and submit.';
    }
  }

  document.querySelectorAll('.question-block .choice-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const grid = btn.closest('.choice-grid');
      const block = btn.closest('.question-block');
      grid.querySelectorAll('.choice-btn').forEach((b) => {
        b.classList.remove('selected', 'is-correct', 'is-wrong');
      });
      btn.classList.add('selected');
      if (block) resetQuestionBlock(block);
    });
  });

  function handleChoiceCheck(block) {
    const grid = block.querySelector('.choice-grid');
    const feedback = block.querySelector('.feedback-box');
    const selected = grid.querySelector('.choice-btn.selected');
    if (!selected || !feedback) return;

    const mode = grid.dataset.mode || 'ack';

    if (mode === 'reveal') {
      grid.querySelectorAll('.choice-btn').forEach((b) => {
        const isCorrect = b.dataset.correct === 'true';
        b.classList.toggle('is-correct', isCorrect);
        b.classList.toggle('is-wrong', b === selected && !isCorrect);
      });
      const wasCorrect = selected.dataset.correct === 'true';
      feedback.classList.toggle('is-correct', wasCorrect);
      feedback.classList.toggle('is-wrong', !wasCorrect);
      const explain = grid.dataset.explain || '';
      feedback.textContent = wasCorrect
        ? `Correct! ${explain}`.trim()
        : `Not quite — the correct answer is highlighted. ${explain}`.trim();
      setPageMascot(wasCorrect ? 'celebrate' : 'sad', wasCorrect ? 'Nice work!' : 'Aw, so close!');
    } else {
      feedback.classList.remove('is-correct', 'is-wrong');
      feedback.textContent = grid.dataset.message || 'Nice choice!';
    }
  }

  /* ---------- Sequence builder (drag/tap-to-order) ---------- */

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function initSequenceBuilder(builder) {
    const answer = JSON.parse(builder.dataset.answer || '[]');
    const pool = builder.querySelector('.sequence-pool');
    const slotsWrap = builder.querySelector('.sequence-slots');
    const block = builder.closest('.sequence-block');
    const checkBtn = block ? block.querySelector('.check-btn') : null;
    const feedback = block ? block.querySelector('.feedback-box') : null;
    let failedAttempts = 0;

    let revealBtn = null;
    if (block) {
      revealBtn = document.createElement('button');
      revealBtn.type = 'button';
      revealBtn.className = 'reveal-btn is-hidden';
      revealBtn.textContent = 'Reveal answer';
      block.appendChild(revealBtn);
    }

    function revealAnswer() {
      pool.innerHTML = '';
      Array.from(slotsWrap.children).forEach((slot, index) => {
        slot.classList.add('is-filled', 'is-correct');
        slot.classList.remove('is-incorrect');
        slot.dataset.text = answer[index];
        slot.innerHTML = '';
        const badge = document.createElement('span');
        badge.className = 'sequence-slot-index';
        badge.textContent = String(index + 1);
        slot.appendChild(badge);
        const label = document.createElement('span');
        label.textContent = answer[index];
        slot.appendChild(label);
      });
      if (checkBtn) checkBtn.classList.remove('is-ready');
      if (feedback) {
        feedback.classList.add('is-correct');
        feedback.classList.remove('is-wrong');
        feedback.textContent = "Here's the correct order.";
      }
      if (revealBtn) revealBtn.classList.add('is-hidden');
    }

    if (revealBtn) revealBtn.addEventListener('click', revealAnswer);

    slotsWrap.innerHTML = '';
    answer.forEach((_, index) => {
      const slot = document.createElement('div');
      slot.className = 'sequence-slot';
      slot.dataset.index = String(index);
      const badge = document.createElement('span');
      badge.className = 'sequence-slot-index';
      badge.textContent = String(index + 1);
      slot.appendChild(badge);
      slotsWrap.appendChild(slot);
    });

    pool.innerHTML = '';
    shuffle(answer).forEach((text) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sequence-chip';
      chip.textContent = text;
      pool.appendChild(chip);
    });

    function syncReadyState() {
      const allFilled = Array.from(slotsWrap.children).every((s) => s.classList.contains('is-filled'));
      if (checkBtn) checkBtn.classList.toggle('is-ready', allFilled);
      if (feedback && !allFilled) {
        feedback.classList.remove('is-correct', 'is-wrong');
        feedback.textContent = 'Tap the cards to build the sequence, then submit.';
      }
      slotsWrap.querySelectorAll('.sequence-slot').forEach((s) => {
        s.classList.remove('is-correct', 'is-incorrect');
      });
    }

    pool.addEventListener('click', (event) => {
      const chip = event.target.closest('.sequence-chip');
      if (!chip) return;
      const emptySlot = Array.from(slotsWrap.children).find((s) => !s.classList.contains('is-filled'));
      if (!emptySlot) return;
      emptySlot.classList.add('is-filled');
      emptySlot.dataset.text = chip.textContent;
      const label = document.createElement('span');
      label.textContent = chip.textContent;
      emptySlot.appendChild(label);
      chip.remove();
      syncReadyState();
    });

    slotsWrap.addEventListener('click', (event) => {
      const slot = event.target.closest('.sequence-slot');
      if (!slot || !slot.classList.contains('is-filled')) return;
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'sequence-chip';
      chip.textContent = slot.dataset.text;
      pool.appendChild(chip);
      slot.classList.remove('is-filled', 'is-correct', 'is-incorrect');
      delete slot.dataset.text;
      slot.innerHTML = '';
      const badge = document.createElement('span');
      badge.className = 'sequence-slot-index';
      badge.textContent = String(Number(slot.dataset.index) + 1);
      slot.appendChild(badge);
      syncReadyState();
    });

    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        if (!checkBtn.classList.contains('is-ready')) return;
        let correctCount = 0;
        Array.from(slotsWrap.children).forEach((slot, index) => {
          const isCorrect = slot.dataset.text === answer[index];
          slot.classList.toggle('is-correct', isCorrect);
          slot.classList.toggle('is-incorrect', !isCorrect);
          if (isCorrect) correctCount += 1;
        });
        const perfect = correctCount === answer.length;
        if (feedback) {
          feedback.classList.toggle('is-correct', perfect);
          feedback.classList.toggle('is-wrong', !perfect);
          feedback.textContent = perfect
            ? 'All in order! You solved it.'
            : `${correctCount} of ${answer.length} in the right spot — try swapping a few.`;
        }
        if (!perfect) {
          failedAttempts += 1;
          if (failedAttempts >= 5 && revealBtn) revealBtn.classList.remove('is-hidden');
        } else if (revealBtn) {
          revealBtn.classList.add('is-hidden');
        }
      });
    }

    syncReadyState();
  }

  document.querySelectorAll('.sequence-builder').forEach(initSequenceBuilder);

  /* ---------- Unified Check button dispatch ---------- */

  document.querySelectorAll('.check-btn').forEach((btn) => {
    if (btn.closest('.sequence-block')) return; // handled in initSequenceBuilder
    btn.addEventListener('click', () => {
      if (!btn.classList.contains('is-ready')) return;
      const block = btn.closest('.question-block');
      if (block) handleChoiceCheck(block);
    });
  });

  /* ---------- Tabs ---------- */

  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.tab-row');
      const scope = row.parentElement;
      row.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
      scope.querySelectorAll('.tab-panel').forEach((panel) => {
        panel.classList.toggle('is-active', panel.dataset.tabPanel === btn.dataset.tab);
      });
    });
  });

  /* ---------- Code console ---------- */

  const runCodeButton = document.getElementById('run-code-btn');
  const missionCode = document.getElementById('mission-code');
  const codeOutput = document.getElementById('code-output');
  const lineNumbers = document.getElementById('line-numbers');
  const codeHighlight = document.getElementById('code-highlight');

  function escapeHtml(value) {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  const TOKEN_PATTERN = /(#[^\n]*)|("[^"]*"|'[^']*')|\b(for|in|range|print|def|return|if|else|while|import|class|True|False|None)\b|\b(\d+)\b/g;

  function highlightCode(code) {
    const escaped = escapeHtml(code);
    return escaped.replace(TOKEN_PATTERN, (match, comment, string, keyword, number) => {
      if (comment) return `<span class="token-comment">${comment}</span>`;
      if (string) return `<span class="token-string">${string}</span>`;
      if (keyword) {
        const cls = keyword === 'print' ? 'token-builtin' : 'token-keyword';
        return `<span class="${cls}">${keyword}</span>`;
      }
      if (number) return `<span class="token-number">${number}</span>`;
      return match;
    });
  }

  function updateEditorView() {
    if (!missionCode) return;
    const value = missionCode.value || '';
    lineNumbers.textContent = value.split('\n').map((_, index) => index + 1).join('\n');
    codeHighlight.innerHTML = highlightCode(value);
  }

  function mountStaticCode() {
    document.querySelectorAll('[data-code-static]').forEach((el) => {
      el.innerHTML = highlightCode(el.textContent);
    });
  }

  /* A small, deliberately limited Python-subset interpreter: variable
     assignment, "var + N" / "var - N" expressions, a single top-level
     for-loop over range(N), and print() with comma-separated args.
     Handles the two-variable growth model used in this mission's code
     step, plus reasonable student edits (different numbers, loop count). */
  function runSimplePythonCode(code) {
    const vars = {};
    const output = [];

    function evalExpr(expr) {
      const trimmed = expr.trim();
      const strMatch = trimmed.match(/^["']([^"']*)["']$/);
      if (strMatch) return strMatch[1];
      if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
      const binMatch = trimmed.match(/^(\w+)\s*([+-])\s*(-?\d+(?:\.\d+)?)$/);
      if (binMatch) {
        const base = Number(vars[binMatch[1]] ?? 0);
        const delta = Number(binMatch[3]);
        return binMatch[2] === '+' ? base + delta : base - delta;
      }
      if (Object.prototype.hasOwnProperty.call(vars, trimmed)) return vars[trimmed];
      return trimmed;
    }

    function splitArgs(argsStr) {
      const parts = [];
      let current = '';
      let quote = null;
      for (const ch of argsStr) {
        if (quote) {
          current += ch;
          if (ch === quote) quote = null;
        } else if (ch === '"' || ch === "'") {
          quote = ch;
          current += ch;
        } else if (ch === ',') {
          parts.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      if (current.trim()) parts.push(current);
      return parts;
    }

    function runLine(line) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const printMatch = trimmed.match(/^print\((.*)\)$/);
      if (printMatch) {
        const rendered = splitArgs(printMatch[1]).map((part) => {
          const strPart = part.trim().match(/^["']([^"']*)["']$/);
          return strPart ? strPart[1] : String(evalExpr(part));
        });
        output.push(rendered.join(' '));
        return;
      }

      const assignMatch = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
      if (assignMatch) {
        vars[assignMatch[1]] = evalExpr(assignMatch[2]);
      }
    }

    const lines = code.replace(/\r/g, '').split('\n');
    const loopStart = lines.findIndex((line) => /^\s*for\s+\w+\s+in\s+range\(/.test(line));

    if (loopStart === -1) {
      lines.forEach(runLine);
      return { output: output.join('\n'), vars };
    }

    lines.slice(0, loopStart).forEach(runLine);

    const loopMatch = lines[loopStart].match(/for\s+\w+\s+in\s+range\((\w+)\)\s*:/);
    const arg = loopMatch ? loopMatch[1] : '0';
    const count = /^\d+$/.test(arg) ? Number(arg) : Number(vars[arg] ?? 0);

    const firstBodyLine = lines[loopStart + 1] || '';
    const indent = (firstBodyLine.match(/^\s*/) || [''])[0].length || 4;
    let bodyEnd = loopStart + 1;
    while (bodyEnd < lines.length) {
      const line = lines[bodyEnd];
      if (line.trim() === '') {
        bodyEnd += 1;
        continue;
      }
      const thisIndent = (line.match(/^\s*/) || [''])[0].length;
      if (thisIndent < indent) break;
      bodyEnd += 1;
    }
    const bodyLines = lines.slice(loopStart + 1, bodyEnd).filter((line) => line.trim());

    for (let i = 0; i < count; i += 1) {
      bodyLines.forEach(runLine);
    }

    lines.slice(bodyEnd).forEach(runLine);

    return { output: output.join('\n'), vars };
  }

  if (runCodeButton && missionCode && codeOutput) {
    runCodeButton.addEventListener('click', () => {
      codeOutput.textContent = 'Running...';
      codeOutput.classList.remove('has-run');
      try {
        const result = runSimplePythonCode(missionCode.value);
        codeOutput.textContent = result.output || 'No output yet.';
        codeOutput.classList.add('has-run');
      } catch (error) {
        codeOutput.textContent = `Error: ${error.message}`;
      }
    });
  }

  if (missionCode) {
    missionCode.addEventListener('input', updateEditorView);
    missionCode.addEventListener('scroll', () => {
      codeHighlight.scrollTop = missionCode.scrollTop;
      codeHighlight.scrollLeft = missionCode.scrollLeft;
    });
  }

  /* ---------- Challenge stepper ----------
     window.MISSION_CHALLENGES, set by the mission's own mission.js, is an array of:
     { title, prompt, hint, validate(code) -> boolean, successMessage } */

  const challengeTitle = document.getElementById('challenge-title');
  const challengePrompt = document.getElementById('challenge-prompt');
  const challengeHint = document.getElementById('challenge-hint');
  const challengeCounter = document.getElementById('challenge-counter');
  const challengeFeedback = document.getElementById('challenge-feedback');
  const checkChallengeButton = document.getElementById('check-challenge');
  const hintButton = document.getElementById('hint-btn');
  const nextChallengeButton = document.getElementById('next-challenge');
  const revealChallengeButton = document.getElementById('reveal-challenge-btn');

  const challenges = window.MISSION_CHALLENGES || [];
  let challengeIndex = 0;
  let hintShown = false;
  const attempts = challenges.map(() => 0);
  const passed = challenges.map(() => false);

  function renderChallenge() {
    if (!challengeTitle || challenges.length === 0) return;
    const challenge = challenges[challengeIndex];

    challengeTitle.textContent = challenge.title;
    challengePrompt.textContent = challenge.prompt;
    challengeCounter.textContent = `Try ${attempts[challengeIndex]} of 5`;
    challengeHint.textContent = challenge.hint;
    challengeHint.classList.toggle('is-hidden', !hintShown);

    if (passed[challengeIndex]) {
      challengeFeedback.innerHTML = `<strong>Correct!</strong> ${challenge.successMessage}`;
      challengeFeedback.classList.add('is-correct');
    } else {
      challengeFeedback.textContent = 'Edit the code and press Submit.';
      challengeFeedback.classList.remove('is-correct');
    }

    if (nextChallengeButton) {
      nextChallengeButton.classList.toggle('is-hidden', challengeIndex >= challenges.length - 1);
    }
    if (revealChallengeButton) {
      revealChallengeButton.classList.add('is-hidden');
    }
  }

  if (hintButton) {
    hintButton.addEventListener('click', () => {
      hintShown = !hintShown;
      renderChallenge();
    });
  }

  if (checkChallengeButton && missionCode) {
    checkChallengeButton.addEventListener('click', () => {
      const challenge = challenges[challengeIndex];
      attempts[challengeIndex] += 1;
      challengeCounter.textContent = `Try ${attempts[challengeIndex]} of 5`;

      if (challenge.validate(missionCode.value)) {
        passed[challengeIndex] = true;
        renderChallenge();
        return;
      }

      challengeFeedback.textContent = attempts[challengeIndex] >= 5
        ? `Not yet. ${challenge.hint}`
        : 'Not yet. Give it another try.';
      challengeFeedback.classList.remove('is-correct');

      if (revealChallengeButton) {
        revealChallengeButton.classList.toggle('is-hidden', attempts[challengeIndex] < 5 || !challenge.solution);
      }
    });
  }

  if (revealChallengeButton && missionCode) {
    revealChallengeButton.addEventListener('click', () => {
      const challenge = challenges[challengeIndex];
      if (!challenge.solution) return;
      missionCode.value = challenge.solution;
      updateEditorView();
      challengeFeedback.innerHTML = "<strong>Here's one way to do it</strong> &mdash; press Submit to confirm.";
      challengeFeedback.classList.remove('is-correct');
      revealChallengeButton.classList.add('is-hidden');
    });
  }

  if (nextChallengeButton) {
    nextChallengeButton.addEventListener('click', () => {
      if (challengeIndex < challenges.length - 1) {
        challengeIndex += 1;
        hintShown = false;
        renderChallenge();
      }
    });
  }

  /* ---------- Init ---------- */

  buildProgressDots();
  updateEditorView();
  mountStaticCode();
  updateProgress();
  if (introCard) {
    steps.forEach((step) => step.classList.remove('active'));
  }
  renderChallenge();
  wireStepFooters();
})();
