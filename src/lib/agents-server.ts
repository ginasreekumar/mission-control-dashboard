import { promises as fs } from 'fs';
import { join } from 'path';

const STATUS_DIR = process.env.MISSION_CONTROL_STATUS || '/home/siju/WORK/GINA/mission-control/status';

export interface AgentStatus {
  agent: string;
  status: 'idle' | 'working' | 'error';
  current_task: string | null;
  last_update: string;
  task_id: string | null;
}

export async function readAgentStatus(agent: string): Promise<AgentStatus | null> {
  try {
    const data = await fs.readFile(join(STATUS_DIR, `${agent}.json`), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function writeAgentStatus(status: AgentStatus): Promise<void> {
  await fs.mkdir(STATUS_DIR, { recursive: true });
  await fs.writeFile(
    join(STATUS_DIR, `${status.agent}.json`),
    JSON.stringify({ ...status, last_update: new Date().toISOString() }, null, 2)
  );
}

export async function listAgentStatuses(): Promise<AgentStatus[]> {
  try {
    const files = await fs.readdir(STATUS_DIR);
    const statuses: AgentStatus[] = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const agent = file.replace('.json', '');
        const status = await readAgentStatus(agent);
        if (status) statuses.push(status);
      }
    }
    return statuses;
  } catch (error) {
    return [];
  }
}
