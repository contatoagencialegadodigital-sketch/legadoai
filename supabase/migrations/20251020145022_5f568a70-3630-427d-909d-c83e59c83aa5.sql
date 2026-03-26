-- Remove foreign key constraints que referenciam auth.users
-- Isso é necessário porque não devemos referenciar diretamente auth.users

-- Remove constraint da tabela image_jobs se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'image_jobs_user_id_fkey'
    ) THEN
        ALTER TABLE public.image_jobs DROP CONSTRAINT image_jobs_user_id_fkey;
    END IF;
END $$;

-- Remove constraint da tabela video_jobs se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'video_jobs_user_id_fkey'
    ) THEN
        ALTER TABLE public.video_jobs DROP CONSTRAINT video_jobs_user_id_fkey;
    END IF;
END $$;

-- Remove constraint da tabela text_conversations se existir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'text_conversations_user_id_fkey'
    ) THEN
        ALTER TABLE public.text_conversations DROP CONSTRAINT text_conversations_user_id_fkey;
    END IF;
END $$;

-- Garante que created_at seja timestamp correto em image_jobs
ALTER TABLE public.image_jobs 
ALTER COLUMN created_at SET DEFAULT now();