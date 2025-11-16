const { google } = require('googleapis');
(async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: './secrets/ysp-web-app-migration.json',
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1zTgBQw3ISAtagKOKhMYl6JWL6DnQSpcHt7L3UnBevuU';
    const range = 'Homepage Content!A1:I200';
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];
    if (!rows.length) {
      console.error('No rows in Homepage Content sheet.');
      return;
    }
    const headers = rows[0]; // Expecting [Key, Value, UpdatedAt, ...]
    const kv = {};
    rows.slice(1).forEach(r => {
      const key = r[0];
      if (!key) return;
      const value = (r[1] || '').toString().trim();
      kv[key] = value;
    });

    // Collect legacy projects
    const projectMap = {};
    Object.keys(kv).forEach(k => {
      const match = k.match(/project(?:Title|Desc|ImageUrl|LinkURL)_(\d+)/i);
      if (match) {
        const idx = match[1];
        projectMap[idx] = projectMap[idx] || { id: idx };
        if (/projectTitle_/i.test(k)) projectMap[idx].title = kv[k];
        if (/projectDesc_/i.test(k)) projectMap[idx].description = kv[k];
        if (/projectImageUrl_/i.test(k)) projectMap[idx].image = kv[k];
        if (/projectLinkURL_/i.test(k)) projectMap[idx].link = kv[k];
      }
    });
    const legacyProjects = Object.values(projectMap).filter(p => p.title || p.description || p.image || p.link);

    // Normalized output similar to GAS handler
    const normalized = {
      hero_main_heading: kv.title || 'Welcome to Youth Service Philippines',
      hero_sub_heading: kv.subtitle || 'Tagum Chapter',
      hero_tagline: kv.motto || 'Empowering youth to serve communities',
      about_title: 'About Us',
      about_content: kv.aboutYSP || '',
      mission_title: 'Our Mission',
      mission_content: kv.mission || '',
      vision_title: 'Our Vision',
      vision_content: kv.vision || '',
      membership_URL: kv.membership_URL || '',
      partner_url: kv.partner_url || '',
      location_url: kv.location_url || '',
      email: kv.email || '',
      phone: kv.phone || '',
      social_facebook: kv.facebookUrl || '',
      social_instagram: kv.instagram_url || '',
      social_twitter: kv.twitter_url || '',
      social_linkedin: kv.linkedin_url || '',
      social_youtube: kv.youtube_url || '',
      social_tiktok: kv.tiktok_url || '',
      projects: legacyProjects
    };

    console.log('\nNormalized Homepage JSON Preview:\n');
    console.log(JSON.stringify(normalized, null, 2));
    console.log('\nField Summary:');
    Object.keys(normalized).forEach(k => {
      if (k === 'projects') {
        console.log(`- projects: ${normalized.projects.length} legacy entries`);
      } else {
        console.log(`- ${k}: ${normalized[k] ? 'OK' : 'EMPTY'}`);
      }
    });
  } catch (e) {
    console.error('Simulation error:', e.message);
  }
})();
