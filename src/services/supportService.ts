import { FirestoreService } from './firestoreService';

interface ChatContext {
  investor: any;
  transactions: any[];
  selectedOption: string | null;
  conversationHistory: any[];
}

export class SupportService {
  static async getChatResponse(message: string, context: ChatContext): Promise<string> {
    try {
      // Enhanced AI response with comprehensive investor data access
      return await this.generateEnhancedResponse(message, context);
    } catch (error) {
      console.error('Support Service Error:', error);
      throw new Error('Failed to get support response');
    }
  }

  private static async generateEnhancedResponse(message: string, context: ChatContext): Promise<string> {
    const lowerMessage = message.toLowerCase();
    
    // Check if user is asking about a specific investor
    const investorNameMatch = this.extractInvestorName(message);
    if (investorNameMatch) {
      return await this.getInvestorInformation(investorNameMatch, lowerMessage);
    }
    
    // Handle current user's account queries
    return this.handleCurrentUserQueries(lowerMessage, context);
  }

  private static extractInvestorName(message: string): string | null {
    // Enhanced name extraction patterns
    const patterns = [
      /(?:about|information|info|details|data|tell me about).*?(?:on|for|about)?\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
      /([A-Za-z]+\s+[A-Za-z]+)(?:\s+account|\s+profile|\s+information)/i,
      /(?:investor|client|user)\s+([A-Za-z]+(?:\s+[A-Za-z]+)*)/i,
      /^([A-Za-z]+\s+[A-Za-z]+)$/i,
      // Specific name patterns
      /pamela\s+medina/i,
      /omar\s+ehab/i,
      /rodrigo\s+alfonso/i,
      /pablo\s+canales/i,
      /javier\s+francisco/i,
      /patricia\s+perea/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private static async getInvestorInformation(investorName: string, query: string): Promise<string> {
    try {
      console.log(`🔍 Searching for investor: ${investorName}`);
      
      // Get all investors from Firebase
      const allInvestors = await FirestoreService.getInvestors();
      
      // Find investor by name (case-insensitive, partial match)
      const investor = allInvestors.find(inv => 
        inv.name.toLowerCase().includes(investorName.toLowerCase()) ||
        investorName.toLowerCase().includes(inv.name.toLowerCase()) ||
        // Match first and last name separately
        (investorName.split(' ').length >= 2 && 
         inv.name.toLowerCase().includes(investorName.split(' ')[0].toLowerCase()) && 
         inv.name.toLowerCase().includes(investorName.split(' ')[1].toLowerCase()))
      );

      if (!investor) {
        return `I couldn't find an investor named "${investorName}" in our system. Please check the spelling or provide the exact name as it appears in the account.`;
      }

      // Get investor's transactions
      const transactions = await FirestoreService.getTransactions(investor.id);
      
      // Get withdrawal requests for this investor
      const allWithdrawals = await FirestoreService.getWithdrawalRequests();
      const investorWithdrawals = allWithdrawals.filter(w => w.investorId === investor.id);

      // Generate comprehensive response based on query type
      if (query.includes('withdrawal') || query.includes('withdraw')) {
        return this.generateWithdrawalInfo(investor, transactions, investorWithdrawals);
      } else if (query.includes('transaction') || query.includes('history')) {
        return this.generateTransactionInfo(investor, transactions);
      } else if (query.includes('balance') || query.includes('account')) {
        return this.generateAccountInfo(investor, transactions);
      } else {
        // Comprehensive overview
        return this.generateFullInvestorProfile(investor, transactions, investorWithdrawals);
      }

    } catch (error) {
      console.error('Error fetching investor information:', error);
      return `I encountered an error while retrieving information for "${investorName}". Please try again or contact technical support.`;
    }
  }

  private static generateFullInvestorProfile(investor: any, transactions: any[], withdrawals: any[]): string {
    const totalDeposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const totalWithdrawals = Math.abs(transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved');
    
    const performance = investor.currentBalance - investor.initialDeposit;
    const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit * 100) : 0;

    return `I've found the complete profile for ${investor.name}:

Account Information:
• Account Status: ${investor.accountStatus || 'Active'}
• Member Since: ${investor.joinDate}
• Country: ${investor.country}
• Email: ${investor.email || 'Not provided'}
• Phone: ${investor.phone || 'Not provided'}

Financial Summary:
• Current Balance: $${investor.currentBalance.toLocaleString()}
• Initial Deposit: $${investor.initialDeposit.toLocaleString()}
• Total Deposits: $${totalDeposits.toLocaleString()}
• Total Earnings: $${totalEarnings.toLocaleString()}
• Total Withdrawals: $${totalWithdrawals.toLocaleString()}
• Performance: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Transaction Activity:
• Total Transactions: ${transactions.length}
• Recent Activity: ${transactions.length > 0 ? `Last transaction on ${transactions[0]?.date}` : 'No recent activity'}

Withdrawal History:
• Total Withdrawal Requests: ${withdrawals.length}
• Pending Requests: ${pendingWithdrawals.length}
• Approved Requests: ${approvedWithdrawals.length}
• Available for Withdrawal: $${investor.currentBalance.toLocaleString()}

Bank Information:
${investor.bankDetails ? `
• Account Holder: ${investor.bankDetails.accountHolderName || 'Not provided'}
• Bank: ${investor.bankDetails.bankName || 'Not provided'}
• Currency: ${investor.bankDetails.currency || 'USD'}` : '• Bank details not on file'}

Is there any specific aspect of ${investor.name}'s account you'd like me to elaborate on?`;
  }

  private static generateAccountInfo(investor: any, transactions: any[]): string {
    const totalDeposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const performance = investor.currentBalance - investor.initialDeposit;
    const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit * 100) : 0;

    return `Here's the account information for ${investor.name}:

Current Status: ${investor.accountStatus || 'Active'}
Current Balance: $${investor.currentBalance.toLocaleString()}
Initial Deposit: $${investor.initialDeposit.toLocaleString()}
Account Performance: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Account Details:
• Member since: ${investor.joinDate}
• Country: ${investor.country}
• Total deposits: $${totalDeposits.toLocaleString()}
• Total earnings: $${totalEarnings.toLocaleString()}
• Transaction count: ${transactions.length}

Contact Information:
• Email: ${investor.email || 'Not provided'}
• Phone: ${investor.phone || 'Not provided'}

The account is ${investor.accountStatus?.includes('Active') || !investor.accountStatus ? 'in good standing' : 'under review'}. Is there anything specific about this account you need assistance with?`;
  }

  private static generateTransactionInfo(investor: any, transactions: any[]): string {
    const recentTransactions = transactions.slice(0, 5);
    const deposits = transactions.filter(tx => tx.type === 'Deposit');
    const earnings = transactions.filter(tx => tx.type === 'Earnings');
    const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');

    let response = `Here's the transaction history for ${investor.name}:

Summary:
• Total Transactions: ${transactions.length}
• Deposits: ${deposits.length} (Total: $${deposits.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()})
• Earnings: ${earnings.length} (Total: $${earnings.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()})
• Withdrawals: ${withdrawals.length} (Total: $${Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()})

Recent Transactions:`;

    if (recentTransactions.length > 0) {
      recentTransactions.forEach((tx, index) => {
        response += `\n${index + 1}. ${tx.type}: $${Math.abs(tx.amount).toLocaleString()} - ${tx.status} (${tx.date})`;
      });
    } else {
      response += '\nNo recent transactions found.';
    }

    response += `\n\nWould you like more details about any specific transaction or time period?`;

    return response;
  }

  private static generateWithdrawalInfo(investor: any, transactions: any[], withdrawals: any[]): string {
    const withdrawalTransactions = transactions.filter(tx => tx.type === 'Withdrawal');
    const totalWithdrawn = Math.abs(withdrawalTransactions.reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved');
    const rejectedWithdrawals = withdrawals.filter(w => w.status === 'Rejected');

    let response = `Here's the withdrawal information for ${investor.name}:

Current Status:
• Available Balance: $${investor.currentBalance.toLocaleString()}
• Minimum Withdrawal: $100
• Commission Rate: 15%

Withdrawal History:
• Total Withdrawal Requests: ${withdrawals.length}
• Total Amount Withdrawn: $${totalWithdrawn.toLocaleString()}
• Pending Requests: ${pendingWithdrawals.length}
• Approved Requests: ${approvedWithdrawals.length}
• Rejected Requests: ${rejectedWithdrawals.length}`;

    if (pendingWithdrawals.length > 0) {
      response += `\n\nPending Withdrawals:`;
      pendingWithdrawals.forEach((w, index) => {
        response += `\n${index + 1}. $${w.amount.toLocaleString()} - Requested on ${w.date}`;
      });
    }

    if (withdrawalTransactions.length > 0) {
      const recentWithdrawals = withdrawalTransactions.slice(0, 3);
      response += `\n\nRecent Withdrawal Transactions:`;
      recentWithdrawals.forEach((tx, index) => {
        response += `\n${index + 1}. $${Math.abs(tx.amount).toLocaleString()} - ${tx.status} (${tx.date})`;
      });
    }

    // Check account restrictions
    if (investor.accountStatus?.includes('Restricted') || investor.accountStatus?.includes('Closed')) {
      response += `\n\nNote: This account has restrictions that may affect withdrawal processing.`;
    }

    response += `\n\nIs there a specific withdrawal you need assistance with?`;

    return response;
  }

  private static handleCurrentUserQueries(query: string, context: ChatContext): string {
    const { investor, transactions } = context;
    
    if (query.includes('withdrawal') || query.includes('withdraw')) {
      return `You can request a withdrawal from your account page. The minimum withdrawal amount is $100, and there is a 15% platform commission. Your current balance is $${investor?.currentBalance?.toLocaleString() || '0'}, so you can withdraw up to that amount. Withdrawals are typically processed within 1-3 business days.`;
    }
    
    if (query.includes('balance') || query.includes('account balance')) {
      return `Your current account balance is $${investor?.currentBalance?.toLocaleString() || '0'}. Your initial deposit was $${investor?.initialDeposit?.toLocaleString() || '0'}, and you've made ${transactions.filter(tx => tx.type === 'Withdrawal').length} withdrawals to date.`;
    }
    
    if (query.includes('transaction') || query.includes('history')) {
      const recentTransaction = transactions[0];
      return `You have ${transactions.length} transactions on record. Your most recent transaction was a ${recentTransaction?.type || 'deposit'} of $${Math.abs(recentTransaction?.amount || 0).toLocaleString()} on ${recentTransaction?.date || 'recent date'}.`;
    }
    
    if (query.includes('account') || query.includes('status')) {
      return `Your account is currently ${investor?.accountStatus || 'Active'}. You've been with Interactive Brokers since ${investor?.joinDate || 'your join date'}. Is there anything specific about your account you'd like to know?`;
    }
    
    if (query.includes('help') || query.includes('support')) {
      return `I'm here to help with any questions about Interactive Brokers accounts. You can ask about specific investors by name (e.g., "Tell me about Pamela Medina"), or inquire about your own balance, transactions, withdrawals, or account status. What specific assistance do you need today?`;
    }
    
    // Default response with examples
    return `Thank you for your message. I can help you with:

• Investor Information: Ask about any investor by name (e.g., "Tell me about Pamela Medina")
• Account Details: Balance, status, and performance information
• Transaction History: Deposits, earnings, and withdrawal records
• Withdrawal Support: Processing status and requirements

What specific information would you like me to help you with today?`;
  }

  static async generateQuickResponse(category: string, context: ChatContext): Promise<string> {
    const quickResponses = {
      account: `I can see your account is in ${context.investor?.accountStatus || 'Active'} status. You've been with us since ${context.investor?.joinDate}.\n\nI can provide detailed information about any investor by name. What specific account information do you need?`,
      balance: `Your current account balance is $${context.investor?.currentBalance?.toLocaleString() || '0'}. You have ${context.transactions.length} transactions on record.\n\nI can also look up balance information for any investor. How can I help with balance or transaction history?`,
      withdrawal: `I can assist with withdrawal information for any investor account. The minimum withdrawal amount is $100 and there is a 15% platform commission.\n\nWould you like to check withdrawal status for a specific investor or get information about initiating a withdrawal?`,
      general: `I'm here to help with any questions about Interactive Brokers accounts.\n\nYou can ask about specific investors by name, check account balances, review transaction history, or get withdrawal information.\n\nWhat can I assist you with today?`
    };

    return quickResponses[category as keyof typeof quickResponses] || quickResponses.general;
  }
}