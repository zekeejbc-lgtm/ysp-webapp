export type UploadType = 'profile' | 'developer' | 'founder' | 'orgchart' | 'project';

type UploadOptions = {
  uploadType: UploadType;
  userIdCode?: string;
  maxSizeBytes?: number;
  extra?: Record<string, string>;
};

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

function getActionForType(type: UploadType) {
  switch (type) {
    case 'profile':
      return 'uploadProfilePicture';
    case 'developer':
      return 'uploadDeveloperImage';
    case 'founder':
      return 'uploadFounderImage';
    case 'orgchart':
      return 'uploadOrgChartImage';
    case 'project':
      return 'uploadProjectImage';
    default:
      return '';
  }
}

export async function uploadImageFile(file: File, options: UploadOptions) {
  const maxSize = options.maxSizeBytes ?? (options.uploadType === 'orgchart' ? 10 * 1024 * 1024 : 5 * 1024 * 1024);

  if (!file) return { success: false, message: 'No file provided' };
  if (file.size > maxSize) return { success: false, message: `Image must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };

  const idCode = options.userIdCode;
  if (!idCode) return { success: false, message: 'Please login to upload images' };

  const base64 = await fileToDataUrl(file);

  const action = getActionForType(options.uploadType);
  if (!action) return { success: false, message: 'Invalid upload type' };

  const body = new URLSearchParams({
    action,
    idCode,
    base64Image: base64,
    fileName: file.name,
    mimeType: file.type,
    ...(options.extra || {})
  } as Record<string, string>);

  try {
    const res = await fetch(import.meta.env.VITE_GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    });
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export default uploadImageFile;
