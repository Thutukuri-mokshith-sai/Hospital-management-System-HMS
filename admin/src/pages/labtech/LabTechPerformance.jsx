import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button
} from '@mui/material';
import {
  TrendingUp,
  Speed,
  Assessment,
  Timeline,
  BarChart,
  PieChart,
  CalendarToday,
  Download,
  Refresh,
  Star,
  EmojiEvents,
  Timeline as TimelineIcon,
  AccessTime,
  Science,
  LocalHospital,
  TaskAlt,
  Error as ErrorIcon,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import axios from 'axios';
import { format, subDays, subMonths, parseISO } from 'date-fns';
import { BASE_URL } from '../../api/api';

const LabTechPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [activeTab, setActiveTab] = useState(0);

  const api = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/labtech/performance');
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      setError('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  // Process data for charts based on backend response
  const getMonthlyTrendData = () => {
    if (!performanceData?.recentTests) return [];
    
    // Group by month
    const monthlyData = {};
    performanceData.recentTests.forEach(test => {
      if (test.completedAt) {
        const month = format(parseISO(test.completedAt), 'MMM yyyy');
        if (!monthlyData[month]) {
          monthlyData[month] = { month, tests: 0, totalTime: 0 };
        }
        monthlyData[month].tests += 1;
        
        // Parse completion time from string like "2.50 hours"
        const timeMatch = test.completionTime?.match(/([\d.]+)\s*hours?/);
        if (timeMatch) {
          monthlyData[month].totalTime += parseFloat(timeMatch[1]);
        }
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .map(item => ({
        month: item.month,
        tests: item.tests,
        avgTime: item.tests > 0 ? (item.totalTime / item.tests).toFixed(2) : 0
      }));
  };

  const getPriorityChartData = () => {
    if (!performanceData?.recentPerformance?.priorityStats) return [];
    
    return Object.entries(performanceData.recentPerformance.priorityStats).map(([name, value]) => ({
      name,
      value
    }));
  };

  const getTestTypeData = () => {
    if (!performanceData?.recentPerformance?.departmentStats) return [];
    
    return performanceData.recentPerformance.departmentStats.map(stat => ({
      name: stat.testName,
      value: stat.count,
      avgTime: stat.avgCompletionTime
    }));
  };

  const getDailyCompletionChart = () => {
    if (!performanceData?.recentTests) return [];
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return format(date, 'MMM dd');
    }).reverse();

    return last7Days.map(day => {
      const dayTests = performanceData.recentTests.filter(test => {
        if (!test.completedAt) return false;
        return format(parseISO(test.completedAt), 'MMM dd') === day;
      });

      const totalTime = dayTests.reduce((sum, test) => {
        const timeMatch = test.completionTime?.match(/([\d.]+)\s*hours?/);
        return sum + (timeMatch ? parseFloat(timeMatch[1]) : 0);
      }, 0);

      return {
        day,
        tests: dayTests.length,
        avgTime: dayTests.length > 0 ? (totalTime / dayTests.length).toFixed(2) : 0
      };
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const PRIORITY_COLORS = {
    'Critical': '#f44336',
    'High': '#ff9800',
    'Medium': '#2196f3',
    'Low': '#4caf50'
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 95) return 'success';
    if (accuracy >= 85) return 'warning';
    return 'error';
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr === 'N/A') return 'N/A';
    const match = timeStr.match(/([\d.]+)\s*hours?/);
    if (match) {
      const hours = parseFloat(match[1]);
      if (hours >= 1) {
        return `${hours.toFixed(1)}h`;
      } else {
        const minutes = Math.round(hours * 60);
        return `${minutes}m`;
      }
    }
    return timeStr;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchPerformanceData}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            <Assessment sx={{ verticalAlign: 'middle', mr: 1 }} />
            Performance Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track your laboratory performance metrics and statistics
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl sx={{ minWidth: 150 }} size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="90days">Last 90 Days</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchPerformanceData}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Report">
            <IconButton>
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Performance Metrics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2, color: 'primary.main' }}>
                  <Science />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Tests Conducted
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {performanceData?.basicStats?.testsConducted || 0}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp color="success" sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="caption" color="success.main">
                  {performanceData?.recentPerformance?.testsLast30Days || 0} in last 30 days
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ 
                  bgcolor: `${getAccuracyColor(performanceData?.basicStats?.accuracyRate)}.light`, 
                  mr: 2,
                  color: `${getAccuracyColor(performanceData?.basicStats?.accuracyRate)}.main`
                }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Accuracy Rate
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {performanceData?.basicStats?.accuracyRate || 0}%
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={performanceData?.basicStats?.accuracyRate || 0}
                sx={{ 
                  height: 6, 
                  borderRadius: 3,
                  mt: 1.5,
                  backgroundColor: `${getAccuracyColor(performanceData?.basicStats?.accuracyRate)}.light`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: `${getAccuracyColor(performanceData?.basicStats?.accuracyRate)}.main`
                  }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'info.light', mr: 2, color: 'info.main' }}>
                  <Speed />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Avg. Completion Time
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {formatTime(performanceData?.recentPerformance?.averageCompletionTime) || 'N/A'}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                <AccessTime color="info" sx={{ mr: 1, fontSize: 16 }} />
                <Typography variant="caption" color="info.main">
                  Based on recent tests
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ bgcolor: 'warning.light', mr: 2, color: 'warning.main' }}>
                  <EmojiEvents />
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Experience & Certifications
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {performanceData?.basicStats?.experience || 0}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      yrs
                    </Typography>
                  </Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {performanceData?.basicStats?.certifiedTests || 0} certified tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            px: 2,
            pt: 2
          }}
        >
          <Tab icon={<TimelineIcon />} label="Trends" />
          <Tab icon={<BarChart />} label="Distribution" />
          <Tab icon={<PieChart />} label="Breakdown" />
          <Tab icon={<Assessment />} label="Recent Tests" />
        </Tabs>

        {/* Tab Content */}
        <Box p={3}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Monthly Performance Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={getMonthlyTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          if (name === 'tests') return [value, 'Tests'];
                          if (name === 'avgTime') return [`${value} hours`, 'Avg Time'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="tests" 
                        stroke="#8884d8" 
                        strokeWidth={2}
                        activeDot={{ r: 6 }}
                        name="Tests Conducted"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="avgTime" 
                        stroke="#82ca9d"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Avg Time (hours)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Daily Completion Rate
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getDailyCompletionChart()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          if (name === 'tests') return [value, 'Tests'];
                          if (name === 'avgTime') return [`${value} hours`, 'Avg Time'];
                          return [value, name];
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tests" 
                        stroke="#8884d8" 
                        fill="#8884d8"
                        fillOpacity={0.3}
                        name="Tests Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Tests by Priority
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={getPriorityChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Number of Tests" radius={[4, 4, 0, 0]}>
                        {getPriorityChartData().map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PRIORITY_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Test Completion Times
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsBarChart data={getTestTypeData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <RechartsTooltip 
                        formatter={(value, name) => {
                          if (name === 'value') return [value, 'Count'];
                          if (name === 'avgTime') return [value, 'Avg Time'];
                          return [value, name];
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#82ca9d" 
                        name="Test Count"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Test Type Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsPieChart>
                      <Pie
                        data={getTestTypeData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        innerRadius={40}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {getTestTypeData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value, name, props) => {
                          if (name === 'value') return [value, 'Count'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom mb={3}>
                    Priority Breakdown
                  </Typography>
                  <Box mt={3}>
                    {getPriorityChartData().map((item, index) => (
                      <Box key={item.name} mb={2.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Box display="flex" alignItems="center">
                            <Box 
                              sx={{ 
                                width: 12, 
                                height: 12, 
                                borderRadius: '50%', 
                                bgcolor: PRIORITY_COLORS[item.name] || COLORS[index % COLORS.length],
                                mr: 1.5 
                              }} 
                            />
                            <Typography variant="body2" fontWeight="medium">
                              {item.name}
                            </Typography>
                          </Box>
                          <Typography variant="body2" fontWeight="bold">
                            {item.value}
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(item.value / Math.max(...getPriorityChartData().map(d => d.value))) * 100}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: 'grey.100',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: PRIORITY_COLORS[item.name] || COLORS[index % COLORS.length],
                              borderRadius: 4
                            }
                          }}
                        />
                      </Box>
                    ))}
                  </Box>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                    Top Performing Tests
                  </Typography>
                  {getTestTypeData()
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5)
                    .map((test, index) => (
                      <Box key={test.name} display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                        <Typography variant="body2" color="text.secondary">
                          {test.name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Chip 
                            label={`${test.value} tests`} 
                            size="small" 
                            variant="outlined"
                          />
                          {test.avgTime && test.avgTime !== 'N/A' && (
                            <Typography variant="caption" color="text.secondary">
                              {test.avgTime}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ))}
                </Paper>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Paper sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" gutterBottom>
                  Recent Test Performance
                </Typography>
                <Chip 
                  label={`${performanceData?.recentTests?.length || 0} tests`} 
                  color="primary" 
                  size="small" 
                />
              </Box>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Name</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Completion Time</TableCell>
                      <TableCell>Date Completed</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performanceData?.recentTests?.map((test, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Science sx={{ mr: 1.5, color: 'primary.main', fontSize: 18 }} />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {test.testName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {test.testId?.substring(0, 8)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={test.priority} 
                            size="small"
                            icon={
                              test.priority === 'Critical' ? <ErrorIcon /> :
                              test.priority === 'High' ? <Warning /> :
                              test.priority === 'Medium' ? <AccessTime /> :
                              <CheckCircle />
                            }
                            color={
                              test.priority === 'Critical' ? 'error' :
                              test.priority === 'High' ? 'warning' :
                              'default'
                            }
                            variant="outlined"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <AccessTime sx={{ mr: 1, color: 'info.main', fontSize: 16 }} />
                            <Typography variant="body2">
                              {formatTime(test.completionTime)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {test.completedAt ? (
                            <Box>
                              <Typography variant="body2">
                                {format(parseISO(test.completedAt), 'MMM d, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {format(parseISO(test.completedAt), 'h:mm a')}
                              </Typography>
                            </Box>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label="Completed" 
                            size="small"
                            color="success"
                            icon={<TaskAlt />}
                            variant="filled"
                            sx={{ fontWeight: 'medium' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {(!performanceData?.recentTests || performanceData.recentTests.length === 0) && (
                <Box textAlign="center" py={6}>
                  <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No recent test data
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete tests to see performance metrics
                  </Typography>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      </Paper>

      {/* Summary Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom mb={3}>
              Performance Insights
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Fastest Test Type
                  </Typography>
                  {getTestTypeData().length > 0 ? (
                    <>
                      <Typography variant="h6" fontWeight="bold">
                        {getTestTypeData().reduce((prev, current) => 
                          (parseFloat(prev.avgTime?.replace(' hours', '') || Infinity) < 
                           parseFloat(current.avgTime?.replace(' hours', '') || Infinity)) ? prev : current
                        ).name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Quickest turnaround
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                    Most Frequent Test
                  </Typography>
                  {getTestTypeData().length > 0 ? (
                    <>
                      <Typography variant="h6" fontWeight="bold">
                        {getTestTypeData().reduce((prev, current) => 
                          prev.value > current.value ? prev : current
                        ).name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Highest volume
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No data available
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom mb={3}>
              Quick Stats
            </Typography>
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Critical Tests Handled
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {getPriorityChartData().find(p => p.name === 'Critical')?.value || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Tests This Month
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {performanceData?.recentPerformance?.testsLast30Days || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Test Types
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {getTestTypeData().length}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Total Hours Logged
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {getTestTypeData().reduce((sum, test) => {
                    const timeMatch = test.avgTime?.match(/([\d.]+)\s*hours?/);
                    return sum + (timeMatch ? parseFloat(timeMatch[1]) * test.value : 0);
                  }, 0).toFixed(1)}h
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LabTechPerformance;