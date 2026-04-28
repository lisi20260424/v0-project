import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function initGenerationConfig() {
  try {
    console.log("Creating admin_generation_config table...")

    // 创建表
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.admin_generation_config (
          id BIGINT PRIMARY KEY DEFAULT 1,
          music_timeout INT DEFAULT 600,
          image_timeout INT DEFAULT 300,
          video_timeout INT DEFAULT 1800,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT only_one_row CHECK (id = 1)
        );

        ALTER TABLE public.admin_generation_config ENABLE ROW LEVEL SECURITY;

        CREATE POLICY IF NOT EXISTS "allow_select_all" 
          ON public.admin_generation_config 
          FOR SELECT 
          USING (true);

        INSERT INTO public.admin_generation_config (id, music_timeout, image_timeout, video_timeout)
        VALUES (1, 600, 300, 1800)
        ON CONFLICT (id) DO NOTHING;
      `,
    })

    if (createError) {
      console.error("Error creating table:", createError)
      process.exit(1)
    }

    console.log("✓ admin_generation_config table created successfully")

    // 验证表是否存在
    const { data, error: selectError } = await supabase
      .from("admin_generation_config")
      .select("*")
      .single()

    if (selectError) {
      console.error("Error verifying table:", selectError)
      process.exit(1)
    }

    console.log("✓ Table verified:", data)
  } catch (error) {
    console.error("Unexpected error:", error)
    process.exit(1)
  }
}

initGenerationConfig()
