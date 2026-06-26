'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, ImageIcon, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface IngredientInputProps {
  onAnalyze: (ingredients: string[]) => void;
  isLoading: boolean;
}

export default function IngredientInput({ onAnalyze, isLoading }: IngredientInputProps) {
  const [textIngredients, setTextIngredients] = useState('');
  const [uploadedIngredients, setUploadedIngredients] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleTextSubmit = () => {
    const ingredients = textIngredients
      .split(',')
      .map(i => i.replace(/[\r\n]+/g, ' ').trim())
      .filter(i => i.length > 0);

    if (ingredients.length > 0) {
      onAnalyze(ingredients);
    } else {
      toast({
        title: "Validation Error",
        description: "Please enter at least one ingredient.",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG images are supported.",
        variant: "destructive"
      });
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/analysis/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      setUploadedIngredients(data.ingredients);
      toast({
        title: "OCR Successful",
        description: `Successfully extracted ${data.count} ingredients!`,
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      const errMsg = error.response?.data?.detail || error.message || "Failed to extract ingredients from the image. Please try again or paste manually.";
      toast({
        title: "OCR Failed",
        description: errMsg,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadedAnalyze = () => {
    if (uploadedIngredients.length > 0) {
      onAnalyze(uploadedIngredients);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-md border border-zinc-200">
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Paste Ingredients
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Scan Ingredient List Image
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Enter Comma-Separated Ingredients</label>
            <Textarea
              placeholder="Water, Glycerin, Niacinamide, Hyaluronic Acid, Phenoxyethanol, Parfum..."
              value={textIngredients}
              onChange={(e) => setTextIngredients(e.target.value)}
              className="min-h-[160px] bg-zinc-50 border-zinc-200 focus:bg-white transition-colors"
            />
          </div>
          <Button
            onClick={handleTextSubmit}
            disabled={isLoading || textIngredients.trim().length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-colors py-6 text-base"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Ingredients'}
          </Button>
        </TabsContent>

        <TabsContent value="image" className="space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50/50' : 'border-zinc-300 hover:border-indigo-400 bg-zinc-50/50'
              }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer block">
              <Upload className="mx-auto h-12 w-12 text-zinc-400 mb-3" />
              <p className="text-sm font-semibold text-zinc-700">
                Drag and drop your ingredient label here
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                or click to browse from files (JPEG, PNG up to 5MB)
              </p>
            </label>
            {isUploading && (
              <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-semibold text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                Reading ingredients via OCR...
              </div>
            )}
          </div>

          {uploadedIngredients.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-2 text-green-600 font-semibold text-sm">
                <CheckCircle className="h-5 w-5" />
                Extracted {uploadedIngredients.length} ingredients successfully!
              </div>
              <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200 max-h-40 overflow-y-auto">
                <p className="text-sm text-zinc-700 leading-relaxed">{uploadedIngredients.join(', ')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUploadedIngredients([])}
                  className="w-1/4"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleUploadedAnalyze}
                  disabled={isLoading}
                  className="w-3/4 bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Extracted Ingredients'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
