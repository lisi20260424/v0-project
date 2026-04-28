"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GatewayForm } from "@/components/admin/gateway-form"
import { GenerationConfigForm } from "@/components/admin/generation-config-form"
import { Plug, Clock } from "lucide-react"

type SystemSettingsData = {
  gateway: {
    api_key: string
    gateway_url: string
    updated_at: string | null
  }
  generation: {
    music_timeout: number
    image_timeout: number
    video_timeout: number
    updated_at: string | null
  }
}

interface SystemSettingsPageProps {
  data: SystemSettingsData
}

export function SystemSettingsPageContent({ data }: SystemSettingsPageProps) {
  const [activeTab, setActiveTab] = useState("gateway")

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold tracking-tight">系统设置</h1>
        <p className="text-sm text-muted-foreground">
          配置 AI 网关和生成任务的相关参数
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gateway" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">API 网关</span>
          </TabsTrigger>
          <TabsTrigger value="generation" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">生成配置</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gateway" className="mt-6">
          <GatewayForm
            initialApiKey={data.gateway.api_key ?? ""}
            initialGatewayUrl={data.gateway.gateway_url ?? ""}
            updatedAt={data.gateway.updated_at ?? null}
          />
        </TabsContent>

        <TabsContent value="generation" className="mt-6">
          <GenerationConfigForm
            initialMusicTimeout={data.generation.music_timeout ?? 600}
            initialImageTimeout={data.generation.image_timeout ?? 300}
            initialVideoTimeout={data.generation.video_timeout ?? 1800}
            updatedAt={data.generation.updated_at ?? null}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
