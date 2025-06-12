import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/common/Card';
import Table from '../../components/common/Table';
import Button from '../../components/common/Button';
import AddInvestorModal from '../../components/admin/AddInvestorModal';
import { useInvestors } from '../../hooks/useFirestore';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  Eye, 
  Edit, 
  Search, 
  Filter,
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  User,
  MapPin,
  Calendar,
  DollarSign,
  AlertTriangle,
  Activity,
  Building
} from 'lucide-react';

const InvestorsListPage = () => {
  const navigate = useNavigate();
  const { investors, loading, error, refetch } = useInvestors();
  const [addInvestorModalOpen, setAddInvestorModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter investors based on search and status
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      investor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (!investor.accountStatus || investor.accountStatus.includes('Active'))) ||
      (statusFilter === 'restricted' && investor.accountStatus?.includes('Restricted')) ||
      (statusFilter === 'closed' && investor.accountStatus?.includes('Closed'));
    
    return matchesSearch && matchesStatus;
  });

  // Sort investors
  const sortedInvestors = [...filteredInvestors].sort((a, b) => {
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Calculate summary statistics
  const totalAUM = investors.reduce((sum, inv) => sum + (inv.currentBalance || 0), 0);
  const activeInvestors = investors.filter(inv => !inv.accountStatus?.includes('Closed')).length;
  const restrictedInvestors = investors.filter(inv => inv.accountStatus?.includes('Restricted')).length;
  const profitableInvestors = investors.filter(inv => inv.currentBalance > inv.initialDeposit).length;

  // Industrial-style columns
  const columns = [
    {
      key: 'profile',
      header: 'INVESTOR PROFILE',
      render: (_: any, row: any) => (
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gray-200 border-2 border-gray-400 flex items-center justify-center">
            <span className="text-gray-700 font-bold text-lg">
              {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg uppercase tracking-wide">{row.name}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
              <div className="flex items-center space-x-1">
                <MapPin size={12} />
                <span className="uppercase tracking-wide">{row.country}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span className="uppercase tracking-wide">
                  {new Date(row.joinDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider">ID:</span>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 border border-gray-300">
                {row.id.slice(-8)}
              </span>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'portfolio',
      header: 'PORTFOLIO METRICS',
      render: (_: any, row: any) => {
        const performance = row.currentBalance - row.initialDeposit;
        const performancePercent = row.initialDeposit > 0 ? (performance / row.initialDeposit) * 100 : 0;
        const isPositive = performance >= 0;
        
        return (
          <div className="bg-gray-50 p-4 border border-gray-300">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">CURRENT BALANCE</p>
                <p className="font-bold text-xl text-gray-900">${row.currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">INITIAL DEPOSIT</p>
                <p className="font-semibold text-lg text-gray-700">${row.initialDeposit.toLocaleString()}</p>
              </div>
              <div className="col-span-2 border-t border-gray-300 pt-3">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">PERFORMANCE</p>
                <div className="flex items-center space-x-2">
                  {isPositive ? (
                    <TrendingUp size={16} className="text-gray-700" />
                  ) : (
                    <TrendingDown size={16} className="text-gray-700" />
                  )}
                  <span className={`font-bold text-lg ${isPositive ? 'text-gray-900' : 'text-gray-900'}`}>
                    {isPositive ? '+' : ''}${performance.toLocaleString()}
                  </span>
                  <span className={`text-sm font-medium ${isPositive ? 'text-gray-700' : 'text-gray-700'}`}>
                    ({performancePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'ACCOUNT STATUS',
      render: (value: string, row: any) => {
        const status = value || 'Active';
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-800';
        let borderColor = 'border-gray-300';
        let icon = <CheckCircle size={14} />;
        
        if (status.includes('Restricted')) {
          bgColor = 'bg-gray-200';
          textColor = 'text-gray-900';
          borderColor = 'border-gray-400';
          icon = <AlertTriangle size={14} />;
        } else if (status.includes('Closed')) {
          bgColor = 'bg-gray-300';
          textColor = 'text-gray-900';
          borderColor = 'border-gray-500';
          icon = <XCircle size={14} />;
        }
        
        return (
          <div className="space-y-3">
            <div className={`inline-flex items-center px-4 py-2 border-2 ${bgColor} ${textColor} ${borderColor}`}>
              {icon}
              <span className="ml-2 font-bold uppercase tracking-wide text-sm">{status}</span>
            </div>
            {row.email && (
              <div className="bg-gray-50 p-2 border border-gray-300">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">EMAIL</p>
                <p className="text-xs font-mono text-gray-800">{row.email}</p>
              </div>
            )}
            {row.phone && (
              <div className="bg-gray-50 p-2 border border-gray-300">
                <p className="text-xs text-gray-600 uppercase tracking-wider mb-1">PHONE</p>
                <p className="text-xs font-mono text-gray-800">{row.phone}</p>
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'OPERATIONS',
      align: 'center' as 'center',
      render: (_: any, row: any) => (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full border-2 border-gray-400 text-gray-800 hover:bg-gray-100 font-bold uppercase tracking-wide"
          >
            <Eye size={14} className="mr-2" />
            VIEW
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/admin/investor/${row.id}`)}
            className="w-full bg-gray-800 hover:bg-gray-900 border-2 border-gray-800 font-bold uppercase tracking-wide"
          >
            <Edit size={14} className="mr-2" />
            MANAGE
          </Button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <DashboardLayout title="Holdings">
        <Card title="SYSTEM ERROR - INVESTOR DATA" className="bg-white border-2 border-red-500">
          <div className="text-center py-8">
            <AlertTriangle size={48} className="mx-auto text-red-600 mb-4" />
            <p className="text-red-600 mb-4 font-bold uppercase tracking-wide">{error}</p>
            <Button 
              variant="outline" 
              onClick={refetch}
              className="border-2 border-red-500 text-red-600 hover:bg-red-50 font-bold uppercase tracking-wide"
            >
              RETRY LOADING
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Holdings">
      {/* Industrial Header */}
      <div className="mb-8">
        <div className="bg-gray-100 border-2 border-gray-400 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 uppercase tracking-wide">INVESTOR HOLDINGS</h2>
              <p className="text-gray-700 uppercase tracking-wide text-sm mt-2">PORTFOLIO MANAGEMENT & PERFORMANCE MONITORING</p>
            </div>
            <Button
              variant="primary"
              onClick={() => setAddInvestorModalOpen(true)}
              className="bg-gray-800 hover:bg-gray-900 border-2 border-gray-800 font-bold uppercase tracking-wide"
            >
              <UserPlus size={18} className="mr-2" />
              ADD NEW INVESTOR
            </Button>
          </div>
        </div>
      </div>

      {/* Industrial Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gray-100 border-2 border-gray-400">
          <div className="p-6">
            <div className="border-b-2 border-gray-400 pb-3 mb-4">
              <p className="text-gray-700 font-bold text-sm uppercase tracking-wider">TOTAL AUM</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-3xl font-bold">${totalAUM.toLocaleString()}</p>
                <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">ASSETS UNDER MANAGEMENT</p>
              </div>
              <div className="w-12 h-12 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
                <DollarSign className="text-gray-700" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-100 border-2 border-gray-400">
          <div className="p-6">
            <div className="border-b-2 border-gray-400 pb-3 mb-4">
              <p className="text-gray-700 font-bold text-sm uppercase tracking-wider">ACTIVE ACCOUNTS</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-3xl font-bold">{activeInvestors}</p>
                <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">OPERATIONAL STATUS</p>
              </div>
              <div className="w-12 h-12 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
                <CheckCircle className="text-gray-700" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-100 border-2 border-gray-400">
          <div className="p-6">
            <div className="border-b-2 border-gray-400 pb-3 mb-4">
              <p className="text-gray-700 font-bold text-sm uppercase tracking-wider">PROFITABLE</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-3xl font-bold">{profitableInvestors}</p>
                <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">POSITIVE PERFORMANCE</p>
              </div>
              <div className="w-12 h-12 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
                <TrendingUp className="text-gray-700" size={24} />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-100 border-2 border-gray-400">
          <div className="p-6">
            <div className="border-b-2 border-gray-400 pb-3 mb-4">
              <p className="text-gray-700 font-bold text-sm uppercase tracking-wider">RESTRICTED</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-900 text-3xl font-bold">{restrictedInvestors}</p>
                <p className="text-gray-600 text-xs mt-1 uppercase tracking-wide">COMPLIANCE REVIEW</p>
              </div>
              <div className="w-12 h-12 bg-gray-300 border-2 border-gray-500 flex items-center justify-center">
                <AlertTriangle className="text-gray-700" size={24} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Industrial Filters and Search */}
      <Card className="mb-8 bg-gray-100 border-2 border-gray-400">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <Filter size={16} className="text-gray-700" />
                <span className="text-sm text-gray-700 font-bold uppercase tracking-wide">STATUS FILTER:</span>
              </div>
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'ALL', count: investors.length },
                  { key: 'active', label: 'ACTIVE', count: activeInvestors },
                  { key: 'restricted', label: 'RESTRICTED', count: restrictedInvestors },
                  { key: 'closed', label: 'CLOSED', count: investors.filter(inv => inv.accountStatus?.includes('Closed')).length }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setStatusFilter(filter.key)}
                    className={`px-4 py-2 text-sm font-bold uppercase tracking-wide border-2 transition-colors ${
                      statusFilter === filter.key
                        ? 'bg-gray-800 text-white border-gray-800'
                        : 'bg-gray-200 text-gray-800 border-gray-400 hover:bg-gray-300'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="SEARCH INVESTORS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border-2 border-gray-400 bg-white text-sm font-bold uppercase tracking-wide focus:ring-0 focus:border-gray-600 w-80"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Industrial Investor Profiles Table */}
      <Card title={`INVESTOR PROFILES DATABASE (${sortedInvestors.length} RECORDS)`} className="bg-white border-2 border-gray-400">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-gray-700 font-bold uppercase tracking-wide">LOADING INVESTOR PROFILES FROM FIREBASE...</p>
            <p className="text-gray-600 text-sm mt-2 uppercase tracking-wide">RETRIEVING ACCOUNT DATA & TRANSACTION HISTORY</p>
          </div>
        ) : sortedInvestors.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-200 border-2 border-gray-400 flex items-center justify-center mx-auto mb-6">
              <User size={40} className="text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">NO INVESTOR PROFILES FOUND</h3>
            <p className="text-gray-700 mb-8 uppercase tracking-wide text-sm">
              {searchTerm || statusFilter !== 'all' 
                ? 'NO INVESTORS MATCH CURRENT FILTER CRITERIA'
                : 'INITIALIZE SYSTEM BY ADDING FIRST INVESTOR PROFILE'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                variant="primary"
                onClick={() => setAddInvestorModalOpen(true)}
                className="bg-gray-800 hover:bg-gray-900 border-2 border-gray-800 font-bold uppercase tracking-wide"
              >
                <UserPlus size={18} className="mr-2" />
                ADD FIRST INVESTOR
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b-2 border-gray-400 bg-gray-100">
                    {columns.map((column) => (
                      <th 
                        key={column.key}
                        scope="col"
                        className="px-6 py-4 text-sm font-bold text-gray-800 uppercase tracking-wider text-left"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-300">
                  {sortedInvestors.map((row, index) => (
                    <tr 
                      key={row.id || index}
                      className="hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      {columns.map((column) => (
                        <td 
                          key={`${row.id || index}-${column.key}`}
                          className="px-6 py-6 text-sm text-gray-700"
                        >
                          {column.render ? column.render(row[column.key as keyof typeof row], row) : row[column.key as keyof typeof row]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Industrial Summary Footer */}
            <div className="mt-8 p-6 bg-gray-100 border-t-2 border-gray-400">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-4 border-2 border-gray-400">
                  <p className="text-gray-600 mb-2 text-xs uppercase tracking-wider font-bold">SHOWING RESULTS</p>
                  <p className="font-bold text-gray-900 text-2xl">{sortedInvestors.length}</p>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">TOTAL RECORDS</p>
                </div>
                <div className="bg-white p-4 border-2 border-gray-400">
                  <p className="text-gray-600 mb-2 text-xs uppercase tracking-wider font-bold">PORTFOLIO VALUE</p>
                  <p className="font-bold text-gray-900 text-2xl">
                    ${sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0).toLocaleString()}
                  </p>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">COMBINED AUM</p>
                </div>
                <div className="bg-white p-4 border-2 border-gray-400">
                  <p className="text-gray-600 mb-2 text-xs uppercase tracking-wider font-bold">AVERAGE SIZE</p>
                  <p className="font-bold text-gray-900 text-2xl">
                    ${sortedInvestors.length > 0 ? Math.round(sortedInvestors.reduce((sum, inv) => sum + inv.currentBalance, 0) / sortedInvestors.length).toLocaleString() : '0'}
                  </p>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">PER ACCOUNT</p>
                </div>
                <div className="bg-white p-4 border-2 border-gray-400">
                  <p className="text-gray-600 mb-2 text-xs uppercase tracking-wider font-bold">SUCCESS RATE</p>
                  <p className="font-bold text-gray-900 text-2xl">
                    {sortedInvestors.length > 0 ? ((sortedInvestors.filter(inv => inv.currentBalance > inv.initialDeposit).length / sortedInvestors.length) * 100).toFixed(1) : '0.0'}%
                  </p>
                  <p className="text-gray-600 text-xs uppercase tracking-wide">PROFITABLE</p>
                </div>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Add Investor Modal */}
      <AddInvestorModal
        isOpen={addInvestorModalOpen}
        onClose={() => setAddInvestorModalOpen(false)}
        onSuccess={() => {
          setAddInvestorModalOpen(false);
          refetch(); // Refresh the investor list from Firebase
        }}
      />
    </DashboardLayout>
  );
};

export default InvestorsListPage;