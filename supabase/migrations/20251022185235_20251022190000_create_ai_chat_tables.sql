/*
  # AI Predictive Analysis Chat System

  1. New Tables
    - `ai_conversations`
      - `id` (uuid, primary key) - Unique conversation identifier
      - `user_id` (uuid) - Reference to auth.users
      - `title` (text) - Conversation title (auto-generated or user-defined)
      - `created_at` (timestamptz) - When conversation was created
      - `updated_at` (timestamptz) - Last message timestamp
      - `is_archived` (boolean) - Archive status

    - `ai_messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `conversation_id` (uuid) - Reference to ai_conversations
      - `role` (text) - 'user' or 'assistant'
      - `content` (text) - Message content
      - `chart_data` (jsonb) - Optional chart configuration and data
      - `query_executed` (text) - SQL query that was executed (for assistant messages)
      - `created_at` (timestamptz) - Message timestamp

    - `ai_saved_findings`
      - `id` (uuid, primary key) - Unique finding identifier
      - `conversation_id` (uuid) - Reference to ai_conversations
      - `message_id` (uuid) - Reference to ai_messages
      - `user_id` (uuid) - Reference to auth.users
      - `title` (text) - Finding title
      - `notes` (text) - User notes about this finding
      - `tags` (text[]) - Array of tags for organization
      - `created_at` (timestamptz) - When finding was saved

  2. Security
    - Enable RLS on all tables
    - Users can only access their own conversations, messages, and findings
    - Policies for CRUD operations restricted to authenticated users
*/

-- Create ai_conversations table
CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  is_archived boolean DEFAULT false NOT NULL
);

-- Create ai_messages table
CREATE TABLE IF NOT EXISTS ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  chart_data jsonb,
  query_executed text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create ai_saved_findings table
CREATE TABLE IF NOT EXISTS ai_saved_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES ai_conversations(id) ON DELETE CASCADE NOT NULL,
  message_id uuid REFERENCES ai_messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  notes text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_saved_findings_user_id ON ai_saved_findings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_saved_findings_conversation_id ON ai_saved_findings(conversation_id);

-- Enable Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_saved_findings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON ai_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own conversations
CREATE POLICY "Users can create own conversations"
  ON ai_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON ai_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON ai_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ai_messages

-- Users can view messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON ai_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in own conversations"
  ON ai_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- Users can delete messages in their own conversations
CREATE POLICY "Users can delete messages in own conversations"
  ON ai_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_conversations
      WHERE ai_conversations.id = ai_messages.conversation_id
      AND ai_conversations.user_id = auth.uid()
    )
  );

-- RLS Policies for ai_saved_findings

-- Users can view their own saved findings
CREATE POLICY "Users can view own saved findings"
  ON ai_saved_findings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own saved findings
CREATE POLICY "Users can create own saved findings"
  ON ai_saved_findings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved findings
CREATE POLICY "Users can update own saved findings"
  ON ai_saved_findings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved findings
CREATE POLICY "Users can delete own saved findings"
  ON ai_saved_findings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ai_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update conversation timestamp when new message is added
DROP TRIGGER IF EXISTS update_conversation_timestamp_on_message ON ai_messages;
CREATE TRIGGER update_conversation_timestamp_on_message
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_timestamp();
