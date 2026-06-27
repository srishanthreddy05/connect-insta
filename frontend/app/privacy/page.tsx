"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
        {/* Navigation back */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group font-medium"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Login
        </Link>

        {/* Header */}
        <div className="border-b border-border/40 pb-6 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-lg glow-sm">
              <Shield className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl ig-gradient-text">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: June 2026
          </p>
        </div>

        {/* Content sections as glassmorphic cards */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">01.</span>
              Information We Collect
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When you authenticate with our application, we collect details related to your Instagram Business account (such as username, account ID) and Facebook Page metadata through Meta's official OAuth mechanism. We do not harvest or access personal data outside of what is strictly necessary to run the automation scripts.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">02.</span>
              How We Use Your Information
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We process the collected data solely to perform automations that you explicitly set up. This includes responding to comments on your Instagram posts, sending automated Direct Messages, and tracking execution metrics on your dashboard. We do not sell, license, or share your data with any external advertising networks.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">03.</span>
              Instagram Data & Meta Platform Policy Compliance
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Our application communicates exclusively with official Meta APIs. We maintain strict compliance with all Meta Platform Terms and Developer Policies. We limit our permissions request to those critical to the application's basic operations (comments and messages) and respect the security boundaries defined by the Meta Graph API.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">04.</span>
              Data Retention & Deletion
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your credentials (OAuth long-lived access tokens) are stored using secure AES-256 encryption. We retain this data only as long as your account remains connected to our platform. You may request the deletion of all data associated with your profile at any time by utilizing the "Disconnect Account" feature in your dashboard, which triggers a complete, transactional purge of your database rows.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">05.</span>
              Third-Party Services
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We leverage Google Firebase for user authentication and PostgreSQL as our database system. All communications between our microservices are encrypted in transit via SSL. We do not introduce third-party trackers or analytic tools that compromise your or your audience's privacy.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">06.</span>
              Contact Us
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, your data rights, or how we manage platform integrations, please reach out to us at:
            </p>
            <div className="mt-2 rounded-xl bg-muted/30 border border-border/40 p-4 font-semibold text-sm text-center">
              srishanthreddyy05@gmail.com
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
