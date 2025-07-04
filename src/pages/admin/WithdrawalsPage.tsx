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
      header: 'Investor',
      render: (value: string, row: any) => {
        const investor = getInvestorDetails(row.investorId);
        return (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{value}</p>
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
      header: 'Amount',
      align: 'right' as 'right',
      render: (value: number) => (
        <div className="text-right">
          <p className="font-medium text-gray-900">${value?.toLocaleString() || '0'}</p>
          <p className="text-xs text-gray-500">USD</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (value: string) => {
        const date = new Date(value);
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">{date.toLocaleDateString()}</p>
            <p className="text-xs text-gray-500">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
          </div>
        );
      }
    },
    {
      key: 'bankDetails',
      header: 'Bank/Platform',
      render: (_: any, row: any) => {
        const bankInfo = getBankInfo(row.investorName);
        return (
          <div className="space-y-1">
            <p className="text-sm text-gray-900">{bankInfo}</p>
            <p className="text-xs text-gray-500">External Transfer</p>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (value: string, row: any) => {
        let statusClass = 'bg-gray-100 text-gray-800';
        
        if (value === 'Approved') {
          statusClass = 'bg-green-50 text-green-800 border border-green-200';
        } else if (value === 'Rejected') {
          statusClass = 'bg-red-50 text-red-800 border border-red-200';
        } else if (value === 'Pending') {
          statusClass = 'bg-yellow-50 text-yellow-800 border border-yellow-200';
        }
        
        return (
          <div className="space-y-1">
            <span className={`px-2 py-1 text-xs rounded ${statusClass}`}>
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
        return (
          <div className="text-center">
            <span className="text-gray-500 text-xs">
              {row.status === 'Pending' ? 'Awaiting Review' : 'Processed'}
            </span>
            {row.reason && (
              <p className="text-xs text-gray-400 max-w-32 truncate mt-1">
                {row.reason}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <DashboardLayout>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">${totalPendingAmount.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Pending</div>
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{approvedCount}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-900 mb-1">{rejectedCount}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
      </div>
      
      {/* Filters and Controls */}
      <Card className="mb-6 bg-white border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Filter:</span>
            </div>
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All', count: withdrawalRequests.length },
                { key: 'pending', label: 'Pending', count: pendingCount },
                { key: 'approved', label: 'Approved', count: approvedCount },
                { key: 'rejected', label: 'Rejected', count: rejectedCount }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterStatus(filter.key as FilterStatus)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    filterStatus === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by investor or amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </Card>
      
      {/* Withdrawal Requests Table */}
      <Card title={`Withdrawal Requests (${filteredRequests.length})`} className="bg-white border border-gray-200">
        <Table 
          columns={columns} 
          data={filteredRequests}
          isLoading={loading}
          emptyMessage="No withdrawal requests found"
        />
        
        {!loading && filteredRequests.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Showing Results</p>
                <p className="font-medium text-gray-900">{filteredRequests.length} of {withdrawalRequests.length} requests</p>
              </div>
              <div>
                <p className="text-gray-500">Total Amount (Filtered)</p>
                <p className="font-medium text-gray-900">
                  ${filteredRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Average Request</p>
                <p className="font-medium text-gray-900">
                  ${filteredRequests.length > 0 ? Math.round(filteredRequests.reduce((sum, req) => sum + req.amount, 0) / filteredRequests.length).toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
};

export default WithdrawalsPage;