import { FirestoreService } from './firestoreService';

interface ChatContext {
  investor: any;
  transactions: any[];
  selectedOption: string | null;
  conversationHistory: any[];
  userRole?: string;
  hasSystemAccess?: boolean;
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
      /patricia\s+perea/i,
      /haas\s+raphael/i,
      /herreman/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Check for exact name matches in the message
    const specificNames = [
      "Pamela Medina", "Omar Ehab", "Rodrigo Alfonso", 
      "Pablo Canales", "Javier Francisco", "Patricia Perea",
      "Haas Raphael", "Herreman"
    ];
    
    for (const name of specificNames) {
      if (message.toLowerCase().includes(name.toLowerCase())) {
        return name;
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
        return `I couldn't find an investor named "${investorName}" in our records. Could you double-check the spelling or provide their full name as it appears in our system?`;
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
      } else if (query.includes('restriction') || query.includes('policy violation')) {
        return this.generateRestrictionInfo(investor);
      } else {
        // Comprehensive overview
        return this.generateFullInvestorProfile(investor, transactions, investorWithdrawals);
      }

    } catch (error) {
      console.error('Error fetching investor information:', error);
      return `I encountered an error while retrieving information for "${investorName}". Please try again or contact technical support if the issue persists.`;
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

    let statusExplanation = '';
    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      statusExplanation = `\n\nThis account has restrictions due to policy violations. The investor made multiple withdrawal requests in a short timeframe, which triggered our security system. While under review, withdrawals require manual approval and may take 5-10 business days to process.`;
    } else if (investor.accountStatus?.toLowerCase().includes('closed')) {
      statusExplanation = `\n\nThis account is in the process of being closed. The remaining balance will be transferred to the investor's registered bank account within 60-90 days.`;
    } else if (investor.accountStatus?.toLowerCase().includes('kyc')) {
      statusExplanation = `\n\nThis account requires additional verification documents. The investor needs to complete the KYC process to access all account features.`;
    }

    return `I've found ${investor.name}'s complete profile for you.

${investor.name} joined us on ${investor.joinDate} from ${investor.country}. Their account is currently ${investor.accountStatus || 'Active'}.${statusExplanation}

Financial Overview:
• Current Balance: $${investor.currentBalance.toLocaleString()}
• Initial Deposit: $${investor.initialDeposit.toLocaleString()}
• Total Earnings: $${totalEarnings.toLocaleString()}
• Performance: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Transaction Summary:
• ${transactions.length} total transactions
• $${totalDeposits.toLocaleString()} in deposits
• $${totalWithdrawals.toLocaleString()} in withdrawals
${transactions.length > 0 ? `• Most recent activity on ${transactions[0]?.date}` : '• No recent activity'}

Withdrawal Status:
• ${pendingWithdrawals.length} pending withdrawal requests
• ${approvedWithdrawals.length} approved withdrawals
• $${investor.currentBalance.toLocaleString()} available for withdrawal

${investor.bankDetails ? `Bank Information:
• Bank: ${investor.bankDetails.bankName || 'Not specified'}
• Account Holder: ${investor.bankDetails.accountHolderName || 'Not specified'}
• Currency: ${investor.bankDetails.currency || 'USD'}` : 'No bank details are on file for this investor.'}

Would you like more details about ${investor.name}'s transaction history, withdrawal requests, or account status?`;
  }

  private static generateAccountInfo(investor: any, transactions: any[]): string {
    const totalDeposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const performance = investor.currentBalance - investor.initialDeposit;
    const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit * 100) : 0;

    let accountStatusDetails = '';
    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      accountStatusDetails = `\n\nThis account has restrictions due to policy violations. Our system detected unusual withdrawal patterns that triggered a security review. While under review, the investor can still trade, but withdrawals require manual approval by our compliance team.`;
    } else if (investor.accountStatus?.toLowerCase().includes('closed')) {
      accountStatusDetails = `\n\nThis account is in the closure process. All trading activities are suspended, and the remaining balance will be transferred to the investor's registered bank account within 60-90 days.`;
    } else if (investor.accountStatus?.toLowerCase().includes('kyc')) {
      accountStatusDetails = `\n\nThis account requires additional verification. The investor needs to submit proper identification documents to complete the KYC process.`;
    } else {
      accountStatusDetails = `\n\nThis account is in good standing with full access to all platform features.`;
    }

    return `Here's ${investor.name}'s account information:

Account Status: ${investor.accountStatus || 'Active'}${accountStatusDetails}

Financial Details:
• Current Balance: $${investor.currentBalance.toLocaleString()}
• Initial Deposit: $${investor.initialDeposit.toLocaleString()}
• Total Deposits: $${totalDeposits.toLocaleString()}
• Total Earnings: $${totalEarnings.toLocaleString()}
• Performance: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Account Information:
• Member Since: ${investor.joinDate}
• Country: ${investor.country}
• Email: ${investor.email || 'Not provided'}
• Phone: ${investor.phone || 'Not provided'}

Would you like to know about ${investor.name}'s transaction history or withdrawal requests? Or is there something specific about their account you'd like to understand better?`;
  }

  private static generateTransactionInfo(investor: any, transactions: any[]): string {
    const recentTransactions = transactions.slice(0, 5);
    const deposits = transactions.filter(tx => tx.type === 'Deposit');
    const earnings = transactions.filter(tx => tx.type === 'Earnings');
    const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');

    let response = `Here's ${investor.name}'s transaction history:

Transaction Summary:
• ${transactions.length} total transactions
• ${deposits.length} deposits totaling $${deposits.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
• ${earnings.length} earnings entries totaling $${earnings.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
• ${withdrawals.length} withdrawals totaling $${Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}

`;

    if (recentTransactions.length > 0) {
      response += `Recent Transactions:\n`;
      recentTransactions.forEach((tx, index) => {
        const amount = Math.abs(tx.amount).toLocaleString();
        const date = new Date(tx.date).toLocaleDateString();
        response += `• ${date}: ${tx.type} - $${amount} (${tx.status})\n`;
        if (tx.description) {
          response += `  Note: ${tx.description}\n`;
        }
      });
    } else {
      response += `No transactions found for this investor.\n`;
    }

    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      response += `\nNote: This account has restrictions that may affect future transactions. All withdrawals require manual review by our compliance team.`;
    }

    response += `\nWould you like to see more details about a specific transaction type or time period?`;

    return response;
  }

  private static generateWithdrawalInfo(investor: any, transactions: any[], withdrawals: any[]): string {
    const withdrawalTransactions = transactions.filter(tx => tx.type === 'Withdrawal');
    const totalWithdrawn = Math.abs(withdrawalTransactions.reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved');
    const rejectedWithdrawals = withdrawals.filter(w => w.status === 'Rejected');

    let withdrawalRestrictionInfo = '';
    if (investor.accountStatus?.toLowerCase().includes('restricted')) {
      withdrawalRestrictionInfo = `\nThis account has withdrawal restrictions due to policy violations. Our system detected unusual patterns that triggered a security review. While under review:

• All withdrawals require manual approval by our compliance team
• Processing time is extended to 5-10 business days
• Additional verification may be requested
• The 15% commission still applies to all withdrawals

These restrictions are temporary while our compliance team reviews the account.`;
    } else if (investor.accountStatus?.toLowerCase().includes('closed')) {
      withdrawalRestrictionInfo = `\nThis account is in the closure process. No new withdrawals can be initiated. The remaining balance of $${investor.currentBalance.toLocaleString()} will be transferred to the investor's registered bank account within 60-90 days.`;
    }

    let response = `Here's ${investor.name}'s withdrawal information:

Current Status:
• Available Balance: $${investor.currentBalance.toLocaleString()}
• Account Status: ${investor.accountStatus || 'Active'}${withdrawalRestrictionInfo}

Withdrawal History:
• Total Withdrawals: ${withdrawals.length}
• Total Amount Withdrawn: $${totalWithdrawn.toLocaleString()}
• Pending Requests: ${pendingWithdrawals.length}
• Approved Requests: ${approvedWithdrawals.length}
• Rejected Requests: ${rejectedWithdrawals.length}

`;

    if (pendingWithdrawals.length > 0) {
      response += `Pending Withdrawals:\n`;
      pendingWithdrawals.forEach((w, index) => {
        response += `• $${w.amount.toLocaleString()} requested on ${w.date}\n`;
      });
    }

    if (withdrawalTransactions.length > 0) {
      const recentWithdrawals = withdrawalTransactions.slice(0, 3);
      response += `\nRecent Withdrawal Transactions:\n`;
      recentWithdrawals.forEach((tx, index) => {
        response += `• $${Math.abs(tx.amount).toLocaleString()} - ${tx.status} (${tx.date})\n`;
      });
    }

    response += `\nIs there a specific withdrawal you need more information about?`;

    return response;
  }

  private static generateRestrictionInfo(investor: any): string {
    if (!investor.accountStatus?.toLowerCase().includes('restricted') && 
        !investor.accountStatus?.toLowerCase().includes('policy violation')) {
      return `${investor.name}'s account doesn't have any restrictions. The account is in good standing with full access to all platform features.

Account Status: ${investor.accountStatus || 'Active'}
Current Balance: $${investor.currentBalance.toLocaleString()}

The investor can freely:
• Deposit additional funds
• Execute trades
• Request withdrawals (subject to the standard 1-3 day processing time)
• Access all platform features

Is there something specific about this account you're concerned about?`;
    }

    // For restricted accounts
    return `${investor.name}'s account has restrictions due to policy violations. Our compliance system flagged this account for the following reasons:

• Multiple withdrawal requests in a short timeframe
• Unusual trading patterns that don't match typical investor behavior
• Potential verification issues with submitted documents

Current Status: ${investor.accountStatus}
Restriction Date: Approximately 30 days ago
Current Balance: $${investor.currentBalance.toLocaleString()}

While under review, the account has the following limitations:
• Withdrawals require manual approval by our compliance team
• Processing time is extended to 5-10 business days
• Additional verification may be requested for large transactions
• Trading functionality remains available but is monitored

These restrictions are temporary while our compliance team completes their review. The investor has been notified and asked to provide additional documentation to help resolve these issues.

Would you like me to check if there's been any recent update on this review process?`;
  }

  private static handleCurrentUserQueries(query: string, context: ChatContext): string {
    const { investor, transactions } = context;
    
    // Handle policy violation questions
    if (query.includes('policy violation') || query.includes('restricted') || query.includes('restriction')) {
      if (investor?.accountStatus?.toLowerCase().includes('restricted') || 
          investor?.accountStatus?.toLowerCase().includes('policy violation')) {
        return `I can see that your account currently has restrictions due to a policy violation. This typically happens when our security system detects unusual patterns in your account activity.

In your case, our system flagged:
• Multiple withdrawal requests made in a short timeframe
• Trading patterns that differ significantly from your usual behavior
• Possible login attempts from unfamiliar locations

While your account is under review, you can still:
• View your account balance and transaction history
• Make deposits and continue trading
• Request withdrawals (though they'll require manual approval)

The review process typically takes 7-14 days. During this time, withdrawals will require manual approval and may take 5-10 business days to process instead of the usual 1-3 days.

Is there a specific concern you have about these restrictions that I can address?`;
      } else {
        return `Good news! Your account doesn't have any policy violations or restrictions. You have full access to all platform features including deposits, trading, and withdrawals.

Our policy violations typically occur when our system detects:
• Unusual trading patterns or suspicious activity
• Multiple withdrawal requests in quick succession
• Identity verification issues
• Login attempts from suspicious locations

Your account is in good standing with a current balance of $${investor?.currentBalance?.toLocaleString() || '0'}.

Is there something specific about our policies you'd like to understand better?`;
      }
    }
    
    // Handle withdrawal restriction questions
    if (query.includes('why') && (query.includes('withdrawal') || query.includes('withdraw')) && 
        (query.includes('disabled') || query.includes('restricted') || query.includes('can\'t'))) {
      if (investor?.accountStatus?.toLowerCase().includes('restricted') || 
          investor?.accountStatus?.toLowerCase().includes('policy violation')) {
        return `Your withdrawals are currently taking longer to process because your account has been flagged for a security review.

Our system detected some unusual patterns in your account activity that require additional verification. This is actually a protection measure for your account security.

Specifically, we noticed:
• You made several withdrawal requests in a short period
• There were some unusual trading patterns compared to your history
• There may have been login activity from unfamiliar locations

While your account is under review, you can still request withdrawals, but they'll need manual approval from our compliance team, which takes 5-10 business days instead of the usual 1-3 days.

This is temporary and will be resolved once our review is complete. If you need to make an urgent withdrawal, I recommend providing any additional verification documents that might help expedite the review process.

Is there a specific withdrawal you're concerned about?`;
      } else if (investor?.accountStatus?.toLowerCase().includes('closed')) {
        return `Your account is currently in the closure process, which is why withdrawals are disabled.

During account closure:
• All trading functionality is suspended
• New deposits are not accepted
• Withdrawal requests cannot be initiated through the platform

Instead, our system will automatically process the transfer of your remaining balance ($${investor?.currentBalance?.toLocaleString() || '0'}) to your registered bank account. This transfer typically takes 60-90 days to complete due to compliance requirements and security checks.

The good news is you don't need to do anything - the transfer will happen automatically. If you need to update your bank information before the transfer is completed, please let me know and I can help with that process.

Is there anything else about the account closure process you'd like to understand?`;
      } else {
        return `I don't see any withdrawal restrictions on your account. You should be able to withdraw funds normally, subject to our standard policies:

• Minimum withdrawal amount: $100
• Platform commission: 15% of withdrawal amount
• Processing time: 1-3 business days
• Available balance: $${investor?.currentBalance?.toLocaleString() || '0'}

If you're experiencing issues with withdrawals, it could be due to:
1. Temporary system maintenance
2. Incomplete bank information in your profile
3. A recent large deposit that's still in the clearing period

Are you having trouble with a specific withdrawal request? I'd be happy to look into it for you.`;
      }
    }
    
    if (query.includes('withdrawal') || query.includes('withdraw')) {
      return `Here's everything you need to know about withdrawals from your account:

• Your available balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Minimum withdrawal amount: $100
• Platform commission: 15% of the withdrawal amount
• Processing time: ${investor?.accountStatus?.toLowerCase().includes('restricted') ? '5-10 business days (due to account review)' : '1-3 business days'}

${investor?.accountStatus?.toLowerCase().includes('restricted') ? 
'Note: Your account is currently under review, so withdrawals require manual approval from our compliance team. This is why processing takes longer than usual.' : 
'Your account is in good standing with no withdrawal restrictions.'}

When you request a withdrawal:
1. The amount is immediately deducted from your available balance
2. Our team reviews the request (this takes ${investor?.accountStatus?.toLowerCase().includes('restricted') ? '5-10' : '1-3'} business days)
3. Once approved, funds are transferred to your registered bank account
4. The 15% commission is deducted from the withdrawal amount

Would you like me to help you initiate a withdrawal or explain the commission structure in more detail?`;
    }
    
    if (query.includes('balance') || query.includes('account balance')) {
      const performance = (investor?.currentBalance || 0) - (investor?.initialDeposit || 0);
      const performancePercent = (investor?.initialDeposit || 0) > 0 ? (performance / (investor?.initialDeposit || 1) * 100) : 0;
      
      return `Your current account balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

Here's a breakdown of your account performance:
• Initial investment: $${investor?.initialDeposit?.toLocaleString() || '0'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Total gain/loss: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)

Your account has had ${transactions.length} transactions in total, including:
• ${transactions.filter(tx => tx.type === 'Deposit').length} deposits
• ${transactions.filter(tx => tx.type === 'Earnings').length} earnings entries
• ${transactions.filter(tx => tx.type === 'Withdrawal').length} withdrawals

Your balance is updated in real-time based on trading activity. Would you like to see your recent transaction history or learn more about your account performance?`;
    }
    
    if (query.includes('transaction') || query.includes('history')) {
      const recentTransactions = transactions.slice(0, 5);
      const deposits = transactions.filter(tx => tx.type === 'Deposit');
      const earnings = transactions.filter(tx => tx.type === 'Earnings');
      const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');
      
      let response = `You have ${transactions.length} transactions on your account. Here's a summary:

• Deposits: ${deposits.length} totaling $${deposits.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
• Earnings: ${earnings.length} totaling $${earnings.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
• Withdrawals: ${withdrawals.length} totaling $${Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()}

`;

      if (recentTransactions.length > 0) {
        response += `Your most recent transactions:\n`;
        recentTransactions.forEach((tx, index) => {
          const date = new Date(tx.date).toLocaleDateString();
          response += `• ${date}: ${tx.type} - $${Math.abs(tx.amount).toLocaleString()} (${tx.status})\n`;
        });
      } else {
        response += `You don't have any transactions recorded yet.\n`;
      }

      response += `\nWould you like to see more details about a specific transaction type or filter by date?`;
      return response;
    }
    
    if (query.includes('account') || query.includes('status')) {
      let statusExplanation = '';
      
      if (investor?.accountStatus?.toLowerCase().includes('restricted')) {
        statusExplanation = `Your account is currently under review due to some unusual activity patterns. While we complete this review:

• You can continue trading normally
• You can make deposits without restrictions
• Withdrawal requests require manual approval (5-10 business days)
• Some features may require additional verification

This is a temporary security measure to protect your account. The review typically takes 7-14 days to complete.`;
      } else if (investor?.accountStatus?.toLowerCase().includes('closed')) {
        statusExplanation = `Your account is currently in the closure process. During this time:

• Trading functionality is disabled
• New deposits cannot be made
• Withdrawal requests cannot be initiated
• Your remaining balance will be automatically transferred to your registered bank account within 60-90 days`;
      } else {
        statusExplanation = `Your account is in good standing with full access to all platform features. You can:

• Deposit funds without restrictions
• Trade on all available markets
• Request withdrawals (processed within 1-3 business days)
• Access all platform tools and features`;
      }
      
      return `Your account status is: ${investor?.accountStatus || 'Active'}

${statusExplanation}

Account Details:
• Member since: ${investor?.joinDate || 'N/A'}
• Country: ${investor?.country || 'N/A'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Email: ${investor?.email || 'N/A'}

Is there anything specific about your account you'd like to know more about?`;
    }
    
    if (query.includes('help') || query.includes('support')) {
      return `I'm here to help with any questions about your Interactive Brokers account. Here are some ways I can assist you:

• Account Information: I can check your status, balance, and performance metrics
• Transaction History: I can show your deposits, earnings, and withdrawals
• Withdrawal Support: I can help with withdrawal requests and explain processing times
• Policy Questions: I can explain any restrictions or account limitations
• Investor Information: I can provide details about any investor by name

You can ask me specific questions like "Why is my withdrawal taking longer?" or "What's my current balance?" or even "Tell me about Pamela Medina's account."

What can I help you with today?`;
    }
    
    // Handle commission questions
    if (query.includes('commission') || query.includes('fee') || query.includes('charge')) {
      return `The platform charges a 15% commission on all withdrawals. Here's how it works:

When you request a withdrawal:
• You specify the total amount you want to withdraw
• The system deducts 15% as the platform commission
• You receive the remaining 85% in your bank account

For example, if you request a $1,000 withdrawal:
• Commission: $150 (15% of $1,000)
• Amount you receive: $850 (85% of $1,000)

This commission helps support our trading infrastructure, security systems, and customer service. It only applies to withdrawals - there are no fees on deposits or earnings.

With your current balance of $${investor?.currentBalance?.toLocaleString() || '0'}, if you were to withdraw the full amount:
• Commission would be: $${((investor?.currentBalance || 0) * 0.15).toLocaleString()}
• You would receive: $${((investor?.currentBalance || 0) * 0.85).toLocaleString()}

Would you like me to help you calculate the commission for a specific withdrawal amount?`;
    }
    
    // Handle policy questions
    if (query.includes('policy') || query.includes('terms') || query.includes('rules')) {
      return `Here are our key platform policies:

• KYC Requirements: All users must complete identity verification before making withdrawals
• Withdrawal Policy: 15% commission on all withdrawals, $100 minimum, 1-3 day standard processing
• Security Measures: Accounts showing unusual patterns may be temporarily restricted for review
• Account Closure: 90-day restriction on new account creation after closure
• Fund Protection: All client funds are held in segregated accounts

${investor?.accountStatus?.toLowerCase().includes('restricted') ? 
'Your account currently has restrictions due to a policy review. This is typically resolved within 7-14 days, during which withdrawals require manual approval.' : 
'Your account is currently in good standing with no policy violations.'}

Is there a specific policy you'd like me to explain in more detail?`;
    }
    
    // Default response with examples
    return `I'm here to help with your Interactive Brokers account. I can assist with:

• Account information and status updates
• Balance inquiries and performance tracking
• Transaction history and details
• Withdrawal requests and processing information
• Policy questions and explanations
• Information about specific investors

You can ask me questions like "What's my current balance?", "Why is my withdrawal taking longer than usual?", or even "Tell me about Pamela Medina's account status."

I can also provide detailed information about any investor in our system - just mention their name and what you'd like to know.

How can I assist you today?`;
  }

  static async generateQuickResponse(category: string, context: ChatContext): Promise<string> {
    const quickResponses = {
      account: `I can see your account is in ${context.investor?.accountStatus || 'Active'} status. You've been with us since ${context.investor?.joinDate}.

${context.investor?.accountStatus?.toLowerCase().includes('restricted') ? 'Your account currently has restrictions that require additional verification for certain actions. This is typically temporary while our compliance team reviews your account.' : 'Your account is in good standing with full access to all platform features.'}

I can provide detailed information about any investor by name or answer specific questions about your account. What would you like to know?`,
      
      balance: `Your current account balance is $${context.investor?.currentBalance?.toLocaleString() || '0'}.

Account Summary:
• Initial deposit: $${context.investor?.initialDeposit?.toLocaleString() || '0'}
• Current balance: $${context.investor?.currentBalance?.toLocaleString() || '0'}
• Performance: ${((context.investor?.currentBalance || 0) - (context.investor?.initialDeposit || 0)) >= 0 ? '+' : ''}$${((context.investor?.currentBalance || 0) - (context.investor?.initialDeposit || 0)).toLocaleString()}
• Transactions: ${context.transactions.length} total

I can also look up balance information for any investor or provide more detailed transaction analysis. How can I help?`,
      
      withdrawal: `I can assist with withdrawal information and processing.

Your withdrawal options:
• Available balance: $${context.investor?.currentBalance?.toLocaleString() || '0'}
• Minimum withdrawal: $100
• Commission: 15% of withdrawal amount
• Processing time: ${context.investor?.accountStatus?.toLowerCase().includes('restricted') ? '5-10 business days (due to account restrictions)' : '1-3 business days'}

${context.investor?.accountStatus?.toLowerCase().includes('restricted') ? 'Note: Your account currently has restrictions, so withdrawals require manual review by our compliance team.' : 'Your account is in good standing with no withdrawal restrictions.'}

Would you like to check withdrawal status for a specific investor or get help with initiating a withdrawal?`,
      
      general: `I'm here to help with any questions about Interactive Brokers accounts.

You can ask me about:
• Specific investors by name (e.g., "Tell me about Pamela Medina")
• Account status and restrictions
• Balance and performance details
• Transaction history and analysis
• Withdrawal processing and requirements
• Policy explanations and compliance issues

What can I assist you with today?`
    };

    return quickResponses[category as keyof typeof quickResponses] || quickResponses.general;
  }
}