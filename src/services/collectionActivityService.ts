import { supabase } from '../lib/supabase';

export interface PerformedAction {
  p_action_id: string;
  account_id: string;
  user_id: number | null;
  type_id: number;
  date_done: string;
  description: string;
  notes: string | null;
  outcome: string | null;
  metadata: Record<string, any>;
  created_at: string;

  // Joined data
  action_type_name?: string;
  agent_name?: string;
  account_name?: string;
  account_status?: string;
}

export interface ActionType {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
}

export interface StatusHistory {
  id: string;
  account_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: number | null;
  changed_at: string;
  reason: string | null;
  p_action_id: string | null;

  // Joined data
  agent_name?: string;
  account_name?: string;
}

export interface CollectionActivityMetrics {
  totalActions: number;
  successfulActions: number;
  successRate: number;
  actionsByType: {
    name: string;
    count: number;
    percentage: number;
  }[];
  actionsByAgent: {
    agent_id: number;
    agent_name: string;
    total_actions: number;
    successful_actions: number;
    success_rate: number;
  }[];
  actionsByOutcome: {
    outcome: string;
    count: number;
    percentage: number;
  }[];
  statusChanges: {
    from: string;
    to: string;
    count: number;
  }[];
  activityTrend: {
    date: string;
    count: number;
  }[];
  recentActions: PerformedAction[];
}

/**
 * Fetch all performed actions with joined data
 */
export async function getPerformedActions(limit: number = 100): Promise<PerformedAction[]> {
  const { data, error } = await supabase
    .from('performed_actions')
    .select(`
      *,
      performed_action_types(name),
      agents(first_name, last_name),
      debtor_records(name, score)
    `)
    .order('date_done', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching performed actions:', error);
    throw error;
  }

  return (data || []).map((action: any) => ({
    ...action,
    action_type_name: action.performed_action_types?.name,
    agent_name: action.agents
      ? `${action.agents.first_name} ${action.agents.last_name}`
      : 'Unknown Agent',
    account_name: action.debtor_records?.name || 'Unknown Account',
    account_status: action.debtor_records?.score?.toString() || 'N/A'
  }));
}

/**
 * Fetch all action types
 */
export async function getActionTypes(): Promise<ActionType[]> {
  const { data, error } = await supabase
    .from('performed_action_types')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching action types:', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch account status history
 */
export async function getStatusHistory(limit: number = 50): Promise<StatusHistory[]> {
  const { data, error } = await supabase
    .from('account_status_history')
    .select(`
      *,
      agents(first_name, last_name),
      debtor_records(name)
    `)
    .order('changed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching status history:', error);
    throw error;
  }

  return (data || []).map((history: any) => ({
    ...history,
    agent_name: history.agents
      ? `${history.agents.first_name} ${history.agents.last_name}`
      : 'System',
    account_name: history.debtor_records?.name || 'Unknown Account'
  }));
}

/**
 * Get comprehensive collection activity metrics
 */
export async function getCollectionActivityMetrics(): Promise<CollectionActivityMetrics> {
  // Fetch all performed actions
  const actions = await getPerformedActions(1000);

  // Fetch status history
  const statusHistory = await getStatusHistory(100);

  // Calculate total actions
  const totalActions = actions.length;

  // Calculate successful actions (outcome contains 'Successful')
  const successfulActions = actions.filter(
    action => action.outcome?.toLowerCase().includes('successful')
  ).length;

  const successRate = totalActions > 0
    ? (successfulActions / totalActions) * 100
    : 0;

  // Actions by type
  const actionTypeMap = new Map<string, number>();
  actions.forEach(action => {
    const typeName = action.action_type_name || 'Unknown';
    actionTypeMap.set(typeName, (actionTypeMap.get(typeName) || 0) + 1);
  });

  const actionsByType = Array.from(actionTypeMap.entries())
    .map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalActions) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Actions by agent
  const agentMap = new Map<string, {
    agent_id: number;
    agent_name: string;
    total: number;
    successful: number;
  }>();

  actions.forEach(action => {
    if (!action.user_id) return;

    const key = `${action.user_id}`;
    const agentName = action.agent_name || 'Unknown Agent';

    if (!agentMap.has(key)) {
      agentMap.set(key, {
        agent_id: action.user_id,
        agent_name: agentName,
        total: 0,
        successful: 0
      });
    }

    const agent = agentMap.get(key)!;
    agent.total++;
    if (action.outcome?.toLowerCase().includes('successful')) {
      agent.successful++;
    }
  });

  const actionsByAgent = Array.from(agentMap.values())
    .map(agent => ({
      agent_id: agent.agent_id,
      agent_name: agent.agent_name,
      total_actions: agent.total,
      successful_actions: agent.successful,
      success_rate: agent.total > 0 ? (agent.successful / agent.total) * 100 : 0
    }))
    .sort((a, b) => b.success_rate - a.success_rate);

  // Actions by outcome
  const outcomeMap = new Map<string, number>();
  actions.forEach(action => {
    const outcome = action.outcome || 'Unknown';
    outcomeMap.set(outcome, (outcomeMap.get(outcome) || 0) + 1);
  });

  const actionsByOutcome = Array.from(outcomeMap.entries())
    .map(([outcome, count]) => ({
      outcome,
      count,
      percentage: (count / totalActions) * 100
    }))
    .sort((a, b) => b.count - a.count);

  // Status changes
  const statusChangeMap = new Map<string, number>();
  statusHistory.forEach(change => {
    const key = `${change.old_status || 'None'} → ${change.new_status}`;
    statusChangeMap.set(key, (statusChangeMap.get(key) || 0) + 1);
  });

  const statusChanges = Array.from(statusChangeMap.entries())
    .map(([transition, count]) => {
      const [from, to] = transition.split(' → ');
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Activity trend (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const trendMap = new Map<string, number>();
  actions.forEach(action => {
    const date = new Date(action.date_done);
    if (date >= thirtyDaysAgo) {
      const dateKey = date.toISOString().split('T')[0];
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    }
  });

  const activityTrend = Array.from(trendMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent actions (last 20)
  const recentActions = actions.slice(0, 20);

  return {
    totalActions,
    successfulActions,
    successRate,
    actionsByType,
    actionsByAgent,
    actionsByOutcome,
    statusChanges,
    activityTrend,
    recentActions
  };
}

/**
 * Record a new performed action
 */
export async function recordPerformedAction(
  accountId: string,
  userId: number,
  typeId: number,
  description: string,
  outcome?: string,
  notes?: string
): Promise<PerformedAction> {
  const { data, error } = await supabase
    .from('performed_actions')
    .insert({
      account_id: accountId,
      user_id: userId,
      type_id: typeId,
      description,
      outcome,
      notes,
      date_done: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording performed action:', error);
    throw error;
  }

  return data;
}

/**
 * Record a status change
 */
export async function recordStatusChange(
  accountId: string,
  oldStatus: string,
  newStatus: string,
  changedBy: number,
  reason?: string,
  actionId?: string
): Promise<StatusHistory> {
  const { data, error } = await supabase
    .from('account_status_history')
    .insert({
      account_id: accountId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      changed_at: new Date().toISOString(),
      reason,
      p_action_id: actionId
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording status change:', error);
    throw error;
  }

  return data;
}
