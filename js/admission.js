/**
 * IRF Admission Tool - Admission flow logic
 */

(function() {
  if (!localStorage.getItem('irf_logged_in')) {
    window.location.href = 'index.html';
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const patientId = urlParams.get('id') || 'P' + Date.now();
  const DRAFT_KEY = 'irf_admission_draft_' + patientId;

  let formData = {
    step1: {},
    step2: {},
    step3: {},
    riskFlags: [],
    generatedTasks: []
  };

  // Checklist steps (config-driven)
  const CHECKLIST = DEMO_DATA.checklistSteps;

  // Step navigation
  let currentStep = 1;
  const steps = document.querySelectorAll('.step-content');
  const stepIndicators = document.querySelectorAll('.stepper .step');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  let _saveTimeout;

  // Auto-save draft to localStorage (debounced)
  function saveDraft() {
    clearTimeout(_saveTimeout);
    _saveTimeout = setTimeout(() => {
      const draft = {
        patientId,
        step: currentStep,
        step1: {
          firstName: document.getElementById('firstName')?.value || '',
          lastName: document.getElementById('lastName')?.value || '',
          dob: document.getElementById('dob')?.value || '',
          mrn: document.getElementById('mrn')?.value || '',
          diagnosis: document.getElementById('diagnosis')?.value || ''
        },
        step2: {
          allergies: document.querySelector('input[name="allergies"]:checked')?.value || 'none',
          allergyList: document.getElementById('allergyList')?.value || '',
          meds: document.querySelector('input[name="meds"]:checked')?.value || 'none',
          medList: document.getElementById('medList')?.value || '',
          skin: document.querySelector('input[name="skin"]:checked')?.value || 'intact',
          woundNotes: document.getElementById('woundNotes')?.value || '',
          fall: document.querySelector('input[name="fall"]:checked')?.value || 'low'
        },
        step3: formData.step3 || {}
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (e) {}
    }, 300);
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {}
  }

  function restoreDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      const draft = JSON.parse(raw);
      if (!draft || draft.patientId !== patientId) return false;

      const s1 = draft.step1 || {};
      const s2 = draft.step2 || {};
      const s3 = draft.step3 || {};

      const fn = document.getElementById('firstName');
      const ln = document.getElementById('lastName');
      const dob = document.getElementById('dob');
      const mrn = document.getElementById('mrn');
      const dx = document.getElementById('diagnosis');
      if (fn) fn.value = s1.firstName || '';
      if (ln) ln.value = s1.lastName || '';
      if (dob) dob.value = s1.dob || '';
      if (mrn) mrn.value = s1.mrn || '';
      if (dx) dx.value = s1.diagnosis || '';

      (document.querySelectorAll('input[name="allergies"]') || []).forEach(r => {
        if (r.value === (s2.allergies || 'none')) r.checked = true;
      });
      const allergyList = document.getElementById('allergyList');
      if (allergyList) allergyList.value = s2.allergyList || '';

      (document.querySelectorAll('input[name="meds"]') || []).forEach(r => {
        if (r.value === (s2.meds || 'none')) r.checked = true;
      });
      const medList = document.getElementById('medList');
      if (medList) medList.value = s2.medList || '';

      (document.querySelectorAll('input[name="skin"]') || []).forEach(r => {
        if (r.value === (s2.skin || 'intact')) r.checked = true;
      });
      const woundNotes = document.getElementById('woundNotes');
      if (woundNotes) woundNotes.value = s2.woundNotes || '';

      (document.querySelectorAll('input[name="fall"]') || []).forEach(r => {
        if (r.value === (s2.fall || 'low')) r.checked = true;
      });

      formData.step3 = s3 || {};
      currentStep = Math.min(4, Math.max(1, draft.step || 1));
      showStep(currentStep);

      initConditionalLogic();
      if (currentStep === 2) {
        const ad = document.getElementById('allergyDetails');
        const md = document.getElementById('medsDetails');
        const wd = document.getElementById('woundDetails');
        if (ad) ad.style.display = (s2.allergies === 'yes') ? 'block' : 'none';
        if (md) md.style.display = (s2.meds === 'few' || s2.meds === 'many') ? 'block' : 'none';
        if (wd) wd.style.display = (s2.skin === 'risk') ? 'block' : 'none';
      }
      if (currentStep === 3) {
        buildChecklist();
        generateTasksAndRisks();
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function showStep(n) {
    currentStep = n;
    steps.forEach((s, i) => {
      s.style.display = i + 1 === n ? 'block' : 'none';
    });
    stepIndicators.forEach((s, i) => {
      s.classList.remove('active', 'completed');
      if (i + 1 < n) s.classList.add('completed');
      else if (i + 1 === n) s.classList.add('active');
    });
    progressBar.style.width = (n / 4 * 100) + '%';
    progressText.textContent = `Step ${n} of 4`;
  }

  // Step 1 validation
  function validateStep1() {
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    const dob = document.getElementById('dob').value;
    const dx = document.getElementById('diagnosis').value.trim();
    return fn && ln && dob && dx;
  }

  // Conditional logic for Step 2 (called once at load - Step 2 DOM exists)
  function initConditionalLogic() {
    if (window._conditionalLogicInitialized) return;
    window._conditionalLogicInitialized = true;

    document.querySelectorAll('input[name="allergies"]').forEach(r => {
      r.addEventListener('change', () => {
        const details = document.getElementById('allergyDetails');
        details.style.display = r.value === 'yes' ? 'block' : 'none';
        saveDraft();
      });
    });
    document.querySelectorAll('input[name="meds"]').forEach(r => {
      r.addEventListener('change', () => {
        const details = document.getElementById('medsDetails');
        details.style.display = (r.value === 'few' || r.value === 'many') ? 'block' : 'none';
        saveDraft();
      });
    });
    document.querySelectorAll('input[name="skin"]').forEach(r => {
      r.addEventListener('change', () => {
        const details = document.getElementById('woundDetails');
        details.style.display = r.value === 'risk' ? 'block' : 'none';
        saveDraft();
      });
    });
  }

  // Get current clinical context for conditional checklist
  function getClinicalContext() {
    return {
      skin: document.querySelector('input[name="skin"]:checked')?.value || 'intact'
    };
  }

  // Filter checklist by when-condition (e.g. when: 'skin=risk')
  function getFilteredChecklist() {
    const ctx = getClinicalContext();
    return CHECKLIST.filter(s => {
      if (!s.when) return true;
      const [key, val] = s.when.split('=');
      return ctx[key] === val;
    });
  }

  // Build checklist (preserves state when returning from step 2; conditional items)
  function buildChecklist() {
    const filtered = getFilteredChecklist();
    const container = document.getElementById('checklist');
    container.innerHTML = filtered.map(s => `
      <div class="checklist-item" data-id="${s.id}">
        <input type="checkbox" id="chk_${s.id}" ${s.required ? 'required' : ''} ${formData.step3[s.id] ? 'checked' : ''}>
        <label for="chk_${s.id}">${s.label}</label>
      </div>
    `).join('');

    const nextBtn = document.getElementById('next3');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        cb.closest('.checklist-item').classList.toggle('completed', cb.checked);
        formData.step3[cb.id.replace('chk_', '')] = cb.checked;
        nextBtn.disabled = !validateChecklist();
        saveDraft();
      });
      if (cb.checked) cb.closest('.checklist-item').classList.add('completed');
    });

    nextBtn.disabled = !validateChecklist();
  }

  // Checklist validation - all required (in filtered list) must be checked
  function validateChecklist() {
    return getFilteredChecklist().filter(s => s.required).every(s => {
      const cb = document.getElementById('chk_' + s.id);
      return cb && cb.checked;
    });
  }

  // Generate tasks and risk flags from form data
  function generateTasksAndRisks() {
    const tasks = [];
    const risks = [];

    // From clinical step
    const meds = document.querySelector('input[name="meds"]:checked')?.value;
    if (meds === 'many') {
      risks.push({ id: 'polypharmacy', label: 'Polypharmacy (6+ meds)', type: 'warning' });
      tasks.push('Pharmacy consult for medication reconciliation');
    }
    if (meds === 'few' || meds === 'many') {
      tasks.push('Complete home medication reconciliation');
    }

    const allergies = document.querySelector('input[name="allergies"]:checked')?.value;
    if (allergies === 'yes') {
      tasks.push('Verify allergy list with patient/family');
    }

    const skin = document.querySelector('input[name="skin"]:checked')?.value;
    if (skin === 'risk') {
      risks.push({ id: 'pressure-injury', label: 'Pressure injury risk', type: 'danger' });
      tasks.push('Wound care consult');
      tasks.push('Daily wound check');
    }

    const fall = document.querySelector('input[name="fall"]:checked')?.value;
    if (fall === 'high') {
      risks.push({ id: 'fall-risk', label: 'Fall risk', type: 'info' });
      tasks.push('Fall precautions - PT evaluation');
    }

    // Standard consults for rehab
    tasks.push('PT/OT evaluation ordered');
    tasks.push('Follow-up consult in 48–72h');

    formData.generatedTasks = [...new Set(tasks)];
    formData.riskFlags = risks;

    // Render
    const taskContainer = document.getElementById('generatedTasks');
    const riskContainer = document.getElementById('riskFlagsCard');

    taskContainer.style.display = formData.generatedTasks.length > 0 ? 'block' : 'none';
    document.getElementById('taskList').innerHTML = formData.generatedTasks.map(t =>
      `<div class="task-item">${t}</div>`
    ).join('');

    riskContainer.style.display = formData.riskFlags.length > 0 ? 'block' : 'none';
    document.getElementById('riskFlagsList').innerHTML = formData.riskFlags.map(r =>
      `<span class="risk-flag ${r.type}">${r.label}</span> `
    ).join('');
  }

  // Build summary
  function buildSummary() {
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    const dob = document.getElementById('dob').value;
    const mrn = document.getElementById('mrn').value.trim() || '—';
    const dx = document.getElementById('diagnosis').value.trim();

    const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : '—';

    let html = `
      <table style="width: 100%; border-collapse: collapse; font-size: 0.9375rem;">
        <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><strong>Patient</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">${fn} ${ln}</td></tr>
        <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><strong>DOB / Age</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">${dob} (${age} yrs)</td></tr>
        <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><strong>MRN</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">${mrn}</td></tr>
        <tr><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);"><strong>Admitting Dx</strong></td><td style="padding: 0.5rem 0; border-bottom: 1px solid var(--border);">${dx}</td></tr>
      </table>
    `;

    const allergyVal = document.querySelector('input[name="allergies"]:checked')?.value;
    html += `<p style="margin-top: 1rem;"><strong>Allergies:</strong> ${allergyVal === 'yes' ? (document.getElementById('allergyList').value || '—') : 'None'}</p>`;

    const medVal = document.querySelector('input[name="meds"]:checked')?.value;
    html += `<p><strong>Meds:</strong> ${medVal === 'none' ? 'None' : medVal === 'many' ? '6+ (polypharmacy)' : '1–5'}</p>`;

    const skinVal = document.querySelector('input[name="skin"]:checked')?.value;
    html += `<p><strong>Skin:</strong> ${skinVal === 'risk' ? 'At risk / wound – ' + (document.getElementById('woundNotes').value || '—') : 'Intact'}</p>`;

    const fallVal = document.querySelector('input[name="fall"]:checked')?.value;
    html += `<p><strong>Fall risk:</strong> ${fallVal === 'high' ? 'High' : 'Low'}</p>`;

    if (formData.riskFlags.length > 0) {
      html += `<p style="margin-top: 1rem;"><strong>Risk flags:</strong> ${formData.riskFlags.map(r => r.label).join(', ')}</p>`;
    }

    html += `<p style="margin-top: 1rem;"><strong>Tasks:</strong></p><ul style="margin-left: 1.25rem;">`;
    formData.generatedTasks.forEach(t => { html += `<li>${t}</li>`; });
    html += `</ul>`;

    html += `<p style="margin-top: 1rem; font-size: 0.8125rem; color: var(--text-muted);">Generated ${new Date().toLocaleString()}</p>`;

    document.getElementById('summaryBody').innerHTML = html;
  }

  // PDF export (client-side print to PDF)
  function exportPdf() {
    window.print();
  }

  // Save patient to dashboard
  function savePatient() {
    const fn = document.getElementById('firstName').value.trim();
    const ln = document.getElementById('lastName').value.trim();
    const dob = document.getElementById('dob').value;
    const mrn = document.getElementById('mrn').value.trim() || 'MRN-' + Date.now();
    const dx = document.getElementById('diagnosis').value.trim();
    const age = dob ? Math.floor((new Date() - new Date(dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 0;

    const patient = {
      id: patientId,
      mrn,
      name: `${fn} ${ln}`,
      age,
      dob,
      diagnosis: dx,
      admissionDate: new Date().toISOString().slice(0, 10),
      status: 'active',
      riskFlags: formData.riskFlags.map(r => r.id),
      pendingTasks: formData.generatedTasks.length
    };

    let patients = [];
    try {
      const stored = localStorage.getItem('irf_patients');
      if (stored) patients = JSON.parse(stored);
    } catch (e) {}

    const idx = patients.findIndex(p => p.id === patientId);
    if (idx >= 0) patients[idx] = patient;
    else patients.unshift(patient);

    localStorage.setItem('irf_patients', JSON.stringify(patients));
    clearDraft();
  }

  // Event listeners
  initConditionalLogic();

  // Auto-save on step 1 & 2 input changes
  ['firstName', 'lastName', 'dob', 'mrn', 'diagnosis', 'allergyList', 'medList', 'woundNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', saveDraft);
      el.addEventListener('change', saveDraft);
    }
  });
  document.querySelectorAll('input[name="fall"]').forEach(r => {
    r.addEventListener('change', saveDraft);
  });

  // Keyboard: Enter advances step (except in textarea)
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (currentStep === 1) document.getElementById('next1').click();
    else if (currentStep === 2) document.getElementById('next2').click();
    else if (currentStep === 3) document.getElementById('next3').click();
  });

  document.getElementById('next1').addEventListener('click', () => {
    if (!validateStep1()) {
      alert('Please complete all required fields.');
      return;
    }
    showStep(2);
  });

  document.getElementById('prev2').addEventListener('click', () => showStep(1));
  document.getElementById('next2').addEventListener('click', () => {
    showStep(3);
    buildChecklist();
    generateTasksAndRisks();
  });

  document.getElementById('prev3').addEventListener('click', () => showStep(2));
  document.getElementById('next3').addEventListener('click', () => {
    if (!validateChecklist()) {
      alert('Please complete all required checklist items before proceeding.');
      return;
    }
    buildSummary();
    savePatient();
    showStep(4);
  });

  document.getElementById('prev4').addEventListener('click', () => showStep(3));
  document.getElementById('btnPdf').addEventListener('click', exportPdf);

  // Load: draft first (full state), else patient record (demographics), no DOB prefill
  const draftRestored = restoreDraft();
  if (!draftRestored && patientId && patientId.startsWith('P')) {
    try {
      const stored = localStorage.getItem('irf_patients');
      if (stored) {
        const patients = JSON.parse(stored);
        const p = patients.find(x => x.id === patientId);
        if (p && p.name) {
          const parts = p.name.split(' ');
          document.getElementById('lastName').value = parts.pop() || '';
          document.getElementById('firstName').value = parts.join(' ') || '';
          document.getElementById('mrn').value = p.mrn || '';
          if (p.dob) document.getElementById('dob').value = p.dob;
          if (p.diagnosis) document.getElementById('diagnosis').value = p.diagnosis;
        }
      }
    } catch (e) {}
  }

  if (!draftRestored) showStep(1);
})();
