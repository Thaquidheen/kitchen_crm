package com.fleetmanagement.kitchencrmbackend.modules.quotation.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.Base64;

@Service
public class ImageService {

    @Value("${app.upload-dir:uploads/plan-images}")
    private String uploadDir;

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
        System.out.println("Upload directory: " + uploadDir);
        System.out.println("Image URL: " + imageUrl);

        // Handle different URL formats
        String imagePath;
        if (imageUrl.startsWith("/uploads/plan-images/")) {
            // Remove the leading slash and path prefix
            imagePath = imageUrl.substring("/uploads/plan-images/".length());
        } else if (imageUrl.startsWith("uploads/plan-images/")) {
            // Remove the path prefix
            imagePath = imageUrl.substring("uploads/plan-images/".length());
        } else if (imageUrl.startsWith("/")) {
            // Remove leading slash
            imagePath = imageUrl.substring(1);
        } else {
            imagePath = imageUrl;
        }

        System.out.println("Extracted image path: " + imagePath);

        // Build full file path
        Path fullPath = Paths.get(uploadDir, imagePath);
        System.out.println("Full file path: " + fullPath.toAbsolutePath());

        if (Files.exists(fullPath)) {
            System.out.println("File exists, attempting to read...");
            return ImageIO.read(fullPath.toFile());
        } else {
            System.err.println("File does not exist at: " + fullPath.toAbsolutePath());

            // Try alternative paths
            Path alternative1 = Paths.get(".", uploadDir, imagePath);
            Path alternative2 = Paths.get(System.getProperty("user.dir"), uploadDir, imagePath);

            System.out.println("Trying alternative path 1: " + alternative1.toAbsolutePath());
            if (Files.exists(alternative1)) {
                return ImageIO.read(alternative1.toFile());
            }

            System.out.println("Trying alternative path 2: " + alternative2.toAbsolutePath());
            if (Files.exists(alternative2)) {
                return ImageIO.read(alternative2.toFile());
            }

            // List what files are actually in the upload directory
            Path uploadPath = Paths.get(uploadDir);
            if (Files.exists(uploadPath)) {
                System.out.println("Files in upload directory:");
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
}