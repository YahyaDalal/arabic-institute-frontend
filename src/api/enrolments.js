import client from './client';

export const enrol = (cohortId) => client.post('/api/enrolments/', { cohort: cohortId });
export const getMyEnrolments = () => client.get('/api/enrolments/my/');
export const getCohortEnrolments = (cohortId) =>
  client.get(`/api/enrolments/cohort/${cohortId}/`);
export const updateEnrolment = (id, data) =>
  client.patch(`/api/enrolments/${id}/`, data);
export const withdrawEnrolment = (id) =>
  client.patch(`/api/enrolments/${id}/withdraw/`);