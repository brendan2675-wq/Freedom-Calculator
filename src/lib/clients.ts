/**
 * Clients & Agents directory seam — adviser-owned data.
 *
 * TODO(backend): swap the localStorage internals below for real API calls:
 *   - listClients / getClient   →  GET /clients, GET /clients/:id
 *   - upsertClient              →  POST /clients  or  PATCH /clients/:id
 *   - deleteClient              →  DELETE /clients/:id
 *   - listAgents / getAgent     →  GET /agents, GET /agents/:id
 *   - upsertAgent               →  POST /agents  or  PATCH /agents/:id
 *   - deleteAgent               →  DELETE /agents/:id
 *
 * Public function signatures must NOT change — components consume this module
 * directly. See src/lib/api.ts and BACKEND_INTEGRATION.md.
 */

export interface Client {
  id: string;
  name: string;
  email: string;
  agentIds: string[]; // agents with default access to this client's scenarios
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  agency?: string;
  createdAt: string;
}

const CLIENTS_KEY = "clients";
const AGENTS_KEY = "agents";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Clients
export function listClients(): Client[] {
  return read<Client>(CLIENTS_KEY);
}

export function getClient(id: string): Client | undefined {
  return listClients().find((c) => c.id === id);
}

export function upsertClient(client: Omit<Client, "id" | "createdAt"> & { id?: string }): Client {
  const existing = listClients();
  if (client.id) {
    const idx = existing.findIndex((c) => c.id === client.id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...client, id: client.id } as Client;
      write(CLIENTS_KEY, existing);
      return existing[idx];
    }
  }
  const created: Client = {
    id: crypto.randomUUID(),
    name: client.name,
    email: client.email,
    agentIds: client.agentIds || [],
    createdAt: new Date().toISOString(),
  };
  write(CLIENTS_KEY, [...existing, created]);
  return created;
}

export function deleteClient(id: string) {
  write(CLIENTS_KEY, listClients().filter((c) => c.id !== id));
}

// Agents
export function listAgents(): Agent[] {
  return read<Agent>(AGENTS_KEY);
}

export function getAgent(id: string): Agent | undefined {
  return listAgents().find((a) => a.id === id);
}

export function upsertAgent(agent: Omit<Agent, "id" | "createdAt"> & { id?: string }): Agent {
  const existing = listAgents();
  if (agent.id) {
    const idx = existing.findIndex((a) => a.id === agent.id);
    if (idx !== -1) {
      existing[idx] = { ...existing[idx], ...agent, id: agent.id } as Agent;
      write(AGENTS_KEY, existing);
      return existing[idx];
    }
  }
  const created: Agent = {
    id: crypto.randomUUID(),
    name: agent.name,
    email: agent.email,
    agency: agent.agency,
    createdAt: new Date().toISOString(),
  };
  write(AGENTS_KEY, [...existing, created]);
  return created;
}

export function deleteAgent(id: string) {
  write(AGENTS_KEY, listAgents().filter((a) => a.id !== id));
}
