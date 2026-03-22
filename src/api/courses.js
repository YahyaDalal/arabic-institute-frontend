import client from './client';

export const getCourses = () => client.get('/api/courses/');
export const getCourse = (id) => client.get(`/api/courses/${id}/`);
export const createCourse = (data) => client.post('/api/courses/', data);
export const updateCourse = (id, data) => client.patch(`/api/courses/${id}/`, data);
export const deleteCourse = (id) => client.delete(`/api/courses/${id}/`);
export const getCohorts = () => client.get('/api/courses/cohorts/');
export const createCohort = (data) => client.post('/api/courses/cohorts/', data);
export const updateCohort = (id, data) => client.patch(`/api/courses/cohorts/${id}/`, data);