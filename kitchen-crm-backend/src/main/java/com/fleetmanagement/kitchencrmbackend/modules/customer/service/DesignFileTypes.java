package com.fleetmanagement.kitchencrmbackend.modules.customer.service;

import java.nio.charset.StandardCharsets;
import java.util.Set;

/**
 * Which files the design workflow takes, and what kind each one is.
 *
 * <p>The kind is read from the file's name. The type a browser declares is deliberately not used:
 * for a CAD drawing it depends on what is installed on the uploader's computer (application/acad,
 * image/vnd.dwg, application/octet-stream, nothing at all…), so checking it turned real drawings
 * away on exactly the computers that have CAD software. For the formats with a fixed signature
 * the first bytes of the file are checked instead, which also catches a damaged or renamed file
 * before it becomes a customer's approved design.
 */
public final class DesignFileTypes {

    /** In the order a design is best looked at: a PDF opens anywhere, a CAD drawing needs CAD software. */
    public enum Kind { PDF, IMAGE, CAD, OTHER }

    /** For messages: "The design must be …". */
    public static final String DESIGN_KINDS = "a PDF, an image (JPG, PNG) or a CAD drawing (DWG, DXF)";

    private static final Set<String> IMAGES = Set.of("jpg", "jpeg", "png", "webp");
    private static final Set<String> CAD = Set.of("dwg", "dxf");
    /** What may accompany a design: other 3D formats, office documents, bundles. */
    private static final Set<String> EXTRAS = Set.of(
            "skp", "3ds", "obj", "fbx", "stl", "step", "stp", "iges", "igs",
            "doc", "docx", "xls", "xlsx", "zip", "rar");

    private DesignFileTypes() {
    }

    /** Lower-case extension without the dot; empty when the name has none. */
    public static String extension(String fileName) {
        if (fileName == null) {
            return "";
        }
        String name = fileName.trim();
        int dot = name.lastIndexOf('.');
        return dot > 0 ? name.substring(dot + 1).toLowerCase() : "";
    }

    public static Kind kind(String fileName) {
        String ext = extension(fileName);
        if ("pdf".equals(ext)) {
            return Kind.PDF;
        }
        if (IMAGES.contains(ext)) {
            return Kind.IMAGE;
        }
        return CAD.contains(ext) ? Kind.CAD : Kind.OTHER;
    }

    /** A design is something to look at or to draw from: a PDF, an image or a CAD drawing. */
    public static boolean isDesign(String fileName) {
        return kind(fileName) != Kind.OTHER;
    }

    /** Any file the design workflow stores: a design, a plan document, or an extra next to them. */
    public static boolean isAccepted(String fileName) {
        return isDesign(fileName) || EXTRAS.contains(extension(fileName));
    }

    /**
     * Whether the file's first bytes fit its name.
     *
     * @param head the start of the file (the first kilobyte is plenty)
     * @return null when they fit or the format has no fixed signature; otherwise what is wrong
     */
    public static String contentProblem(String fileName, byte[] head) {
        switch (kind(fileName)) {
            case PDF:
                // The header may sit a few bytes in; readers accept it anywhere in the first kilobyte.
                return new String(head, StandardCharsets.ISO_8859_1).contains("%PDF-")
                        ? null : "This is not a real PDF file — it may be damaged, or another kind of file renamed";
            case IMAGE:
                // Any picture a browser shows will do, whatever the name says: a PNG saved as .jpg still opens.
                return isPicture(head)
                        ? null : "This is not a picture that can be shown — save it as JPG or PNG and try again";
            case CAD:
                // Every DWG starts with its version, "AC1032" and the like. DXF is plain text with no fixed start.
                return !"dwg".equals(extension(fileName)) || startsWith(head, 'A', 'C')
                        ? null : "This is not a real DWG drawing — it may be damaged, or another kind of file renamed";
            default:
                return null;
        }
    }

    private static boolean isPicture(byte[] head) {
        return startsWith(head, 0xFF, 0xD8, 0xFF)                                   // JPEG
                || startsWith(head, 0x89, 'P', 'N', 'G')                            // PNG
                || (startsWith(head, 'R', 'I', 'F', 'F') && at(head, 8, 'W', 'E', 'B', 'P')) // WEBP
                || startsWith(head, 'G', 'I', 'F', '8')                             // GIF
                || startsWith(head, 'B', 'M');                                      // BMP
    }

    private static boolean startsWith(byte[] head, int... bytes) {
        return at(head, 0, bytes);
    }

    private static boolean at(byte[] head, int offset, int... bytes) {
        if (head == null || head.length < offset + bytes.length) {
            return false;
        }
        for (int i = 0; i < bytes.length; i++) {
            if ((head[offset + i] & 0xFF) != bytes[i]) {
                return false;
            }
        }
        return true;
    }
}
