const Privacy = () => {
  return (
    <div className="container">
      <div className="static-page">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> {new Date().toLocaleDateString()}</p>
        
        <h2>1. Information We Collect</h2>
        <p>SOCIATE collects the following information:</p>
        <ul>
          <li>Account information (username, email, profile data)</li>
          <li>Content you create (posts, comments)</li>
          <li>Usage data (preferences, settings)</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide and improve our services</li>
          <li>Personalize your experience</li>
          <li>Communicate with you about your account</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Currently, SOCIATE stores all data locally in your browser using localStorage.
          This means your data remains on your device and is not transmitted to external servers.
        </p>

        <h2>4. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your information. However,
          no method of transmission over the internet is 100% secure.
        </p>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Update or correct your information</li>
          <li>Delete your account and data</li>
        </ul>

        <h2>6. Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us through
          the app settings.
        </p>
      </div>
    </div>
  );
};

export default Privacy;

