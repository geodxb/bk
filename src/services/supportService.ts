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
    
    // Handle policy violation questions
    if (query.includes('policy violation') || query.includes('restricted') || query.includes('restriction')) {
      if (investor?.accountStatus?.includes('Restricted') || investor?.accountStatus?.includes('policy violation')) {
        return `Your account currently has restrictions due to a policy violation. This is typically related to one of the following:

1. Unusual trading patterns detected on your account
2. Multiple withdrawal requests in a short timeframe
3. Verification issues with your identity documents
4. Suspicious login activity from unrecognized locations

These restrictions are temporary while our compliance team reviews your account. During this period, withdrawals require manual approval and may take 5-10 business days to process. You can continue trading, but new deposits may also require additional verification.

If you believe this is an error, please provide any supporting documentation that may help resolve this issue faster.`;
      } else {
        return `Your account is currently in good standing with no policy violations or restrictions. You have full access to all platform features including deposits, trading, and withdrawals.

If you're asking about policy violations in general, they typically occur when our system detects:
- Unusual trading patterns
- Multiple withdrawal requests in short succession
- Identity verification issues
- Login attempts from suspicious locations

Is there a specific concern about your account you'd like me to address?`;
      }
    }
    
    // Handle withdrawal restriction questions
    if (query.includes('why') && (query.includes('withdrawal') || query.includes('withdraw')) && 
        (query.includes('disabled') || query.includes('restricted') || query.includes('can\'t'))) {
      if (investor?.accountStatus?.includes('Restricted') || investor?.accountStatus?.includes('policy violation')) {
        return `Your withdrawals are currently restricted because your account has been flagged for a policy violation review. 

Our compliance team detected unusual activity that requires manual verification. This is a security measure to protect both you and the platform. Common reasons include:

• Unusual trading patterns that don't match your typical behavior
• Multiple withdrawal requests in a short timeframe
• Incomplete or inconsistent verification documents
• Login attempts from unfamiliar locations

While under review, withdrawals require manual approval from our compliance team. You can still submit withdrawal requests, but they'll be processed after review, which typically takes 5-10 business days.

The restriction is temporary and will be lifted once the review is complete. If you need urgent assistance, please provide any supporting documentation that might help expedite the review.`;
      } else if (investor?.accountStatus?.includes('Closed')) {
        return `Your account is currently marked for closure, which is why withdrawals are disabled. During the closure process, our system automatically handles the transfer of any remaining funds to your registered bank account.

This process typically takes 60-90 days to complete, as it requires several compliance checks and verification steps. You don't need to submit withdrawal requests during this period - the system will automatically process the transfer of your remaining balance ($${investor?.currentBalance?.toLocaleString() || '0'}) to your bank account.

If you have any questions about the closure process or need to update your bank information before the transfer is completed, please let me know.`;
      } else {
        return `Your account doesn't have any withdrawal restrictions. You can withdraw funds at any time, subject to:

• Minimum withdrawal amount: $100
• Platform commission: 15% of withdrawal amount
• Processing time: 1-3 business days for approval

Your current available balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

If you're experiencing issues with withdrawals, it might be due to:
1. Temporary system maintenance
2. Incomplete bank information
3. Recent large deposits still clearing

Would you like me to help you with initiating a withdrawal?`;
      }
    }
    
    if (query.includes('withdrawal') || query.includes('withdraw')) {
      return `You can request a withdrawal from your account page. Here's what you need to know:

• Minimum withdrawal amount: $100
• Platform commission: 15% of withdrawal amount
• Available balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Processing time: ${investor?.accountStatus?.includes('Restricted') ? '5-10 business days (due to account restrictions)' : '1-3 business days'}

${investor?.accountStatus?.includes('Restricted') ? 'Note: Your account currently has restrictions, so withdrawals require manual review by our compliance team.' : 'Your account is in good standing with no withdrawal restrictions.'}

Would you like me to guide you through the withdrawal process or explain the commission structure in more detail?`;
    }
    
    if (query.includes('balance') || query.includes('account balance')) {
      const performance = (investor?.currentBalance || 0) - (investor?.initialDeposit || 0);
      const performancePercent = (investor?.initialDeposit || 0) > 0 ? (performance / (investor?.initialDeposit || 1) * 100) : 0;
      
      return `Your current account balance is $${investor?.currentBalance?.toLocaleString() || '0'}.

Account Performance:
• Initial deposit: $${investor?.initialDeposit?.toLocaleString() || '0'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Total gain/loss: ${performance >= 0 ? '+' : ''}$${performance.toLocaleString()} (${performancePercent.toFixed(2)}%)
• Withdrawals to date: ${transactions.filter(tx => tx.type === 'Withdrawal').length}

Your balance is updated in real-time based on trading activity. Is there anything specific about your balance or performance you'd like to know?`;
    }
    
    if (query.includes('transaction') || query.includes('history')) {
      const recentTransaction = transactions[0];
      const deposits = transactions.filter(tx => tx.type === 'Deposit');
      const earnings = transactions.filter(tx => tx.type === 'Earnings');
      const withdrawals = transactions.filter(tx => tx.type === 'Withdrawal');
      
      return `Your account has ${transactions.length} transactions on record:

• Deposits: ${deposits.length} (Total: $${deposits.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()})
• Earnings: ${earnings.length} (Total: $${earnings.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()})
• Withdrawals: ${withdrawals.length} (Total: $${Math.abs(withdrawals.reduce((sum, tx) => sum + tx.amount, 0)).toLocaleString()})

${recentTransaction ? `Your most recent transaction was a ${recentTransaction.type} of $${Math.abs(recentTransaction.amount).toLocaleString()} on ${recentTransaction.date}.` : ''}

Would you like to see more details about your recent transactions or filter by a specific type?`;
    }
    
    if (query.includes('account') || query.includes('status')) {
      let statusExplanation = '';
      
      if (investor?.accountStatus?.includes('Restricted')) {
        statusExplanation = 'Your account is currently under review due to a policy violation. While you can continue trading, withdrawals require manual approval and may take longer to process.';
      } else if (investor?.accountStatus?.includes('Closed')) {
        statusExplanation = 'Your account is marked for closure. During this process, you cannot make trades or withdrawals. Any remaining balance will be transferred to your registered bank account.';
      } else {
        statusExplanation = 'Your account is in good standing with full access to all platform features.';
      }
      
      return `Your account status is: ${investor?.accountStatus || 'Active'}

${statusExplanation}

Account Details:
• Member since: ${investor?.joinDate || 'your join date'}
• Country: ${investor?.country || 'your country'}
• Current balance: $${investor?.currentBalance?.toLocaleString() || '0'}
• Email: ${investor?.email || 'your email'}

Is there anything specific about your account status or details you'd like to know?`;
    }
    
    if (query.includes('help') || query.includes('support')) {
      return `I'm here to help with any questions about your Interactive Brokers account. Here are some ways I can assist you:

• Account Information: Check your status, balance, and performance
• Transaction History: Review your deposits, earnings, and withdrawals
• Withdrawal Support: Help with withdrawal requests and processing times
• Policy Questions: Explain any restrictions or account limitations
• Investor Lookup: Get information about any investor by name (e.g., "Tell me about Pamela Medina")

You can also ask specific questions like "Why is my withdrawal restricted?" or "What's my current balance?" What can I help you with today?`;
    }
    
    // Handle commission questions
    if (query.includes('commission') || query.includes('fee') || query.includes('charge')) {
      return `The platform charges a 15% commission on all withdrawals. This is calculated as follows:

• Withdrawal amount: The amount you request to withdraw
• Commission: 15% of the withdrawal amount
• Net amount: The amount you'll receive after the commission is deducted

For example, if you withdraw $1,000:
• Commission: $150 (15% of $1,000)
• Net amount you receive: $850

This commission helps support platform operations, security measures, and ongoing development. The commission is only applied to withdrawals, not deposits or earnings.

Is there anything else you'd like to know about the commission structure?`;
    }
    
    // Handle policy questions
    if (query.includes('policy') || query.includes('terms') || query.includes('rules')) {
      return `Our platform policies are designed to ensure security and compliance. Key policies include:

• KYC Requirements: All users must complete identity verification
• Withdrawal Policy: 15% commission, minimum $100 withdrawal, 1-3 day processing
• Security Measures: Accounts may be restricted if suspicious activity is detected
• Account Closure: 90-day restriction on new account creation after closure
• Fund Protection: All funds are held in segregated accounts

Violations of these policies may result in temporary restrictions or account closure. Our compliance team reviews all flagged accounts to ensure fair treatment.

Is there a specific policy you'd like more information about?`;
    }
    
    // Default response with examples
    return `I'm here to help with your Interactive Brokers account. I can assist with:

• Account information and status
• Balance and performance tracking
• Transaction history and details
• Withdrawal requests and processing
• Policy questions and explanations
• Information about specific investors (just mention their name)

You can ask questions like "What's my balance?", "Why is my withdrawal restricted?", or "Tell me about Pamela Medina's account".

How can I assist you today?`;
  }

  static async generateQuickResponse(category: string, context: ChatContext): Promise<string> {
    const quickResponses = {
      account: `I can see your account is in ${context.investor?.accountStatus || 'Active'} status. You've been with us since ${context.investor?.joinDate}.

${context.investor?.accountStatus?.includes('Restricted') ? 'Your account currently has restrictions that require additional verification for certain actions. This is typically temporary while our compliance team reviews your account.' : 'Your account is in good standing with full access to all platform features.'}

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
• Processing time: ${context.investor?.accountStatus?.includes('Restricted') ? '5-10 business days (due to account restrictions)' : '1-3 business days'}

${context.investor?.accountStatus?.includes('Restricted') ? 'Note: Your account currently has restrictions, so withdrawals require manual review by our compliance team.' : 'Your account is in good standing with no withdrawal restrictions.'}

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

  private static generateFullInvestorProfile(investor: any, transactions: any[], withdrawals: any[]): string {
    const totalDeposits = transactions.filter(tx => tx.type === 'Deposit').reduce((sum, tx) => sum + tx.amount, 0);
    const totalEarnings = transactions.filter(tx => tx.type === 'Earnings').reduce((sum, tx) => sum + tx.amount, 0);
    const totalWithdrawals = Math.abs(transactions.filter(tx => tx.type === 'Withdrawal').reduce((sum, tx) => sum + tx.amount, 0));
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pending');
    const approvedWithdrawals = withdrawals.filter(w => w.status === 'Approved');
    
    const performance = investor.currentBalance - investor.initialDeposit;
    const performancePercent = investor.initialDeposit > 0 ? (performance / investor.initialDeposit * 100) : 0;

    // Create a more conversational and professional response
    return `Here's the complete profile for ${investor.name}:

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

${this.generateAccountStatusExplanation(investor)}

Is there any specific aspect of ${investor.name}'s account you'd like me to elaborate on?`;
  }

  private static generateAccountStatusExplanation(investor: any): string {
    if (!investor.accountStatus || investor.accountStatus.includes('Active')) {
      return 'This account is in good standing with full access to all platform features.';
    }
    
    if (investor.accountStatus.includes('Restricted') || investor.accountStatus.includes('policy violation')) {
      return `This account has restrictions due to a policy violation. This typically occurs when our system detects unusual activity patterns or verification issues. While under review, withdrawals require manual approval and may take 5-10 business days to process.`;
    }
    
    if (investor.accountStatus.includes('Closed')) {
      return `This account is marked for closure. During the closure process, trading and withdrawals are disabled. Any remaining balance will be transferred to the registered bank account within 60-90 days.`;
    }
    
    if (investor.accountStatus.includes('KYC') || investor.accountStatus.includes('verification')) {
      return `This account requires additional verification. The investor needs to complete the KYC process by submitting the required documentation.`;
    }
    
    return `Current account status: ${investor.accountStatus}`;
  }
}