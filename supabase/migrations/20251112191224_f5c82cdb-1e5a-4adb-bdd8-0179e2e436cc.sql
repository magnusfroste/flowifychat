-- Add chat_type enum column to chat_instances
ALTER TABLE chat_instances 
ADD COLUMN chat_type text DEFAULT 'authenticated' 
CHECK (chat_type IN ('public', 'authenticated'));

-- Add index for performance
CREATE INDEX idx_chat_instances_chat_type ON chat_instances(chat_type);

-- Add comment explaining the modes
COMMENT ON COLUMN chat_instances.chat_type IS 
'public: No storage, GDPR-compliant, direct webhook. authenticated: Full session management with storage';