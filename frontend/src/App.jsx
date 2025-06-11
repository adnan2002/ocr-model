import { useState, useRef, useCallback } from 'react';
import { Upload, ImageIcon, X, FileText } from 'lucide-react';

const App = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);

  const allowedExtensions = ['jpg', 'jpeg', 'png', 'avif'];
  const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost') {
    // We are on the host computer for development
    return 'http://localhost:8000';
  }
  // We are accessing from another device on the LAN.
  // Use the computer's IP address (which is the current hostname).
  return `http://${hostname}:8000`;
};
const API_BASE_URL = getApiBaseUrl();
  // Toast management
  const addToast = (message, type = 'error') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // File validation
  const validateFile = (file) => {
    if (!file || file.type.indexOf('image/') !== 0) {
      addToast('Please upload only image files');
      return false;
    }

    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      addToast(`Unsupported file format. Please use: ${allowedExtensions.join(', ').toUpperCase()}`);
      return false;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      addToast('File size too large. Please use an image under 10MB');
      return false;
    }

    return true;
  };


  // const handleCapital = (text)=>{
  //   const text_arr = text.split(" ");
  //   const result = text_arr.map((val)=>{
  //     let temp = val.slice(1, val.length);
  //     return val.charAt(0).toUpperCase() + temp;
  //   })
  //   return result.join(" ")
  // }

  // Process and upload image
  const processImage = async (file) => {
    if (!validateFile(file)) return;

    try {
      // Create preview URL
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage(imageUrl);

      // Start loading
      setIsLoading(true);
      addToast('Processing image...', 'loading');

      // Simulate API call (replace with your actual endpoint)
      const formData = new FormData();
      formData.append('file', file); 

      const response = await fetch(`${API_BASE_URL}/ocr`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.text) {
        setExtractedText(result.text);
        addToast('Text extraction completed successfully!', 'success');
      } else {
        throw new Error('No text found in the response');
      }

    } catch (error) {
      console.error('OCR Error:', error);
      addToast(`Failed to extract text: ${error.message}`);
      setExtractedText('');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processImage(file);
    }
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle paste
  const handlePaste = useCallback(async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          processImage(file);
          return;
        }
      }
    }

    // If we get here, no image was found in clipboard
    addToast('No image found in clipboard. Please copy an image and try again.');
  }, []);

  // Clear all data
  const clearAll = () => {
    setUploadedImage(null);
    setExtractedText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              flex items-center px-4 py-3 rounded-lg shadow-lg transition-all duration-300 transform
              ${toast.type === 'error' ? 'bg-red-500 text-white' : 
                toast.type === 'success' ? 'bg-green-500 text-white' : 
                'bg-blue-500 text-white'}
            `}
          >
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-white hover:text-gray-200 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Image OCR Tool</h1>
          <p className="text-gray-600">Upload an image to extract text using optical character recognition</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                <Upload size={24} className="text-blue-600" />
                Upload Image
              </h2>
              {(uploadedImage || extractedText) && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                  Clear All
                </button>
              )}
            </div>

            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onPaste={handlePaste}
              onClick={() => fileInputRef.current?.click()}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
            >
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="max-w-full max-h-64 mx-auto rounded-lg shadow-md"
                  />
                  <p className="text-sm text-gray-600">Click to upload a different image</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon size={48} className="mx-auto text-gray-400" />
                  <div>
                    <p className="text-lg font-medium text-gray-700">
                      Drop an image here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      You can also paste an image from your clipboard (Ctrl+V)
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supported formats: JPG, JPEG, PNG, AVIF (max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.avif"
              onChange={handleFileChange}
              className="hidden"
            />

 {/* Paste Text Field */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or paste image here:
              </label>
              <input
                type="text"
                placeholder="Click here and paste an image (Ctrl+V)"
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">
                Copy an image from anywhere and paste it in this field
              </p>
            </div>
          </div>
          {/* Results Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={24} className="text-green-600" />
              Extracted Text
            </h2>

            <div className="relative">
              <textarea
                value={extractedText}
                readOnly
                placeholder={isLoading ? "Processing image..." : "Extracted text will appear here..."}
                className="w-full h-80 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              />
              
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Extracting text...</span>
                  </div>
                </div>
              )}
            </div>

            {extractedText && (
              <div className="mt-4 flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  {extractedText.length} characters extracted
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(extractedText)
                    addToast('Text copied to clipboard!', 'success');
                  }
                  }

                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  Copy Text
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">How to use:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 text-blue-600 rounded-full p-2 mt-1">
                <Upload size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-800">1. Upload Image</p>
                <p>Click to browse or drag & drop an image file</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-green-100 text-green-600 rounded-full p-2 mt-1">
                <FileText size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-800">2. Auto Process</p>
                <p>Text extraction starts automatically</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 text-purple-600 rounded-full p-2 mt-1">
                <X size={16} />
              </div>
              <div>
                <p className="font-medium text-gray-800">3. Copy or Clear</p>
                <p>Copy the extracted text or clear to start over</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;