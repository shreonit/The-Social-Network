/**
 * Convert a file to base64 string
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Validate image URL format
 */
export const isValidImageUrl = (url: string): boolean => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.endsWith(ext)) || 
         lowerUrl.startsWith('data:image/') ||
         lowerUrl.startsWith('https://') ||
         lowerUrl.startsWith('http://');
};

/**
 * Validate file is an image
 */
export const isValidImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

