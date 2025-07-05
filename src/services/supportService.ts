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
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Prepare conversation history
      const conversationMessages = context.conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationMessages,
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || 'I apologize, but I\'m having trouble processing your request. Please try again.';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to get AI response');
    }
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