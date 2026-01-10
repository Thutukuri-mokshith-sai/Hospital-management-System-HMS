import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  Stack,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  Bed,
  LocalHospital,
  Layers,
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Add,
  Search,
  BarChart
} from '@mui/icons-material';

import { BASE_URL } from '../../api/api';
const defaultWard = {
  wardNumber: '',
  name: '',
  floor: 1,
  bedCount: 10,
  specialty: 'General',
  isAvailable: true
};

const Wards = () => {
  const [wards, setWards] = useState([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentWard, setCurrentWard] = useState(defaultWard);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');

  // Calculate insights from ward data
  const insights = React.useMemo(() => {
    const totalWards = wards.length;
    const activeWards = wards.filter(w => w.isAvailable).length;
    const totalBeds = wards.reduce((sum, w) => sum + (w.bedCount || 0), 0);
    const avgBedsPerWard = totalWards > 0 ? (totalBeds / totalWards).toFixed(1) : 0;
    
    // Specialty distribution
    const specialtyCount = {};
    wards.forEach(w => {
      specialtyCount[w.specialty] = (specialtyCount[w.specialty] || 0) + 1;
    });
    
    // Floor distribution
    const floorCount = {};
    wards.forEach(w => {
      floorCount[w.floor] = (floorCount[w.floor] || 0) + 1;
    });
    
    const occupancyRate = totalWards > 0 ? ((activeWards / totalWards) * 100).toFixed(1) : 0;
    
    return {
      totalWards,
      activeWards,
      inactiveWards: totalWards - activeWards,
      totalBeds,
      avgBedsPerWard,
      specialtyCount,
      floorCount,
      occupancyRate,
      mostCommonSpecialty: Object.keys(specialtyCount).reduce((a, b) => 
        specialtyCount[a] > specialtyCount[b] ? a : b, 'N/A'
      )
    };
  }, [wards]);

  /* ================= FETCH WARDS ================= */
  const fetchWards = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const res = await fetch(`${BASE_URL}/wards?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch wards');

      const data = await res.json();
      setWards(data.data || []);
    } catch (error) {
      console.error(error);
      setWards([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchWards();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [search]);

  /* ================= DIALOG ================= */
  const openDialog = (ward = null) => {
    if (ward) {
      setCurrentWard(ward);
      setEditing(true);
    } else {
      setCurrentWard(defaultWard);
      setEditing(false);
    }
    setOpen(true);
  };

  /* ================= SAVE ================= */
  const saveWard = async () => {
    try {
      const url = editing
        ? `${BASE_URL}/wards/${currentWard._id}`
        : `${BASE_URL}/wards`;

      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentWard)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to save ward');
      }

      setOpen(false);
      fetchWards();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ================= DELETE ================= */
  const deleteWard = async (id) => {
    if (!window.confirm('Delete this ward?')) return;

    try {
      const res = await fetch(`${BASE_URL}/wards/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to delete ward');
      }
      fetchWards();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ================= TOGGLE STATUS ================= */
  const toggleStatus = async (ward) => {
    try {
      const res = await fetch(`${BASE_URL}/wards/${ward._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAvailable: !ward.isAvailable })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update status');
      }

      fetchWards();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  const getSpecialtyColor = (specialty) => {
    const colors = {
      'General': '#3b82f6',
      'ICU': '#ef4444',
      'Emergency': '#f59e0b',
      'Pediatric': '#10b981',
      'Maternity': '#ec4899',
      'Surgery': '#8b5cf6',
      'Cardiology': '#ef4444',
      'Neurology': '#6366f1'
    };
    return colors[specialty] || '#6b7280';
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1
          }}
        >
          Ward Management System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor and manage hospital wards efficiently
        </Typography>
      </Box>

      {/* Insights Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Wards
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalWards}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 16 }} />
                    <Typography variant="caption">Active: {insights.activeWards}</Typography>
                  </Box>
                </Box>
                <LocalHospital sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Total Beds
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.totalBeds}
                  </Typography>
                  <Typography variant="caption">
                    Avg: {insights.avgBedsPerWard} per ward
                  </Typography>
                </Box>
                <Bed sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Availability Rate
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.occupancyRate}%
                  </Typography>
                  <Typography variant="caption">
                    {insights.inactiveWards} inactive
                  </Typography>
                </Box>
                <BarChart sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={insights.occupancyRate} 
                sx={{ 
                  mt: 2, 
                  height: 6, 
                  borderRadius: 3,
                  bgcolor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { bgcolor: 'white' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                    Top Specialty
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    {insights.mostCommonSpecialty}
                  </Typography>
                  <Typography variant="caption">
                    {insights.specialtyCount[insights.mostCommonSpecialty] || 0} wards
                  </Typography>
                </Box>
                <Layers sx={{ fontSize: 48, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Specialty Distribution */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Specialty Distribution
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(insights.specialtyCount).map(([specialty, count]) => (
            <Grid item xs={12} sm={6} md={4} key={specialty}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: getSpecialtyColor(specialty)
                  }}
                />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {specialty}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(count / insights.totalWards) * 100}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      mt: 0.5,
                      bgcolor: alpha(getSpecialtyColor(specialty), 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: getSpecialtyColor(specialty)
                      }
                    }}
                  />
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {count}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Search + Add */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search wards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ 
            flex: 1,
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2
            }
          }}
        />
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={() => openDialog()}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
            }
          }}
        >
          Add Ward
        </Button>
      </Stack>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 600 }}>Ward Details</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Floor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Specialty</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {wards.map((ward) => (
              <TableRow 
                key={ward._id}
                sx={{ 
                  '&:hover': { bgcolor: '#f8fafc' },
                  transition: 'background-color 0.2s'
                }}
              >
                <TableCell>
                  <Box>
                    <Typography fontWeight={600} sx={{ mb: 0.5 }}>
                      {ward.name}
                    </Typography>
                    <Chip 
                      label={ward.wardNumber} 
                      size="small" 
                      sx={{ 
                        height: 20,
                        fontSize: '0.7rem',
                        bgcolor: alpha('#667eea', 0.1),
                        color: '#667eea'
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={`Floor ${ward.floor}`}
                    size="small"
                    sx={{ bgcolor: alpha('#3b82f6', 0.1), color: '#3b82f6' }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Bed sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography fontWeight={600}>{ward.bedCount}</Typography>
                    <Typography variant="caption" color="text.secondary">beds</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={ward.specialty}
                    size="small"
                    sx={{
                      bgcolor: alpha(getSpecialtyColor(ward.specialty), 0.1),
                      color: getSpecialtyColor(ward.specialty),
                      fontWeight: 500
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Switch
                      checked={ward.isAvailable}
                      onChange={() => toggleStatus(ward)}
                      size="small"
                    />
                    {ward.isAvailable ? (
                      <Chip 
                        icon={<CheckCircle />}
                        label="Active" 
                        size="small" 
                        color="success"
                        sx={{ height: 24 }}
                      />
                    ) : (
                      <Chip 
                        icon={<Cancel />}
                        label="Inactive" 
                        size="small" 
                        color="error"
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title="Edit Ward">
                      <IconButton 
                        size="small" 
                        onClick={() => openDialog(ward)}
                        sx={{ color: '#667eea' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Ward">
                      <IconButton
                        size="small"
                        onClick={() => deleteWard(ward._id)}
                        sx={{ color: '#ef4444' }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}

            {wards.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <LocalHospital sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No wards found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {search ? 'Try adjusting your search' : 'Add your first ward to get started'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
          {editing ? 'Edit Ward' : 'Add New Ward'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 2 }}>
            <TextField
              label="Ward Number"
              value={currentWard.wardNumber}
              onChange={(e) =>
                setCurrentWard({ ...currentWard, wardNumber: e.target.value })
              }
              fullWidth
              placeholder="e.g., W-101"
            />
            <TextField
              label="Ward Name"
              value={currentWard.name}
              onChange={(e) =>
                setCurrentWard({ ...currentWard, name: e.target.value })
              }
              fullWidth
              placeholder="e.g., North Wing ICU"
            />
            <TextField
              label="Floor"
              type="number"
              value={currentWard.floor}
              onChange={(e) =>
                setCurrentWard({ ...currentWard, floor: Number(e.target.value) })
              }
              fullWidth
              inputProps={{ min: 1, max: 20 }}
            />
            <TextField
              label="Bed Count"
              type="number"
              value={currentWard.bedCount}
              onChange={(e) =>
                setCurrentWard({
                  ...currentWard,
                  bedCount: Number(e.target.value)
                })
              }
              fullWidth
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              label="Specialty"
              value={currentWard.specialty}
              onChange={(e) =>
                setCurrentWard({ ...currentWard, specialty: e.target.value })
              }
              fullWidth
              placeholder="e.g., General, ICU, Emergency"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveWard}
            sx={{
              textTransform: 'none',
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)'
              }
            }}
          >
            {editing ? 'Update Ward' : 'Create Ward'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wards;