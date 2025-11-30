-- Add DELETE and UPDATE policies for user_sessions table
CREATE POLICY "Users can delete own sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);