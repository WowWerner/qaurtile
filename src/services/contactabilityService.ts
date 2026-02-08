import { supabase } from '../lib/supabase';

export interface ContactAttempt {
  id: string;
  debtor_id: string;
  agent_id: number | null;
  channel: string;
  contact_number: string | null;
  attempt_timestamp: string;
  outcome: string;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface ContactOutcomeSummary {
  debtor_id: string;
  total_attempts: number;
  phone_attempts: number;
  email_attempts: number;
  sms_attempts: number;
  successful_contacts: number;
  last_contact_date: string | null;
  last_attempt_date: string;
  best_channel: string | null;
  best_time_slot: string | null;
  contact_score: number | null;
  updated_at: string;
}

export interface ContactabilityMetrics {
  totalAttempts: number;
  successfulContacts: number;
  successRate: number;
  byChannel: {
    phone: { attempts: number; success: number; rate: number };
    email: { attempts: number; success: number; rate: number };
    sms: { attempts: number; success: number; rate: number };
  };
  byOutcome: Record<string, number>;
  byTimeOfDay: {
    morning: { attempts: number; success: number; rate: number };
    afternoon: { attempts: number; success: number; rate: number };
    evening: { attempts: number; success: number; rate: number };
    night: { attempts: number; success: number; rate: number };
  };
  averageContactScore: number;
  trends: {
    last7Days: { attempts: number; success: number };
    last30Days: { attempts: number; success: number };
    last90Days: { attempts: number; success: number };
  };
  topPerformingAgents: Array<{
    agent_id: number;
    agent_name: string;
    attempts: number;
    successful: number;
    rate: number;
  }>;
}

const SUCCESS_OUTCOMES = [
  'connected',
  'email_opened',
  'email_clicked',
  'callback_requested',
  'promise_to_pay',
];

/**
 * Fetches comprehensive contactability metrics from the database
 */
export async function getContactabilityMetrics(): Promise<ContactabilityMetrics> {
  try {
    // Get all contact attempts with agent info
    const { data: attempts, error: attemptsError } = await supabase
      .from('contact_attempts')
      .select(`
        *,
        agents (
          id,
          first_name,
          last_name
        )
      `);

    if (attemptsError) throw attemptsError;

    // Get summary data for average score
    const { data: summaries, error: summariesError } = await supabase
      .from('contact_outcomes_summary')
      .select('contact_score');

    if (summariesError) throw summariesError;

    const totalAttempts = attempts?.length || 0;
    const successfulContacts =
      attempts?.filter((a) => SUCCESS_OUTCOMES.includes(a.outcome)).length || 0;

    // Calculate metrics by channel
    const byChannel = calculateChannelMetrics(attempts || []);

    // Calculate metrics by outcome
    const byOutcome = calculateOutcomeMetrics(attempts || []);

    // Calculate metrics by time of day
    const byTimeOfDay = calculateTimeOfDayMetrics(attempts || []);

    // Calculate trends
    const trends = calculateTrends(attempts || []);

    // Calculate top performing agents
    const topPerformingAgents = calculateTopAgents(attempts || []);

    // Calculate average contact score
    const validScores = summaries?.filter((s) => s.contact_score !== null) || [];
    const averageContactScore =
      validScores.length > 0
        ? validScores.reduce((sum, s) => sum + (s.contact_score || 0), 0) / validScores.length
        : 0;

    return {
      totalAttempts,
      successfulContacts,
      successRate: totalAttempts > 0 ? (successfulContacts / totalAttempts) * 100 : 0,
      byChannel,
      byOutcome,
      byTimeOfDay,
      averageContactScore,
      trends,
      topPerformingAgents,
    };
  } catch (error) {
    console.error('Error fetching contactability metrics:', error);
    throw error;
  }
}

function calculateChannelMetrics(attempts: any[]) {
  const channels = ['phone', 'email', 'sms'];
  const result: any = {};

  channels.forEach((channel) => {
    const channelAttempts = attempts.filter((a) => a.channel === channel);
    const successfulInChannel = channelAttempts.filter((a) =>
      SUCCESS_OUTCOMES.includes(a.outcome)
    );

    result[channel] = {
      attempts: channelAttempts.length,
      success: successfulInChannel.length,
      rate:
        channelAttempts.length > 0
          ? (successfulInChannel.length / channelAttempts.length) * 100
          : 0,
    };
  });

  return result;
}

function calculateOutcomeMetrics(attempts: any[]) {
  const outcomes: Record<string, number> = {};

  attempts.forEach((attempt) => {
    outcomes[attempt.outcome] = (outcomes[attempt.outcome] || 0) + 1;
  });

  return outcomes;
}

function calculateTimeOfDayMetrics(attempts: any[]) {
  const timeSlots = {
    morning: { attempts: 0, success: 0, rate: 0 },
    afternoon: { attempts: 0, success: 0, rate: 0 },
    evening: { attempts: 0, success: 0, rate: 0 },
    night: { attempts: 0, success: 0, rate: 0 },
  };

  attempts.forEach((attempt) => {
    const hour = new Date(attempt.attempt_timestamp).getHours();
    let slot: 'morning' | 'afternoon' | 'evening' | 'night';

    if (hour >= 6 && hour < 12) slot = 'morning';
    else if (hour >= 12 && hour < 17) slot = 'afternoon';
    else if (hour >= 17 && hour < 21) slot = 'evening';
    else slot = 'night';

    timeSlots[slot].attempts++;
    if (SUCCESS_OUTCOMES.includes(attempt.outcome)) {
      timeSlots[slot].success++;
    }
  });

  // Calculate rates
  Object.keys(timeSlots).forEach((slot) => {
    const key = slot as keyof typeof timeSlots;
    timeSlots[key].rate =
      timeSlots[key].attempts > 0
        ? (timeSlots[key].success / timeSlots[key].attempts) * 100
        : 0;
  });

  return timeSlots;
}

function calculateTrends(attempts: any[]) {
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const trends = {
    last7Days: { attempts: 0, success: 0 },
    last30Days: { attempts: 0, success: 0 },
    last90Days: { attempts: 0, success: 0 },
  };

  attempts.forEach((attempt) => {
    const attemptDate = new Date(attempt.attempt_timestamp);
    const isSuccess = SUCCESS_OUTCOMES.includes(attempt.outcome);

    if (attemptDate >= last7Days) {
      trends.last7Days.attempts++;
      if (isSuccess) trends.last7Days.success++;
    }
    if (attemptDate >= last30Days) {
      trends.last30Days.attempts++;
      if (isSuccess) trends.last30Days.success++;
    }
    if (attemptDate >= last90Days) {
      trends.last90Days.attempts++;
      if (isSuccess) trends.last90Days.success++;
    }
  });

  return trends;
}

function calculateTopAgents(attempts: any[]) {
  const agentStats: Record<
    number,
    {
      agent_id: number;
      agent_name: string;
      attempts: number;
      successful: number;
    }
  > = {};

  attempts.forEach((attempt) => {
    if (!attempt.agent_id || !attempt.agents) return;

    if (!agentStats[attempt.agent_id]) {
      agentStats[attempt.agent_id] = {
        agent_id: attempt.agent_id,
        agent_name: `${attempt.agents.first_name} ${attempt.agents.last_name}`,
        attempts: 0,
        successful: 0,
      };
    }

    agentStats[attempt.agent_id].attempts++;
    if (SUCCESS_OUTCOMES.includes(attempt.outcome)) {
      agentStats[attempt.agent_id].successful++;
    }
  });

  return Object.values(agentStats)
    .map((agent) => ({
      ...agent,
      rate: agent.attempts > 0 ? (agent.successful / agent.attempts) * 100 : 0,
    }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);
}

/**
 * Fetches detailed contact attempts with pagination
 */
export async function getContactAttempts(
  limit = 100,
  offset = 0
): Promise<ContactAttempt[]> {
  const { data, error } = await supabase
    .from('contact_attempts')
    .select('*')
    .order('attempt_timestamp', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data || [];
}

/**
 * Fetches contact outcomes summary for all debtors
 */
export async function getContactOutcomesSummary(): Promise<ContactOutcomeSummary[]> {
  const { data, error } = await supabase
    .from('contact_outcomes_summary')
    .select('*')
    .order('contact_score', { ascending: false, nullsFirst: false });

  if (error) throw error;
  return data || [];
}

/**
 * Records a new contact attempt
 */
export async function recordContactAttempt(attempt: {
  debtor_id: string;
  agent_id?: number;
  channel: string;
  outcome: string;
  contact_number?: string;
  duration_seconds?: number;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.from('contact_attempts').insert([attempt]);

  if (error) throw error;
}
