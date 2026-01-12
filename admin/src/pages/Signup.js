import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormHelperText,
  Divider,
  Card,
  CardContent,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  LocalHospital,
  Badge,
  LocationOn,
  Bloodtype,
  Bed,
  CalendarToday,
  Notes,
  AssignmentInd,
  Science,
  Work,
  MedicalServices,
  Schedule,
  VerifiedUser,
  School,
  DeviceHub
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { BASE_URL } from '../api/api';

const steps = ['Account Information', 'Personal Details', 'Professional Information'];

const Signup = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form data structure
  const [formData, setFormData] = useState({
    // Account Information
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'PATIENT',
    phone: '',

    // Personal Details (for all roles)
    age: '',
    gender: '',
    address: '',
    bloodGroup: '',
    
    // Patient-specific
    wardId: '',
    bedNumber: '',
    admissionDate: '',
    admissionStatus: 'Admitted',
    isAdmitted: false,

    // Doctor-specific
    specialization: '',
    department: '',

    // Nurse-specific
    employeeId: '',
    licenseNumber: '',
    wardId: '', // For nurse - ward assignment
    specialization: 'General',
    experience: '',
    shift: 'Rotating',

    // Lab Tech-specific
    labEmployeeId: '',
    labDepartment: 'Pathology',
    labLicenseNumber: '',
    labSpecialization: 'General',
    labExperience: '',
    labShift: 'Rotating',
    equipmentPermissions: [
      { equipmentType: 'Microscope', canOperate: true },
      { equipmentType: 'Centrifuge', canOperate: true },
      { equipmentType: 'Blood Analyzer', canOperate: true }
    ],
    certifiedTests: [
      { testName: 'CBC', certificationDate: new Date().toISOString().split('T')[0] }
    ]
  });

  // Form validation errors
  const [errors, setErrors] = useState({});

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    switch (activeStep) {
      case 0: // Account Information
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        if (!formData.role) newErrors.role = 'Role is required';
        if (!formData.phone.trim()) {
          newErrors.phone = 'Phone number is required';
        }
        break;

      case 1: // Personal Details (required for all roles)
        if (['PATIENT', 'DOCTOR', 'NURSE', 'LAB_TECH'].includes(formData.role)) {
          if (!formData.age) newErrors.age = 'Age is required';
          if (!formData.gender) newErrors.gender = 'Gender is required';
          if (!formData.address?.trim()) newErrors.address = 'Address is required';
        }
        
        // Patient-specific fields
        if (formData.role === 'PATIENT') {
          if (formData.isAdmitted && !formData.bedNumber?.trim()) {
            newErrors.bedNumber = 'Bed number is required for admitted patients';
          }
        }
        break;

      case 2: // Professional Information
        if (formData.role === 'DOCTOR') {
          if (!formData.specialization?.trim()) newErrors.specialization = 'Specialization is required';
          if (!formData.department?.trim()) newErrors.department = 'Department is required';
        }
        
        if (formData.role === 'NURSE') {
          if (!formData.employeeId?.trim()) newErrors.employeeId = 'Employee ID is required';
          if (!formData.licenseNumber?.trim()) newErrors.licenseNumber = 'License number is required';
          if (!formData.wardId) newErrors.wardId = 'Ward assignment is required';
        }
        
        if (formData.role === 'LAB_TECH') {
          if (!formData.labEmployeeId?.trim()) newErrors.labEmployeeId = 'Employee ID is required';
          if (!formData.labLicenseNumber?.trim()) newErrors.labLicenseNumber = 'License number is required';
          if (!formData.labDepartment) newErrors.labDepartment = 'Department is required';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare data based on role
      const submitData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone,
        ...(formData.role === 'PATIENT' && {
          age: parseInt(formData.age),
          gender: formData.gender,
          address: formData.address,
          bloodGroup: formData.bloodGroup || undefined,
          wardId: formData.wardId || undefined,
          bedNumber: formData.bedNumber || undefined,
          admissionDate: formData.admissionDate ? dayjs(formData.admissionDate).toISOString() : undefined,
          admissionStatus: formData.admissionStatus,
          isAdmitted: formData.isAdmitted
        }),
        ...(formData.role === 'DOCTOR' && {
          specialization: formData.specialization,
          department: formData.department
        }),
        ...(formData.role === 'NURSE' && {
          employeeId: formData.employeeId,
          licenseNumber: formData.licenseNumber,
          wardId: formData.wardId,
          specialization: formData.specialization,
          experience: parseInt(formData.experience) || 0,
          shift: formData.shift
        }),
        ...(formData.role === 'LAB_TECH' && {
          employeeId: formData.labEmployeeId,
          department: formData.labDepartment,
          licenseNumber: formData.labLicenseNumber,
          specialization: formData.labSpecialization,
          experience: parseInt(formData.labExperience) || 0,
          shift: formData.labShift,
          equipmentPermissions: formData.equipmentPermissions,
          certifiedTests: formData.certifiedTests
        })
      };

      // Make API call
      const response = await axios.post(`${BASE_URL}/auth/signup`, submitData);
      
      if (response.data.success) {
        setSuccess('Registration successful! Redirecting to login...');
        
        // Store token and user data
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error?.message || 
                         'Registration failed. Please try again.';
      setError(errorMessage);
      
      // If it's a duplicate email error, go back to step 1
      if (errorMessage.includes('email already exists')) {
        setActiveStep(0);
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Update role selection
  const handleRoleChange = (e) => {
    const newRole = e.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole
    }));
  };

  // Get step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Visibility />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.role} required>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  label="Role"
                  startAdornment={
                    <InputAdornment position="start">
                      <AssignmentInd />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="PATIENT">Patient</MenuItem>
                  <MenuItem value="DOCTOR">Doctor</MenuItem>
                  <MenuItem value="NURSE">Nurse</MenuItem>
                  <MenuItem value="LAB_TECH">Lab Technician</MenuItem>
                </Select>
                {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                error={!!errors.age}
                helperText={errors.age}
                required
                InputProps={{
                  inputProps: { min: 0, max: 150 }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.gender} required>
                <InputLabel>Gender</InputLabel>
                <Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  label="Gender"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
                {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                required
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Blood Group</InputLabel>
                <Select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  label="Blood Group"
                  startAdornment={
                    <InputAdornment position="start">
                      <Bloodtype />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="">Not specified</MenuItem>
                  <MenuItem value="A+">A+</MenuItem>
                  <MenuItem value="A-">A-</MenuItem>
                  <MenuItem value="B+">B+</MenuItem>
                  <MenuItem value="B-">B-</MenuItem>
                  <MenuItem value="O+">O+</MenuItem>
                  <MenuItem value="O-">O-</MenuItem>
                  <MenuItem value="AB+">AB+</MenuItem>
                  <MenuItem value="AB-">AB-</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Patient-specific fields */}
            {formData.role === 'PATIENT' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Patient Admission Details
                    </Typography>
                  </Divider>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Admission Status</InputLabel>
                    <Select
                      name="admissionStatus"
                      value={formData.admissionStatus}
                      onChange={handleChange}
                      label="Admission Status"
                    >
                      <MenuItem value="Admitted">Admitted</MenuItem>
                      <MenuItem value="Observation">Observation</MenuItem>
                      <MenuItem value="Discharged">Discharged</MenuItem>
                      <MenuItem value="Transferred">Transferred</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Bed Number"
                    name="bedNumber"
                    value={formData.bedNumber}
                    onChange={handleChange}
                    error={!!errors.bedNumber}
                    helperText={errors.bedNumber}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Bed />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Admission Date"
                    name="admissionDate"
                    type="date"
                    value={formData.admissionDate}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isAdmitted}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          isAdmitted: e.target.checked
                        }))}
                      />
                    }
                    label="Currently Admitted"
                  />
                </Grid>
              </>
            )}
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            {/* Doctor-specific fields */}
            {formData.role === 'DOCTOR' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Professional Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    error={!!errors.specialization}
                    helperText={errors.specialization}
                    required
                    placeholder="e.g., Cardiology, Neurology"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    error={!!errors.department}
                    helperText={errors.department}
                    required
                    placeholder="e.g., Emergency, ICU"
                  />
                </Grid>
              </>
            )}

            {/* Nurse-specific fields */}
            {formData.role === 'NURSE' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    <Badge sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Nursing Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="employeeId"
                    value={formData.employeeId}
                    onChange={handleChange}
                    error={!!errors.employeeId}
                    helperText={errors.employeeId}
                    required
                    placeholder="e.g., NUR-2024-001"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                    required
                    placeholder="Nursing license number"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.specialization}>
                    <InputLabel>Nursing Specialization</InputLabel>
                    <Select
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      label="Nursing Specialization"
                    >
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="Pediatric">Pediatric</MenuItem>
                      <MenuItem value="ICU">ICU</MenuItem>
                      <MenuItem value="Emergency">Emergency</MenuItem>
                      <MenuItem value="Surgical">Surgical</MenuItem>
                      <MenuItem value="Cardiac">Cardiac</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.shift}>
                    <InputLabel>Shift</InputLabel>
                    <Select
                      name="shift"
                      value={formData.shift}
                      onChange={handleChange}
                      label="Shift"
                    >
                      <MenuItem value="Morning">Morning</MenuItem>
                      <MenuItem value="Evening">Evening</MenuItem>
                      <MenuItem value="Night">Night</MenuItem>
                      <MenuItem value="Rotating">Rotating</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Experience (years)"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleChange}
                    InputProps={{
                      inputProps: { min: 0, max: 50 }
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Assigned Ward ID"
                    name="wardId"
                    value={formData.wardId}
                    onChange={handleChange}
                    error={!!errors.wardId}
                    helperText={errors.wardId}
                    required
                    placeholder="Enter ward ID"
                  />
                </Grid>
              </>
            )}

            {/* Lab Tech-specific fields */}
            {formData.role === 'LAB_TECH' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Laboratory Technician Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Employee ID"
                    name="labEmployeeId"
                    value={formData.labEmployeeId}
                    onChange={handleChange}
                    error={!!errors.labEmployeeId}
                    helperText={errors.labEmployeeId}
                    required
                    placeholder="e.g., LT-2024-001"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Badge />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="License Number"
                    name="labLicenseNumber"
                    value={formData.labLicenseNumber}
                    onChange={handleChange}
                    error={!!errors.labLicenseNumber}
                    helperText={errors.labLicenseNumber}
                    required
                    placeholder="Lab technician license"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VerifiedUser />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!errors.labDepartment} required>
                    <InputLabel>Department</InputLabel>
                    <Select
                      name="labDepartment"
                      value={formData.labDepartment}
                      onChange={handleChange}
                      label="Department"
                      startAdornment={
                        <InputAdornment position="start">
                          <Work />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="Pathology">Pathology</MenuItem>
                      <MenuItem value="Radiology">Radiology</MenuItem>
                      <MenuItem value="Biochemistry">Biochemistry</MenuItem>
                      <MenuItem value="Microbiology">Microbiology</MenuItem>
                      <MenuItem value="Hematology">Hematology</MenuItem>
                      <MenuItem value="General">General Laboratory</MenuItem>
                    </Select>
                    {errors.labDepartment && <FormHelperText>{errors.labDepartment}</FormHelperText>}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Specialization</InputLabel>
                    <Select
                      name="labSpecialization"
                      value={formData.labSpecialization}
                      onChange={handleChange}
                      label="Specialization"
                      startAdornment={
                        <InputAdornment position="start">
                          <School />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="General">General</MenuItem>
                      <MenuItem value="X-Ray">X-Ray</MenuItem>
                      <MenuItem value="MRI">MRI</MenuItem>
                      <MenuItem value="CT Scan">CT Scan</MenuItem>
                      <MenuItem value="Blood Tests">Blood Tests</MenuItem>
                      <MenuItem value="Urine Analysis">Urine Analysis</MenuItem>
                      <MenuItem value="Tissue Analysis">Tissue Analysis</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Experience (years)"
                    name="labExperience"
                    type="number"
                    value={formData.labExperience}
                    onChange={handleChange}
                    InputProps={{
                      inputProps: { min: 0, max: 50 },
                      startAdornment: (
                        <InputAdornment position="start">
                          <Work />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Shift</InputLabel>
                    <Select
                      name="labShift"
                      value={formData.labShift}
                      onChange={handleChange}
                      label="Shift"
                      startAdornment={
                        <InputAdornment position="start">
                          <Schedule />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="Morning">Morning</MenuItem>
                      <MenuItem value="Evening">Evening</MenuItem>
                      <MenuItem value="Night">Night</MenuItem>
                      <MenuItem value="Rotating">Rotating</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Equipment Permissions
                    </Typography>
                  </Divider>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Default permissions enabled for standard laboratory equipment.
                    Can be updated later in profile settings.
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {formData.equipmentPermissions.map((item, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" alignItems="center" gap={1}>
                              <DeviceHub color="primary" />
                              <Typography variant="subtitle2">{item.equipmentType}</Typography>
                            </Box>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={item.canOperate}
                                  onChange={(e) => {
                                    const newPermissions = [...formData.equipmentPermissions];
                                    newPermissions[index].canOperate = e.target.checked;
                                    setFormData(prev => ({
                                      ...prev,
                                      equipmentPermissions: newPermissions
                                    }));
                                  }}
                                  size="small"
                                />
                              }
                              label={item.canOperate ? "Can Operate" : "Cannot Operate"}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              </>
            )}

            {/* No professional info needed for patients */}
            {formData.role === 'PATIENT' && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="body1" align="center" color="text.secondary">
                      No additional professional information required for patients.
                      Click "Submit" to complete registration.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Hospital Management System
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            Create New Account
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Register as a Patient, Doctor, Nurse, or Lab Technician
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {/* Current Role Indicator */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Chip 
            label={`Registering as: ${formData.role === 'LAB_TECH' ? 'Lab Technician' : formData.role}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
            icon={formData.role === 'LAB_TECH' ? <Science /> : 
                  formData.role === 'DOCTOR' ? <LocalHospital /> : 
                  formData.role === 'NURSE' ? <Badge /> : <Person />}
          />
        </Box>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            {getStepContent(activeStep)}
          </Box>

          {/* Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant="contained"
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>
        </form>

        {/* Login Link */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link 
              to="/login" 
              style={{ 
                textDecoration: 'none', 
                color: '#1976d2',
                fontWeight: 'bold'
              }}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Paper>

      {/* Role Information Cards */}
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                Patient
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register to access medical records, appointments, and prescriptions.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <LocalHospital sx={{ mr: 1, verticalAlign: 'middle' }} />
                Doctor
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register to manage patients, appointments, and prescriptions.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <Badge sx={{ mr: 1, verticalAlign: 'middle' }} />
                Nurse
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register to manage patient care, vitals, and nursing duties.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom color="primary">
                <Science sx={{ mr: 1, verticalAlign: 'middle' }} />
                Lab Technician
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Register to manage laboratory tests, samples, and reports.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Signup;