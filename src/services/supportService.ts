import OpenAI from 'openai';

interface ChatContext {
  investor: any;
  transactions: any[];
  selectedOption: string | null;
  conversationHistory: any[];
}

export class SupportService {
  private static openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  static async getChatResponse(message: string, context: ChatContext): Promise<string> {
    try {
      // Prepare system prompt with Interactive Brokers context
      
      // Simulate AI response without making actual API calls
      return this.generateSimulatedResponse(message, context);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get AI response');
    }
  }

  private static generateSimulatedResponse(message: string, context: ChatContext): string {
    const { investor, transactions } = context;
    const lowerMessage = message.toLowerCase();
    
    // Basic response templates based on message content
    if (lowerMessage.includes('withdrawal') || lowerMessage.includes('withdraw')) {
      return `You can request a withdrawal from your account page. The minimum withdrawal amount is $100, and there is a 15% platform commission. Your current balance is $${investor?.currentBalance?.toLocaleString() || '0'}, so you can withdraw up to that amount. Withdrawals are typically processed within 1-3 business days.`;
    }
    
    if (lowerMessage.includes('balance') || lowerMessage.includes('account balance')) {
      return `Your current account balance is $${investor?.currentBalance?.toLocaleString() || '0'}. Your initial deposit was $${investor?.initialDeposit?.toLocaleString() || '0'}, and you've made ${transactions.filter(tx => tx.type === 'Withdrawal').length} withdrawals to date.`;
    }
    
    if (lowerMessage.includes('transaction') || lowerMessage.includes('history')) {
      const recentTransaction = transactions[0];
      return `You have ${transactions.length} transactions on record. Your most recent transaction was a ${recentTransaction?.type || 'deposit'} of $${Math.abs(recentTransaction?.amount || 0).toLocaleString()} on ${recentTransaction?.date || 'recent date'}.`;
    }
    
    if (lowerMessage.includes('account') || lowerMessage.includes('status')) {
      return `Your account is currently ${investor?.accountStatus || 'Active'}. You've been with Interactive Brokers since ${investor?.joinDate || 'your join date'}. Is there anything specific about your account you'd like to know?`;
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return `I'm here to help with any questions about your Interactive Brokers account. You can ask about your balance, transactions, withdrawals, or account status. What specific assistance do you need today?`;
    }
    
    // Default response
    return `Thank you for your message. I'm here to help with your Interactive Brokers account. To better assist you, could you please provide more details about your inquiry? You can ask about your balance, transactions, withdrawals, or account status.`;
  }

  private static buildSystemPrompt(context: ChatContext): string {
    const { investor, transactions, selectedOption } = context;
    
    // Calculate key metrics
    const currentBalance = investor?.currentBalance || 0;
    const initialDeposit = investor?.initialDeposit || 0;
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const totalWithdrawals = Math.abs(transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
    const pendingTransactions = transactions.filter(tx => tx.status === 'Pending');
    const recentTransactions = transactions.slice(0, 5);

    return `You are a professional Interactive Brokers customer support representative. You have access to the client's complete account information and should provide helpful, accurate assistance.

IMPORTANT GUIDELINES:
- You are Interactive Brokers support, NOT an AI assistant
- Be professional, helpful, and knowledgeable about trading and financial services
- Use the client's account data to provide personalized responses
- Never mention that you are an AI or chatbot
- Address the client by their name when appropriate
- Provide specific account information when relevant
- Offer solutions and next steps for their inquiries

CLIENT ACCOUNT INFORMATION:
- Name: ${investor?.name || 'Client'}
- Email: ${investor?.email || 'N/A'}
- Account Status: ${investor?.accountStatus || 'Active'}
- Join Date: ${investor?.joinDate || 'N/A'}
- Country: ${investor?.country || 'N/A'}
- Current Balance: $${currentBalance.toLocaleString()}
- Initial Deposit: $${initialDeposit.toLocaleString()}
- Total Earnings: $${totalEarnings.toLocaleString()}
- Total Withdrawals: $${totalWithdrawals.toLocaleString()}
- Total Transactions: ${transactions.length}
- Pending Transactions: ${pendingTransactions.length}

RECENT TRANSACTION ACTIVITY:
${recentTransactions.map(tx => 
  `- ${tx.type}: $${Math.abs(tx.amount).toLocaleString()} (${tx.status}) - ${tx.date}`
).join('\n')}

CURRENT INQUIRY CATEGORY: ${selectedOption || 'General'}

RESPONSE GUIDELINES:
- Keep responses concise but informative (under 150 words typically)
- Reference specific account data when relevant
- Provide actionable advice or next steps
- Maintain a professional, supportive tone
- If you cannot help with something, direct them to appropriate resources
- For complex issues, offer to escalate to specialized departments
- Always prioritize account security and compliance

Remember: You are representing Interactive Brokers and should maintain the highest standards of customer service while being knowledgeable about trading, investments, and account management.`;
  }

  static async generateQuickResponse(category: string, context: ChatContext): Promise<string> {
    const quickResponses = {
      account: `I can see your account is in ${context.investor?.accountStatus || 'Active'} status. You've been with us since ${context.investor?.joinDate}. What specific account information do you need?`,
      balance: `Your current account balance is $${context.investor?.currentBalance?.toLocaleString() || '0'}. You have ${context.transactions.length} transactions on record. How can I help with your balance or transaction history?`,
      withdrawal: `I see you have withdrawal capabilities on your account. The minimum withdrawal amount is $100. Would you like to initiate a withdrawal or check the status of an existing request?`,
      general: `I'm here to help with any questions about your Interactive Brokers account. What can I assist you with today?`
    };

    return quickResponses[category as keyof typeof quickResponses] || quickResponses.general;
  }
}