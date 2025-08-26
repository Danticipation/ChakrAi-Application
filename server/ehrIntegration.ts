import { storage } from './storage';
import { 
  EhrIntegration, InsertEhrIntegration, 
  FhirResource, InsertFhirResource,
  InsuranceEligibility, InsertInsuranceEligibility,
  SessionBilling, InsertSessionBilling,
  ClinicalExport, InsertClinicalExport,
  AuditLog, InsertAuditLog
} from '../shared/ehrSchema';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs/promises';
import path from 'path';

// FHIR R4 Resource Templates
export class FHIRService {
  
  static generatePatientResource(userId: number, userData: any): any {
    return {
      resourceType: "Patient",
      id: `patient-${userId}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient"]
      },
      identifier: [
        {
          use: "usual",
          type: {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                code: "MR",
                display: "Medical Record Number"
              }
            ]
          },
          system: "https://trai.mental-health.system",
          value: `TRAI-${userId}`
        }
      ],
      active: true,
      name: [
        {
          use: "official",
          family: userData.lastName || "Anonymous",
          given: [userData.firstName || "Patient"]
        }
      ],
      gender: userData.gender || "unknown",
      birthDate: userData.birthDate,
      address: userData.address ? [
        {
          use: "home",
          line: [userData.address.street],
          city: userData.address.city,
          state: userData.address.state,
          postalCode: userData.address.zip,
          country: "US"
        }
      ] : [],
      telecom: userData.phone || userData.email ? [
        ...(userData.phone ? [{
          system: "phone",
          value: userData.phone,
          use: "mobile"
        }] : []),
        ...(userData.email ? [{
          system: "email",
          value: userData.email,
          use: "home"
        }] : [])
      ] : []
    };
  }

  static generateEncounterResource(sessionId: string, userId: number, therapistId: number, sessionData: any): any {
    return {
      resourceType: "Encounter",
      id: `encounter-${sessionId}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-encounter"]
      },
      status: "finished",
      class: {
        system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
        code: "AMB",
        display: "ambulatory"
      },
      type: [
        {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: "108311000",
              display: "Psychiatric therapeutic procedure"
            }
          ]
        }
      ],
      subject: {
        reference: `Patient/patient-${userId}`,
        display: "Patient"
      },
      participant: [
        {
          individual: {
            reference: `Practitioner/practitioner-${therapistId}`,
            display: "Therapist"
          }
        }
      ],
      period: {
        start: sessionData.startTime,
        end: sessionData.endTime
      },
      length: {
        value: sessionData.duration,
        unit: "min",
        system: "http://unitsofmeasure.org",
        code: "min"
      },
      reasonCode: sessionData.reasonCodes ? sessionData.reasonCodes.map((code: string) => ({
        coding: [
          {
            system: "http://hl7.org/fhir/sid/icd-10-cm",
            code: code,
            display: sessionData.reasonDescriptions?.[code] || code
          }
        ]
      })) : [],
      location: [
        {
          location: {
            reference: "Location/virtual-therapy-room",
            display: "Virtual Therapy Session"
          }
        }
      ]
    };
  }

  static generateObservationResource(observationId: string, userId: number, observationType: string, value: any, effectiveDate: string): any {
    return {
      resourceType: "Observation",
      id: `observation-${observationId}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-observation-clinical-test"]
      },
      status: "final",
      category: [
        {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/observation-category",
              code: "survey",
              display: "Survey"
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: "http://loinc.org",
            code: this.getLoincCodeForObservation(observationType),
            display: this.getDisplayForObservationType(observationType)
          }
        ]
      },
      subject: {
        reference: `Patient/patient-${userId}`,
        display: "Patient"
      },
      effectiveDateTime: effectiveDate,
      valueQuantity: typeof value === 'number' ? {
        value: value,
        unit: this.getUnitForObservationType(observationType),
        system: "http://unitsofmeasure.org"
      } : undefined,
      valueString: typeof value === 'string' ? value : undefined,
      component: Array.isArray(value) ? value.map((component: any, index: number) => ({
        code: {
          coding: [
            {
              system: "http://loinc.org",
              code: `${observationType}-${index}`,
              display: component.name || `Component ${index + 1}`
            }
          ]
        },
        valueQuantity: typeof component.value === 'number' ? {
          value: component.value,
          unit: component.unit || "score"
        } : undefined,
        valueString: typeof component.value === 'string' ? component.value : undefined
      })) : undefined
    };
  }

  static generateCarePlanResource(carePlanId: string, userId: number, therapistId: number, goals: any[], interventions: any[]): any {
    return {
      resourceType: "CarePlan",
      id: `careplan-${carePlanId}`,
      meta: {
        versionId: "1",
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-careplan"]
      },
      status: "active",
      intent: "plan",
      category: [
        {
          coding: [
            {
              system: "http://hl7.org/fhir/us/core/CodeSystem/careplan-category",
              code: "assess-plan",
              display: "Assessment and Plan of Treatment"
            }
          ]
        }
      ],
      subject: {
        reference: `Patient/patient-${userId}`,
        display: "Patient"
      },
      author: {
        reference: `Practitioner/practitioner-${therapistId}`,
        display: "Therapist"
      },
      period: {
        start: new Date().toISOString().split('T')[0]
      },
      goal: goals.map((goal: any) => ({
        reference: `Goal/goal-${goal.id}`,
        display: goal.name
      })),
      activity: interventions.map((intervention: any) => ({
        detail: {
          kind: "ServiceRequest",
          code: {
            coding: [
              {
                system: "http://snomed.info/sct",
                code: intervention.code || "108311000",
                display: intervention.name || "Therapeutic intervention"
              }
            ]
          },
          status: "in-progress",
          description: intervention.description,
          scheduledTiming: intervention.schedule ? {
            repeat: {
              frequency: intervention.schedule.frequency,
              period: intervention.schedule.period,
              periodUnit: intervention.schedule.unit
            }
          } : undefined
        }
      }))
    };
  }

  private static getLoincCodeForObservation(type: string): string {
    const codes: Record<string, string> = {
      'mood': '72133-2',
      'anxiety': '72133-2',
      'depression': '44249-1',
      'stress': '72133-2',
      'wellbeing': '72133-2',
      'session_rating': '72133-2',
      'progress_note': '11506-3'
    };
    return codes[type] || '72133-2';
  }

  private static getDisplayForObservationType(type: string): string {
    const displays: Record<string, string> = {
      'mood': 'Mood assessment',
      'anxiety': 'Anxiety level assessment',
      'depression': 'Depression screening assessment',
      'stress': 'Stress level assessment',
      'wellbeing': 'Wellbeing assessment',
      'session_rating': 'Therapy session rating',
      'progress_note': 'Progress note'
    };
    return displays[type] || 'Clinical assessment';
  }

  private static getUnitForObservationType(type: string): string {
    return 'score';
  }
}

// Insurance Eligibility Verification
export class InsuranceService {
  
  static async verifyEligibility(
    memberId: string, 
    insuranceProvider: string, 
    therapistNPI: string
  ): Promise<any> {
    // In production, this would call real insurance APIs
    // For now, return mock verification data
    return {
      eligibilityStatus: 'eligible',
      coverageType: 'mental_health',
      copayAmount: '$25.00',
      deductibleRemaining: '$150.00',
      annualLimit: '$2000.00',
      sessionsRemaining: 15,
      preAuthRequired: false,
      verificationDate: new Date().toISOString(),
      expirationDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  static generateCPTCode(sessionType: string, duration: number): string {
    // Standard CPT codes for mental health services
    const codes: Record<string, Record<string, string>> = {
      'individual': {
        '30': '90834', // 30-37 minutes
        '45': '90837', // 38-52 minutes
        '60': '90837'  // 53+ minutes
      },
      'group': {
        '90': '90853'  // Group therapy
      },
      'family': {
        '50': '90847'  // Family therapy with patient
      },
      'crisis': {
        '60': '90834'  // Crisis intervention
      }
    };

    const sessionCodes = codes[sessionType] || codes['individual'];
    
    if (duration <= 37) return sessionCodes?.['30'] || '90834';
    if (duration <= 52) return sessionCodes?.['45'] || '90837';
    return sessionCodes?.['60'] || '90837';
  }

  static calculateBillableAmount(cptCode: string, insuranceProvider: string): string {
    // Standard rates - would be configurable per provider
    const rates: Record<string, Record<string, number>> = {
      'default': {
        '90834': 120.00,
        '90837': 160.00,
        '90847': 140.00,
        '90853': 80.00
      }
    };

    const providerRates = rates[insuranceProvider] || rates['default'];
    const amount = providerRates?.[cptCode] || 120.00;
    
    return `$${amount.toFixed(2)}`;
  }
}

// Clinical Data Export Service
export class ClinicalExportService {
  
  static async generatePDFReport(
    userId: number, 
    therapistId: number,
    dateRange: { start: string; end: string },
    includedData: string[]
  ): Promise<{ filePath: string; fileSize: number }> {
    
    const doc = new PDFDocument();
    const fileName = `clinical_report_${userId}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    // Ensure exports directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    const stream = doc.pipe(require('fs').createWriteStream(filePath));
    
    // Header
    doc.fontSize(20).text('Clinical Summary Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Patient ID: TRAI-${userId}`);
    doc.text(`Report Period: ${dateRange.start} to ${dateRange.end}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Session Summary
    if (includedData.includes('sessions')) {
      doc.fontSize(16).text('Session Summary', { underline: true });
      doc.moveDown();
      
      // Mock session data - would fetch real data
      const sessions = [
        {
          date: '2024-01-15',
          duration: 45,
          type: 'Individual Therapy',
          notes: 'Patient showed significant progress in anxiety management techniques.'
        }
      ];
      
      sessions.forEach((session, index) => {
        doc.fontSize(12)
           .text(`Session ${index + 1}: ${session.date}`)
           .text(`Duration: ${session.duration} minutes`)
           .text(`Type: ${session.type}`)
           .text(`Notes: ${session.notes}`)
           .moveDown();
      });
    }

    // Assessment Results
    if (includedData.includes('assessments')) {
      doc.fontSize(16).text('Assessment Results', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12)
         .text('PHQ-9 Depression Scale: 8/27 (Mild depression)')
         .text('GAD-7 Anxiety Scale: 6/21 (Mild anxiety)')
         .text('Stress Level: 4/10 (Moderate)')
         .moveDown();
    }

    // Treatment Goals
    if (includedData.includes('goals')) {
      doc.fontSize(16).text('Treatment Goals & Progress', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12)
         .text('Goal 1: Reduce anxiety symptoms (75% complete)')
         .text('Goal 2: Improve sleep quality (60% complete)')
         .text('Goal 3: Develop coping strategies (85% complete)')
         .moveDown();
    }

    // Clinical Impressions
    doc.fontSize(16).text('Clinical Impressions', { underline: true });
    doc.moveDown();
    doc.fontSize(12)
       .text('Patient demonstrates good engagement in therapy and shows')
       .text('measurable improvement in anxiety management and overall')
       .text('emotional regulation. Recommend continuing current treatment plan.')
       .moveDown();

    // Provider Information
    doc.fontSize(16).text('Provider Information', { underline: true });
    doc.moveDown();
    doc.fontSize(12)
       .text('Licensed Clinical Social Worker')
       .text('License #: SW123456')
       .text('NPI: 1234567890');

    doc.end();
    
    return new Promise((resolve, reject) => {
      stream.on('finish', async () => {
        try {
          const stats = await fs.stat(filePath);
          resolve({ filePath, fileSize: stats.size });
        } catch (error) {
          reject(error);
        }
      });
      stream.on('error', reject);
    });
  }

  static async generateCSVExport(
    userId: number,
    dateRange: { start: string; end: string },
    includedData: string[]
  ): Promise<{ filePath: string; fileSize: number }> {
    
    const fileName = `clinical_data_${userId}_${Date.now()}.csv`;
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Mock session data - would fetch real data from database
    const records = [
      {
        date: '2024-01-15',
        sessionType: 'Individual',
        duration: 45,
        moodBefore: 4,
        moodAfter: 7,
        anxietyLevel: 6,
        stressLevel: 5,
        goals: 'Anxiety management',
        notes: 'Good progress with breathing exercises'
      },
      {
        date: '2024-01-22',
        sessionType: 'Individual',
        duration: 50,
        moodBefore: 5,
        moodAfter: 8,
        anxietyLevel: 4,
        stressLevel: 3,
        goals: 'Coping strategies',
        notes: 'Implemented mindfulness techniques successfully'
      }
    ];

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'date', title: 'Date' },
        { id: 'sessionType', title: 'Session Type' },
        { id: 'duration', title: 'Duration (min)' },
        { id: 'moodBefore', title: 'Mood Before (1-10)' },
        { id: 'moodAfter', title: 'Mood After (1-10)' },
        { id: 'anxietyLevel', title: 'Anxiety Level (1-10)' },
        { id: 'stressLevel', title: 'Stress Level (1-10)' },
        { id: 'goals', title: 'Session Goals' },
        { id: 'notes', title: 'Clinical Notes' }
      ]
    });

    await csvWriter.writeRecords(records);
    
    const stats = await fs.stat(filePath);
    return { filePath, fileSize: stats.size };
  }

  static async generateFHIRBundle(
    userId: number,
    dateRange: { start: string; end: string }
  ): Promise<{ filePath: string; fileSize: number }> {
    
    const fileName = `fhir_bundle_${userId}_${Date.now()}.json`;
    const filePath = path.join(process.cwd(), 'exports', fileName);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Generate FHIR Bundle
    const bundle = {
      resourceType: "Bundle",
      id: `bundle-${userId}-${Date.now()}`,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ["http://hl7.org/fhir/us/core/StructureDefinition/us-core-documentreference"]
      },
      type: "document",
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `Patient/patient-${userId}`,
          resource: FHIRService.generatePatientResource(userId, {
            firstName: "John",
            lastName: "Doe"
          })
        },
        {
          fullUrl: `Encounter/encounter-session-1`,
          resource: FHIRService.generateEncounterResource(
            "session-1", 
            userId, 
            1, 
            {
              startTime: dateRange.start,
              endTime: dateRange.end,
              duration: 45
            }
          )
        },
        {
          fullUrl: `Observation/observation-mood-1`,
          resource: FHIRService.generateObservationResource(
            "mood-1",
            userId,
            "mood",
            7,
            new Date().toISOString()
          )
        }
      ]
    };

    await fs.writeFile(filePath, JSON.stringify(bundle, null, 2));
    
    const stats = await fs.stat(filePath);
    return { filePath, fileSize: stats.size };
  }
}

// Audit Logging Service
export class AuditService {
  
  static async logAccess(
    userId: number | null,
    therapistId: number | null,
    action: string,
    resourceType: string,
    resourceId: string,
    ipAddress: string,
    userAgent: string,
    outcome: 'success' | 'failure' | 'partial',
    details?: any
  ): Promise<void> {
    
    const auditLog: InsertAuditLog = {
      userId,
      therapistId,
      action,
      resourceType,
      resourceId,
      ipAddress,
      userAgent,
      outcome,
      details: details ? JSON.stringify(details) : null
    };

    // Log to database (would implement storage methods)
    console.log('Audit Log:', auditLog);
  }
}

// Encryption Service for Secure Data Handling
export class EncryptionService {
  
  private static readonly algorithm = 'aes-256-gcm';
  
  static encrypt(text: string, key: string): { encryptedData: string; authTag: string; iv: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('TraI-EHR-Integration'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
      iv: iv.toString('hex')
    };
  }
  
  static decrypt(encryptedData: string, authTag: string, iv: string, key: string): string {
    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAAD(Buffer.from('TraI-EHR-Integration'));
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  static generateSecureKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}