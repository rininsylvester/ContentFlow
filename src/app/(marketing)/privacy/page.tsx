import { LegalPage } from "@/components/marketing/legal-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 19, 2026">
      <p>
        This policy explains what personal data CreatorHub ([Company name]) collects, why, and the
        choices you have.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, and name and profile picture if you sign in
          with Google.
        </li>
        <li>
          <strong>Content:</strong> what you enter into the tools, your brand voice profile,
          generated outputs, saved items and calendar entries.
        </li>
        <li>
          <strong>Billing data:</strong> subscription status and a Stripe customer ID. Card details
          are handled by Stripe and never reach our servers.
        </li>
        <li>
          <strong>Usage data:</strong> generation counts, token usage and cost estimates, used to
          enforce plan limits.
        </li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>
          To provide the Service, including sending your inputs to our AI provider to generate
          outputs.
        </li>
        <li>To enforce trial and fair-use limits and to prevent abuse.</li>
        <li>To process payments and send account and billing emails.</li>
      </ul>
      <p>We do not sell your personal data or use your content for advertising.</p>
      <h2>Service providers</h2>
      <ul>
        <li>Supabase — authentication and database hosting.</li>
        <li>
          Anthropic — AI generation (your prompts and outputs are processed to generate responses).
        </li>
        <li>Stripe — payments and billing portal.</li>
        <li>Vercel — application hosting.</li>
      </ul>
      <h2>Retention</h2>
      <p>
        We keep your data while your account is active. When you delete your account we delete your
        content within 30 days, except records we must keep for legal or tax purposes.
      </p>
      <h2>Your rights</h2>
      <p>
        Depending on where you live, you may have the right to access, correct, export or delete
        your data, and to object to certain processing. Contact [privacy email] to exercise these
        rights.
      </p>
      <h2>Security</h2>
      <p>
        Data is encrypted in transit, access to each user&apos;s data is restricted at the database
        level, and API keys never reach the browser.
      </p>
      <h2>Cookies</h2>
      <p>
        We use only essential cookies to keep you signed in, plus local browser storage to remember
        drafts and your theme. We do not use advertising or tracking cookies.
      </p>
      <h2>Contact</h2>
      <p>[Company name], [address]. Email: [privacy email].</p>
    </LegalPage>
  );
}
