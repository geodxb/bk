import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { useWithdrawalRequests, useInvestors } from '../../hooks/useFirestore';
import { FirestoreService } from '../../services/firestoreService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle, 
  XCircle, 
  Filter, 
  Search, 
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Clock,
  AlertTriangle
} from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

const WithdrawalsPage = () => {
  const { user } = useAuth();
  const { withdrawalRequests, loading, error, refetch } = useWithdrawalRequests();
  const { investors } = useInvestors();
  
  // State management
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [reason, setReason] = useState('');
  const [bankDetails, setBankDetails] = useState('');

  // Filter and search logic
  const filteredRequests = withdrawalRequests.filter(request => {
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && request.status === 'Pending') ||
      (filterStatus === 'approved' && request.status === 'Approved') ||
      (filterStatus === 'rejected' && request.status === 'Rejected');
    
    const matchesSearch = request.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.amount.toString().includes(searchTerm);
    
    return matchesStatus && matchesSearch;
  });

  // Get investor details for bank information
  const getInvestorDetails = (investorId: string) => {
    return investors.find(inv => inv.id === investorId);
  };

  // Get bank information based on investor name
  const getBankInfo = (investorName: string) => {
    const name = investorName.toLowerCase();
    
    if (name.includes('omar ehab')) {
      return 'Custody Wallet';
    } else if (name.includes('rodrigo alfonso')) {
      return 'Crypto';
    } else if (name.includes('pablo canales')) {
      return 'Bitso, S.A.P.I. de C.V.';
    } else if (name.includes('haas raphael') || name.includes('herreman')) {
      return 'Mercado Pago CNBV';
    } else if (name.includes('javier francisco')) {
      return 'Banorte (GFNorte)';
    } else if (name.includes('pamela medina')) {
      return 'Third Party';
    } else if (name.includes('patricia') && name.includes('perea')) {
      return 'Third Party';
    } else {
      return 'Bitso, S.A.P.I. de C.V.';
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    if (!user) return;
    
    setIsLoading(prev => ({ ...prev, [id]: true }));
    
    try {
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      await FirestoreService.updateWithdrawalRequest(id, status, user.id, reason);
      await refetch();
      
      setShowActionModal(false);
      setSelectedRequest(null);
      setReason('');
      setBankDetails('');
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const openActionModal = (request: any, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowActionModal(true);
    
    // Get investor details for bank information
    const investor = getInvestorDetails(request.investorId);
    if (investor) {
      setBankDetails(`Account Holder: ${investor.name}\nCountry: ${investor.country}`);
    }
  };

  const handleModalSubmit = () => {
    if (selectedRequest) {
      handleAction(selectedRequest.id, actionType, reason);
    }
  };

  // Calculate statistics
  const pendingCount = withdrawalRequests.filter(req => req.status === 'Pending').length;
  const approvedCount = withdrawalRequests.filter(req => req.status === 'Approved').length;
  const rejectedCount = withdrawalRequests.filter(req => req.status === 'Rejected').length;
  const totalPendingAmount = withdrawalRequests
    .filter(req => req.status === 'Pending')
    .reduce((sum, req) => sum + req.amount, 0);

  const columns = [
    {
      key: 'investorName',
      header: 'Investor Details',
      render: (value: string, row: any) => {
        const investor = getInvestorDetails(row.investorId);
        return (
          <div className="space-y-1">
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">ID: {row.investorId.slice(-8)}</p>
            {investor && (
              <p className="text-xs text-gray-500">{investor.country}</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'amount',
      header: 'Amount Requested',
      align: 'right' as 'right',
      render: (value: number) => (
        <div className="text-right">
          <p className="font-bold text-lg text-gray-800">${value?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Request Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="font-medium">{date.toLocaleDateString()}</p>
          </div>
        );
      }
    },
    {
      key: 'bankDetails',
      header: 'Bank Details',
      render: (_: any, row: any) => {
        const bankInfo = getBankInfo(row.investorName);
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{bankInfo}</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: any) => {
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let icon = null;
        
        if (value === 'Approved') {
          bgColor = 'bg-green-100';
          textColor = 'text-green-800';
          icon = <CheckCircle size={14} className="mr-1" />;
        } else if (value === 'Rejected') {
          bgColor = 'bg-red-100';
          textColor = 'text-red-800';
          icon = <XCircle size={14} className="mr-1" />;
        } else if (value === 'Pending') {
          bgColor = 'bg-amber-100';
          textColor = 'text-amber-800';
          icon = <Clock size={14} className="mr-1" />;
        }
        
        return (
          <div className="space-y-1">
            <span className={`px-3 py-1 text-sm rounded-full flex items-center w-fit ${bgColor} ${textColor}`}>
              {icon}
              {value}
            </span>
            {row.processedAt && (
              <p className="text-xs text-gray-500">
                {new Date(row.processedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center' as 'center',
      render: (_: any, row: any) => {
        if (row.status !== 'Pending') {
          return (
            <div className="text-center space-y-1">
              <span className="text-gray-500 text-sm">Processed</span>
              {row.reason && (
                <p className="text-xs text-gray-400 max-w-32 truncate">
                  {row.reason}
                </p>
              )}
            </div>
          );
        }
        
        return (
          <div className="flex flex-col space-y-2">
            <Button
              variant="success"
              size="sm"
              onClick={() => openActionModal(row, 'approve')}
              isLoading={isLoading[row.id]}
              disabled={isLoading[row.id]}
              className="w-full"
            >
              <CheckCircle size={14} className="mr-1" />
              Approve
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => openActionModal(row, 'reject')}
              isLoading={isLoading[row.id]}
              disabled={isLoading[row.id]}
              className="w-full"
            >
              <XCircle size={14} className="mr-1" />
              Reject
            </Button>
          </div>
        );
      },
    },
  ];

  if (error) {
    return (
      <DashboardLayout title="Withdrawal Management">
        <Card title="Error">
          <div className="text-center py-8">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Withdrawal Management">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Withdrawal Requests</h2>
        <p className="text-gray-600">Review and process investor withdrawal requests with detailed bank information</p>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-lg mx-auto mb-3">
            <Clock className="text-amber-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Pending Requests</h3>
          <p className="text-3xl font-bold text-amber-600">{pendingCount}</p>
        </Card>
        
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-3">
            <DollarSign className="text-red-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Pending Amount</h3>
          <p className="text-3xl font-bold text-red-600">${totalPendingAmount.toLocaleString()}</p>
        </Card>
        
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Approved</h3>
          <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
        </Card>
        
        <Card className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mx-auto mb-3">
            <XCircle className="text-gray-600" size={24} />
          </div>
          <h3 className="text-gray-500 font-medium mb-2">Rejected</h3>
          <p className="text-3xl font-bold text-gray-600">{rejectedCount}</p>
        </Card>
      </div>
      
      {/* Filters and Search */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All', count: withdrawalRequests.length },
                { key: 'pending', label: 'Pending', count: pendingCount },
                { key: 'approved', label: 'Approved', count: approvedCount },
                { key: 'rejected', label: 'Rejected', count: rejectedCount }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key as FilterStatus)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filterStatus === filter.key
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by investor name or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Withdrawal Requests Table */}
      <Card title={`Withdrawal Requests (${filteredRequests.length})`}>
        <Table 
          columns={columns} 
          data={filteredRequests}
          isLoading={loading}
          emptyMessage="No withdrawal requests found"
        />
        
        {!loading && filteredRequests.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Showing Results</p>
                <p className="font-semibold">{filteredRequests.length} of {withdrawalRequests.length} requests</p>
              </div>
              <div>
                <p className="text-gray-500">Total Amount (Filtered)</p>
                <p className="font-semibold text-blue-600">
                  ${filteredRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Average Request</p>
                <p className="font-semibold text-indigo-600">
                  ${filteredRequests.length > 0 ? Math.round(filteredRequests.reduce((sum, req) => sum + req.amount, 0) / filteredRequests.length).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Action Modal */}
      <Modal
        isOpen={showActionModal}
        onClose={() => {
          setShowActionModal(false);
          setSelectedRequest(null);
          setReason('');
          setBankDetails('');
        }}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Withdrawal Request`}
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Request Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <CreditCard size={18} className="mr-2" />
                Request Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Investor</p>
                  <p className="font-medium">{selectedRequest.investorName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Amount</p>
                  <p className="font-bold text-lg">${selectedRequest.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Request Date</p>
                  <p className="font-medium">{new Date(selectedRequest.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Current Status</p>
                  <p className="font-medium">{selectedRequest.status}</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                <User size={18} className="mr-2" />
                Bank & Contact Information
              </h4>
              <div className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-500">Account Holder</p>
                    <p className="font-medium">{selectedRequest.investorName}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Country</p>
                    <p className="font-medium">{getInvestorDetails(selectedRequest.investorId)?.country || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Bank/Platform</p>
                    <p className="font-medium">{getBankInfo(selectedRequest.investorName)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Account Status</p>
                    <p className="font-medium">{getInvestorDetails(selectedRequest.investorId)?.accountStatus || 'Active'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {actionType === 'approve' ? 'Approval Notes' : 'Rejection Reason'} 
                {actionType === 'reject' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any notes about this approval (optional)...'
                    : 'Please provide a clear reason for rejection...'
                }
                required={actionType === 'reject'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                  setReason('');
                  setBankDetails('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'approve' ? 'success' : 'danger'}
                onClick={handleModalSubmit}
                isLoading={isLoading[selectedRequest.id]}
                disabled={actionType === 'reject' && !reason.trim()}
              >
                {actionType === 'approve' ? (
                  <>
                    <CheckCircle size={18} className="mr-2" />
                    Approve Withdrawal
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="mr-2" />
                    Reject Withdrawal
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default WithdrawalsPage;