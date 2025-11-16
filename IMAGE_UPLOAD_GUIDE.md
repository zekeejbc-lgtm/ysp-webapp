# Image Upload Mechanism Guide

## Overview
The YSP Web App now supports seamless image uploads to Google Drive with automatic CORS-friendly URL transformation.

## Backend Implementation

### Google Drive Folder Configuration
The following folders are configured in `YSP_LoginAccess.gs`:

```javascript
// Folder IDs from user requirements
const PROJECTS_IMPLEMENTED_FOLDER_ID = '1WfWmKxF9ewna6E5GnyAmNVS5HI7rlqRR';
const ORGCHART_UPLOAD_FOLDER_ID = '109vHL0iaJAcmAb0H9v6qSAdWJk2bAHyt';
const FOUNDER_IMAGE_FOLDER_ID = '1d7emUcnL3YEOpS40Y19ssoEFAohDveuv';
const DEVELOPER_IMAGE_FOLDER_ID = '1d7emUcnL3YEOpS40Y19ssoEFAohDveuv';
```

### Upload Handler: `handleUploadImage(data)`

**Endpoint:** `action: 'uploadImage'`

**Request Parameters:**
```javascript
{
  action: 'uploadImage',
  base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // Base64 encoded image
  fileName: 'project_1.jpg',                                // Optional filename
  uploadType: 'project',                                     // Required: 'project', 'orgchart', 'founder', or 'developer'
  mimeType: 'image/jpeg'                                     // Optional, defaults to 'image/jpeg'
}
```

**Response:**
```javascript
{
  success: true,
  message: 'Image uploaded successfully',
  fileId: '1abc123...',
  publicUrl: 'https://drive.google.com/uc?export=view&id=1abc123...',
  fileName: 'project_1.jpg',
  uploadType: 'project'
}
```

### Upload Types
- `project` / `projects` → ProjectsImplementedURL folder
- `orgchart` / `org_chart` → OrgChartURL folder
- `founder` → FounderURL folder
- `developer` → DeveloperURL folder

### CORS-Friendly URL Conversion
All uploaded images are automatically converted to the public format:
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

This format bypasses CORS restrictions and works directly in `<img>` tags.

### Helper Function: `convertToPublicDriveUrl(driveUrl)`
Converts any Google Drive URL format to the public view format:

**Supported Input Formats:**
- `https://drive.google.com/file/d/FILE_ID/view`
- `https://drive.google.com/open?id=FILE_ID`
- `https://drive.google.com/uc?export=view&id=FILE_ID` (already correct)

**Output:**
```
https://drive.google.com/uc?export=view&id=FILE_ID
```

## Frontend Integration (To Be Implemented)

### Example Upload Function
```typescript
import { callGAS } from './gasApi';

async function uploadImage(file: File, uploadType: 'project' | 'orgchart' | 'founder' | 'developer') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const base64Image = reader.result as string;
        
        const response = await callGAS('uploadImage', {
          base64Image,
          fileName: file.name,
          uploadType,
          mimeType: file.type
        });
        
        if (response.success) {
          resolve(response.publicUrl);
        } else {
          reject(new Error(response.message));
        }
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Usage example
const imageUrl = await uploadImage(file, 'project');
console.log('Uploaded image URL:', imageUrl);
```

### UI Component Example
```tsx
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

function ImageUploader({ uploadType, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const imageUrl = await uploadImage(file, uploadType);
      toast.success('Image uploaded successfully!');
      onUploadSuccess(imageUrl);
    } catch (error) {
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div>
      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition">
        <Upload className="w-4 h-4" />
        {uploading ? 'Uploading...' : 'Upload Image'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  );
}
```

## Homepage Content Field Mappings (Updated)

### Hero Section
- **Title** → `data.content.title` → `hero_main_heading`
- **Subtitle** → `data.content.subtitle` → `hero_sub_heading`
- **Tagline** → `data.content.motto` → `hero_tagline`
- **Membership Button** → `data.content.membership_URL` (shows toast if empty)

### About Section
- **Title** → "About Us"
- **Content** → `data.content.aboutYSP` → `about_content`

### Mission & Vision
- **Mission** → `data.content.mission` → `mission_content`
- **Vision** → `data.content.vision` → `vision_content`

### Advocacy Pillars
- **Intro** → `data.content['Section 3. YSP shall be guided by the following advocacy pillars:']`
- **Pillars** → `data.content.advocacy_pillars` (array)

### Projects Implemented
- **Title** → `projectTitle_N`
- **Description** → `projectDesc_N`
- **Image** → `projectImageUrl_N` (upload to ProjectsImplementedURL folder)
- **Link** → `projectLinkURL_N`

### Organizational Chart
- **URL** → `data.content.orgChartUrl` (upload to OrgChartURL folder)

### Founder
- **Name** → `data.content.founderName`
- **Image** → Upload to FounderURL folder

### Contact Section
- **Email** → `data.content.email`
- **Phone** → `data.content.phone`
- **Location** → `data.content.location_url`
- **Social Media** → `data.content.facebookUrl` → `social_facebook`
- **Partner URL** → `data.content.partner_url`

## Upload Workflow

1. **User selects image** → Frontend file input
2. **Convert to Base64** → FileReader API
3. **Call GAS API** → `action: 'uploadImage'` with base64Image and uploadType
4. **Backend processes:**
   - Decodes Base64
   - Creates blob
   - Uploads to appropriate Drive folder
   - Sets public sharing permissions
   - Returns CORS-friendly URL
5. **Frontend receives URL** → Update state/display image
6. **Store URL in sheet** → Update Homepage Content or relevant sheet

## Security Considerations

- All uploaded files are set to public view (required for CORS)
- File uploads require appropriate user authentication
- Consider implementing file size limits (recommended: 5MB max)
- Validate file types on both frontend and backend
- Implement rate limiting for upload endpoints

## Testing

### Test Upload
```bash
# Test from Apps Script console
var result = handleUploadImage({
  base64Image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  fileName: 'test_project.jpg',
  uploadType: 'project',
  mimeType: 'image/jpeg'
});
Logger.log(result);
```

### Verify URL Format
```javascript
// Expected format
const validUrl = 'https://drive.google.com/uc?export=view&id=1abc123xyz';

// Test conversion
const converted = convertToPublicDriveUrl('https://drive.google.com/file/d/1abc123xyz/view');
console.log(converted === validUrl); // true
```

## Deployment Notes

1. Deploy updated `YSP_LoginAccess.gs` to Google Apps Script
2. Verify folder permissions (all folders must be accessible by the service account)
3. Test upload from frontend with small image first
4. Monitor Apps Script logs for errors
5. Update frontend gasApi.ts with uploadImage function

## Next Steps

1. ✅ Backend upload handler implemented
2. ✅ Folder IDs configured
3. ✅ CORS-friendly URL conversion added
4. ⏳ Frontend upload UI component (pending)
5. ⏳ Integration with project/orgchart/founder sections (pending)
6. ⏳ Sheet update handlers for storing uploaded URLs (pending)

## Support

For issues or questions:
- Check Apps Script logs: `View > Logs` in Apps Script editor
- Verify folder permissions in Google Drive
- Test with small images first (< 1MB)
- Ensure service account has access to all folders
