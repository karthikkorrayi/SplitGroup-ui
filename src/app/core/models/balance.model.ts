export interface Balance {
  balanceId: string;
  user1: number;
  user1Name: string;
  user2: number;
  user2Name: string;
  amount: number;
  description: string;
  isSettled: boolean;
}

export interface SettlementRequest {
  fromUserId: number;
  toUserId: number;
  amount: number;
}