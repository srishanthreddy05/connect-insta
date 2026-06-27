"use client";

import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfServicePage() {
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
              <FileText className="h-5 w-5" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl ig-gradient-text">
              Terms of Service
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
              Acceptance of Terms
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              By connecting your Instagram Business account to our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you are prohibited from utilizing our service and must immediately disconnect all linked profiles.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">02.</span>
              Use of Service
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You are granted a limited, non-exclusive, non-transferable, revocable license to access and use the platform solely for the purpose of managing conversational automations. You agree that your use of the service is subject to the limitations set forth in these terms, developer standards, and applicable local rules.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">03.</span>
              Instagram Account Connection
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              To operate our automation engine, you must grant the system access tokens via standard Meta OAuth authorization. You are responsible for ensuring that the connected accounts belong to you or that you possess proper legal authorization to bind them. You must keep all credentials secure.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">04.</span>
              Prohibited Conduct
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You agree not to engage in activities that abuse Meta's messaging systems, send spam, broadcast unsolicited commercial messages, or transmit illegal or harmful content. You must not attempt to scrape, reverse engineer, or degrade the performance of the automation engine.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">05.</span>
              Termination
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We reserve the right, in our sole discretion and without liability, to suspend or terminate your access to the platform at any time, with or without notice, if we believe you are violating these terms, Instagram's API policy, or if we cease offering the service.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">06.</span>
              Disclaimer of Warranties
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES, EXPRESS, IMPLIED, OR STATUTORY. WE DISCLAIM ANY WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">07.</span>
              Governing Law
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              These Terms of Service and any dispute arising from your use of the platform shall be governed by and construed in accordance with the laws of our primary operating jurisdiction, without regard to conflicts of law principles.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 space-y-3 transition-all hover:glow-sm hover:scale-[1.005]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary font-mono text-sm">08.</span>
              Contact Us
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have any questions or concerns regarding these Terms, please contact us via email at:
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
