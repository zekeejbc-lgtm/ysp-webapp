/**
 * CREATE PROJECT HANDLER
 * This handler creates a new project in the Homepage_Projects sheet
 * 
 * Homepage_Projects Structure:
 * Column A (0): Project ID
 * Column B (1): Title
 * Column C (2): Description
 * Column D (3): ImageURL
 * Column E (4): Link
 * Column F (5): LinkText
 * Column G (6): Active (TRUE/FALSE)
 */

/**
 * Create a new project (Admin/Auditor only)
 * Expects: { 
 *   action: 'createProject', 
 *   idCode,
 *   title, 
 *   description, 
 *   link (optional),
 *   linkText (optional),
 *   imageBase64,
 *   imageFileName
 * }
 */
function handleCreateProject(data) {
  try {
    // Validate user permissions
    if (!data || !data.idCode) {
      return { success: false, message: 'ID Code is required' };
    }
    
    var role = _getUserRoleByIdCode(data.idCode);
    if (role !== 'Admin' && role !== 'Auditor') {
      return { success: false, message: 'Forbidden: Only Admin and Auditor can create projects' };
    }
    
    // Validate required fields
    if (!data.title || !data.description || !data.imageBase64) {
      return { success: false, message: 'Title, description, and image are required' };
    }
    
    // Step 1: Upload image to Google Drive
    var imageUploadResult = uploadProjectImageToDrive({
      base64Image: data.imageBase64,
      fileName: data.imageFileName || 'project-image.jpg',
      projectTitle: data.title
    });
    
    if (!imageUploadResult.success) {
      return imageUploadResult;
    }
    
    var imageUrl = imageUploadResult.imageUrl;
    
    // Step 2: Add project to Homepage_Projects sheet
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var projectsSheet = ss.getSheetByName('Homepage_Projects');
    
    if (!projectsSheet) {
      return { success: false, message: 'Homepage_Projects sheet not found' };
    }
    
    // Get next ID
    var lastRow = projectsSheet.getLastRow();
    var nextId = 1;
    
    if (lastRow > 1) {
      // Get all existing IDs and find the max
      var idRange = projectsSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < idRange.length; i++) {
        var currentId = parseInt(idRange[i][0]) || 0;
        if (currentId >= nextId) {
          nextId = currentId + 1;
        }
      }
    }
    
    // Prepare row data
    var newRow = [
      nextId,                           // Column A: Project ID
      data.title,                       // Column B: Title
      data.description,                 // Column C: Description
      imageUrl,                         // Column D: ImageURL
      data.link || '',                  // Column E: Link
      data.linkText || 'Learn More',    // Column F: LinkText
      true                              // Column G: Active
    ];
    
    // Append the new row
    projectsSheet.appendRow(newRow);
    
    Logger.log('Created new project: ID=' + nextId + ', Title=' + data.title);
    
    // Invalidate cache to force refresh
    invalidateCache('homepage_projects');
    
    return {
      success: true,
      message: 'Project created successfully',
      projectId: nextId,
      title: data.title,
      imageUrl: imageUrl
    };
    
  } catch (error) {
    Logger.log('Error in handleCreateProject: ' + error.toString());
    return { 
      success: false, 
      message: 'Error creating project: ' + error.message 
    };
  }
}

/**
 * Upload project image to Google Drive
 * Internal helper function
 */
function uploadProjectImageToDrive(params) {
  try {
    var folder = DriveApp.getFolderById(PROJECTS_IMPLEMENTED_FOLDER_ID);
    
    // Extract base64 data (remove data:image/xxx;base64, prefix if present)
    var base64Data = params.base64Image;
    if (base64Data.indexOf(',') > -1) {
      base64Data = base64Data.split(',')[1];
    }
    
    // Determine MIME type
    var mimeType = 'image/jpeg';
    if (params.base64Image.indexOf('data:image/png') > -1) {
      mimeType = 'image/png';
    } else if (params.base64Image.indexOf('data:image/jpg') > -1) {
      mimeType = 'image/jpeg';
    }
    
    // Create sanitized filename
    var sanitizedTitle = (params.projectTitle || 'project')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    var timestamp = new Date().getTime();
    var extension = mimeType === 'image/png' ? 'png' : 'jpg';
    var fileName = 'project_' + sanitizedTitle + '_' + timestamp + '.' + extension;
    
    // Create blob and upload
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      mimeType,
      fileName
    );
    
    var file = folder.createFile(blob);
    
    // Set public sharing
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Generate public URL
    var fileId = file.getId();
    var publicUrl = 'https://drive.google.com/uc?export=view&id=' + fileId;
    
    Logger.log('Uploaded project image: ' + fileName + ' -> ' + publicUrl);
    
    return {
      success: true,
      imageUrl: publicUrl,
      fileName: fileName,
      fileId: fileId
    };
    
  } catch (error) {
    Logger.log('Error uploading project image: ' + error.toString());
    return {
      success: false,
      message: 'Error uploading image: ' + error.message
    };
  }
}

/**
 * Helper function to invalidate cache
 * (This should already exist in YSP_LoginAccess.gs, but included here for reference)
 */
function invalidateCache(cacheKey) {
  try {
    var cache = CacheService.getScriptCache();
    cache.remove(cacheKey);
    Logger.log('Cache invalidated: ' + cacheKey);
  } catch (e) {
    Logger.log('Error invalidating cache: ' + e.toString());
  }
}
