import type { JuniorProject } from '../types/project';
import { apiClient } from './apiClient';

export function saveProjectApi(project: JuniorProject) {
  return apiClient<JuniorProject>('/api/junior-projects', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}
