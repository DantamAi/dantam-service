/** Names describe the Dantam screen/workflow, rather than a defect category. */
export const modules=[
 'Registration',
 'Patient Profile',
 'Appointments',
 'Case Sheet',
 'Case Sheet Audio Scribe',
 'Case Sheet Workspace',
 'Case Sheet Patient Preview',
 'Case Sheet Export',
 'Invoice',
 'Prescription',
 'Overview Dashboard',
 'Communications',
 'Settings - Clinical Team',
 'Settings - Clinic Profile',
 'Other'
];
export const reviewedModules:Record<string,string>={
 'DQA-009':'Case Sheet Workspace',
 'CLIN-001':'Case Sheet',
 'DANTAM-002':'Case Sheet Workspace',
 'QA-03':'Case Sheet',
 'QA-13':'Case Sheet Patient Preview',
 'QA-18':'Case Sheet Export',
 'TIME-001':'Appointments',
 'APT-STATUS-001':'Appointments',
 'BIL-VALID-002':'Invoice',
 'COM-COUNT-001':'Communications',
 'DQA-002':'Case Sheet Audio Scribe',
 'DQA-005':'Case Sheet Audio Scribe',
 'DQA-006':'Case Sheet Audio Scribe',
 'DQA-007':'Case Sheet Audio Scribe',
 'DQA-008':'Case Sheet',
 'QA-06':'Case Sheet',
 'QA-14':'Case Sheet Patient Preview',
 'QA-20':'Case Sheet',
 'QA-21':'Case Sheet',
 'QA-24':'Case Sheet Workspace',
 'TIME-002':'Appointments',
 'VAL-001':'Registration',
 'QA-12':'Case Sheet Workspace',
 'QA-23':'Case Sheet Patient Preview',
 'SEARCH-001':'Appointments',
 'UX-001':'Overview Dashboard',
 'UX-002':'Case Sheet Workspace',
 'UX-003':'Prescription',
 'UX-004':'Settings - Clinical Team',
 'COPY-001':'Case Sheet'
};
const legacyModules:Record<string,string>={'Case sheets':'Case Sheet','Audio scribe':'Case Sheet Audio Scribe','Teeth mapping':'Case Sheet Workspace','Billing':'Invoice','Patient records':'Patient Profile','Reports & exports':'Case Sheet Patient Preview','Settings & access':'Settings - Clinical Team','User experience':'Case Sheet Workspace'};
/** Preserve any current valid selection; classify old labels on an explicit ticket update. */
export function normalizeModule(sourceId:string|null|undefined,module:string){
 if(modules.includes(module))return module;
 return (sourceId&&reviewedModules[sourceId])||legacyModules[module]||module;
}
