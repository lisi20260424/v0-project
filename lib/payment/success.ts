export type SuccessResult = {
  success: boolean
  alreadyProcessed?: boolean
  error?: string
  bonusPoints?: number
  newBalance?: number
}

export async function handlePaymentSuccess(_orderId: string): Promise<SuccessResult> {
  return { success: true, alreadyProcessed: true, bonusPoints: 0, newBalance: 0 }
}
