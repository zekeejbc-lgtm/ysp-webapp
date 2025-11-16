# Homepage Content Field Mapping - Complete Reference

## Overview
This document provides a comprehensive mapping of all homepage content fields from Google Sheets to backend (GAS) to frontend (React).

---

## Hero Section

### Welcome Heading
- **Sheet Key:** `title`
- **Backend Field:** `hero_main_heading`
- **Frontend:** `homepageContent.hero.mainHeading`
- **Current Value:** "Welcome to Youth Service Philippines!"
- **Fallback:** "Welcome to Youth Service Philippines"

### Subheading
- **Sheet Key:** `subtitle`
- **Backend Field:** `hero_sub_heading`
- **Frontend:** `homepageContent.hero.subHeading`
- **Current Value:** "Tagum Chapter"
- **Fallback:** "Tagum Chapter"

### Tagline/Motto
- **Sheet Key:** `motto`
- **Backend Field:** `hero_tagline`
- **Frontend:** `homepageContent.hero.tagline`
- **Current Value:** "Empowering youth to serve communities and build a better future for all Filipinos"
- **Fallback:** "Empowering youth to serve communities"

### Membership Button
- **Sheet Key:** `membership_URL`
- **Backend Field:** `membership_URL`
- **Frontend:** `homepageContent.hero.membershipURL`
- **Current Value:** `https://forms.gle/nS8m7mj2LovBevUZ8`
- **Behavior:** Opens link in new tab; shows toast "No Opened Applications" if empty
- **Icon:** ❌ (changed to HandHeart for "Tabang ta Bai" button at bottom)

---

## About Section

### Title
- **Sheet Key:** N/A (hardcoded)
- **Backend Field:** `about_title`
- **Frontend:** `homepageContent.about.title`
- **Value:** "About Us"

### Content
- **Sheet Key:** `aboutYSP`
- **Backend Field:** `about_content`
- **Frontend:** `homepageContent.about.content`
- **Current Value:** Full organizational description (200+ words)

---

## Mission Section

### Title
- **Sheet Key:** N/A (hardcoded)
- **Backend Field:** `mission_title`
- **Frontend:** `homepageContent.mission.title`
- **Value:** "Our Mission"

### Content
- **Sheet Key:** `mission`
- **Backend Field:** `mission_content`
- **Frontend:** `homepageContent.mission.content`
- **Current Value:** "YSP empowers young leaders to drive sustainable community development..."

---

## Vision Section

### Title
- **Sheet Key:** N/A (hardcoded)
- **Backend Field:** `vision_title`
- **Frontend:** `homepageContent.vision.title`
- **Value:** "Our Vision"

### Content
- **Sheet Key:** `vision`
- **Backend Field:** `vision_content`
- **Frontend:** `homepageContent.vision.content`
- **Current Value:** "YSP actively fosters civic engagement, collaboration..."

---

## Advocacy Pillars Section

### Title
- **Sheet Key:** N/A (hardcoded)
- **Backend Field:** N/A
- **Frontend:** `homepageContent.advocacyPillars.title`
- **Value:** "Our Advocacy Pillars"

### Introduction
- **Sheet Key:** `Section 3. YSP shall be guided by the following advocacy pillars:`
- **Backend Field:** `objectives[0]`
- **Frontend:** `homepageContent.advocacyPillars.intro`
- **Format:** "**Section 3.** {content}"

### Pillars Array
- **Sheet Key:** TBD (future enhancement)
- **Backend Field:** `advocacy_pillars`
- **Frontend:** `homepageContent.advocacyPillars.pillars`
- **Current:** Empty array (to be populated)

---

## Projects Implemented Section

### Title
- **Sheet Key:** N/A (hardcoded)
- **Backend Field:** N/A
- **Frontend:** `homepageContent.projects.title`
- **Value:** "Projects Implemented"

### Project Data (Legacy Format)
Each project uses indexed keys:

- **Title:** `projectTitle_N` (N = 1, 2, 3, ...)
- **Description:** `projectDesc_N`
- **Image URL:** `projectImageUrl_N`
  - **Upload Folder:** `PROJECTS_IMPLEMENTED_FOLDER_ID` (1WfWmKxF9ewna6E5GnyAmNVS5HI7rlqRR)
  - **Format:** `https://drive.google.com/uc?export=view&id=FILE_ID`
- **Link URL:** `projectLinkURL_N`

**Backend Processing:**
```javascript
// Legacy projects parsed in handleGetHomepageContent
var legacyProjects = [];
while (projectIndex < 50) {
  if (map['projectTitle_' + projectIndex]) {
    legacyProjects.push({
      id: 'legacy_' + projectIndex,
      title: map['projectTitle_' + projectIndex],
      description: map['projectDesc_' + projectIndex],
      image: map['projectImageUrl_' + projectIndex],
      link: map['projectLinkURL_' + projectIndex]
    });
  }
  projectIndex++;
}
```

**Frontend:**
```typescript
data.content.projects.map((p: any) => ({
  id: p.id || p.title,
  title: p.title || '',
  description: p.description || '',
  imageUrl: p.image || 'https://images.unsplash.com/...',
  link: p.link || '',
  linkText: p.linkText || 'Learn More'
}))
```

---

## Organizational Chart Section

### Chart Image URL
- **Sheet Key:** `orgChartUrl`
- **Backend Field:** `orgChartUrl`
- **Frontend:** Used directly in `<img>` tag
- **Upload Folder:** `ORGCHART_UPLOAD_FOLDER_ID` (109vHL0iaJAcmAb0H9v6qSAdWJk2bAHyt)
- **Format:** `https://drive.google.com/uc?export=view&id=FILE_ID`

---

## Founder Section

### Name
- **Sheet Key:** `founderName`
- **Backend Field:** `founderName`
- **Frontend:** Displayed in modal/card
- **Current Value:** TBD (from sheet)

### Image
- **Sheet Key:** TBD (future enhancement)
- **Backend Field:** TBD
- **Frontend:** Founder modal image
- **Upload Folder:** `FOUNDER_IMAGE_FOLDER_ID` (1d7emUcnL3YEOpS40Y19ssoEFAohDveuv)

---

## Developer Section

### Developer Data
- **Sheet Key:** N/A (from separate sheet/tab)
- **Backend Field:** Fetched separately
- **Frontend:** Developer modal
- **Upload Folder:** `DEVELOPER_IMAGE_FOLDER_ID` (1d7emUcnL3YEOpS40Y19ssoEFAohDveuv)

---

## Contact Section ("Get in Touch")

### Email
- **Sheet Key:** `email`
- **Backend Field:** `email`
- **Frontend:** `homepageContent.contact.email` & `emailHref`
- **Current Value:** `YSPTagumChapter@gmail.com`
- **Format:** `mailto:YSPTagumChapter@gmail.com`

### Phone
- **Sheet Key:** `phone`
- **Backend Field:** `phone`
- **Frontend:** `homepageContent.contact.phone` & `phoneHref`
- **Current Value:** `+63 917 123 4567`
- **Format:** `tel:+639171234567` (spaces removed)

### Location
- **Sheet Key:** `location_url`
- **Backend Field:** `location_url`
- **Frontend:** `homepageContent.contact.locationLink`
- **Current Value:** Empty (default text shown)
- **Default Text:** "Tagum City, Davao del Norte, Philippines"
- **Format:** Google Maps link (if provided)

### Social Media
- **Sheet Key:** `facebookUrl`
- **Backend Fields:**
  - `social_facebook`
  - `social_instagram`
  - `social_twitter`
  - `social_linkedin`
  - `social_youtube`
  - `social_tiktok`
- **Frontend:** `homepageContent.contact.socialLink`
- **Current Value:** `https://www.facebook.com/YSPTagumChapter`
- **Display Text:** "YSP Tagum Chapter"

### Partner with Us
- **Sheet Key:** `partner_url`
- **Backend Field:** `partner_url`
- **Frontend:** `homepageContent.contact.partnerButtonLink`
- **Current Value:** Empty (falls back to membership_URL)
- **Fallback:** `membership_URL`
- **Button Text:** "Partner with Us"
- **Title:** "🤝 Become Our Partner"

---

## Backend Response Structure

```javascript
{
  success: true,
  content: {
    // Legacy fields (compatibility)
    mission: "...",
    vision: "...",
    about: "...",
    motto: "...",
    membership_URL: "...",
    founderName: "...",
    orgChartUrl: "...",
    email: "...",
    phone: "...",
    location_url: "...",
    partner_url: "...",
    
    // Normalized hero fields
    hero_main_heading: "Welcome to Youth Service Philippines!",
    hero_sub_heading: "Tagum Chapter",
    hero_tagline: "Empowering youth...",
    
    // Normalized content fields
    about_title: "About Us",
    about_content: "...",
    mission_title: "Our Mission",
    mission_content: "...",
    vision_title: "Our Vision",
    vision_content: "...",
    
    // Social media (flat structure)
    social_facebook: "https://www.facebook.com/YSPTagumChapter",
    social_instagram: "",
    social_twitter: "",
    social_linkedin: "",
    social_youtube: "",
    social_tiktok: "",
    
    // Advocacy
    objectives: ["Section 3 text..."],
    advocacy_pillars: [],
    
    // Projects (combined array)
    projects: [
      {
        id: "legacy_1",
        title: "...",
        description: "...",
        image: "https://drive.google.com/uc?export=view&id=...",
        link: "...",
        linkText: "Learn More",
        active: true
      }
    ]
  }
}
```

---

## UI Changes Summary

### ✅ Completed
1. **Tabang ta Bai Button Icon:** Changed from ❤️ emoji to `<HandHeart>` icon for consistency
2. **Membership Button Validation:** Added toast "No Opened Applications" when URL is empty
3. **Hero Section Mapping:** Connected to `title`, `subtitle`, `motto` sheet keys
4. **Contact Section:** Fully dynamic with conditional rendering (email, phone, location, social, partner)
5. **Advocacy Pillars Intro:** Connected to "Section 3" sheet key
6. **All Field Mappings:** Verified and documented

### 🔧 Backend Enhancements
1. **Image Upload Handler:** `handleUploadImage(data)` for GDrive uploads
2. **CORS-Friendly URLs:** Automatic conversion to `uc?export=view&id=` format
3. **Folder Configuration:** All 4 upload folders configured
4. **URL Converter Helper:** `convertToPublicDriveUrl(driveUrl)` for any Drive link format

### 📋 Pending
1. Frontend image upload UI component
2. Integration with project/orgchart/founder upload workflows
3. Advocacy pillars array population
4. Dynamic founder/developer data loading

---

## Testing Checklist

- [x] Hero section shows correct title/subtitle/tagline from sheet
- [x] Membership button opens correct URL or shows toast
- [x] About/Mission/Vision content populated from sheet
- [x] Contact section renders only available links
- [x] Projects array shows combined legacy + sheet projects
- [x] Backend normalized fields present in response
- [ ] Image upload works for all 4 types
- [ ] Uploaded images display without CORS errors
- [ ] Founder section shows founder name and image
- [ ] Org chart displays from sheet URL

---

## Deployment Steps

1. **Backend:**
   ```bash
   # Push updated YSP_LoginAccess.gs to Google Apps Script
   clasp push
   clasp deploy
   ```

2. **Frontend:**
   ```bash
   # Build and test
   npm run dev
   # Verify all mappings in browser console
   ```

3. **Verification:**
   - Check console for `[DEBUG] Loaded homepageContent:` log
   - Test membership button with empty and filled URL
   - Verify contact cards render conditionally
   - Test Tabang ta Bai button icon

---

## Migration Notes

All field mappings are backward compatible. The backend returns both legacy fields (`mission`, `vision`, `about`) and new normalized fields (`mission_content`, `vision_content`, `about_content`) to support gradual frontend migration.

**Recommendation:** Use normalized fields for all new code; legacy fields maintained for compatibility only.
