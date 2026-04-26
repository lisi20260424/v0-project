-- 008: 把原 mock 数据的 UI 配置（icon/accent/tag/href/cost/desc/display_name）
-- 迁移到 admin_providers.config.ui_by_type，并把模型上的 is_default_display 标记好。
-- 此脚本可重复执行（用 jsonb 合并）。

-- 1) 给供应商写入 ui_by_type
update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "video": {
      "display_name": "Veo 视频",
      "icon": "Video",
      "accent": "from-emerald-500/30 to-teal-500/10",
      "tag": "4K",
      "href": "/veo",
      "cost": "30 点起",
      "description": "文生视频、图生视频，支持 4K 超清与电影级镜头语言。"
    },
    "image": {
      "display_name": "Nano Banana",
      "icon": "Banana",
      "accent": "from-yellow-500/30 to-amber-500/10",
      "tag": "",
      "href": "/image?model=nano-banana",
      "cost": "5 点起",
      "description": "交互式图像编辑，支持多图融合、局部重绘、风格迁移。"
    }
  }'::jsonb,
  true
) where name = 'google';

update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "video": {
      "display_name": "Sora 视频",
      "icon": "Film",
      "accent": "from-sky-500/30 to-indigo-500/10",
      "tag": "Pro",
      "href": "/sora",
      "cost": "25 点起",
      "description": "高度真实的世界模拟器，支持 10s / 15s 时长，物理一致性强。"
    },
    "image": {
      "display_name": "GPT-Image",
      "icon": "ImageIcon",
      "accent": "from-violet-500/30 to-fuchsia-500/10",
      "tag": "新上线",
      "href": "/image",
      "cost": "4 点起",
      "description": "全新一代多模态图像生成，细节丰富，支持精准文字渲染。"
    }
  }'::jsonb,
  true
) where name = 'openai';

update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "video": {
      "display_name": "可灵视频",
      "icon": "Sparkles",
      "accent": "from-amber-500/30 to-orange-500/10",
      "tag": "HOT",
      "href": "/kling",
      "cost": "20 点起",
      "description": "中国团队自研，中文指令理解精准，人物动作自然流畅。"
    }
  }'::jsonb,
  true
) where name = 'kuaishou';

update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "video": {
      "display_name": "Grok 视频",
      "icon": "Play",
      "accent": "from-zinc-500/30 to-slate-500/10",
      "tag": "新",
      "href": "/grok",
      "cost": "15 点起",
      "description": "单图快速驱动成片，视频尺寸自动跟随参考图，轻量创意首选。"
    }
  }'::jsonb,
  true
) where name = 'xai';

update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "image": {
      "display_name": "Flux 图像",
      "icon": "Wand2",
      "accent": "from-rose-500/30 to-pink-500/10",
      "tag": "",
      "href": "/image?model=flux",
      "cost": "3 点起",
      "description": "开源顶级图像模型，摄影级真实质感，艺术创作首选。"
    }
  }'::jsonb,
  true
) where name = 'blackforest';

update admin_providers set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{ui_by_type}',
  '{
    "music": {
      "display_name": "Suno 音乐",
      "icon": "Music2",
      "accent": "from-cyan-500/30 to-blue-500/10",
      "tag": "V5",
      "href": "/suno",
      "cost": "8 点起",
      "description": "输入歌词或描述，生成完整的人声 + 伴奏的高质量歌曲。"
    }
  }'::jsonb,
  true
) where name = 'suno';

-- 2) 给所有模型默认设为该供应商在该类型下的默认展示模型
update admin_models set config = jsonb_set(
  coalesce(config, '{}'::jsonb), '{is_default_display}', 'true'::jsonb, true
);

-- 3) 清理模型上不再使用的 UI 字段（不影响功能，仅整洁）
update admin_models set config = (config - 'ui_icon' - 'ui_accent' - 'ui_tag' - 'ui_href');
