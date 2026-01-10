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
  Stack,
  IconButton,
  Chip,
  Tooltip,
  LinearProgress,
  MenuItem,
  Switch,
  Avatar,
  Badge,
  Fade,
  Zoom,
  TablePagination,
  InputAdornment,
  Card,
  Grid,
  Divider
} from '@mui/material';

import {
  Add,
  Edit,
  Delete,
  Search,
  CheckCircle,
  Cancel,
  Person,
  LocalHospital,
  Vaccines,
  Science,
  Medication,
  AdminPanelSettings,
  FilterList,
  Email,
  Phone as PhoneIcon,
  CalendarToday
} from '@mui/icons-material';

import { BASE_URL } from '../../api/api';

const ROLES = [
  'ADMIN',
  'DOCTOR',
  'PATIENT',
  'NURSE',
  'PHARMACIST',
  'LAB_TECH'
];

const defaultUser = {
  name: '',
  email: '',
  password: '',
  role: 'PATIENT',
  phone: '',
  isActive: true
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [selectedId, setSelectedId] = useState(null);

  const token = localStorage.getItem('token');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role) params.append('role', role);

      const res = await fetch(
        `${BASE_URL}/admin/users?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (!res.ok) throw new Error('Failed to fetch users');

      const result = await res.json();
      setUsers(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchUsers, 300);
    return () => clearTimeout(t);
  }, [search, role]);

  const openDialog = (user = null) => {
    if (user) {
      setEditing(true);
      setSelectedId(user._id);
      setCurrentUser({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        isActive: user.isActive
      });
    } else {
      setEditing(false);
      setCurrentUser(defaultUser);
    }
    setOpen(true);
  };

  const saveUser = async () => {
    try {
      const url = editing
        ? `${BASE_URL}/admin/users/${selectedId}`
        : `${BASE_URL}/admin/users`;

      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(currentUser)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Operation failed');
      }

      setOpen(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const toggleStatus = async (user) => {
    try {
      const res = await fetch(
        `${BASE_URL}/admin/users/${user._id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isActive: !user.isActive })
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;

    try {
      const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }

      fetchUsers();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const getRoleIcon = (role) => {
    const icons = {
      ADMIN: <AdminPanelSettings />,
      DOCTOR: <LocalHospital />,
      NURSE: <Vaccines />,
      PATIENT: <Person />,
      PHARMACIST: <Medication />,
      LAB_TECH: <Science />
    };
    return icons[role] || <Person />;
  };

  const roleColor = (role) => {
    const map = {
      ADMIN: 'error',
      DOCTOR: 'primary',
      NURSE: 'info',
      PATIENT: 'success',
      PHARMACIST: 'warning',
      LAB_TECH: 'secondary'
    };
    return map[role] || 'default';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    doctors: users.filter(u => u.role === 'DOCTOR').length,
    patients: users.filter(u => u.role === 'PATIENT').length
  };

  return (
    <Box sx={{ 
      p: 4, 
      bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      {/* Header */}
      <Fade in timeout={800}>
        <Box mb={4}>
          <Typography 
            variant="h3" 
            fontWeight={800} 
            mb={1}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary" fontWeight={500}>
            Manage system users, roles, and permissions
          </Typography>
        </Box>
      </Fade>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          { label: 'Total Users', value: stats.total, color: '#667eea', icon: <Person /> },
          { label: 'Active Users', value: stats.active, color: '#10b981', icon: <CheckCircle /> },
          { label: 'Doctors', value: stats.doctors, color: '#3b82f6', icon: <LocalHospital /> },
          { label: 'Patients', value: stats.patients, color: '#8b5cf6', icon: <Person /> }
        ].map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Zoom in timeout={300 + idx * 100}>
              <Card 
                sx={{ 
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
                  border: `1px solid ${stat.color}30`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 24px ${stat.color}30`
                  }
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {stat.label}
                    </Typography>
                    <Typography variant="h4" fontWeight={800} color={stat.color}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar 
                    sx={{ 
                      bgcolor: stat.color, 
                      width: 56, 
                      height: 56,
                      boxShadow: `0 4px 12px ${stat.color}40`
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Stack>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 3,
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="medium"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              flex: 1, 
              minWidth: 300,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }
            }}
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main' }} />
                </InputAdornment>
              )
            }}
          />
          <TextField
            size="medium"
            select
            label="Filter by Role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={{ 
              minWidth: 180,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#f8fafc'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterList />
                </InputAdornment>
              )
            }}
          >
            <MenuItem value="">All Roles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r} value={r}>
                <Stack direction="row" spacing={1} alignItems="center">
                  {getRoleIcon(r)}
                  <span>{r}</span>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="contained"
            size="large"
            startIcon={<Add />}
            onClick={() => openDialog()}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.5)'
              }
            }}
          >
            Add New User
          </Button>
        </Stack>
      </Paper>

      {/* Table */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}
      >
        {loading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Joined</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, idx) => (
              <Fade in timeout={300 + idx * 50} key={user._id}>
                <TableRow 
                  hover
                  sx={{ 
                    '&:hover': { 
                      bgcolor: '#f8fafc',
                      transform: 'scale(1.001)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          user.isActive ? (
                            <CheckCircle 
                              sx={{ 
                                width: 16, 
                                height: 16, 
                                color: '#10b981',
                                bgcolor: 'white',
                                borderRadius: '50%'
                              }} 
                            />
                          ) : null
                        }
                      >
                        <Avatar 
                          sx={{ 
                            bgcolor: roleColor(user.role) + '.main',
                            fontWeight: 700,
                            width: 48,
                            height: 48
                          }}
                        >
                          {getInitials(user.name)}
                        </Avatar>
                      </Badge>
                      <Box>
                        <Typography fontWeight={700} fontSize="0.95rem">
                          {user.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                          <Email sx={{ fontSize: 12 }} />
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      {user.phone || 'N/A'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      icon={getRoleIcon(user.role)}
                      label={user.role}
                      size="medium"
                      color={roleColor(user.role)}
                      sx={{ 
                        fontWeight: 600,
                        borderRadius: 2,
                        px: 1
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Switch
                        checked={user.isActive}
                        onChange={() => toggleStatus(user)}
                        size="small"
                        sx={{
                          '& .MuiSwitch-thumb': {
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }
                        }}
                      />
                      <Chip
                        label={user.isActive ? 'Active' : 'Inactive'}
                        size="small"
                        color={user.isActive ? 'success' : 'default'}
                        sx={{ 
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}
                      />
                    </Stack>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" display="flex" alignItems="center" gap={0.5}>
                      <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                      {new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit User" arrow>
                        <IconButton
                          size="small"
                          onClick={() => openDialog(user)}
                          sx={{
                            bgcolor: '#3b82f615',
                            color: '#3b82f6',
                            '&:hover': {
                              bgcolor: '#3b82f630',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User" arrow>
                        <IconButton
                          size="small"
                          onClick={() => deleteUser(user._id)}
                          sx={{
                            bgcolor: '#ef444415',
                            color: '#ef4444',
                            '&:hover': {
                              bgcolor: '#ef444430',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              </Fade>
            ))}

            {users.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Person sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" fontWeight={600}>
                    No users found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your search or filters
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Divider />
        
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Create / Edit Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {editing ? 'Edit User' : 'Create New User'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {editing ? 'Update user information' : 'Add a new user to the system'}
          </Typography>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Full Name"
              value={currentUser.name}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, name: e.target.value })
              }
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              label="Email Address"
              type="email"
              value={currentUser.email}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, email: e.target.value })
              }
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            {!editing && (
              <TextField
                label="Password"
                type="password"
                value={currentUser.password}
                onChange={(e) =>
                  setCurrentUser({
                    ...currentUser,
                    password: e.target.value
                  })
                }
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
            )}
            <TextField
              label="Phone Number"
              value={currentUser.phone}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, phone: e.target.value })
              }
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            <TextField
              select
              label="User Role"
              value={currentUser.role}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, role: e.target.value })
              }
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {getRoleIcon(r)}
                    <span>{r}</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{ 
              borderRadius: 2, 
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={saveUser}
            sx={{
              borderRadius: 2,
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)'
              }
            }}
          >
            {editing ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;