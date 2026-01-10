const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

/* =========================================================
   1. USER (AUTH & RBAC)
========================================================= */
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email'
      ]
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },

    // In userSchema role enum
    role: {
      type: String,
      enum: ['ADMIN', 'DOCTOR', 'PATIENT', 'PHARMACIST', 'LAB_TECH', 'NURSE'],
      required: true,
      index: true,
      default: 'PATIENT' // Add default if needed
    },

    phone: {
      type: String,
      trim: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastLogin: {
      type: Date
    }
  },
  { timestamps: true }
);

/* ===== Password Hash ===== */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

/* ===== Password Compare ===== */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* =========================================================
   2. PATIENT PROFILE (UPDATED)
========================================================= */
const patientSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    age: {
      type: Number,
      min: 0,
      max: 150
    },

    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },

    address: {
      type: String,
      trim: true
    },

    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },

    // New nursing-related fields
    wardId: {
      type: Schema.Types.ObjectId,
      ref: 'Ward'
    },

    bedNumber: {
      type: String
    },

    admissionDate: {
      type: Date
    },

    dischargeDate: {
      type: Date
    },

    admissionStatus: {
      type: String,
      enum: ['Admitted', 'Discharged', 'Transferred', 'Observation'],
      default: 'Admitted'
    },

    isAdmitted: {
      type: Boolean,
      default: false
    },

    lastVitalsRecorded: {
      type: Date
    },

    lastCareUpdated: {
      type: Date
    },

    careNotes: [{
      noteType: {
        type: String,
        enum: ['Observation', 'Instruction', 'Concern', 'Progress', 'Other']
      },
      content: String,
      priority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
      },
      createdBy: {
        role: String,
        userId: Schema.Types.ObjectId,
        name: String
      },
      followUpRequired: Boolean,
      followUpDate: Date,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

/* =========================================================
   3. DOCTOR PROFILE
========================================================= */
const doctorSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    specialization: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    department: {
      type: String,
      required: true,
      trim: true,
      index: true
    }
  },
  { timestamps: true }
);

/* =========================================================
   4. NURSE PROFILE
========================================================= */
const nurseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    employeeId: {
      type: String,
      unique: true,
      required: true
    },

    specialization: {
      type: String,
      enum: ['General', 'Pediatric', 'ICU', 'Emergency', 'Surgical', 'Cardiac'],
      default: 'General'
    },

    licenseNumber: {
      type: String,
      required: true
    },

    experience: {
      type: Number, // in years
      default: 0
    },

    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'Rotating'],
      default: 'Rotating'
    },

    wardId: {
      type: Schema.Types.ObjectId,
      ref: 'Ward',
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    },

    joinDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* =========================================================
   5. WARD
========================================================= */
const wardSchema = new Schema(
  {
    wardNumber: {
      type: String,
      required: true,
      unique: true
    },

    name: {
      type: String,
      required: true
    },

    floor: {
      type: Number,
      required: true
    },

    bedCount: {
      type: Number,
      required: true
    },

    specialty: {
      type: String,
      enum: ['General', 'ICU', 'Pediatric', 'Surgical', 'Maternity', 'Cardiac', 'Neurology'],
      default: 'General'
    },

    chargeNurseId: {
      type: Schema.Types.ObjectId,
      ref: 'Nurse'
    },

    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

/* =========================================================
   6. APPOINTMENTS (UPDATED)
========================================================= */
const appointmentSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true,
      index: true
    },

    time: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
      index: true
    },

    reason: {
      type: String,
      trim: true
    },

    notes: {
      type: String,
      trim: true
    },

    // New nursing-related fields
    nursingNotes: {
      type: String
    },

    preparationStatus: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Ready', 'Completed'],
      default: 'Not Started'
    },

    lastUpdatedBy: {
      role: String,
      userId: Schema.Types.ObjectId,
      name: String,
      updatedAt: Date
    }
  },
  { timestamps: true }
);

/* =========================================================
   7. PRESCRIPTIONS (UPDATED)
========================================================= */
const prescriptionSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },

    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },

    medicines: [
      {
        medicineId: {
          type: Schema.Types.ObjectId,
          ref: 'Medicine'
        },
        name: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          min: 1
        },
        dosage: {
          type: String,
          trim: true,
          required: true
        },
        frequency: {
          type: String,
          required: true
        },
        duration: {
          type: String,
          required: true
        },
        instructions: String,
        administrationStatus: {
          type: String,
          enum: ['Pending', 'Administered', 'Skipped', 'Cancelled'],
          default: 'Pending'
        },
        lastAdministered: Date,
        nextDue: Date,
        administeredBy: {
          role: String,
          userId: Schema.Types.ObjectId,
          name: String
        }
      }
    ],
    
    administrationRecords: [{
      medicineName: String,
      status: String,
      administeredBy: {
        role: String,
        userId: Schema.Types.ObjectId,
        name: String
      },
      notes: String,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  { timestamps: true }
);

/* =========================================================
   8. MEDICINES
========================================================= */
const medicineSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    category: {
      type: String,
      trim: true
    },

    price: {
      type: Number,
      min: 0,
      required: true
    },

    stockQuantity: {
      type: Number,
      default: 0,
      min: 0
    },

    unit: {
      type: String,
      enum: ['tablet', 'capsule', 'ml', 'mg', 'g', 'piece']
    }
  },
  { timestamps: true }
);

/* =========================================================
   9. VITALS
========================================================= */
const vitalsSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    nurseId: {
      type: Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true
    },

    temperature: {
      type: Number, // in Celsius
      min: 30,
      max: 45
    },

    bloodPressure: {
      systolic: {
        type: Number,
        min: 60,
        max: 250
      },
      diastolic: {
        type: Number,
        min: 40,
        max: 150
      }
    },

    heartRate: {
      type: Number, // beats per minute
      min: 30,
      max: 200
    },

    respiratoryRate: {
      type: Number, // breaths per minute
      min: 8,
      max: 40
    },

    oxygenSaturation: {
      type: Number, // percentage
      min: 70,
      max: 100
    },

    glucoseLevel: {
      type: Number, // mg/dL
      min: 30,
      max: 500
    },

    weight: {
      type: Number, // in kg
      min: 1,
      max: 200
    },

    height: {
      type: Number, // in cm
      min: 30,
      max: 250
    },

    bmi: {
      type: Number,
      min: 10,
      max: 60
    },

    notes: {
      type: String
    },

    recordedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* =========================================================
   10. NURSING CARE
========================================================= */
const nursingCareSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    nurseId: {
      type: Schema.Types.ObjectId,
      ref: 'Nurse',
      required: true
    },

    careType: {
      type: String,
      enum: ['Medication', 'Wound Care', 'Hygiene', 'Feeding', 'Mobility', 'Monitoring', 'Other'],
      required: true
    },

    description: {
      type: String,
      required: true
    },

    medicationsAdministered: [{
      name: String,
      dosage: String,
      time: Date
    }],

    observations: {
      type: String
    },

    nextCareSchedule: {
      type: Date
    },

    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Completed'
    }
  },
  { timestamps: true }
);
/* =========================================================
   5. LAB TECH PROFILE
========================================================= */
const labTechSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    employeeId: {
      type: String,
      unique: true,
      required: true
    },

    department: {
      type: String,
      required: true,
      trim: true,
      index: true,
      enum: ['Pathology', 'Radiology', 'Biochemistry', 'Microbiology', 'Hematology', 'General']
    },

    licenseNumber: {
      type: String,
      required: true
    },

    specialization: {
      type: String,
      enum: ['X-Ray', 'MRI', 'CT Scan', 'Blood Tests', 'Urine Analysis', 'Tissue Analysis', 'General'],
      default: 'General'
    },

    experience: {
      type: Number, // in years
      default: 0
    },

    shift: {
      type: String,
      enum: ['Morning', 'Evening', 'Night', 'Rotating'],
      default: 'Rotating'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    joinDate: {
      type: Date,
      default: Date.now
    },

    // Lab equipment handling permissions
    equipmentPermissions: [{
      equipmentType: String,
      canOperate: Boolean,
      trainingDate: Date
    }],

    // Test types the lab tech is certified for
    certifiedTests: [{
      testName: String,
      certificationDate: Date,
      renewDate: Date
    }],

    // Performance metrics
    testsConducted: {
      type: Number,
      default: 0
    },

    accuracyRate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    },

    lastCertificationCheck: {
      type: Date
    }
  },
  { timestamps: true }
);

/* =========================================================
   11. LAB TESTS
========================================================= */
const labTestSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
      index: true
    },

    labTechId: {
      type: Schema.Types.ObjectId,
      ref: 'LabTech',
      index: true
    },

    testName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },

    status: {
      type: String,
      enum: ['Requested', 'Processing', 'Completed'],
      default: 'Requested',
      index: true
    },

    // New fields for lab tech management
    assignedAt: {
      type: Date
    },

    completedAt: {
      type: Date
    },

    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },

    estimatedCompletion: {
      type: Date
    },

    notes: {
      type: String
    },

    reassignmentHistory: [{
      fromLabTech: Schema.Types.ObjectId,
      toLabTech: Schema.Types.ObjectId,
      reassignedAt: Date,
      reassignedBy: Schema.Types.ObjectId,
      reason: String
    }]
  },
  { timestamps: true }
);
/* =========================================================
   12. LAB REPORTS
========================================================= */
const labReportSchema = new Schema(
  {
    labTestId: {
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
      required: true,
      unique: true
    },

    result: {
      type: String,
      required: true
    },

    reportDate: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

/* =========================================================
   13. BILLING
========================================================= */
const billingSchema = new Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true
    },

    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription'
    },

    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment'
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending'],
      default: 'Pending',
      index: true
    }
  },
  { timestamps: true }
);

/* =========================================================
   EXPORT MODELS
========================================================= */
module.exports = {
  User: mongoose.model('User', userSchema),
  Patient: mongoose.model('Patient', patientSchema),
  Doctor: mongoose.model('Doctor', doctorSchema),
  Nurse: mongoose.model('Nurse', nurseSchema),
  Ward: mongoose.model('Ward', wardSchema),
  Appointment: mongoose.model('Appointment', appointmentSchema),
  Prescription: mongoose.model('Prescription', prescriptionSchema),
  Medicine: mongoose.model('Medicine', medicineSchema),
  Vitals: mongoose.model('Vitals', vitalsSchema),
  NursingCare: mongoose.model('NursingCare', nursingCareSchema),
  LabTest: mongoose.model('LabTest', labTestSchema),
  LabReport: mongoose.model('LabReport', labReportSchema),
  Billing: mongoose.model('Billing', billingSchema),
  // Then in your exports at the end of schema.js, add:
  LabTech: mongoose.model('LabTech', labTechSchema),
};