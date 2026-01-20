import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  useTheme,
  Chip,
  Avatar,
  Fade,
  Grow,
  Button,
  alpha
} from '@mui/material';
import {
  People,
  LocalHospital,
  MedicalServices,
  CalendarToday,
  Science,
  Receipt,
  Refresh,
  Medication,
  Healing,
  TrendingUp,
  ArrowUpward,
  ArrowDownward,
  Add,
  Dashboard,
  Assessment
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  
} from 'recharts';
import axios from 'axios';
import { BASE_URL } from '../../api/api';
// Color palettes
const GRADIENT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)'
];

const STAT_COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];


const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState('');

  // Set up axios interceptor for token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Direct API call to fetch dashboard stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${BASE_URL}/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch dashboard data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.overview?.totalUsers || 0,
      icon: <People sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[0],
      description: 'All registered users',
      trend: '+12%',
      color: STAT_COLORS[0]
    },
    {
      title: 'Patients',
      value: stats?.overview?.totalPatients || 0,
      icon: <LocalHospital sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[1],
      description: 'Registered patients',
      trend: '+8%',
      color: STAT_COLORS[1]
    },
    {
      title: 'Doctors',
      value: stats?.overview?.totalDoctors || 0,
      icon: <MedicalServices sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[2],
      description: 'Active doctors',
      trend: '+5%',
      color: STAT_COLORS[2]
    },
    {
      title: 'Nurses',
      value: stats?.overview?.totalNurses || 0,
      icon: <Healing sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[3],
      description: 'Active nurses',
      trend: '+3%',
      color: STAT_COLORS[3]
    },
    {
      title: 'Active Appointments',
      value: stats?.overview?.activeAppointments || 0,
      icon: <CalendarToday sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[4],
      description: 'Scheduled appointments',
      trend: '+15%',
      color: STAT_COLORS[4]
    },
    {
      title: 'Total Revenue',
      value: `$${(stats?.overview?.totalRevenue || 0).toLocaleString()}`,
      icon: <Receipt sx={{ fontSize: 30 }} />,
      gradient: GRADIENT_COLORS[5],
      description: 'Total earnings',
      trend: '+18%',
      color: STAT_COLORS[5]
    }
  ];

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
          Loading Dashboard
        </Typography>
        <Typography variant="body1" sx={{ 
          color: 'rgba(255,255,255,0.8)', 
          animation: 'fadeIn 2.5s ease-in-out'
        }}>
          Fetching real-time analytics...
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
                Dashboard Overview
              </Typography>
              <Typography variant="h6" sx={{ 
                color: 'rgba(255,255,255,0.9)',
                fontWeight: 500,
                fontSize: { xs: '0.9rem', md: '1.1rem' }
              }}>
                Welcome back! Here's what's happening with your hospital today.
              </Typography>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <Chip 
                icon={<Refresh sx={{ fontSize: 16 }} />}
                label="Live"
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
              <IconButton 
                onClick={fetchStats} 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: 'white',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.35)',
                    transform: 'rotate(180deg)',
                    transition: 'transform 0.5s ease'
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Box>
          </Box>
          
          {/* Quick Stats */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {[
              { label: 'Hospital Status', value: 'Active', color: '#43e97b' },
              { label: 'Server Load', value: '24%', color: '#4facfe' },
              { label: 'Uptime', value: '99.9%', color: '#fa709a' },
              { label: 'Last Backup', value: 'Today 02:00', color: '#30cfd0' }
            ].map((item, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ 
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Typography variant="caption" sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 500,
                    display: 'block',
                    mb: 0.5
                  }}>
                    {item.label}
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    color: 'white',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Box sx={{ 
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: item.color
                    }} />
                    {item.value}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
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

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Grow in timeout={300 + index * 100}>
              <Card 
                sx={{ 
                  height: '100%',
                  borderRadius: 4,
                  background: card.gradient,
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 8px 32px ${alpha(card.color, 0.3)}`,
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: `0 16px 48px ${alpha(card.color, 0.4)}`,
                    '& .stats-content': {
                      transform: 'translateY(-5px)'
                    }
                  }
                }}
              >
                <CardContent 
                  className="stats-content"
                  sx={{ 
                    p: 3,
                    position: 'relative',
                    zIndex: 1,
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    mb: 3 
                  }}>
                    <Avatar
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.25)',
                        width: 60,
                        height: 60,
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {card.icon}
                    </Avatar>
                    <Chip 
                      icon={card.trend.startsWith('+') ? 
                        <ArrowUpward sx={{ fontSize: 14 }} /> : 
                        <ArrowDownward sx={{ fontSize: 14 }} />
                      }
                      label={card.trend}
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(255,255,255,0.25)',
                        color: 'white',
                        fontWeight: 800,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    />
                  </Box>
                  
                  <Typography variant="h2" fontWeight="900" sx={{ 
                    mb: 1,
                    fontSize: { xs: '2.5rem', md: '2.75rem' },
                    lineHeight: 1
                  }}>
                    {card.value}
                  </Typography>
                  
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600,
                    mb: 1,
                    fontSize: '1.1rem'
                  }}>
                    {card.title}
                  </Typography>
                  
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    fontSize: '0.875rem',
                    lineHeight: 1.4
                  }}>
                    {card.description}
                  </Typography>
                </CardContent>
                
                {/* Background pattern */}
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }} />
              </Card>
            </Grow>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* User Role Distribution */}
        <Grid item xs={12} md={6}>
          <Grow in timeout={800}>
            <Paper 
              sx={{ 
                p: 4, 
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                background: 'white',
                height: 500,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 4 
              }}>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 800,
                    color: '#333',
                    mb: 1
                  }}>
                    User Role Distribution
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    Breakdown of users by their roles
                  </Typography>
                </Box>
                <Button
                  startIcon={<Dashboard />}
                  sx={{
                    bgcolor: '#667eea',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      bgcolor: '#5a6fd8',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                >
                  View Details
                </Button>
              </Box>
              
              {stats?.trends?.roleDistribution && stats.trends.roleDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {STAT_COLORS.map((color, index) => (
                        <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
                          <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={stats.trends.roleDistribution.map(item => ({
                        name: item._id,
                        value: item.count
                      }))}
                      cx="50%"
                      cy="45%"
                      labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      innerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      animationDuration={1200}
                      animationBegin={300}
                    >
                      {stats.trends.roleDistribution.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#colorGradient${index % STAT_COLORS.length})`}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} users`, name]}
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        background: 'white',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Assessment sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No data available
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grow>
        </Grid>

        {/* Appointment Status */}
        <Grid item xs={12} md={6}>
          <Grow in timeout={1000}>
            <Paper 
              sx={{ 
                p: 4, 
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                background: 'white',
                height: 500,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 4 
              }}>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 800,
                    color: '#333',
                    mb: 1
                  }}>
                    Appointment Status
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    Current appointment distribution by status
                  </Typography>
                </Box>
                <Button
                  startIcon={<CalendarToday />}
                  sx={{
                    bgcolor: '#f77062',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': {
                      bgcolor: '#e86556',
                      boxShadow: '0 4px 12px rgba(247, 112, 98, 0.3)'
                    }
                  }}
                >
                  Manage
                </Button>
              </Box>
              
              {stats?.trends?.appointmentStats && stats.trends.appointmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.trends.appointmentStats.map(item => ({
                      name: item._id,
                      count: item.count
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#667eea" stopOpacity={0.9}/>
                        <stop offset="100%" stopColor="#764ba2" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontWeight: 500, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontWeight: 500, fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} appointments`, 'Count']}
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        background: 'white',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#barGradient)" 
                      radius={[8, 8, 0, 0]}
                      animationDuration={1500}
                      animationBegin={300}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <CalendarToday sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No appointment data
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grow>
        </Grid>

        {/* Patient Registration Trend */}
        <Grid item xs={12}>
          <Grow in timeout={1200}>
            <Paper 
              sx={{ 
                p: 4, 
                borderRadius: 4,
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                background: 'white',
                height: 500,
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 4 
              }}>
                <Box>
                  <Typography variant="h5" sx={{ 
                    fontWeight: 800,
                    color: '#333',
                    mb: 1
                  }}>
                    Patient Registration Trend
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    Last 7 days patient registration analytics
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip 
                    label="7 Days"
                    sx={{ 
                      bgcolor: '#43e97b',
                      color: 'white',
                      fontWeight: 600
                    }}
                  />
                  <Chip 
                    label="30 Days"
                    variant="outlined"
                    sx={{ 
                      borderColor: '#43e97b',
                      color: '#43e97b',
                      fontWeight: 500
                    }}
                  />
                </Box>
              </Box>
              
              {stats?.trends?.patientRegistrations && stats.trends.patientRegistrations.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={stats.trends.patientRegistrations}
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#43e97b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#38f9d7" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="_id" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontWeight: 500, fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#666', fontWeight: 500, fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} patients`, 'Registrations']}
                      contentStyle={{ 
                        borderRadius: 12, 
                        border: 'none',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                        background: 'white',
                        padding: '12px 16px'
                      }}
                      labelStyle={{ fontWeight: 600 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#43e97b" 
                      strokeWidth={4}
                      fill="url(#areaGradient)"
                      fillOpacity={1}
                      dot={{ 
                        stroke: '#43e97b', 
                        strokeWidth: 2, 
                        fill: 'white',
                        r: 5 
                      }}
                      activeDot={{ 
                        r: 8, 
                        stroke: '#43e97b',
                        strokeWidth: 2,
                        fill: 'white'
                      }}
                      animationDuration={2000}
                      animationBegin={300}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <TrendingUp sx={{ fontSize: 80, color: '#e0e0e0', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No trend data available
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grow>
        </Grid>
      </Grid>

      {/* Alerts Section */}
      {(stats?.alerts?.lowStock || stats?.alerts?.pendingTests || stats?.alerts?.activeAppointments) && (
        <Grow in timeout={1400}>
          <Paper 
            sx={{ 
              p: 4, 
              borderRadius: 4,
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              color: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              mb: 4
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 4 
            }}>
              <Box>
                <Typography variant="h5" sx={{ 
                  fontWeight: 800,
                  color: 'white',
                  mb: 1
                }}>
                  System Alerts
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontWeight: 500
                }}>
                  Important notifications requiring your attention
                </Typography>
              </Box>
              <Button
                startIcon={<Add />}
                sx={{
                  bgcolor: '#667eea',
                  color: 'white',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 3,
                  '&:hover': {
                    bgcolor: '#5a6fd8',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                Add Alert
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {[
                {
                  condition: stats.alerts.lowStock,
                  title: 'Low Stock Alert',
                  description: stats.alerts.lowStock,
                  icon: <Medication sx={{ fontSize: 32 }} />,
                  color: '#ff9800',
                  action: 'Restock Now'
                },
                {
                  condition: stats.alerts.pendingTests,
                  title: 'Lab Tests Pending',
                  description: stats.alerts.pendingTests,
                  icon: <Science sx={{ fontSize: 32 }} />,
                  color: '#2196f3',
                  action: 'Review Tests'
                },
                {
                  condition: stats.alerts.activeAppointments,
                  title: 'Active Appointments',
                  description: stats.alerts.activeAppointments,
                  icon: <CalendarToday sx={{ fontSize: 32 }} />,
                  color: '#4caf50',
                  action: 'View Schedule'
                }
              ].filter(alert => alert.condition).map((alert, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Box sx={{ 
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'rgba(255,255,255,0.08)',
                    borderLeft: `4px solid ${alert.color}`,
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.12)',
                      transform: 'translateX(8px)'
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ 
                        p: 1.5,
                        mr: 2,
                        borderRadius: 2,
                        bgcolor: alpha(alert.color, 0.2),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {alert.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {alert.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ 
                      mb: 3,
                      color: 'rgba(255,255,255,0.9)',
                      lineHeight: 1.6
                    }}>
                      {alert.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Chip 
                        label="Priority"
                        size="small"
                        sx={{ 
                          bgcolor: alpha(alert.color, 0.2),
                          color: alert.color,
                          fontWeight: 600
                        }}
                      />
                      <Button
                        size="small"
                        sx={{
                          color: alert.color,
                          fontWeight: 600,
                          '&:hover': {
                            bgcolor: alpha(alert.color, 0.1)
                          }
                        }}
                      >
                        {alert.action}
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grow>
      )}

      {/* Quick Stats Footer */}
      <Fade in timeout={1600}>
        <Paper 
          sx={{ 
            p: 3, 
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
          }}
        >
          <Grid container spacing={3}>
            {[
              { label: 'System Uptime', value: '99.9%', color: '#667eea' },
              { label: 'Response Time', value: '120ms', color: '#43e97b' },
              { label: 'Data Accuracy', value: '99.8%', color: '#f77062' },
              { label: 'User Satisfaction', value: '4.8/5', color: '#764ba2' }
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ 
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${stat.color} 0%, ${alpha(stat.color, 0.7)} 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2
                  }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ 
                    color: '#666',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Fade>

      {/* Add CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Box>
  );
};

export default AdminDashboard;