/*
  # Enable RLS for HR Tables

  1. Security Updates
    - Enable RLS on agents, agent_skills, agent_performance, agent_status, teams, team_members tables
    - Add policies for authenticated users to read HR data
    - Ensure proper access control for HR information

  2. Tables Updated
    - agents: Core employee information
    - agent_skills: Skill proficiency data
    - agent_performance: Daily performance metrics
    - agent_status: Current status tracking
    - teams: Team organization
    - team_members: Team membership relationships
*/

-- Enable RLS on all HR tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read HR data
CREATE POLICY "Authenticated users can read agents data"
  ON agents
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read agent skills"
  ON agent_skills
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read agent performance"
  ON agent_performance
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read agent status"
  ON agent_status
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read team members"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (true);