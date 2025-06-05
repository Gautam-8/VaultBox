import * as React from "react";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";

interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  preview?: boolean;
  onFileSelect?: (file: File | null) => void;
}

export function FileUpload({
  className,
  preview = true,
  onFileSelect,
  accept,
  ...props
}: FileUploadProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

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
      const file = e.dataTransfer.files[0];
      if (accept) {
        const acceptedTypes = accept.split(',').map(type => type.trim());
        if (!acceptedTypes.some(type => 
          file.type === type || 
          (type.startsWith('.') && file.name.toLowerCase().endsWith(type.toLowerCase()))
        )) {
          return;
        }
      }
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    if (onFileSelect) {
      onFileSelect(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'BUTTON') {
      e.preventDefault();
    }
    inputRef.current?.click();
  };

  const formatAcceptedTypes = (accept?: string) => {
    if (!accept) return "";
    return accept
      .split(",")
      .map(type => type.trim())
      .map(type => type.startsWith(".") ? type.toUpperCase() : type)
      .join(", ");
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "relative flex min-h-[150px] cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600",
          dragActive && "border-primary bg-primary/10",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if ((e.target as HTMLElement).tagName === 'BUTTON') {
              e.preventDefault();
            }
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          accept={accept}
          {...props}
        />
        
        {selectedFile && preview ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
            <div className="flex flex-col items-center space-y-2">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={removeFile}
                className="absolute right-2 top-2 rounded-full bg-gray-200 p-1 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2 p-4 text-center">
            <Upload className="h-8 w-8 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 font-medium">
                Drag & drop or click to upload
              </p>
              {accept && (
                <p className="text-xs text-muted-foreground mt-1">
                  Supported formats: {formatAcceptedTypes(accept)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 