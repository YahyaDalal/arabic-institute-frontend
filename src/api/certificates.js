import client from './client';

export const issueCertificate = (enrolmentId) =>
  client.post('/api/certificates/', { enrolment: enrolmentId });
export const getMyCertificates = () => client.get('/api/certificates/my/');
export const getAllCertificates = () => client.get('/api/certificates/all/');