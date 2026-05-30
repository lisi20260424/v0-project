export async function calculateTotalPointsUsed(_userId: string): Promise<number> {
  return 0
}

export async function getUserPointsStats(_userId: string) {
  return { initialPoints: 0, available: 0, used: 0 }
}

export async function getUserPointsHistory(_userId: string, _limit = 10, _offset = 0) {
  return { records: [], total: 0 }
}
