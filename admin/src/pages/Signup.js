import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  LinearProgress,
  Fade,
  Slide,
  Collapse,
  Grow,
  CircularProgress,
  alpha,
  useTheme
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
  AssignmentInd,
  Science,
  Work,
  MedicalServices,
  Schedule,
  VerifiedUser,
  School,
  DeviceHub,
  CheckCircle,
  Error,
  Lock,
  Security,
  ArrowBack,
  ArrowForward,
  HowToReg
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { BASE_URL } from '../api/api';
import confetti from 'canvas-confetti';
import PasswordStrengthBar from 'react-password-strength-bar';

// Custom Step Icons
const StepIcon = (props) => {
  const { active, completed, icon } = props;
  
  return (
    <Box
      sx={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active || completed 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'rgba(0, 0, 0, 0.1)',
        color: active || completed ? 'white' : 'rgba(0, 0, 0, 0.6)',
        fontWeight: 'bold',
        position: 'relative',
        transition: 'all 0.3s ease',
        boxShadow: active ? '0 4px 20px rgba(102, 126, 234, 0.5)' : 'none',
        '&:after': active ? {
          content: '""',
          position: 'absolute',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '2px solid rgba(102, 126, 234, 0.3)',
          animation: 'pulse 2s infinite'
        } : {}
      }}
    >
      {completed ? <CheckCircle fontSize="small" /> : icon}
    </Box>
  );
};

// Role Cards Component
const RoleCard = ({ role, icon, title, description, selected, onClick }) => {
  const IconComponent = icon;
  
  return (
    <Grow in timeout={500}>
      <Card
        onClick={() => onClick(role)}
        sx={{
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          background: selected 
            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
            : 'transparent',
          border: selected 
            ? '2px solid #667eea'
            : '2px solid rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 8,
            borderColor: '#667eea'
          }
        }}
      >
        <CardContent sx={{ textAlign: 'center' }}>
          <IconComponent 
            sx={{ 
              fontSize: 48, 
              color: selected ? '#667eea' : 'rgba(0, 0, 0, 0.6)',
              mb: 2
            }} 
          />
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
          {selected && (
            <Fade in>
              <CheckCircle 
                sx={{ 
                  position: 'absolute', 
                  top: 10, 
                  right: 10,
                  color: '#667eea'
                }} 
              />
            </Fade>
          )}
        </CardContent>
      </Card>
    </Grow>
  );
};

const Signup = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Role-based steps
  const stepsByRole = {
    PATIENT: ['Account Information', 'Personal Details'],
    DOCTOR: ['Account Information', 'Personal Details', 'Professional Information'],
    NURSE: ['Account Information', 'Personal Details', 'Professional Information'],
    LAB_TECH: ['Account Information', 'Personal Details', 'Professional Information'],
    PHARMACIST: ['Account Information', 'Personal Details', 'Professional Information']
  };

  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('signupDraft');
    return savedData ? JSON.parse(savedData) : {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'PATIENT',
      phone: '',
      age: '',
      gender: '',
      address: '',
      bloodGroup: '',
      wardId: '',
      bedNumber: '',
      admissionDate: '',
      admissionStatus: 'Admitted',
      isAdmitted: false,
      specialization: '',
      department: '',
      employeeId: '',
      licenseNumber: '',
      experience: '',
      shift: 'Rotating',
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
    };
  });

  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    setMounted(true);
    localStorage.setItem('signupDraft', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    let strength = 0;
    if (formData.password.length >= 8) strength += 25;
    if (/[A-Z]/.test(formData.password)) strength += 25;
    if (/[0-9]/.test(formData.password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(formData.password)) strength += 25;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateStep = () => {
    const newErrors = {};
    
    switch (activeStep) {
      case 0:
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (passwordStrength < 50) {
          newErrors.password = 'Password is too weak';
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
        
      case 1:
        if (['PATIENT', 'DOCTOR', 'NURSE', 'LAB_TECH', 'PHARMACIST'].includes(formData.role)) {
          if (!formData.age) newErrors.age = 'Age is required';
          if (!formData.gender) newErrors.gender = 'Gender is required';
          if (!formData.address?.trim()) newErrors.address = 'Address is required';
        }
        if (formData.role === 'PATIENT') {
          if (formData.isAdmitted && !formData.bedNumber?.trim()) {
            newErrors.bedNumber = 'Bed number is required for admitted patients';
          }
        }
        break;
        
      case 2:
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

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const triggerSuccessAnimation = () => {
    setShowSuccessAnimation(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => setShowSuccessAnimation(false), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
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

      const response = await axios.post(`${BASE_URL}/auth/signup`, submitData);
      
      if (response.data.success) {
        triggerSuccessAnimation();
        setSuccess(`Welcome aboard, ${formData.role === 'DOCTOR' ? 'Doctor 👨‍⚕️' : 
          formData.role === 'NURSE' ? 'Nurse 👩‍⚕️' : 
          formData.role === 'PATIENT' ? 'Patient 🏥' : 
          'Professional!'} Registration successful!`);
        
        localStorage.removeItem('signupDraft');
        
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error?.message || 
                         'Registration failed. Please try again.';
      setError(errorMessage);
      
      if (errorMessage.includes('email already exists')) {
        setActiveStep(0);
        setErrors(prev => ({ ...prev, email: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Slide direction="right" in={activeStep === 0} mountOnEnter unmountOnExit>
            <Box>
              {/* Role Selection Cards */}
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Select Your Role
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { role: 'PATIENT', icon: Person, title: 'Patient', 
                    desc: 'Access medical records, appointments, and prescriptions' },
                  { role: 'DOCTOR', icon: LocalHospital, title: 'Doctor', 
                    desc: 'Manage patients, appointments, and medical records' },
                  { role: 'NURSE', icon: Badge, title: 'Nurse', 
                    desc: 'Manage patient care, vitals, and nursing duties' },
                  { role: 'LAB_TECH', icon: Science, title: 'Lab Technician', 
                    desc: 'Manage laboratory tests, samples, and reports' },
                  { role: 'PHARMACIST', icon: MedicalServices, title: 'Pharmacist', 
                    desc: 'Manage prescriptions and medication inventory' }
                ].map((roleData) => (
                  <Grid item xs={12} md={2.4} key={roleData.role}>
                    <RoleCard
                      role={roleData.role}
                      icon={roleData.icon}
                      title={roleData.title}
                      description={roleData.desc}
                      selected={formData.role === roleData.role}
                      onClick={handleRoleChange}
                    />
                  </Grid>
                ))}
              </Grid>
              
              <Divider sx={{ my: 3 }}>
                <Chip label="Account Details" />
              </Divider>
              
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
                    sx={{
                      '& .MuiOutlinedInput-root.Mui-focused': {
                        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color={formData.name ? 'primary' : 'action'} />
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
                          <Email color={formData.email ? 'primary' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    We never share your email. Used for account verification only.
                  </Typography>
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
                          <Lock color={passwordStrength > 50 ? 'success' : passwordStrength > 0 ? 'warning' : 'action'} />
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
                  {formData.password && (
                    <Box sx={{ mt: 1 }}>
                      <PasswordStrengthBar 
                        password={formData.password}
                        scoreWords={['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']}
                        shortScoreWord="Too short"
                      />
                      <Typography variant="caption" color="text.secondary">
                        • 8+ characters • Uppercase • Number • Symbol
                      </Typography>
                    </Box>
                  )}
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
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Security color={formData.password === formData.confirmPassword && formData.confirmPassword ? 'success' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
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
                          <Phone color={formData.phone ? 'primary' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Used only for emergency contact
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Slide>
        );

      case 1:
        return (
          <Slide direction={activeStep > 1 ? 'left' : 'right'} in={activeStep === 1} mountOnEnter unmountOnExit>
            <Box>
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
                  <Grow in>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Patient Admission Details
                        </Typography>
                      </Divider>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={formData.isAdmitted}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              isAdmitted: e.target.checked
                            }))}
                            color="primary"
                          />
                        }
                        label="Currently Admitted"
                      />
                      
                      <Collapse in={formData.isAdmitted}>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
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
                        </Grid>
                      </Collapse>
                    </Grid>
                  </Grow>
                )}
              </Grid>
            </Box>
          </Slide>
        );

      case 2:
        return (
          <Slide direction="left" in={activeStep === 2} mountOnEnter unmountOnExit>
            <Box>
              {/* Professional Information based on role */}
              {formData.role === 'DOCTOR' && (
                <DoctorForm formData={formData} handleChange={handleChange} errors={errors} />
              )}
              {formData.role === 'NURSE' && (
                <NurseForm formData={formData} handleChange={handleChange} errors={errors} />
              )}
              {formData.role === 'LAB_TECH' && (
                <LabTechForm formData={formData} setFormData={setFormData} errors={errors} />
              )}
              {formData.role === 'PHARMACIST' && (
                <PharmacistForm formData={formData} handleChange={handleChange} errors={errors} />
              )}
            </Box>
          </Slide>
        );

      default:
        return null;
    }
  };

  const currentSteps = stepsByRole[formData.role] || stepsByRole.PATIENT;
  const progressPercentage = ((activeStep + 1) / currentSteps.length) * 100;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a237e 0%, #121858 100%)',
        position: 'relative',
        overflowX: 'hidden',
        py: { xs: 4, md: 0 }
      }}
    >
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid 
          container 
          component={Paper} 
          elevation={24} 
          sx={{ 
            borderRadius: 4, 
            overflow: 'hidden', 
            minHeight: { xs: 'auto', md: '750px' },
            mx: 'auto',
            backdropFilter: 'blur(12px)',
            background: 'rgba(255,255,255,0.95)',
            border: '1px solid rgba(255,255,255,0.3)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': { 
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              transform: 'translateY(-2px)'
            }
          }}
        >
          
          {/* FORM ONLY - FULL WIDTH */}
          <Grid item xs={12} sx={{ 
            bgcolor: 'white', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {isSubmitting && <LinearProgress sx={{ height: 4 }} />}
            
            <Box sx={{ 
              p: { xs: 4, md: 6 }, 
              flex: 1, 
              display: 'flex', 
              flexDirection: 'column',
              overflowY: 'auto',
              maxHeight: { md: '750px' }
            }}>
              {/* Header */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main" gutterBottom>
                  Create Your Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Register as a healthcare professional or patient
                </Typography>
              </Box>

              {/* Progress Circle - Centered */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={progressPercentage}
                    size={60}
                    thickness={4}
                    sx={{ color: '#667eea' }}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" component="div" color="#667eea" fontWeight="bold">
                      {Math.round(progressPercentage)}%
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Registration Progress
                </Typography>
              </Box>

              {/* Messages */}
              {error && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    animation: 'shake 0.5s ease-in-out'
                  }}
                  icon={<Error />}
                >
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 3, 
                    borderRadius: 2,
                    animation: 'successPulse 2s ease-in-out'
                  }}
                  icon={<CheckCircle />}
                >
                  {success}
                </Alert>
              )}

              {/* Stepper */}
              <Box sx={{ mb: 4 }}>
                <Stepper 
                  activeStep={activeStep} 
                  alternativeLabel
                  sx={{
                    '& .MuiStepConnector-line': {
                      borderColor: 'rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  {currentSteps.map((label, index) => (
                    <Step key={label}>
                      <StepLabel 
                        StepIconComponent={StepIcon}
                        error={index === activeStep && Object.keys(errors).length > 0}
                      >
                        <Typography variant="caption" fontWeight={index === activeStep ? 'bold' : 'normal'}>
                          {label}
                        </Typography>
                      </StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              {/* Current Role Indicator */}
              <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Chip 
                  label={`Registering as: ${formData.role === 'LAB_TECH' ? 'Lab Technician' : formData.role}`}
                  color="primary"
                  variant="outlined"
                  sx={{ 
                    fontWeight: 'bold',
                    px: 2,
                    py: 1,
                    fontSize: '0.9rem',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderColor: 'rgba(102, 126, 234, 0.3)'
                  }}
                  icon={formData.role === 'LAB_TECH' ? <Science /> : 
                        formData.role === 'DOCTOR' ? <LocalHospital /> : 
                        formData.role === 'NURSE' ? <Badge /> : 
                        formData.role === 'PHARMACIST' ? <MedicalServices /> : <Person />}
                />
              </Box>

              {/* Form Content */}
              <Box sx={{ flex: 1, mb: 4 }}>
                <form onSubmit={handleSubmit} style={{ height: '100%' }}>
                  <Box sx={{ height: '100%' }}>
                    {getStepContent(activeStep)}
                  </Box>

                  {/* Navigation Buttons */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 4,
                    pt: 3,
                    borderTop: '1px solid rgba(0,0,0,0.1)'
                  }}>
                    <Button
                      disabled={activeStep === 0 || isSubmitting}
                      onClick={handleBack}
                      variant="outlined"
                      startIcon={<ArrowBack />}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none'
                      }}
                    >
                      Back
                    </Button>
                    
                    <Box>
                      {activeStep === currentSteps.length - 1 ? (
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={isSubmitting}
                          startIcon={isSubmitting ? <CircularProgress size={20} /> : <HowToReg />}
                          sx={{ 
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                              boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                              transform: 'translateY(-1px)'
                            }
                          }}
                        >
                          {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          variant="contained"
                          endIcon={<ArrowForward />}
                          sx={{ 
                            borderRadius: 2,
                            px: 4,
                            py: 1,
                            textTransform: 'none',
                            fontWeight: 'bold'
                          }}
                        >
                          Continue
                        </Button>
                      )}
                    </Box>
                  </Box>
                </form>
              </Box>

              {/* Login Link */}
              <Box sx={{ 
                mt: 'auto', 
                pt: 3, 
                textAlign: 'center',
                borderTop: '1px solid rgba(0,0,0,0.1)'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    style={{ 
                      textDecoration: 'none', 
                      color: '#667eea',
                      fontWeight: 'bold'
                    }}
                  >
                    Sign in here
                  </Link>
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Your data is protected with bank-level encryption 🔒
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Confetti Animation */}
      {showSuccessAnimation && (
        <canvas
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 9999
          }}
          ref={(node) => {
            if (node) {
              const myConfetti = confetti.create(node, {
                resize: true,
                useWorker: true
              });
              myConfetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 }
              });
            }
          }}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes successPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.02); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Box>
  );
};

// Sub-components for professional forms
const DoctorForm = ({ formData, handleChange, errors }) => (
  <Box>
    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
      <LocalHospital sx={{ mr: 1 }} />
      Doctor Information
    </Typography>
    
    <Grid container spacing={3}>
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
    </Grid>
  </Box>
);

const NurseForm = ({ formData, handleChange, errors }) => (
  <Box>
    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
      <Badge sx={{ mr: 1 }} />
      Nursing Information
    </Typography>
    
    <Grid container spacing={3}>
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
    </Grid>
  </Box>
);

const LabTechForm = ({ formData, setFormData, errors }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
        <Science sx={{ mr: 1 }} />
        Laboratory Technician Information
      </Typography>
      
      <Grid container spacing={3}>
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
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Equipment Permissions
          </Typography>
          <Grid container spacing={2}>
            {formData.equipmentPermissions.map((item, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card variant="outlined">
                  <CardContent sx={{ p: 2 }}>
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
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DeviceHub fontSize="small" />
                          <Typography variant="body2">{item.equipmentType}</Typography>
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

const PharmacistForm = ({ formData, handleChange, errors }) => (
  <Box>
    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
      <MedicalServices sx={{ mr: 1 }} />
      Pharmacist Information
    </Typography>
    
    <Grid container spacing={3}>
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
          placeholder="e.g., PHARM-2024-001"
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
          placeholder="Pharmacy license number"
        />
      </Grid>
    </Grid>
  </Box>
);

export default Signup;