/**
 * Demo data for IRF Clinical Workflow MVP
 * In production, this would come from a real database/API
 */

const DEMO_DATA = {
  // Pre-filled login credentials
  login: {
    username: 'provider@irf.demo',
    password: '••••••••'
  },

  // Sample active patients for dashboard
  patients: [
    {
      id: 'P001',
      mrn: 'MRN-2024-001',
      name: 'John Martinez',
      age: 72,
      admissionDate: '2025-03-18',
      status: 'active',
      riskFlags: ['polypharmacy', 'fall-risk'],
      pendingTasks: 3
    },
    {
      id: 'P002',
      mrn: 'MRN-2024-002',
      name: 'Sarah Chen',
      age: 65,
      admissionDate: '2025-03-19',
      status: 'active',
      riskFlags: ['pressure-injury'],
      pendingTasks: 2
    },
    {
      id: 'P003',
      mrn: 'MRN-2024-003',
      name: 'Robert Williams',
      age: 58,
      admissionDate: '2025-03-17',
      status: 'active',
      riskFlags: [],
      pendingTasks: 1
    }
  ],

  // Admission checklist steps (required, in order)
  checklistSteps: [
    { id: 'vitals', label: 'Vitals documented', required: true },
    { id: 'allergies', label: 'Allergies verified', required: true },
    { id: 'meds', label: 'Home medications reconciled', required: true },
    { id: 'consults', label: 'Required consults ordered', required: true },
    { id: 'skin', label: 'Skin assessment completed', required: true },
    { id: 'fall', label: 'Fall risk assessment', required: true },
    { id: 'goals', label: 'Rehab goals documented', required: true }
  ]
};
