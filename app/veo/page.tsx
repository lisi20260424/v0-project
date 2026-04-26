import { redirect } from "next/navigation"

/**
 * 旧产品路由，统一重定向到 /video 并附带 provider 提示。
 * 若库内不存在同名供应商，统一页会自动回退到第一个有效供应商。
 */
export default function VeoPage() {
  redirect("/video?provider=veo")
}
