package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Base64;

@Service
public class ImageService {

    @Value("${app.upload-dir:uploads/plan-images}")
    private String uploadDir;

    @Value("${app.design-upload-dir:uploads/design-files}")
    private String designUploadDir;

    @Value("${file.upload-dir:./uploads}")
    private String baseUploadDir;

    @Value("${app.pdf.max-image-width:400}")
    private int maxImageWidth;

    @Value("${app.pdf.max-image-height:300}")
    private int maxImageHeight;

    public String convertImageToBase64WithResize(String imageUrl) {
        try {
            System.out.println("Attempting to load image from: " + imageUrl);

            BufferedImage originalImage = loadImage(imageUrl);
            if (originalImage == null) {
                System.err.println("Failed to load image from: " + imageUrl);
                return null;
            }

            // Resize image to fit PDF constraints
            BufferedImage resizedImage = resizeImage(originalImage, maxImageWidth, maxImageHeight);

            // Convert to base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(resizedImage, "jpg", baos);
            byte[] imageBytes = baos.toByteArray();

            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            System.out.println("Successfully converted image to base64, size: " + base64.length() + " characters");
            return base64;

        } catch (Exception e) {
            System.err.println("Error processing image: " + imageUrl + " - " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }

    private BufferedImage loadImage(String imageUrl) throws IOException {
        System.out.println("Plan images upload directory: " + uploadDir);
        System.out.println("Design files upload directory: " + designUploadDir);
        System.out.println("Image URL: " + imageUrl);

        // Determine which upload directory to use based on URL
        String baseDir;
        String imagePath;
        
        if (imageUrl.startsWith("/uploads/design-files/")) {
            // Design phase file
            baseDir = designUploadDir;
            imagePath = imageUrl.substring("/uploads/design-files/".length());
        } else if (imageUrl.startsWith("uploads/design-files/")) {
            // Design phase file (without leading slash)
            baseDir = designUploadDir;
            imagePath = imageUrl.substring("uploads/design-files/".length());
        } else if (imageUrl.startsWith("/uploads/plan-images/")) {
            // Customer plan image
            baseDir = uploadDir;
            imagePath = imageUrl.substring("/uploads/plan-images/".length());
        } else if (imageUrl.startsWith("uploads/plan-images/")) {
            // Customer plan image (without leading slash)
            baseDir = uploadDir;
            imagePath = imageUrl.substring("uploads/plan-images/".length());
        } else if (imageUrl.startsWith("/")) {
            // Generic path - try to determine from path structure
            if (imageUrl.contains("design-files")) {
                baseDir = designUploadDir;
                imagePath = imageUrl.substring(1);
            } else {
                baseDir = uploadDir;
                imagePath = imageUrl.substring(1);
            }
        } else {
            // Relative path - default to plan-images
            baseDir = uploadDir;
            imagePath = imageUrl;
        }

        System.out.println("Using base directory: " + baseDir);
        System.out.println("Extracted image path: " + imagePath);

        // Build full file path
        Path fullPath = Paths.get(baseDir, imagePath);
        System.out.println("Full file path: " + fullPath.toAbsolutePath());

        if (Files.exists(fullPath)) {
            System.out.println("File exists, attempting to read...");
            return ImageIO.read(fullPath.toFile());
        } else {
            System.err.println("File does not exist at: " + fullPath.toAbsolutePath());

            // Try alternative paths
            Path alternative1 = Paths.get(".", baseDir, imagePath);
            Path alternative2 = Paths.get(System.getProperty("user.dir"), baseDir, imagePath);

            System.out.println("Trying alternative path 1: " + alternative1.toAbsolutePath());
            if (Files.exists(alternative1)) {
                return ImageIO.read(alternative1.toFile());
            }

            System.out.println("Trying alternative path 2: " + alternative2.toAbsolutePath());
            if (Files.exists(alternative2)) {
                return ImageIO.read(alternative2.toFile());
            }

            // If still not found, try the other directory (cross-check)
            String otherDir = baseDir.equals(uploadDir) ? designUploadDir : uploadDir;
            Path crossCheckPath = Paths.get(otherDir, imagePath);
            System.out.println("Trying cross-check path: " + crossCheckPath.toAbsolutePath());
            if (Files.exists(crossCheckPath)) {
                return ImageIO.read(crossCheckPath.toFile());
            }

            // List what files are actually in the upload directory
            Path uploadPath = Paths.get(baseDir);
            if (Files.exists(uploadPath)) {
                System.out.println("Files in upload directory (" + baseDir + "):");
                try {
                    Files.list(uploadPath).forEach(path ->
                            System.out.println("  " + path.getFileName()));
                } catch (Exception e) {
                    System.err.println("Could not list files: " + e.getMessage());
                }
            } else {
                System.err.println("Upload directory does not exist: " + uploadPath.toAbsolutePath());
            }

            return null;
        }
    }

    private BufferedImage resizeImage(BufferedImage originalImage, int maxWidth, int maxHeight) {
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();

        // Calculate new dimensions maintaining aspect ratio
        double aspectRatio = (double) originalWidth / originalHeight;
        int newWidth = maxWidth;
        int newHeight = (int) (maxWidth / aspectRatio);

        if (newHeight > maxHeight) {
            newHeight = maxHeight;
            newWidth = (int) (maxHeight * aspectRatio);
        }

        // Create resized image
        BufferedImage resizedImage = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = resizedImage.createGraphics();
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();

        return resizedImage;
    }

    public boolean isValidImageFormat(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        return Arrays.asList("jpg", "jpeg", "png").contains(extension);
    }

    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        return lastDotIndex > 0 ? filename.substring(lastDotIndex + 1) : "";
    }

    /**
     * Convert background image to base64 for PDF templates
     * Handles images from root uploads folder
     * Note: AVIF format is not supported by PDF libraries, so it will be skipped
     */
    public String convertBackgroundImageToBase64(String imagePath) {
        try {
            Path fullPath;
            
            // Handle root uploads folder paths
            if (imagePath.startsWith("/uploads/")) {
                String relativePath = imagePath.substring("/uploads/".length());
                fullPath = Paths.get(baseUploadDir, relativePath);
            } else if (imagePath.startsWith("uploads/")) {
                fullPath = Paths.get(baseUploadDir, imagePath.substring("uploads/".length()));
            } else {
                fullPath = Paths.get(baseUploadDir, imagePath);
            }

            // Try alternative paths if not found
            if (!Files.exists(fullPath)) {
                Path altPath = Paths.get(".", baseUploadDir, imagePath.replaceFirst("^/uploads/", "").replaceFirst("^uploads/", ""));
                if (Files.exists(altPath)) {
                    fullPath = altPath;
                } else {
                    altPath = Paths.get(System.getProperty("user.dir"), baseUploadDir, imagePath.replaceFirst("^/uploads/", "").replaceFirst("^uploads/", ""));
                    if (Files.exists(altPath)) {
                        fullPath = altPath;
                    }
                }
            }

            if (!Files.exists(fullPath)) {
                System.err.println("Background image not found at: " + fullPath.toAbsolutePath());
                return null;
            }

            // Check if file is AVIF format (not supported by PDF libraries)
            String fileName = fullPath.getFileName().toString().toLowerCase();
            if (fileName.endsWith(".avif")) {
                System.out.println("AVIF format detected for background image. AVIF is not supported by PDF libraries. Skipping background image in PDF.");
                return null;
            }

            // Try to read as image (for formats like PNG, JPG)
            BufferedImage image = ImageIO.read(fullPath.toFile());
            if (image == null) {
                System.err.println("Could not read image file: " + fullPath + ". Unsupported format or corrupted file.");
                return null;
            }

            // Convert to JPEG for better PDF compatibility
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            boolean written = ImageIO.write(image, "jpg", baos);
            if (!written) {
                System.err.println("Failed to convert image to JPEG format");
                return null;
            }

            byte[] imageBytes = baos.toByteArray();
            String base64 = Base64.getEncoder().encodeToString(imageBytes);
            System.out.println("Successfully converted background image to base64, size: " + base64.length() + " characters");
            return base64;

        } catch (Exception e) {
            System.err.println("Error processing background image: " + imagePath + " - " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
}