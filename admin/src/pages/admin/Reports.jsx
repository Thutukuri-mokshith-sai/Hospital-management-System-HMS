import { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button, MenuItem,
  Select, FormControl, InputLabel, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, LinearProgress,
  Alert, Chip, IconButton, Avatar, Fade, Grow, alpha, Tooltip
} from '@mui/material';
import {
  Assessment, Download, Refresh, DateRange, People,
  LocalHospital, Receipt, Science, LocalPharmacy,
  InsertChart, TrendingUp, Timeline, BarChart,
  PictureAsPdf, TableChart, FilterList
} from '@mui/icons-material';
import { generateSystemReport } from '../../api/api';
import { format } from 'date-fns';

// Color palettes
const GRADIENT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
];

const STAT_COLORS = ['#667eea', '#4facfe', '#43e97b', '#fa709a', '#30cfd0', '#f093fb'];

// --- SAFETY HELPER ---
const safeFormatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return isNaN(d.getTime()) ? 'N/A' : format(d, formatStr);
};

const Reports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    reportType: 'monthly',
    startDate: '',
    endDate: ''
  });

  // Set default dates for better UX
  useEffect(() => {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    
    // Format dates for date input fields
    const formatForInput = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    setFilters(prev => ({
      ...prev,
      startDate: formatForInput(lastMonth),
      endDate: formatForInput(today)
    }));
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query parameters based on report type
      let params = {
        reportType: filters.reportType
      };
      
      // Add date filters for custom range
      if (filters.reportType === 'custom') {
        if (filters.startDate) {
          params.startDate = filters.startDate;
        }
        if (filters.endDate) {
          params.endDate = filters.endDate;
        }
      }
      
      console.log('Fetching report with params:', params);
      
      const response = await generateSystemReport(params);
      
      if (response.data.success) {
        console.log('Report data received:', response.data);
        setReportData(response.data);
      } else {
        setError(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to fetch report. Please check your connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    fetchReport();
  };

  const handleExport = (formatType) => {
    console.log(`Exporting report in ${formatType} format`);
    // You can implement actual export functionality here
    // For example, generate PDF or Excel from reportData
    alert(`Export functionality for ${formatType.toUpperCase()} would be implemented here`);
  };

  const reportTypes = [
    { value: 'daily', label: 'Daily Report', icon: <DateRange /> },
    { value: 'weekly', label: 'Weekly Report', icon: <Timeline /> },
    { value: 'monthly', label: 'Monthly Report', icon: <InsertChart /> },
    { value: 'custom', label: 'Custom Range', icon: <FilterList /> }
  ];

  const getReportTitle = () => {
    const type = reportTypes.find(t => t.value === filters.reportType)?.label || 'Report';
    return `${type}`;
  };

  // Helper function to calculate totals
  const calculateTotal = (stats, key = 'count') => {
    if (!stats || !Array.isArray(stats)) return 0;
    return stats.reduce((sum, stat) => sum + (stat[key] || 0), 0);
  };

  if (loading) {
    return (
      <Box sx={{ 
        width: '100%', 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Box sx={{ 
          width: { xs: '80%', md: '400px' },
          mb: 4,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4
        }}>
          <LinearProgress 
            sx={{ 
              height: 12,
              backgroundColor: 'rgba(255,255,255,0.2)',
              borderRadius: 4,
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
                borderRadius: 4,
                animation: 'pulse 1.5s ease-in-out infinite'
              }
            }} 
          />
        </Box>
        <Typography variant="h5" sx={{ 
          color: 'white', 
          fontWeight: 700,
          mb: 2,
          animation: 'fadeIn 2s ease-in-out'
        }}>
          Generating Report
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'rgba(255,255,255,0.8)', 
          animation: 'fadeIn 2.5s ease-in-out'
        }}>
          Compiling system statistics and analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      p: { xs: 2, md: 4 }
    }}>
      {/* Header Section */}
      <Box sx={{ 
        mb: 4,
        borderRadius: 4,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: { xs: 3, md: 4 },
          position: 'relative',
          zIndex: 1
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' },
            mb: 3,
            gap: 2
          }}>
            <Box>
              <Typography variant="h3" sx={{ 
                fontWeight: 900,
                color: 'white',
                fontSize: { xs: '2rem', md: '2.5rem' },
                mb: 1
              }}>
                System Reports
              </Typography>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: { xs: '0.9rem', md: '1.1rem' }
              }}>
                Comprehensive analytics and insights for hospital management
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Chip 
                icon={<Assessment sx={{ fontSize: 16 }} />}
                label="Analytics"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 700,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
              <Chip 
                label={`${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              />
            </Box>
          </Box>
        </Box>
        
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />
      </Box>

      {/* Filters Section */}
      <Grow in timeout={500}>
        <Paper 
          sx={{ 
            p: 4, 
            mb: 4,
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <FilterList sx={{ fontSize: 28, color: '#667eea', mr: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
              Report Configuration
            </Typography>
          </Box>
          
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600 }}>Report Type</InputLabel>
                <Select
                  value={filters.reportType}
                  label="Report Type"
                  onChange={(e) => handleFilterChange('reportType', e.target.value)}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }
                  }}
                >
                  {reportTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {type.icon}
                        {type.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { fontWeight: 600 }
                }}
                disabled={filters.reportType !== 'custom'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5'
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                InputLabelProps={{ 
                  shrink: true,
                  sx: { fontWeight: 600 }
                }}
                disabled={filters.reportType !== 'custom'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-disabled': {
                      backgroundColor: '#f5f5f5'
                    }
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                disabled={loading}
                fullWidth
                sx={{
                  height: 56,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-disabled': {
                    background: '#e0e0e0'
                  }
                }}
              >
                {loading ? 'Generating...' : 'Generate Report'}
              </Button>
            </Grid>
          </Grid>
          
          {error && (
            <Fade in>
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 3,
                  borderRadius: 3,
                  boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
                }} 
                onClose={() => setError('')}
              >
                <Typography variant="subtitle1" fontWeight={600}>
                  Error Generating Report
                </Typography>
                <Typography variant="body2">
                  {error}
                </Typography>
              </Alert>
            </Fade>
          )}
        </Paper>
      </Grow>

      {/* Action Buttons */}
      <Grow in timeout={700}>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdf />}
                fullWidth
                onClick={() => handleExport('pdf')}
                disabled={!reportData}
                sx={{
                  height: 56,
                  borderColor: '#f44336',
                  color: '#f44336',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#d32f2f',
                    backgroundColor: alpha('#f44336', 0.04),
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
                  },
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                Export PDF
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<TableChart />}
                fullWidth
                onClick={() => handleExport('excel')}
                disabled={!reportData}
                sx={{
                  height: 56,
                  borderColor: '#4caf50',
                  color: '#4caf50',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#388e3c',
                    backgroundColor: alpha('#4caf50', 0.04),
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  },
                  '&.Mui-disabled': {
                    borderColor: '#e0e0e0',
                    color: '#9e9e9e'
                  }
                }}
              >
                Export Excel
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<BarChart />}
                fullWidth
                onClick={fetchReport}
                disabled={loading}
                sx={{
                  height: 56,
                  borderColor: '#2196f3',
                  color: '#2196f3',
                  fontWeight: 600,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#1976d2',
                    backgroundColor: alpha('#2196f3', 0.04),
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.2)'
                  }
                }}
              >
                Refresh Data
              </Button>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Tooltip title="Generate Report">
                <IconButton 
                  onClick={handleGenerateReport}
                  disabled={loading}
                  sx={{
                    width: 56,
                    height: 56,
                    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      backgroundColor: '#5a6fd8',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)'
                    },
                    '&.Mui-disabled': {
                      backgroundColor: '#e0e0e0',
                      color: '#9e9e9e'
                    }
                  }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Box>
      </Grow>

      {/* Report Content */}
      {reportData && reportData.data ? (
        <Fade in timeout={900}>
          <Box>
            {/* Report Header */}
            <Paper 
              sx={{ 
                p: 4, 
                mb: 4,
                borderRadius: 4,
                background: 'white',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: '#333', mb: 1 }}>
                    {getReportTitle()}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', fontWeight: 500, mb: 2 }}>
                    Generated on: {safeFormatDate(reportData.generatedAt, 'dd/MM/yyyy HH:mm:ss')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      icon={<DateRange />}
                      label={`Type: ${filters.reportType.charAt(0).toUpperCase() + filters.reportType.slice(1)}`}
                      sx={{ 
                        backgroundColor: alpha('#667eea', 0.1),
                        color: '#667eea',
                        fontWeight: 600
                      }}
                    />
                    {reportData.dateRange && (
                      <Chip 
                        icon={<Timeline />}
                        label={`Range: ${reportData.dateRange.$gte ? 
                          `${safeFormatDate(reportData.dateRange.$gte)} to ${safeFormatDate(reportData.dateRange.$lte || new Date())}` : 
                          'All time'}`}
                        sx={{ 
                          backgroundColor: alpha('#43e97b', 0.1),
                          color: '#43e97b',
                          fontWeight: 600
                        }}
                      />
                    )}
                  </Box>
                </Box>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <Assessment sx={{ fontSize: 40 }} />
                </Avatar>
              </Box>
            </Paper>

            {/* Summary Stats Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {[
                {
                  title: 'Total Users',
                  value: calculateTotal(reportData.data.userStatistics),
                  icon: <People sx={{ fontSize: 36 }} />,
                  gradient: GRADIENT_COLORS[0],
                  trend: '+12%'
                },
                {
                  title: 'Total Appointments',
                  value: calculateTotal(reportData.data.appointmentStatistics),
                  icon: <DateRange sx={{ fontSize: 36 }} />,
                  gradient: GRADIENT_COLORS[1],
                  trend: '+15%'
                },
                {
                  title: 'Total Revenue',
                  value: `$${calculateTotal(reportData.data.billingStatistics, 'totalAmount').toLocaleString()}`,
                  icon: <Receipt sx={{ fontSize: 36 }} />,
                  gradient: GRADIENT_COLORS[2],
                  trend: '+18%'
                },
                {
                  title: 'Total Medicines',
                  value: reportData.data.pharmacyStatistics?.totalMedicines || 0,
                  icon: <LocalPharmacy sx={{ fontSize: 36 }} />,
                  gradient: GRADIENT_COLORS[3],
                  trend: '+8%'
                }
              ].map((stat, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Grow in timeout={1100 + index * 100}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        borderRadius: 4,
                        background: stat.gradient,
                        color: 'white',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: 'rgba(255,255,255,0.2)',
                              width: 56,
                              height: 56,
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            {stat.icon}
                          </Avatar>
                          <Chip 
                            icon={<TrendingUp />}
                            label={stat.trend}
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              fontWeight: 700,
                              backdropFilter: 'blur(10px)'
                            }}
                          />
                        </Box>
                        <Typography variant="h2" sx={{ fontWeight: 900, mb: 1, fontSize: '2.5rem' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {stat.title}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grow>
                </Grid>
              ))}
            </Grid>

            {/* Detailed Statistics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* User Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1300}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <People sx={{ fontSize: 28, color: STAT_COLORS[0], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          User Statistics
                        </Typography>
                      </Box>
                      {reportData.data.userStatistics && reportData.data.userStatistics.length > 0 ? (
                        <Grid container spacing={2}>
                          {reportData.data.userStatistics.map((stat, index) => (
                            <Grid item xs={6} key={index}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                bgcolor: alpha(STAT_COLORS[index % STAT_COLORS.length], 0.1),
                                textAlign: 'center'
                              }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 0.5 }}>
                                  {stat._id?.charAt(0).toUpperCase() + stat._id?.slice(1).toLowerCase() || 'Unknown'}
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 900, color: STAT_COLORS[index % STAT_COLORS.length] }}>
                                  {stat.count}
                                </Typography>
                                {stat.active > 0 && (
                                  <Typography variant="caption" sx={{ color: '#666' }}>
                                    ({stat.active} active)
                                  </Typography>
                                )}
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No user data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Appointment Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1400}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <DateRange sx={{ fontSize: 28, color: STAT_COLORS[1], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          Appointment Status
                        </Typography>
                      </Box>
                      {reportData.data.appointmentStatistics && reportData.data.appointmentStatistics.length > 0 ? (
                        <Grid container spacing={2}>
                          {reportData.data.appointmentStatistics.map((stat, index) => (
                            <Grid item xs={6} key={index}>
                              <Box sx={{ 
                                p: 2, 
                                borderRadius: 2, 
                                bgcolor: alpha(STAT_COLORS[(index + 1) % STAT_COLORS.length], 0.1),
                                textAlign: 'center'
                              }}>
                                <Chip 
                                  label={stat._id || 'Unknown'} 
                                  size="small" 
                                  sx={{ 
                                    mb: 1,
                                    bgcolor: 
                                      stat._id === 'Completed' ? alpha('#4caf50', 0.2) :
                                      stat._id === 'Scheduled' ? alpha('#2196f3', 0.2) :
                                      stat._id === 'Cancelled' ? alpha('#f44336', 0.2) : alpha('#9e9e9e', 0.2),
                                    color: 
                                      stat._id === 'Completed' ? '#2e7d32' :
                                      stat._id === 'Scheduled' ? '#1565c0' :
                                      stat._id === 'Cancelled' ? '#c62828' : '#616161',
                                    fontWeight: 600
                                  }}
                                />
                                <Typography variant="h4" sx={{ fontWeight: 900 }}>
                                  {stat.count}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No appointment data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Billing Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1500}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Receipt sx={{ fontSize: 28, color: STAT_COLORS[2], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          Billing Statistics
                        </Typography>
                      </Box>
                      {reportData.data.billingStatistics && reportData.data.billingStatistics.length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#333' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#333' }} align="right">Count</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#333' }} align="right">Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {reportData.data.billingStatistics.map((stat) => (
                                <TableRow key={stat._id} hover>
                                  <TableCell>
                                    <Chip 
                                      label={stat._id === 'Paid' ? 'Paid' : stat._id === 'Pending' ? 'Pending' : stat._id || 'Other'}
                                      size="small"
                                      sx={{
                                        bgcolor: stat._id === 'Paid' ? alpha('#4caf50', 0.2) : alpha('#ff9800', 0.2),
                                        color: stat._id === 'Paid' ? '#2e7d32' : '#e65100',
                                        fontWeight: 600
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 600 }}>{stat.count || 0}</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#333' }}>
                                    ${(stat.totalAmount || 0).toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          No billing data available
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Pharmacy Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1600}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <LocalPharmacy sx={{ fontSize: 28, color: STAT_COLORS[3], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          Pharmacy Overview
                        </Typography>
                      </Box>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Total Medicines', value: reportData.data.pharmacyStatistics?.totalMedicines || 0, color: STAT_COLORS[0] },
                          { label: 'Total Stock', value: reportData.data.pharmacyStatistics?.totalStock || 0, color: STAT_COLORS[1] },
                          { label: 'Low Stock Items', value: reportData.data.pharmacyStatistics?.lowStockCount || 0, color: STAT_COLORS[5] },
                          { label: 'Stock Value', value: `$${(reportData.data.pharmacyStatistics?.totalValue || 0).toLocaleString()}`, color: STAT_COLORS[2] }
                        ].map((item, index) => (
                          <Grid item xs={6} key={index}>
                            <Box sx={{ 
                              p: 2, 
                              borderRadius: 2, 
                              bgcolor: alpha(item.color, 0.1),
                              textAlign: 'center',
                              height: '100%'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 0.5 }}>
                                {item.label}
                              </Typography>
                              <Typography variant="h5" sx={{ 
                                fontWeight: 900, 
                                color: item.color,
                                fontSize: '1.5rem'
                              }}>
                                {item.value}
                              </Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>

            {/* Laboratory & Prescription Statistics */}
            <Grid container spacing={3}>
              {/* Laboratory Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1700}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Science sx={{ fontSize: 28, color: STAT_COLORS[4], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          Laboratory Statistics
                        </Typography>
                      </Box>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 700, color: '#333' }}>Status</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#333' }} align="right">Count</TableCell>
                              <TableCell sx={{ fontWeight: 700, color: '#333' }} align="right">Percentage</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {reportData.data.laboratoryStatistics && reportData.data.laboratoryStatistics.length > 0 ? (
                              reportData.data.laboratoryStatistics.map((stat) => {
                                const total = calculateTotal(reportData.data.laboratoryStatistics);
                                const percentage = total > 0 ? ((stat.count / total) * 100).toFixed(1) : 0;
                                return (
                                  <TableRow key={stat._id} hover>
                                    <TableCell>
                                      <Chip 
                                        label={stat._id || 'Unknown'} 
                                        size="small" 
                                        sx={{
                                          bgcolor: 
                                            stat._id === 'Completed' ? alpha('#4caf50', 0.2) :
                                            stat._id === 'Pending' ? alpha('#ff9800', 0.2) :
                                            stat._id === 'Cancelled' ? alpha('#f44336', 0.2) : alpha('#9e9e9e', 0.2),
                                          color: 
                                            stat._id === 'Completed' ? '#2e7d32' :
                                            stat._id === 'Pending' ? '#e65100' :
                                            stat._id === 'Cancelled' ? '#c62828' : '#616161',
                                          fontWeight: 600
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>{stat.count}</TableCell>
                                    <TableCell align="right">
                                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                        <LinearProgress 
                                          variant="determinate" 
                                          value={percentage} 
                                          sx={{ 
                                            width: 60,
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: alpha('#e0e0e0', 0.5),
                                            '& .MuiLinearProgress-bar': {
                                              bgcolor: 
                                                stat._id === 'Completed' ? '#4caf50' :
                                                stat._id === 'Pending' ? '#ff9800' :
                                                stat._id === 'Cancelled' ? '#f44336' : '#9e9e9e',
                                              borderRadius: 4
                                            }
                                          }}
                                        />
                                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                                          {percentage}%
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  <Typography variant="body2" color="text.secondary">
                                    No laboratory data available
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>

              {/* Prescription Statistics */}
              <Grid item xs={12} md={6}>
                <Grow in timeout={1800}>
                  <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <LocalHospital sx={{ fontSize: 28, color: STAT_COLORS[5], mr: 2 }} />
                        <Typography variant="h5" sx={{ fontWeight: 800, color: '#333' }}>
                          Prescription Analytics
                        </Typography>
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Grid container spacing={3}>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              p: 3, 
                              borderRadius: 3,
                              background: alpha(STAT_COLORS[5], 0.1),
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                                Total Prescriptions
                              </Typography>
                              <Typography variant="h2" sx={{ 
                                fontWeight: 900, 
                                color: STAT_COLORS[5],
                                fontSize: '3rem'
                              }}>
                                {reportData.data.prescriptionStatistics?.totalPrescriptions || 0}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ 
                              p: 3, 
                              borderRadius: 3,
                              background: alpha(STAT_COLORS[2], 0.1),
                              textAlign: 'center'
                            }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#666', mb: 1 }}>
                                Total Medicines
                              </Typography>
                              <Typography variant="h2" sx={{ 
                                fontWeight: 900, 
                                color: STAT_COLORS[2],
                                fontSize: '3rem'
                              }}>
                                {reportData.data.prescriptionStatistics?.totalMedicines || 0}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        {reportData.data.prescriptionStatistics?.totalPrescriptions > 0 && (
                          <Box sx={{ 
                            mt: 3, 
                            p: 2, 
                            borderRadius: 2,
                            background: alpha('#667eea', 0.05),
                            borderLeft: `4px solid ${STAT_COLORS[0]}`
                          }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#333', mb: 0.5 }}>
                              Average Analysis
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666' }}>
                              Average medicines per prescription: <strong>{(
                                reportData.data.prescriptionStatistics.totalMedicines / 
                                reportData.data.prescriptionStatistics.totalPrescriptions
                              ).toFixed(1)}</strong>
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grow>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      ) : (
        !loading && (
          <Fade in timeout={900}>
            <Paper sx={{ 
              p: 6, 
              textAlign: 'center',
              borderRadius: 4,
              background: 'white',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
            }}>
              <Assessment sx={{ fontSize: 80, color: '#e0e0e0', mb: 3 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#666', mb: 2 }}>
                No Report Data Available
              </Typography>
              <Typography variant="body1" sx={{ color: '#999', mb: 4 }}>
                Configure your report parameters and click "Generate Report" to create a new system report
              </Typography>
              <Button
                variant="contained"
                startIcon={<Assessment />}
                onClick={handleGenerateReport}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Generate Your First Report
              </Button>
            </Paper>
          </Fade>
        )
      )}
    </Box>
  );
};

export default Reports;