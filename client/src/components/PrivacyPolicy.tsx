import React from 'react';
import { Shield, Lock, Eye, FileText, AlertTriangle, Phone } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-background to-theme-primary text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-lg text-blue-200">
            Effective Date: June 30, 2025 | Last Updated: July 1, 2025
          </p>
        </div>

        {/* Main Content */}
        <div className="theme-card rounded-lg p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <p className="text-lg leading-relaxed mb-6">
              TrAI ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our AI wellness companion platform.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            </div>
            <div className="space-y-3 ml-9">
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Personal Information:</h3>
                <p>Email address, login credentials, and usage metadata.</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Session Data:</h3>
                <p>Messages exchanged with TrAI are stored securely for long-term reflection, journaling, and personal insights.</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Voice Data:</h3>
                <p>If using voice functionality, audio is processed via ElevenLabs and may be stored temporarily for transcription or playback.</p>
              </div>
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Device Data:</h3>
                <p>Browser type, IP address, operating system.</p>
              </div>
            </div>
          </section>

          {/* Use of Information */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">2. Use of Information</h2>
            </div>
            <div className="ml-9">
              <p className="mb-3">We use your data to:</p>
              <ul className="list-disc list-inside space-y-2 text-blue-100">
                <li>Provide and improve TrAI's functionality and personalization</li>
                <li>Generate insights and wellness content</li>
                <li>Create journal entries and downloadable wellness summaries</li>
                <li>Detect emotional trends and mood changes over time</li>
              </ul>
            </div>
          </section>

          {/* Third-Party Services */}
          <section>
            <div className="flex items-center mb-4">
              <Lock className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">3. Third-Party Services</h2>
            </div>
            <div className="ml-9">
              <p className="mb-4">We utilize third-party processors who adhere to strict data privacy requirements:</p>
              <ul className="list-disc list-inside space-y-2 text-blue-100 mb-4">
                <li><strong>OpenAI</strong> â€“ for natural language understanding and generation</li>
                <li><strong>ElevenLabs</strong> â€“ for voice synthesis</li>
                <li><strong>Neon</strong> â€“ for secure, serverless database storage</li>
              </ul>
              <p className="text-blue-200">
                All third-party services are under strict contractual obligations not to use your data for any other purposes.
              </p>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">4. Data Retention</h2>
            </div>
            <p className="ml-9">
              We retain session content to support journaling and insights unless a user explicitly requests deletion. 
              Deletion requests can be made via your account settings or by contacting us at support@trai.app.
            </p>
          </section>

          {/* Security */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">5. Security</h2>
            </div>
            <ul className="list-disc list-inside space-y-2 text-blue-100 ml-9">
              <li>All data is encrypted in transit (TLS) and at rest (AES-256)</li>
              <li>Sensitive information is stored using cryptographic hashing and salted tokens</li>
              <li>Sessions are isolated via user-scoped access tokens</li>
              <li>API keys are securely managed via environment variables</li>
            </ul>
          </section>

          {/* Children's Privacy */}
          <section>
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">6. Children's Privacy</h2>
            </div>
            <p className="ml-9">
              TrAI is not intended for use by individuals under 18 years of age. We do not knowingly collect personal data from minors.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <div className="flex items-center mb-4">
              <Eye className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">7. Your Rights</h2>
            </div>
            <p className="ml-9">
              Depending on your location, you may have the right to access, modify, or delete your data under 
              applicable laws (e.g., GDPR, CCPA). To exercise these rights, contact support@trai.app.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-2xl font-semibold">8. Changes to This Policy</h2>
            </div>
            <p className="ml-9">
              We may update this Privacy Policy periodically. You'll be notified through the app or email.
            </p>
          </section>

        </div>

        {/* Terms of Service Section */}
        <div className="theme-card rounded-lg p-6 md:p-8 mt-8 space-y-8">
          
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-200">Terms of Service</h1>
            <p className="text-blue-300 mt-2">Effective Date: June 30, 2025</p>
          </div>

          {/* Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p>
              By using TrAI, you agree to these Terms of Service. If you do not agree, do not use the service.
            </p>
          </section>

          {/* Nature of Service */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Nature of the Service</h2>
            <p>
              TrAI is an AI-powered wellness companion designed to support emotional reflection and personal growth. 
              It is <strong className="text-red-300">not a licensed medical provider, wellness professional, or emergency service.</strong> 
              Any insights or suggestions provided are intended solely for informational and self-reflective purposes.
            </p>
          </section>

          {/* No Duty to Report */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">3. No Duty to Report</h2>
            <p>
              TrAI does <strong className="text-red-300">not have a legal or ethical obligation to report</strong> user 
              disclosures of abuse, harm, or illegal activity to authorities. All information shared is considered 
              confidential and will not be disclosed unless required by a valid legal process.
            </p>
          </section>

          {/* Emergency Disclaimer */}
          <section>
            <div className="flex items-center mb-4">
              <Phone className="w-6 h-6 text-red-400 mr-3" />
              <h2 className="text-2xl font-semibold text-red-300">4. Emergency Disclaimer</h2>
            </div>
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-100">
                TrAI is not appropriate for life-threatening situations or mental health crises. 
                If you are in danger, contact your local emergency services or a crisis hotline immediately.
              </p>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">5. User Conduct</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-blue-100">
              <li>Use TrAI for illegal purposes</li>
              <li>Attempt to exploit or reverse-engineer the system</li>
              <li>Impersonate others or falsify identity</li>
            </ul>
          </section>

          {/* Account Termination */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate access for violations of these terms.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
            <p>
              TrAI is provided "as is." We make no warranties about its accuracy, and we are not liable 
              for any damages resulting from your use of the platform.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Contact</h2>
            <p>
              For questions, contact us at <strong className="text-blue-300">support@trai.app</strong>
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-300">
          <p>Â© 2025 TrAI. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
