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
            BufferedImage originalImage = loadImage(imageUrl);
            if (originalImage == null) return null;

            // Resize image to fit PDF constraints
            BufferedImage resizedImage = resizeImage(originalImage, maxImageWidth, maxImageHeight);

            // Convert to base64
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(resizedImage, "jpg", baos);
            byte[] imageBytes = baos.toByteArray();

            return Base64.getEncoder().encodeToString(imageBytes);

        } catch (Exception e) {
            System.err.println("Error processing image: " + imageUrl + " - " + e.getMessage());
            return null;
        }
    }

    private BufferedImage loadImage(String imageUrl) throws IOException {
        if (imageUrl.startsWith("http")) {
            // Load from URL
            URL url = new URL(imageUrl);
            return ImageIO.read(url);
        } else {
            // Load from local file system
            Path imagePath = Paths.get(uploadDir, imageUrl.replace("/uploads/", ""));
            if (Files.exists(imagePath)) {
                return ImageIO.read(imagePath.toFile());
            }
        }
        return null;
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
